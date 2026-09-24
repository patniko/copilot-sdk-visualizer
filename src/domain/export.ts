// Copyright (c) Microsoft Corporation. All rights reserved.
import { BUILTIN_NAMES, BUILTIN_SPECS, HarnessPlanSchema } from "./plan";
import type { HarnessPlan } from "./plan";
import { analyzePlan, hostContracts, toolSummary } from "./analysis";
import { LANGUAGES, RUNTIME_OPTIONS, runtimeEndpoint } from "./target";

function json(value: unknown): string {
    if (Array.isArray(value)) return `[${value.map(json).join(", ")}]`;
    if (typeof value === "object" && value !== null) {
        return `{ ${Object.entries(value)
            .map(
                ([key, item]) =>
                    `${key === "__proto__" ? `[${JSON.stringify(key)}]` : JSON.stringify(key)}: ${json(item)}`,
            )
            .join(", ")} }`;
    }
    const serialized = JSON.stringify(value);
    if (serialized === undefined) throw new Error("A configuration value could not be serialized.");
    return serialized;
}

export function exportPlan(plan: HarnessPlan): string {
    return JSON.stringify(HarnessPlanSchema.parse(plan), null, 2) + "\n";
}

export function downloadName(plan: HarnessPlan, extension: string): string {
    const name =
        plan.name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-+|-+$/g, "") || "harness";
    return `${name}.${extension}`;
}

function markdownList(items: string[], empty: string): string {
    return items.length ? items.map((item) => `- ${item}`).join("\n") : `- ${empty}`;
}

function quoted(value: string): string {
    return JSON.stringify(value);
}

export function generateCopilotCliInstructions(input: HarnessPlan): string {
    const plan = HarnessPlanSchema.parse(input);
    const language =
        LANGUAGES.find((option) => option.id === plan.target.language)?.label ?? plan.target.language;
    const runtime =
        RUNTIME_OPTIONS.find((option) => option.id === plan.target.runtime)?.title ?? plan.target.runtime;
    const tools = toolSummary(plan);
    const contracts = hostContracts(plan);
    const decisions = analyzePlan(plan);
    const selectedBuiltIns = [...tools.kept, ...tools.overridden];
    const runtimeDetail =
        plan.target.runtime === "external"
            ? `Connect to the existing runtime at ${runtimeEndpoint(plan.target).address}. Do not make the SDK client responsible for starting or stopping that shared service.`
            : plan.target.runtime === "inprocess"
              ? "Use the SDK's experimental in-process runtime path and document the required native bundle/version compatibility."
              : plan.target.cliPath.trim()
                ? `Use the SDK-managed child process with the configured runtime executable path ${quoted(plan.target.cliPath.trim())}.`
                : "Use the SDK-managed child process and the SDK's default runtime distribution.";
    const inventoryDetail =
        plan.inventory === "explicit"
            ? `Use an explicit inventory containing only: ${selectedBuiltIns.length ? selectedBuiltIns.join(", ") : "(no built-in tools)"}.`
            : `Keep the runtime's coding-oriented default selection and exclude: ${
                  tools.removed.length ? tools.removed.join(", ") : "(no built-in exclusions)"
              }. Do not interpret this as enabling every compiled tool.`;
    const overrideDetails = tools.overridden.map((name) => {
        const setting = plan.tools[name];
        return `${name}: ${setting.description}; parameters: ${setting.parameters}`;
    });
    const customToolDetails = plan.customTools.map(
        (tool) =>
            `${tool.name}${tool.terminal ? " (terminal)" : ""}: ${tool.description}; parameters: ${tool.parameters}`,
    );
    const mcpDetails = plan.mcpServers.map(
        (server) =>
            `${server.name} at ${server.url}; expose ${server.tools
                .map((tool) => `${tool.name} as ${tool.wireName}`)
                .join(", ")}`,
    );
    const agentDetails = plan.agents.map(
        (agent) =>
            `${agent.name}: ${agent.description}; model: ${agent.model.trim() || "inherit session model"}; tools: ${
                agent.tools.length ? agent.tools.join(", ") : "none"
            }; instructions: ${quoted(agent.prompt)}`,
    );
    const modelDetail =
        plan.model.provider === "copilot"
            ? `GitHub Copilot provider; model: ${plan.model.id.trim() || "resolve explicitly in host code"}; identity: ${plan.identity}.`
            : `${plan.model.provider} provider using ${plan.model.wireApi}; model: ${
                  plan.model.id.trim() || "resolve explicitly in host code"
              }; endpoint: ${plan.model.endpoint.trim() || "require a host-supplied endpoint"}; credential: ${
                  plan.model.credential === "api-key"
                      ? `read only from environment variable ${plan.model.credentialEnv}`
                      : "use a host bearer-token callback"
              }.`;

    return [
        `Integrate the GitHub Copilot SDK into the repository currently open in this Copilot CLI session for the ${quoted(plan.name)} harness.`,
        "",
        "Work in the existing application rather than replacing it with a separate demo. First inspect the repository's architecture, package manager, entrypoints, configuration conventions, tests, and shutdown lifecycle. Then make the smallest coherent integration that follows those patterns.",
        "",
        "## Fixed implementation choices",
        `- SDK language: ${language}.`,
        `- Runtime placement: ${runtime}. ${runtimeDetail}`,
        `- Client baseline: ${plan.clientMode}.`,
        `- Tool inventory: ${inventoryDetail}`,
        plan.prompt.mode === "default"
            ? "- Prompt mode: default. Do not set systemMessage; keep the runtime's built-in prompt unchanged."
            : `- Prompt mode: ${plan.prompt.mode}. Harness instructions: ${quoted(plan.prompt.content)}`,
        `- Model and identity: ${modelDetail}`,
        `- Reasoning effort: ${plan.model.reasoningEffort}; context tier: ${plan.model.contextTier}.`,
        `- Working directory: ${plan.context.workspace.trim() ? quoted(plan.context.workspace.trim()) : "none configured"}.`,
        `- Context switches: config discovery=${plan.context.discovery}, skills=${plan.context.skills}, file hooks=${plan.context.fileHooks}, host Git operations=${plan.context.hostGit}.`,
        `- Skill directories: ${plan.context.skillDirectories.length ? plan.context.skillDirectories.map(quoted).join(", ") : "none"}.`,
        `- Plugin directories: ${plan.context.pluginDirectories.length ? plan.context.pluginDirectories.map(quoted).join(", ") : "none"}.`,
        `- Session storage: ${plan.session.storage}${
            plan.session.storage === "local"
                ? ` at ${quoted(plan.session.baseDirectory)}`
                : " through a host provider"
        }; idle timeout=${plan.session.idleTimeoutSeconds}s; infinite sessions=${plan.session.infinite}; large-output handling=${plan.session.largeOutput}.`,
        `- Events: streaming=${plan.events.streaming}; observer=${plan.events.observer}.`,
        `- Permission handling: ${
            plan.policy.permissionMode === "allow-all"
                ? "deliberately use the SDK approve-all helper for ordinary runtime permission requests"
                : "bind a real host permission callback; do not substitute allow-all"
        }.`,
        `- Hooks: pre-tool=${plan.policy.preToolHook}; post-tool=${plan.policy.postToolHook}.`,
        "",
        "## Tool and agent integrations",
        "Built-in overrides:",
        markdownList(overrideDetails, "None."),
        "",
        "Custom tools:",
        markdownList(customToolDetails, "None."),
        "",
        "MCP servers:",
        markdownList(mcpDetails, "None."),
        "",
        "Custom agents:",
        markdownList(agentDetails, "None."),
        `- Selected agent: ${plan.selectedAgent || "default/root agent"}.`,
        `- Root-agent exclusions: ${plan.rootExcludedTools.length ? plan.rootExcludedTools.join(", ") : "none"}.`,
        "",
        "## Required host work",
        markdownList(
            contracts.map((contract) => `${contract}.`),
            "No additional callback contract is selected, but still preserve application lifecycle and authorization boundaries.",
        ),
        "",
        "Implement selected tool handlers against the application's real service layer and authorization model. Tool visibility is not authorization. Do not add mock success responses, no-op persistence, placeholder credentials, or silent fallbacks. If a required host implementation cannot be derived from this repository, add a typed, clearly failing boundary and document exactly what the application owner must provide.",
        "",
        "## Important boundaries to preserve",
        markdownList(
            decisions.map((decision) => `${decision.title}: ${decision.detail}`),
            "No additional plan-specific boundaries were reported.",
        ),
        "",
        "## Delivery requirements",
        "- Use the SDK APIs supported by the repository's selected dependency/version; inspect authoritative SDK documentation or installed types instead of inventing APIs.",
        "- Keep secrets out of source, generated configuration, logs, prompts, and tests. Add only environment-variable names and documented setup instructions.",
        "- Put client/session creation at the application's composition root, propagate failures, and stop SDK-owned resources during normal shutdown and failed startup.",
        "- Preserve existing behavior outside the integration. Add or update focused tests for configuration mapping, required host bindings, failure behavior, and cleanup.",
        "- Update the repository's existing setup documentation with install, environment, preflight, and run steps.",
        `- Use this evaluation goal when designing tests: ${quoted(plan.evaluation)}`,
        "- Run the smallest relevant formatter, linter, type-check/build, and tests. Fix failures caused by this integration.",
        "- At completion, summarize changed files, the runtime boundary, host-owned TODOs, and the exact commands run.",
        "",
        `Configuration provenance: Harness Builder plan schema v${plan.schemaVersion}; behavior was derived from maintained private SDK/runtime research snapshots. Reconcile differences with the dependency actually used by this repository.`,
        "",
    ].join("\n");
}

export function generateSdkCode(input: HarnessPlan): string {
    const plan = HarnessPlanSchema.parse(input);
    const allowAllPermissions = plan.policy.permissionMode === "allow-all";
    const s2s = plan.model.provider === "copilot" && plan.identity === "s2s-installation";
    const overridden = BUILTIN_NAMES.filter((name) => plan.tools[name].action === "override");
    const unsupported = overridden.filter((name) => !BUILTIN_SPECS[name].overrideable);
    if (unsupported.length) {
        throw new Error(
            `Review unverified/reserved built-in overrides before generating SDK code: ${unsupported.join(", ")}. Your planner JSON can still be exported.`,
        );
    }
    const handlers = [
        ...overridden.map((name) => ({
            name,
            description: plan.tools[name].description,
            schema: plan.tools[name].parameters,
            override: true,
            terminal: false,
        })),
        ...plan.customTools.map((tool) => ({
            name: tool.name,
            description: tool.description,
            schema: tool.parameters,
            override: false,
            terminal: tool.terminal,
        })),
    ];
    const toolDefinitions = handlers
        .map((tool) =>
            [
                "        defineTool(" + json(tool.name) + ", {",
                "            description: " + json(tool.description) + ",",
                "            parameters: " + json(JSON.parse(tool.schema)) + ",",
                ...(tool.override ? ["            overridesBuiltInTool: true,"] : []),
                ...(tool.terminal ? ["            isTerminal: true,"] : []),
                `            handler: toolHandler(host, ${json(tool.name)}),`,
                "        }),",
            ].join("\n"),
        )
        .join("\n");
    const client = [
        `        mode: ${json(plan.clientMode)},`,
        plan.target.runtime === "inprocess"
            ? "        connection: RuntimeConnection.forInProcess(),"
            : plan.target.runtime === "external"
              ? `        connection: RuntimeConnection.forUri(${json(runtimeEndpoint(plan.target).address)}, { connectionToken: process.env.COPILOT_CONNECTION_TOKEN }),`
              : `        connection: RuntimeConnection.forStdio(${plan.target.cliPath.trim() ? `{ path: resolve(${json(plan.target.cliPath)}) }` : ""}),`,
        ...(plan.target.runtime === "external"
            ? []
            : [
                  `        useLoggedInUser: ${plan.model.provider === "copilot" && plan.identity === "developer"},`,
                  `        sessionIdleTimeoutSeconds: ${plan.session.idleTimeoutSeconds},`,
              ]),
        ...(plan.model.provider === "copilot" &&
        plan.identity === "s2s-installation" &&
        plan.target.runtime === "managed"
            ? [
                  "        env: {",
                  "            ...process.env,",
                  '            COPILOT_GITHUB_TOKEN: required(process.env.COPILOT_GITHUB_TOKEN, "GitHub App installation token in COPILOT_GITHUB_TOKEN"),',
                  "        },",
              ]
            : []),
        ...(plan.session.storage === "local" && plan.target.runtime !== "external"
            ? [`        baseDirectory: resolve(${json(plan.session.baseDirectory)}),`]
            : plan.session.storage === "virtual"
              ? [
                    '        sessionFs: { initialCwd: "/virtual", sessionStatePath: "/session-state", conventions: "posix", capabilities: { sqlite: false } },',
                ]
              : []),
    ];
    const prompt =
        plan.prompt.mode === "default"
            ? undefined
            : plan.prompt.mode === "customize"
              ? {
                    mode: "customize",
                    sections: Object.fromEntries(
                        plan.prompt.sections.map((section) => [
                            section.name,
                            {
                                action: section.action,
                                ...(["remove", "preserve"].includes(section.action)
                                    ? {}
                                    : { content: section.content }),
                            },
                        ]),
                    ),
                    content: plan.prompt.content,
                }
              : { mode: plan.prompt.mode, content: plan.prompt.content };
    const available = [
        ...BUILTIN_NAMES.flatMap((name) =>
            plan.tools[name].action === "remove"
                ? []
                : [plan.tools[name].action === "override" ? name : `builtin:${name}`],
        ),
        ...plan.customTools.map((tool) => `custom:${tool.name}`),
        ...plan.mcpServers.flatMap((server) => server.tools.map((tool) => `mcp:${tool.wireName}`)),
    ];
    const provider =
        plan.model.provider === "copilot"
            ? null
            : [
                  "            provider: {",
                  `                type: ${json(plan.model.provider)},`,
                  `                baseUrl: ${plan.model.endpoint.trim() ? json(plan.model.endpoint) : 'required(host.providerEndpoint?.trim(), "provider endpoint")'},`,
                  ...(plan.model.provider === "anthropic"
                      ? []
                      : [`                wireApi: ${json(plan.model.wireApi)},`]),
                  plan.model.credential === "api-key"
                      ? `                apiKey: required(process.env[${json(plan.model.credentialEnv)}], ${json(plan.model.credentialEnv)}),`
                      : '                bearerTokenProvider: required(host.providerToken, "provider bearer-token callback"),',
                  "            },",
              ].join("\n");
    const session = [
        `            model: ${plan.model.id.trim() ? json(plan.model.id.trim()) : 'required(host.model, "model ID")'},`,
        ...(plan.model.reasoningEffort === "default"
            ? []
            : [`            reasoningEffort: ${json(plan.model.reasoningEffort)},`]),
        ...(plan.model.contextTier === "default"
            ? []
            : [`            contextTier: ${json(plan.model.contextTier)},`]),
        ...(prompt ? [`            systemMessage: ${json(prompt)},`] : []),
        "            tools,",
        ...(plan.inventory === "explicit" ? [`            availableTools: ${json(available)},`] : []),
        `            excludedTools: ${json(BUILTIN_NAMES.filter((name) => plan.tools[name].action === "remove"))},`,
        `            enableConfigDiscovery: ${plan.context.discovery},`,
        `            enableSkills: ${plan.context.skills},`,
        `            enableFileHooks: ${plan.context.fileHooks},`,
        `            enableHostGitOperations: ${plan.context.hostGit},`,
        ...(plan.context.workspace.trim()
            ? [`            workingDirectory: resolve(${json(plan.context.workspace)}),`]
            : []),
        `            skillDirectories: ${json(plan.context.skillDirectories)},`,
        `            pluginDirectories: ${json(plan.context.pluginDirectories)},`,
        `            mcpServers: ${json(
            Object.fromEntries(
                plan.mcpServers.map((server) => [
                    server.name,
                    { type: "http", url: server.url, tools: server.tools.map((tool) => tool.name) },
                ]),
            ),
        )},`,
        `            customAgents: ${json(
            plan.agents.map((agent) => ({
                name: agent.name,
                description: agent.description,
                prompt: agent.prompt,
                ...(agent.model.trim() ? { model: agent.model.trim() } : {}),
                tools: agent.tools,
            })),
        )},`,
        ...(plan.selectedAgent ? [`            agent: ${json(plan.selectedAgent)},`] : []),
        ...(plan.rootExcludedTools.length
            ? [`            defaultAgent: { excludedTools: ${json(plan.rootExcludedTools)} },`]
            : []),
        allowAllPermissions
            ? "            onPermissionRequest: approveAll,"
            : '            onPermissionRequest: required(host.callbacks.onPermissionRequest, "permission policy"),',
        ...(plan.tools.ask_user.action === "keep"
            ? [
                  '            onUserInputRequest: required(host.callbacks.onUserInputRequest, "user-input handler"),',
              ]
            : []),
        ...(plan.identity === "host-token" && plan.model.provider === "copilot"
            ? [
                  '            gitHubTokenProvider: required(host.callbacks.gitHubTokenProvider, "GitHub token provider"),',
              ]
            : []),
        ...(plan.session.storage === "virtual"
            ? [
                  '            createSessionFsProvider: required(host.callbacks.createSessionFsProvider, "session filesystem provider"),',
              ]
            : []),
        ...(plan.events.observer
            ? ['            onEvent: required(host.callbacks.onEvent, "event observer"),']
            : []),
        "            hooks: {",
        ...(plan.policy.preToolHook
            ? ['                onPreToolUse: required(host.callbacks.hooks?.onPreToolUse, "pre-tool hook"),']
            : []),
        ...(plan.policy.postToolHook
            ? [
                  '                onPostToolUse: required(host.callbacks.hooks?.onPostToolUse, "post-tool hook"),',
              ]
            : []),
        "            },",
        `            infiniteSessions: { enabled: ${plan.session.infinite} },`,
        `            largeOutput: { enabled: ${plan.session.largeOutput} },`,
        `            streaming: ${plan.events.streaming},`,
        ...(provider ? [provider] : []),
    ];
    return [
        "// Copyright (c) Microsoft Corporation. All rights reserved.",
        "// Generated integration sketch. Supply host implementations; review before execution.",
        "// Behavior reference: maintained private SDK/runtime research snapshots.",
        "// Client modes configure new sessions. This is not a live configuration patch.",
        ...(plan.model.provider === "copilot" && plan.identity === "s2s-installation"
            ? plan.target.runtime === "external"
                ? [
                      "// HOST TODO: operate the external runtime with COPILOT_GITHUB_TOKEN and useLoggedInUser=false.",
                      "// The connecting client must not receive or inject the installation token.",
                      "// Mint a replacement before the one-hour expiry, restart/reconfigure the runtime, then resume as appropriate.",
                  ]
                : plan.target.runtime === "inprocess"
                  ? [
                        "// HOST TODO: mint the GitHub App installation token in trusted host code.",
                        "// Set COPILOT_GITHUB_TOKEN before the in-process runtime loads; do not install a per-session token callback.",
                        "// Mint a replacement before the one-hour expiry, restart the host runtime, then resume as appropriate.",
                    ]
                  : [
                        "// HOST TODO: mint the GitHub App installation token in trusted host code.",
                        "// COPILOT_GITHUB_TOKEN is injected only into the managed child; do not install a per-session token callback.",
                        "// Mint a replacement before the one-hour expiry, restart the SDK client, then resume as appropriate.",
                    ]
            : []),
        'import { resolve } from "node:path";',
        `import { CopilotClient, RuntimeConnection, defineTool${allowAllPermissions ? ", approveAll" : ""}, type SessionConfig, type Tool, type ProviderConfig } from "@github/copilot-sdk";`,
        "",
        "export interface HostBindings {",
        `    callbacks: Pick<SessionConfig, "onPermissionRequest" | "onUserInputRequest"${s2s ? "" : ' | "gitHubTokenProvider"'} | "createSessionFsProvider" | "onEvent" | "hooks">;`,
        '    toolHandlers: Record<string, NonNullable<Tool["handler"]>>;',
        "    model?: string;",
        "    providerEndpoint?: string;",
        '    providerToken?: ProviderConfig["bearerTokenProvider"];',
        "}",
        "",
        "function required<T>(value: T | null | undefined, label: string): T {",
        '    if (value == null || value === "") throw new Error(`Implement or provide ${label} before starting this harness.`);',
        "    return value;",
        "}",
        "",
        'function toolHandler(host: HostBindings, name: string): NonNullable<Tool["handler"]> {',
        "    const handler = Object.hasOwn(host.toolHandlers, name) ? host.toolHandlers[name] : undefined;",
        '    if (typeof handler !== "function") throw new Error(`Implement the host tool handler for ${name}.`);',
        "    return handler;",
        "}",
        "",
        "export async function createHarness(host: HostBindings) {",
        ...(plan.model.provider === "copilot" &&
        plan.identity === "s2s-installation" &&
        plan.target.runtime === "inprocess"
            ? [
                  '    required(process.env.COPILOT_GITHUB_TOKEN, "GitHub App installation token in the host environment before runtime load");',
              ]
            : []),
        "    const tools: Tool[] = [",
        toolDefinitions,
        "    ];",
        "    const client = new CopilotClient({",
        ...client,
        "    });",
        "    try {",
        "        const session = await client.createSession({",
        ...session,
        "        });",
        "        // The caller owns cleanup: call client.stop() when finished.",
        "        return { client, session };",
        "    } catch (error) {",
        "        try {",
        "            await client.stop();",
        "        } catch (cleanupError) {",
        '            throw new AggregateError([error, cleanupError], "Session setup and runtime cleanup both failed.");',
        "        }",
        "        throw error;",
        "    }",
        "}",
        "",
    ].join("\n");
}
