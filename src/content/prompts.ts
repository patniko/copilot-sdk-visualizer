// Copyright (c) Microsoft Corporation. All rights reserved.
import { z } from "zod";
import snapshot from "./builtin-prompts.json";
import { SECTION_NAMES } from "../domain/plan";
import type { HarnessPlan, SectionName } from "../domain/plan";
import { readablePromptReference } from "./prompt-inputs";

const PromptReferenceSchema = z.object({
    revision: z.string(),
    context: z.string(),
    sections: z.array(
        z.object({
            id: z.enum(SECTION_NAMES),
            title: z.string(),
            kind: z.enum(["literal", "template", "fragment", "dynamic", "assembly"]),
            content: z.string(),
            note: z.string(),
            source: z.string(),
            members: z.array(z.enum(SECTION_NAMES)).optional(),
        }),
    ),
});
export const promptReference = PromptReferenceSchema.parse(snapshot);
export type BuiltinPromptReference = (typeof promptReference.sections)[number];

export function previewPromptSection(plan: HarnessPlan, name: SectionName) {
    const reference = promptReference.sections.find((section) => section.id === name);
    if (!reference) throw new Error(`Unknown built-in section: ${name}`);
    if (plan.prompt.mode === "replace")
        return {
            before: readablePromptReference(reference.content),
            after: "",
            status: "Not inherited",
            note: "Your complete replacement prompt is used instead of the foundation. The full prompt editor shows that replacement once.",
        };
    const override =
        plan.prompt.mode === "customize"
            ? plan.prompt.sections.find((section) => section.name === name)
            : undefined;
    const before = readablePromptReference(reference.content);
    let after = before;
    if (override) {
        if (override.action === "remove") after = "";
        if (override.action === "replace") after = override.content;
        if (override.action === "append") after = `${after}\n${override.content}`;
        if (override.action === "prepend") after = `${override.content}\n${after}`;
    }
    const parentGroup = plan.prompt.sections.find((section) =>
        promptReference.sections.some((entry) => entry.id === section.name && entry.members?.includes(name)),
    );
    return {
        before,
        after,
        status: override ? override.action : "Inherited reference",
        note: parentGroup
            ? `The ${parentGroup.name} group also has a ${parentGroup.action} action. This is a section-local preview; the runtime resolves group precedence and model-dependent content.`
            : reference.kind === "literal"
              ? "Preview against the generic default text. Model-specific tuning and runtime assembly can differ."
              : "Reference-text preview only. Runtime placeholders, model tuning, and discovered content are not resolved here.",
    };
}
