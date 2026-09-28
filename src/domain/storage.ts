// Copyright (c) Microsoft Corporation. All rights reserved.
import { HarnessPlanSchema, parsePlan } from "./plan";
import type { HarnessPlan } from "./plan";
import { createPreset } from "./presets";

// Keep the storage location stable; parsePlan migrates the versioned payload.
export const STORAGE_KEY = "copilot-sdk-visualizer:plan:v1";
export interface DraftStorage {
    getItem(key: string): string | null;
    setItem(key: string, value: string): void;
}
export type LoadedDraft = { plan: HarnessPlan; blocked: boolean; error: string | null };

export function errorMessage(error: unknown): string {
    return error instanceof Error ? error.message : String(error);
}

export function loadDraft(getStorage: () => DraftStorage): LoadedDraft {
    try {
        const saved = getStorage().getItem(STORAGE_KEY);
        return { plan: saved ? parsePlan(saved) : createPreset("minimal"), blocked: false, error: null };
    } catch (error) {
        return {
            plan: createPreset("minimal"),
            blocked: true,
            error: `The saved draft could not be loaded. It has not been overwritten. ${errorMessage(error)}`,
        };
    }
}

export function saveDraft(getStorage: () => DraftStorage, plan: HarnessPlan): string | null {
    try {
        const validated = HarnessPlanSchema.parse(plan);
        getStorage().setItem(STORAGE_KEY, JSON.stringify(validated));
        return null;
    } catch (error) {
        return `The draft was not saved. ${errorMessage(error)}`;
    }
}
