// Copyright (c) Microsoft Corporation. All rights reserved.
import { BUILTIN_NAMES, BUILTIN_SPECS, HarnessPlanSchema } from "./plan";
import type { HarnessPlan } from "./plan";
import { reference } from "../content/reference";
import { runtimeEndpoint } from "./target";

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

export function generateSdkCode(input: HarnessPlan): string {
    const plan = HarnessPlanSchema.parse(input);
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
        ...(plan.session.storage === "local" && plan.target.runtime !== "external"
            ? [`        baseDirectory: resolve(${json(plan.session.baseDirectory)}),`]
            : plan.session.storage === "virtual"
              ? [
                    '        sessionFs: { initialCwd: "/virtual", sessionStatePath: "/session-state", conventions: "posix", capabilities: { sqlite: false } },',
                ]
              : []),
    ];
    const prompt =
        plan.prompt.mode === "customize"
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
                  `                baseUrl: ${json(plan.model.endpoint)},`,
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
        `            systemMessage: ${json(prompt)},`,
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
        '            onPermissionRequest: required(host.callbacks.onPermissionRequest, "permission policy"),',
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
        `// Source snapshot: SDK ${reference.revisions.sdk}; runtime ${reference.revisions.runtime}.`,
        "// Client modes configure new sessions. This is not a live configuration patch.",
        'import { resolve } from "node:path";',
        'import { CopilotClient, RuntimeConnection, defineTool, type SessionConfig, type Tool, type ProviderConfig } from "@github/copilot-sdk";',
        "",
        "export interface HostBindings {",
        '    callbacks: Pick<SessionConfig, "onPermissionRequest" | "onUserInputRequest" | "gitHubTokenProvider" | "createSessionFsProvider" | "onEvent" | "hooks">;',
        '    toolHandlers: Record<string, NonNullable<Tool["handler"]>>;',
        "    model?: string;",
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
