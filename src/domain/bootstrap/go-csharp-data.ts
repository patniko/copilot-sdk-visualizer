// Copyright (c) Microsoft Corporation. All rights reserved.
import { BUILTIN_NAMES } from "../plan";
import type { HarnessPlan, HostHandler, LifecycleHook } from "../plan";
import { toolDefinitions } from "./common";
import type { BootstrapRequirement } from "./types";

/** Replaces exactly one known template anchor; a missing anchor is a generator bug. */
export function replaceOnce(source: string, anchor: string, replacement: string): string {
    const index = source.indexOf(anchor);
    if (index < 0 || source.indexOf(anchor, index + anchor.length) >= 0)
        throw new Error(`Template anchor must occur exactly once: ${anchor.trim().slice(0, 80)}`);
    return source.slice(0, index) + replacement + source.slice(index + anchor.length);
}

/** Client log level only applies when the generated client launches or loads the runtime. */
export function clientLogLevel(plan: HarnessPlan): string | undefined {
    return plan.events.logLevel !== "default" && plan.target.runtime !== "external"
        ? plan.events.logLevel
        : undefined;
}

/** v3 host.json keys, emitted only when the plan departs from the defaults. */
export function goCsharpHostExtras(plan: HarnessPlan) {
    const logLevel = clientLogLevel(plan);
    return {
        ...(logLevel ? { logLevel } : {}),
        ...(plan.model.allowedModels.length ? { allowedModels: plan.model.allowedModels } : {}),
    };
}

export const responseSchemaText = (plan: HarnessPlan) =>
    plan.output.responseSchema.trim() ? plan.output.responseSchema.trim() + "\n" : undefined;

export const customToolsSkipPermission = (plan: HarnessPlan) =>
    plan.customTools.some((tool) => tool.skipPermission);

export const customToolsDefer = (plan: HarnessPlan) =>
    plan.customTools.some((tool) => tool.defer !== "default");

/** Notes for selected v3 options; empty for plans that keep every default. */
export function goCsharpV3Notes(plan: HarnessPlan, language: "go" | "csharp"): string[] {
    const go = language === "go";
    const notes: string[] = [];
    if (plan.model.allowedModels.length)
        notes.push(
            go
                ? "allowedModels has no SessionConfig field in the Go SDK. After CreateSession, main.go applies config/host.json allowedModels with session.RPC.Model.SetAllowedModels (session.model.setAllowedModels); a failure disconnects, stops the client, and returns the error."
                : "allowedModels has no SessionConfig property in the .NET SDK. After CreateSessionAsync, Program.cs applies config/host.json allowedModels with session.Rpc.Model.SetAllowedModelsAsync (session.model.setAllowedModels); a failure disposes the session and client and reports the error.",
        );
    if (plan.events.logLevel !== "default")
        notes.push(
            plan.target.runtime === "external"
                ? `The selected runtime log level (${plan.events.logLevel}) is not applied: the client LogLevel option only passes --log-level to a runtime this client launches or loads. Configure logging on the separately operated server.`
                : `Client LogLevel is set to ${plan.events.logLevel}; the SDK passes it to the launched or in-process runtime as --log-level.`,
        );
    if (plan.output.responseSchema.trim())
        notes.push(
            go
                ? "config/response-schema.json is embedded and passed as MessageOptions.ResponseSchema for the run prompt; the SDK requests strict json_schema output named response and the final assistant content is the JSON result."
                : "config/response-schema.json is embedded and passed as MessageOptions.ResponseSchema (JsonElement) for the run prompt; the SDK requests strict json_schema output named response and the final assistant content is the JSON result.",
        );
    if (plan.policy.hooks.length || plan.policy.handlers.length || plan.context.skillProvider)
        notes.push(
            `Selected lifecycle hooks, request handlers, and the skill provider are explicit ${go ? "host.go" : "Host.cs"} slots bound on the SDK session config; preflight and startup reject missing registrations rather than installing no-ops.`,
        );
    if (customToolsSkipPermission(plan))
        notes.push(
            "Custom tools marked skipPermission run without the host permission callback. Validate authority inside those handlers.",
        );
    return notes;
}

/** Requirements for v3 host slots that the shared requirement list does not already cover. */
export function v3Requirements(
    plan: HarnessPlan,
    hostFile: string,
    existing: BootstrapRequirement[],
    names: {
        hook: (hook: LifecycleHook) => string;
        handler: (handler: HostHandler) => string;
        skillProvider: string;
    },
): BootstrapRequirement[] {
    const ids = new Set(existing.map((item) => item.id));
    const items: BootstrapRequirement[] = [
        ...plan.policy.hooks.map((hook) => ({
            id: `hook-${hook}`,
            title: `Implement the ${hook} hook`,
            detail: `Register ${names.hook(hook)} in ${hostFile}. Preflight and startup fail while it is missing; a no-op is not a policy.`,
            file: hostFile,
            kind: "host-code" as const,
        })),
        ...plan.policy.handlers.map((handler) => ({
            id: `handler-${handler}`,
            title: `Implement the ${handler} request handler`,
            detail: `Register ${names.handler(handler)} in ${hostFile}. Preflight and startup fail while it is missing.`,
            file: hostFile,
            kind: "host-code" as const,
        })),
        ...(plan.context.skillProvider
            ? [
                  {
                      id: "skill-provider",
                      title: "Implement the session skill provider",
                      detail: `Register a real ${names.skillProvider} in ${hostFile} (experimental SDK API). Preflight and startup fail while it is missing.`,
                      file: hostFile,
                      kind: "host-code" as const,
                  },
              ]
            : []),
    ];
    return items.filter((item) => !ids.has(item.id));
}

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
                    ...("defer" in tool && tool.defer ? [`    "defer": ${JSON.stringify(tool.defer)},`] : []),
                    ...("skipPermission" in tool && tool.skipPermission
                        ? ['    "skipPermission": true,']
                        : []),
                    `    "parameters": ${schema}`,
                    "  }",
                ].join("\n");
            })
            .join(",\n") +
        "\n]\n"
    );
}
