// Copyright (c) Microsoft Corporation. All rights reserved.
import { describe, expect, it } from "vitest";
import { createHarnessStore } from "./store";
import { createPreset } from "./presets";
import { STORAGE_KEY } from "./storage";

function setup(saved: string | null = null) {
    let value = saved;
    const storage = {
        getItem: () => value,
        setItem: (_key: string, next: string) => {
            value = next;
        },
    };
    return { store: createHarnessStore(() => storage), readSaved: () => value };
}

describe("event-driven draft store", () => {
    it("keeps stable snapshots until an action and supports undo and redo", () => {
        const { store, readSaved } = setup();
        const initial = store.getSnapshot();
        expect(store.getSnapshot()).toBe(initial);
        store.update((plan) => {
            plan.name = "Changed";
            return plan;
        });
        expect(initial.plan.name).toBe("My minimal harness");
        expect(store.getSnapshot().plan.name).toBe("Changed");
        expect(readSaved()).toContain("Changed");
        store.undo();
        expect(store.getSnapshot().plan).toEqual(initial.plan);
        store.redo();
        expect(store.getSnapshot().plan.name).toBe("Changed");
    });

    it("does not destroy a corrupt saved draft until explicit replacement", () => {
        const corrupt = '{"schemaVersion":99}';
        const { store, readSaved } = setup(corrupt);
        store.update((plan) => {
            plan.name = "Working draft";
            return plan;
        });
        expect(store.getSnapshot().blocked).toBe(true);
        expect(readSaved()).toBe(corrupt);
        store.replace(createPreset("empty"));
        expect(store.getSnapshot().blocked).toBe(false);
        expect(JSON.parse(readSaved() ?? "{}").preset).toBe("empty");
    });

    it("publishes validation and quota errors without saving invalid drafts", () => {
        const { store, readSaved } = setup(JSON.stringify(createPreset("minimal")));
        const original = readSaved();
        const notifications: string[] = [];
        const unsubscribe = store.subscribe(() => notifications.push(store.getSnapshot().plan.name));
        store.update((plan) => {
            plan.prompt.content = "";
            return plan;
        });
        expect(store.getSnapshot().issues.length).toBeGreaterThan(0);
        expect(store.getSnapshot().saveError).toContain("last valid saved draft");
        expect(readSaved()).toBe(original);
        expect(notifications).toHaveLength(1);
        unsubscribe();
        store.undo();
        expect(notifications).toHaveLength(1);
        expect(store.getSnapshot().issues).toHaveLength(0);

        const blocked = createHarnessStore(() => ({
            getItem: (_key: string) => null,
            setItem: (key: string) => {
                throw new Error(`quota for ${key}`);
            },
        }));
        blocked.update((plan) => {
            plan.name = "Quota";
            return plan;
        });
        expect(blocked.getSnapshot().saveError).toContain(STORAGE_KEY);
    });
});
