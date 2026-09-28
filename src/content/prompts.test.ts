// Copyright (c) Microsoft Corporation. All rights reserved.
import { describe, expect, it } from "vitest";
import { promptReference, previewPromptSection } from "./prompts";
import { inputsInReference, promptInputs, readablePromptReference } from "./prompt-inputs";
import { createPreset } from "../domain/presets";

describe("explained built-in prompt references", () => {
    it("explains every placeholder in all twelve source sections", () => {
        const covered = new Set<string>();
        expect(promptReference.sections).toHaveLength(12);
        for (const section of promptReference.sections) {
            for (const input of inputsInReference(section.content)) {
                expect(input.meaning.length).toBeGreaterThan(20);
                expect(input.suppliedBy).not.toBe("");
                expect(input.example).not.toBe("");
                covered.add(input.id);
            }
            expect(readablePromptReference(section.content)).not.toMatch(/\{\{[^{}]+\}\}|\{[a-z_]+\}/);
        }
        expect(covered.size).toBe(promptInputs.length);
    });

    it("previews static edits without treating user content as a macro language", () => {
        const plan = createPreset("copilot");
        plan.prompt.mode = "customize";
        plan.prompt.sections = [
            { name: "tone", action: "replace", content: "Literal {{my_application_value}}" },
        ];
        expect(previewPromptSection(plan, "tone").after).toBe("Literal {{my_application_value}}");
        plan.prompt.mode = "replace";
        expect(previewPromptSection(plan, "tone").status).toBe("Not inherited");
    });

    it("marks group interactions rather than claiming a resolved full prompt", () => {
        const plan = createPreset("copilot");
        plan.prompt.mode = "customize";
        plan.prompt.sections = [
            { name: "identity", action: "remove", content: "" },
            { name: "tone", action: "preserve", content: "" },
        ];
        expect(previewPromptSection(plan, "tone").note).toContain("runtime resolves group precedence");
        expect(() => readablePromptReference("{{unknown_reference_region}}")).toThrow(/Unexplained/);
    });
});
