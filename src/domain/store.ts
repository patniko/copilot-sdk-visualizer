// Copyright (c) Microsoft Corporation. All rights reserved.
import { HarnessPlanSchema } from "./plan";
import type { HarnessPlan, PlanIssue } from "./plan";
import { loadDraft, saveDraft } from "./storage";
import type { DraftStorage } from "./storage";

export interface HarnessSnapshot {
    plan: HarnessPlan;
    issues: PlanIssue[];
    blocked: boolean;
    saveError: string | null;
    canUndo: boolean;
    canRedo: boolean;
}

export function createHarnessStore(getStorage: () => DraftStorage) {
    const initial = loadDraft(getStorage);
    let past: HarnessPlan[] = [];
    let future: HarnessPlan[] = [];
    let snapshot: HarnessSnapshot = {
        ...initial,
        issues: [],
        saveError: initial.error,
        canUndo: false,
        canRedo: false,
    };
    const listeners = new Set<() => void>();

    function publish(plan: HarnessPlan, unblock = false) {
        const validation = HarnessPlanSchema.safeParse(plan);
        const blocked = unblock ? false : snapshot.blocked;
        const issues = validation.success
            ? []
            : validation.error.issues.map((issue) => ({
                  path: issue.path.map(String).join("."),
                  message: issue.message,
              }));
        const saveError = blocked
            ? snapshot.saveError
            : validation.success
              ? saveDraft(getStorage, validation.data)
              : "This draft has invalid fields. The last valid saved draft is retained.";
        snapshot = { plan, issues, blocked, saveError, canUndo: past.length > 0, canRedo: future.length > 0 };
        for (const listener of listeners) listener();
    }

    function change(plan: HarnessPlan, unblock = false) {
        if (!unblock && JSON.stringify(plan) === JSON.stringify(snapshot.plan)) return;
        past = [...past.slice(-29), snapshot.plan];
        future = [];
        publish(structuredClone(plan), unblock);
    }

    return {
        getSnapshot: () => snapshot,
        subscribe(listener: () => void) {
            listeners.add(listener);
            return () => {
                listeners.delete(listener);
            };
        },
        update(update: (current: HarnessPlan) => HarnessPlan) {
            change(update(structuredClone(snapshot.plan)));
        },
        replace(plan: HarnessPlan) {
            change(plan, true);
        },
        undo() {
            const previous = past.at(-1);
            if (!previous) return;
            past = past.slice(0, -1);
            future = [snapshot.plan, ...future];
            publish(previous);
        },
        redo() {
            const next = future[0];
            if (!next) return;
            past = [...past, snapshot.plan];
            future = future.slice(1);
            publish(next);
        },
    };
}
