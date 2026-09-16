// Copyright (c) Microsoft Corporation. All rights reserved.
import { describe, expect, it } from "vitest";
import { advancedCategories, advancedControls, advancedSupportLevels } from "./advanced-controls";
import { reference } from "./reference";

describe("advanced control catalog", () => {
    it("stays bounded, unique, categorized, and source-backed", () => {
        expect(advancedControls.length).toBeGreaterThanOrEqual(20);
        expect(advancedControls.length).toBeLessThanOrEqual(40);
        expect(new Set(advancedControls.map((control) => control.id)).size).toBe(advancedControls.length);

        for (const category of advancedCategories) {
            expect(
                advancedControls.some((control) => control.category === category),
                category,
            ).toBe(true);
        }
        for (const support of advancedSupportLevels) {
            expect(
                advancedControls.some((control) => control.support === support),
                support,
            ).toBe(true);
        }
        for (const control of advancedControls) {
            expect(control.key.length, control.id).toBeGreaterThan(0);
            expect(control.readOnlyReason.length, control.id).toBeGreaterThan(0);
            expect(control.sourceUrl, control.id).toMatch(/^https:\/\/github\.com\/github\/copilot-/);
            expect(
                control.sourceUrl.includes(reference.revisions.sdk) ||
                    control.sourceUrl.includes(reference.revisions.runtime),
                control.id,
            ).toBe(true);
        }
    });
});
