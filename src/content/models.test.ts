// Copyright (c) Microsoft Corporation. All rights reserved.
import { describe, expect, it } from "vitest";
import { copilotModelCatalog, copilotModelOptions } from "./models";
import privateModelCatalog from "./model-catalog.json";
import { exportPlan, generateSdkCode } from "../domain/export";
import { sessionData } from "../domain/bootstrap/common";
import { parsePlan } from "../domain/plan";
import { createPreset } from "../domain/presets";

describe("Copilot model catalog", () => {
    it("records pinned SDK discovery and runtime public-list sources", () => {
        const { sources, revisions } = privateModelCatalog;
        const { modelIds } = copilotModelCatalog;
        expect(sources.sdk).toBe(
            `https://github.com/github/copilot-sdk/blob/${revisions.sdk}/nodejs/src/client.ts`,
        );
        expect(sources.runtime).toBe(
            `https://github.com/github/copilot-agent-runtime/blob/${revisions.runtime}/files/session-limit-baseline/session_limit_public_models.json`,
        );
        expect(modelIds).toEqual(
            expect.arrayContaining(["claude-sonnet-5", "gpt-6-astra", "gemini-3.8-flash"]),
        );
        expect(modelIds).not.toContain("gpt-5.6-sol-fast");
    });

    it("offers host-supplied selection and every catalog ID in source order, without duplicates", () => {
        const values = ["", ...copilotModelCatalog.modelIds];
        for (const current of values) {
            const options = copilotModelOptions(current);
            expect(options.map((option) => option.value)).toEqual(values);
            expect(new Set(options.map((option) => option.value)).size).toBe(options.length);
        }
        expect(copilotModelOptions("")[0]).toEqual({ value: "", label: "Host supplied" });
    });

    it("preserves unlisted and legacy IDs verbatim instead of silently selecting another model", () => {
        for (const id of ["future-copilot-model", "deployment/my-model", " legacy-model "]) {
            expect(copilotModelOptions(id)[1]).toEqual({
                value: id,
                label: `${id} (not in bundled catalog)`,
            });
        }
    });

    it("round-trips every selection through plan, SDK sketch, and bootstrap configuration", () => {
        for (const id of [...copilotModelCatalog.modelIds, "future-copilot-model", ""]) {
            const plan = createPreset("minimal");
            plan.model.provider = "copilot";
            plan.model.id = id;
            expect(parsePlan(exportPlan(plan)).model.id).toBe(id);
            const session = sessionData(plan);
            const code = generateSdkCode(plan);
            if (id) {
                expect(session.model).toBe(id);
                expect(code).toContain(`model: "${id}"`);
            } else {
                expect(session).not.toHaveProperty("model");
                expect(code).toContain('model: required(host.model, "model ID")');
            }
        }
    });
});
