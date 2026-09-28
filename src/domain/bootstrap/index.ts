// Copyright (c) Microsoft Corporation. All rights reserved.
import { BUILTIN_NAMES, BUILTIN_SPECS, HarnessPlanSchema } from "../plan";
import type { HarnessPlan } from "../plan";
import type { BootstrapLanguage } from "../target";
import { commonFiles, projectName } from "./common";
import type { BootstrapResult, LanguageAdapter } from "./types";
import { typescriptAdapter } from "./typescript";
import { goAdapter } from "./go";
import { csharpAdapter } from "./csharp";
import { javaAdapter } from "./java";
import { rustAdapter } from "./rust";
import { pythonAdapter } from "./python";

const adapters: Record<BootstrapLanguage, LanguageAdapter> = {
    typescript: typescriptAdapter,
    python: pythonAdapter,
    go: goAdapter,
    csharp: csharpAdapter,
    java: javaAdapter,
    rust: rustAdapter,
};

export function buildBootstrapProject(input: HarnessPlan): BootstrapResult {
    const parsed = HarnessPlanSchema.safeParse(input);
    if (!parsed.success)
        return {
            ok: false,
            blockers: parsed.error.issues.map((issue) => ({
                id: `field-${issue.path.map(String).join(".")}`,
                title: "Correct this plan field",
                detail: issue.message,
                fields: [issue.path.map(String).join(".")],
                sources: [],
            })),
        };
    const plan = parsed.data;
    const adapter = adapters[plan.target.language];
    // Retained fields for another transport are not active SDK options.
    const activePlan = {
        ...plan,
        target: { ...plan.target, cliPath: plan.target.runtime === "managed" ? plan.target.cliPath : "" },
        model: { ...plan.model, endpoint: plan.model.provider === "copilot" ? "" : plan.model.endpoint },
    };
    const blockers = [
        ...BUILTIN_NAMES.flatMap((name) =>
            plan.tools[name].action !== "override" || BUILTIN_SPECS[name].overrideable
                ? []
                : [
                      {
                          id: `unverified-override-${name}`,
                          title: `The host override path for ${name} is not verified`,
                          detail:
                              name === "catalog_search"
                                  ? "The runtime explicitly reserves catalog_search. Keep or remove its exposure; do not register a replacement."
                                  : "The full catalog has no verified external override route for this descriptor. Keep/remove it or add a separate custom tool. The existing selection is retained, not silently rewritten.",
                          fields: [`tools.${name}.action`],
                          sources: ["override-advertised", "runtime-tools"],
                      },
                  ],
        ),
        ...adapter.check(activePlan),
    ];
    if (blockers.length) return { ok: false, blockers };
    const generated = adapter.generate(activePlan);
    const requirements = [
        ...new Map(generated.requirements.map((requirement) => [requirement.id, requirement])).values(),
    ];
    const project = {
        ...generated,
        requirements,
        name: projectName(plan),
        language: adapter.language,
        languageLabel: adapter.label,
    };
    project.files = [...generated.files, ...commonFiles(plan, project)];
    const paths = new Set<string>();
    for (const file of project.files) {
        if (paths.has(file.path)) throw new Error(`Duplicate generated file: ${file.path}`);
        paths.add(file.path);
    }
    for (const requirement of project.requirements) {
        if (!paths.has(requirement.file)) {
            throw new Error(`Missing host integration file: ${requirement.file}`);
        }
    }
    return { ok: true, project, blockers: [] };
}
