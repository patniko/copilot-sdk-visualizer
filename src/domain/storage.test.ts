// Copyright (c) Microsoft Corporation. All rights reserved.
import { describe, expect, it } from "vitest";
import { createPreset } from "./presets";
import { loadDraft, saveDraft, STORAGE_KEY } from "./storage";
import type { DraftStorage } from "./storage";

function memoryStorage(): DraftStorage {
    const data = new Map<string, string>();
    return {
        getItem: (key) => data.get(key) ?? null,
        setItem: (key, value) => {
            data.set(key, value);
        },
    };
}

describe("local draft persistence", () => {
    it("restores a validated draft rather than another preset", () => {
        const storage = memoryStorage();
        const plan = createPreset("empty");
        plan.name = "Tenant evidence assistant";
        expect(saveDraft(() => storage, plan)).toBeNull();
        expect(loadDraft(() => storage)).toEqual({ plan, blocked: false, error: null });
    });

    it("does not overwrite a malformed saved draft", () => {
        const storage = memoryStorage();
        storage.setItem(STORAGE_KEY, '{"schemaVersion":99}');
        const result = loadDraft(() => storage);
        expect(result.blocked).toBe(true);
        expect(result.error).toContain("has not been overwritten");
        expect(storage.getItem(STORAGE_KEY)).toBe('{"schemaVersion":99}');
    });

    it("retains the last valid draft when current edits are invalid", () => {
        const storage = memoryStorage();
        const plan = createPreset("minimal");
        saveDraft(() => storage, plan);
        const invalid = structuredClone(plan);
        invalid.prompt.content = "";
        expect(saveDraft(() => storage, invalid)).toContain("not saved");
        expect(loadDraft(() => storage).plan).toEqual(plan);
    });

    it("surfaces storage access and quota failures", () => {
        const result = loadDraft(() => {
            throw new Error("storage access denied");
        });
        expect(result.blocked).toBe(true);
        expect(result.error).toContain("storage access denied");
        const storage: DraftStorage = {
            getItem: () => null,
            setItem: () => {
                throw new Error("quota exceeded");
            },
        };
        expect(saveDraft(() => storage, createPreset("minimal"))).toContain("quota exceeded");
    });
});
