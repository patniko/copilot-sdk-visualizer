// Copyright (c) Microsoft Corporation. All rights reserved.
import { BUILTIN_NAMES, BUILTIN_SPECS, HarnessPlanSchema, ToolMapSchema, defaultToolSettings } from "./plan";
import type { HarnessPlan, PresetId } from "./plan";
import { defaultTarget } from "./target";
import { TOOL_CATALOG_REVISION } from "../content/builtin-tools";

export const PRESETS = [
    {
        id: "empty",
        label: "Empty",
        tag: "Own the harness",
        description: "Explicit prompt, tools, context, and host policy. No inherited coding inventory.",
    },
    {
        id: "minimal",
        label: "Minimal",
        tag: "Proposed starter",
        description: "A concise general-purpose prompt and two selected session tools. No project workspace.",
    },
    {
        id: "copilot",
        label: "Copilot",
        tag: "Coding baseline",
        description: "Keep the coding-oriented defaults, then deliberately adapt the tools and context.",
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
    return HarnessPlanSchema.parse({
        schemaVersion: 2,
        toolCatalogRevision: TOOL_CATALOG_REVISION,
        target: defaultTarget(),
        name: minimal ? "My minimal harness" : coding ? "My coding harness" : "My custom harness",
        preset,
        clientMode: coding ? "copilot-cli" : "empty",
        inventory: coding ? "coding-defaults" : "explicit",
        prompt: {
            mode: coding ? "append" : "replace",
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
        context: {
            workspace: coding ? "./workspace" : "",
            discovery: coding,
            skills: coding,
            fileHooks: coding,
            hostGit: coding,
            skillDirectories: [],
            pluginDirectories: [],
        },
        policy: { preToolHook: false, postToolHook: false },
        model: {
            id: "",
            provider: "copilot",
            endpoint: "",
            wireApi: "responses",
            credential: "api-key",
            credentialEnv: "MODEL_API_KEY",
            reasoningEffort: "default",
            contextTier: "default",
        },
        identity: coding ? "developer" : "host-token",
        session: {
            storage: minimal ? "virtual" : "local",
            baseDirectory: "./.harness-state",
            idleTimeoutSeconds: minimal ? 900 : 0,
            infinite: true,
            largeOutput: coding,
        },
        events: { streaming: true, observer: true },
        evaluation:
            "Define representative tasks, expected tool behavior, authority checks, and measurable acceptance criteria before shipping.",
    });
}

export const SCENARIOS = [
    {
        id: "workspace-free",
        title: "No project workspace",
        description:
            "Remove native workspace tools, disable ambient discovery, and choose host-provided session storage.",
    },
    {
        id: "tenant-documents",
        title: "Tenant document assistant",
        description:
            "Replace view with an authorized service-backed reader, retaining the shared runtime loop.",
    },
    {
        id: "governed-workflow",
        title: "Governed workflow",
        description: "Add host policy hooks, explicit session identity, and observable decisions.",
    },
] as const;
export type ScenarioId = (typeof SCENARIOS)[number]["id"];

export function applyScenario(plan: HarnessPlan, scenario: ScenarioId): HarnessPlan {
    const next = structuredClone(plan);
    if (scenario === "governed-workflow") {
        next.policy.preToolHook = true;
        next.policy.postToolHook = true;
        next.events.observer = true;
        next.identity = "host-token";
        return next;
    }
    next.clientMode = "empty";
    next.inventory = "explicit";
    next.context = {
        workspace: "",
        discovery: false,
        skills: false,
        fileHooks: false,
        hostGit: false,
        skillDirectories: [],
        pluginDirectories: [],
    };
    next.session.storage = "virtual";
    next.session.largeOutput = false;
    next.identity = "host-token";
    for (const name of BUILTIN_NAMES) {
        if (BUILTIN_SPECS[name].workspace && next.tools[name].action === "keep")
            next.tools[name].action = "remove";
    }
    if (scenario === "tenant-documents") {
        next.tools.view = {
            action: "override",
            description: "Read only documents authorized for the current tenant and principal.",
            parameters: BUILTIN_SPECS.view.parameters,
        };
        next.tools.ask_user.action = "keep";
        next.prompt.mode = "replace";
        next.prompt.content =
            "Answer from the tenant's authorized documents. Use view to retrieve evidence. Do not infer access rights from the user's wording.";
    }
    return next;
}

export function changedAxes(plan: HarnessPlan): string[] {
    const base = createPreset(plan.preset);
    const groups: [string, unknown, unknown][] = [
        ["Runtime & language", plan.target, base.target],
        ["Client baseline", [plan.clientMode, plan.inventory], [base.clientMode, base.inventory]],
        ["Prompt", plan.prompt, base.prompt],
        ["Built-in tools", plan.tools, base.tools],
        ["Custom tools", plan.customTools, base.customTools],
        ["MCP integrations", plan.mcpServers, base.mcpServers],
        [
            "Agents",
            [plan.agents, plan.selectedAgent, plan.rootExcludedTools],
            [base.agents, base.selectedAgent, base.rootExcludedTools],
        ],
        ["Context", plan.context, base.context],
        ["Policy", plan.policy, base.policy],
        ["Models", plan.model, base.model],
        ["Identity", plan.identity, base.identity],
        ["Session state", plan.session, base.session],
        ["Events / evaluation", [plan.events, plan.evaluation], [base.events, base.evaluation]],
    ];
    return groups
        .filter(([, current, initial]) => JSON.stringify(current) !== JSON.stringify(initial))
        .map(([name]) => name);
}
