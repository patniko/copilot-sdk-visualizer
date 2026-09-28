// Copyright (c) Microsoft Corporation. All rights reserved.
import { BUILTIN_NAMES } from "../plan";
import type { HarnessPlan } from "../plan";
import { toolDefinitions } from "./common";

/** Keep schema numbers and literals intact instead of round-tripping them through JavaScript numbers. */
export function goCsharpToolData(plan: HarnessPlan): string {
    const schemas = new Map([
        ...BUILTIN_NAMES.filter((name) => plan.tools[name].action === "override").map(
            (name) => [name, plan.tools[name].parameters] as const,
        ),
        ...plan.customTools.map((tool) => [tool.name, tool.parameters] as const),
    ]);
    const definitions = toolDefinitions(plan);
    if (definitions.length === 0) return "[]\n";
    return (
        "[\n" +
        definitions
            .map((tool) => {
                const schema = schemas.get(tool.name);
                if (schema === undefined) throw new Error(`Missing schema for ${tool.name}`);
                return [
                    "  {",
                    `    "name": ${JSON.stringify(tool.name)},`,
                    `    "description": ${JSON.stringify(tool.description)},`,
                    `    "overridesBuiltInTool": ${tool.overridesBuiltInTool},`,
                    `    "isTerminal": ${tool.isTerminal},`,
                    `    "parameters": ${schema}`,
                    "  }",
                ].join("\n");
            })
            .join(",\n") +
        "\n]\n"
    );
}
