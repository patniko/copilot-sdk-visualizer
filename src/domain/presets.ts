// Copyright (c) Microsoft Corporation. All rights reserved.
import {
    BUILTIN_NAMES,
    HarnessPlanSchema,
    PLAN_SCHEMA_VERSION,
    ToolMapSchema,
    defaultToolSettings,
    v3Defaults,
} from "./plan";
import type { HarnessPlan, PresetId } from "./plan";
import { defaultTarget } from "./target";
import { TOOL_CATALOG_REVISION } from "../content/builtin-tools";

export const PRESETS = [
    {
        id: "empty",
        label: "Empty",
        tag: "Own the harness",
        description: "Start blank. You supply the prompt, every tool, and the host policy.",
    },
    {
        id: "minimal",
        label: "Minimal",
        tag: "Proposed starter",
        description: "A short general-purpose prompt and two session tools. No project workspace.",
    },
    {
        id: "copilot",
        label: "Copilot",
        tag: "Coding baseline",
        description: "The runtime's coding defaults: its prompt, tools, and workspace context.",
    },
] as const;

export function createPreset(preset: PresetId): HarnessPlan {
    const coding = preset === "copilot";
    const minimal = preset === "minimal";
    const tools = ToolMapSchema.parse(
        Object.fromEntries(
            BUILTIN_NAMES.map((name) => [
                name,
                defaultToolSettings(
                    name,
                    coding || (minimal && ["ask_user", "task_complete"].includes(name)) ? "keep" : "remove",
                ),
            ]),
        ),
    );
    const extra = v3Defaults();
    return HarnessPlanSchema.parse({
        schemaVersion: PLAN_SCHEMA_VERSION,
        toolCatalogRevision: TOOL_CATALOG_REVISION,
        target: defaultTarget(),
        name: minimal ? "My minimal harness" : coding ? "My coding harness" : "My custom harness",
        preset,
        clientMode: coding ? "copilot-cli" : "empty",
        inventory: coding ? "coding-defaults" : "explicit",
        prompt: {
            mode: coding ? "default" : "replace",
            content: coding
                ? "Follow the team's engineering conventions. Explain meaningful changes and verify the work."
                : minimal
                  ? "Answer from supplied context. Ask when needed. Do not invent facts or take actions outside the approved scope."
                  : "You are a task-focused assistant. Use only the capabilities explicitly supplied by the host. Follow the user's scope and request clarification when necessary.",
            sections: [],
        },
        tools,
        customTools: [],
        mcpServers: [],
        agents: [],
        selectedAgent: "",
        rootExcludedTools: [],
        excludedBuiltinAgents: extra.excludedBuiltinAgents,
        context: {
            ...extra.context,
            workspace: coding ? "./workspace" : "",
            discovery: coding,
            skills: coding,
            fileHooks: coding,
            hostGit: coding,
            skillDirectories: [],
            pluginDirectories: [],
        },
        policy: { ...extra.policy, permissionMode: "host", preToolHook: false, postToolHook: false },
        model: {
            id: "",
            provider: "copilot",
            endpoint: "",
            wireApi: "responses",
            credential: "api-key",
            credentialEnv: "MODEL_API_KEY",
            reasoningEffort: "default",
            contextTier: "default",
            ...extra.model,
        },
        capabilities: extra.capabilities,
        identity: coding ? "developer" : "host-token",
        session: {
            storage: minimal ? "virtual" : "local",
            baseDirectory: "./.harness-state",
            idleTimeoutSeconds: minimal ? 900 : 0,
            infinite: true,
            largeOutput: coding,
            ...extra.session,
        },
        events: { ...extra.events, streaming: true, observer: true },
        output: extra.output,
        evaluation:
            "Define representative tasks, expected tool behavior, authority checks, and measurable acceptance criteria before shipping.",
    });
}

export function changedAxes(plan: HarnessPlan): string[] {
    const base = createPreset(plan.preset);
    const groups: [string, unknown, unknown][] = [
        ["Runtime & language", plan.target, base.target],
        ["Client baseline", [plan.clientMode, plan.inventory], [base.clientMode, base.inventory]],
        ["Prompt", plan.prompt, base.prompt],
        ["Built-in tools", [plan.tools, plan.capabilities], [base.tools, base.capabilities]],
        ["Custom tools", plan.customTools, base.customTools],
        ["MCP integrations", plan.mcpServers, base.mcpServers],
        [
            "Agents",
            [plan.agents, plan.selectedAgent, plan.rootExcludedTools, plan.excludedBuiltinAgents],
            [base.agents, base.selectedAgent, base.rootExcludedTools, base.excludedBuiltinAgents],
        ],
        ["Context", plan.context, base.context],
        ["Policy", plan.policy, base.policy],
        ["Models", plan.model, base.model],
        ["Identity", plan.identity, base.identity],
        ["Session state", plan.session, base.session],
        [
            "Events / evaluation",
            [plan.events, plan.output, plan.evaluation],
            [base.events, base.output, base.evaluation],
        ],
    ];
    return groups
        .filter(([, current, initial]) => JSON.stringify(current) !== JSON.stringify(initial))
        .map(([name]) => name);
}
