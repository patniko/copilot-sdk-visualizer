// Copyright (c) Microsoft Corporation. All rights reserved.
import { BUILTIN_NAMES } from "../plan";
import type { HarnessPlan } from "../plan";
import { runtimeEndpoint } from "../target";
import { commonRequirements, sessionData, toolDefinitions } from "./common";
import type { BootstrapBlocker, LanguageAdapter } from "./types";
import { pythonAgent, pythonHost, pythonProvision, pythonRunner, pythonSetup } from "./python-templates";

const SDK_COMMIT = "f45c46fd1812f8bed5b4cbc250f47177c83068f0";
const RUNTIME_VERSION = "1.0.84-5";
const HOST_FILE = "host.py";

const SESSION_ALIASES = {
    model: "model",
    reasoningEffort: "reasoning_effort",
    contextTier: "context_tier",
    systemMessage: "system_message",
    availableTools: "available_tools",
    excludedTools: "excluded_tools",
    workingDirectory: "working_directory",
    enableConfigDiscovery: "enable_config_discovery",
    enableSkills: "enable_skills",
    enableFileHooks: "enable_file_hooks",
    enableHostGitOperations: "enable_host_git_operations",
    skillDirectories: "skill_directories",
    pluginDirectories: "plugin_directories",
    mcpServers: "mcp_servers",
    customAgents: "custom_agents",
    agent: "agent",
    defaultAgent: "default_agent",
    infiniteSessions: "infinite_sessions",
    largeOutput: "large_output",
    streaming: "streaming",
    provider: "provider",
} satisfies Record<keyof ReturnType<typeof sessionData>, string>;

const TOOL_ALIASES = {
    name: "name",
    description: "description",
    parameters: "parameters",
    overridesBuiltInTool: "overrides_built_in_tool",
    isTerminal: "is_terminal",
} satisfies Record<keyof ReturnType<typeof toolDefinitions>[number], string>;

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}

function aliases(value: unknown, names: Record<string, string>, scope: string): Record<string, unknown> {
    if (!isRecord(value)) throw new Error(`${scope} must be an object.`);
    return Object.fromEntries(
        Object.entries(value).map(([key, item]) => {
            const name = Object.hasOwn(names, key) ? names[key] : undefined;
            if (!name) throw new Error(`Python bootstrap cannot represent ${scope}.${key}.`);
            return [name, item];
        }),
    );
}

function pythonSession(plan: HarnessPlan): Record<string, unknown> {
    const data = sessionData(plan);
    const output = aliases(data, SESSION_ALIASES, "session");
    output.mcp_servers = Object.fromEntries(
        Object.entries(data.mcpServers).map(([name, server]) => [
            name,
            aliases(server, { type: "type", url: "url", tools: "tools" }, `mcpServers.${name}`),
        ]),
    );
    output.custom_agents = data.customAgents.map((agent) =>
        aliases(
            agent,
            { name: "name", description: "description", prompt: "prompt", model: "model", tools: "tools" },
            `customAgents.${agent.name}`,
        ),
    );
    if (data.defaultAgent) {
        output.default_agent = aliases(
            data.defaultAgent,
            { excludedTools: "excluded_tools" },
            "defaultAgent",
        );
    }
    if (data.provider) {
        output.provider = aliases(
            data.provider,
            { type: "type", baseUrl: "base_url", wireApi: "wire_api" },
            "provider",
        );
    }
    output.infinite_sessions = aliases(data.infiniteSessions, { enabled: "enabled" }, "infiniteSessions");
    output.large_output = aliases(data.largeOutput, { enabled: "enabled" }, "largeOutput");
    return output;
}

function blockers(plan: HarnessPlan): BootstrapBlocker[] {
    const result: BootstrapBlocker[] = [];
    if (plan.model.provider === "copilot" && plan.model.endpoint.trim()) {
        result.push({
            id: "python-copilot-endpoint",
            title: "The selected Copilot endpoint cannot be passed through this Python API",
            detail: "The pinned Python create_session API has no high-level Copilot endpoint override. Clear the endpoint for Copilot authentication, or select a supported BYOK provider; this exporter will not silently discard it.",
            fields: ["model.provider", "model.endpoint"],
            sources: ["sdk-providers", "sdk-session-config"],
        });
    }
    if (plan.target.runtime === "external") {
        try {
            runtimeEndpoint(plan.target);
        } catch {
            result.push({
                id: "python-runtime-address",
                title: "Provide a valid external runtime address",
                detail: "The Python URI connection needs the canonical host:port from a valid bootstrap target.",
                fields: ["target.serverUrl"],
                sources: ["sdk-existing-runtime"],
            });
        }
    }
    return result;
}

function shellQuote(value: string): string {
    return `'${value.replaceAll("'", "'\\''")}'`;
}

function render(template: string): string {
    return template
        .replaceAll("__SDK_COMMIT__", SDK_COMMIT)
        .replaceAll("__RUNTIME_VERSION__", RUNTIME_VERSION)
        .replaceAll("__SESSION_FIELDS__", JSON.stringify(Object.values(SESSION_ALIASES)))
        .replaceAll("__TOOL_FIELDS__", JSON.stringify(Object.values(TOOL_ALIASES)))
        .replaceAll("__BUILTIN_NAMES__", JSON.stringify(BUILTIN_NAMES));
}

export const pythonAdapter = {
    language: "python",
    label: "Python",
    check: blockers,
    generate(plan) {
        const problems = blockers(plan);
        if (problems.length) throw new Error(problems.map((problem) => problem.detail).join("\n"));
        const endpoint = plan.target.runtime === "external" ? runtimeEndpoint(plan.target) : null;
        const requirements = commonRequirements(plan, HOST_FILE);
        if (plan.model.provider === "copilot" && plan.identity === "host-token") {
            requirements.push({
                id: "env-GITHUB_TOKEN_EXPIRES_AT",
                environmentVariable: "GITHUB_TOKEN_EXPIRES_AT",
                title: "Set GITHUB_TOKEN_EXPIRES_AT",
                detail: "Set the token's actual absolute UNIX expiry in seconds. host.py recalculates positive remaining lifetime on every callback and rejects expired credentials. Production token acquisition/refresh belongs in host.py.",
                file: HOST_FILE,
                kind: "environment",
            });
        }
        if (endpoint)
            requirements.push({
                id: "python-connection-token",
                title: "Provide the existing service's connection token when required",
                detail: "Set COPILOT_CONNECTION_TOKEN to the runtime service's transport credential; it is separate from GitHub identity.",
                file: HOST_FILE,
                kind: "runtime",
                environmentVariable: "COPILOT_CONNECTION_TOKEN",
            });
        requirements.push({
            id: "python-sdk-source",
            title: "Install the exact Python SDK source snapshot",
            detail: `Run bash setup-sdk.sh --run with Python 3.11+ and Git. It fetches ${SDK_COMMIT} into .sdk-source/copilot-sdk and installs that checkout into a project-owned virtual environment. It never resets or deletes an existing checkout.`,
            file: "setup-sdk.sh",
            kind: "runtime",
        });
        const sources = [
            "sdk-overview",
            "sdk-session-config",
            "sdk-tools",
            "sdk-prompts",
            "sdk-hooks",
            "sdk-permissions",
            "sdk-auth",
            "sdk-providers",
            "sdk-storage-binding",
            "sdk-storage-capabilities",
            "sdk-result-envelope",
            plan.target.runtime === "inprocess"
                ? "sdk-inprocess-guide"
                : plan.target.runtime === "external"
                  ? "sdk-existing-runtime"
                  : "sdk-managed-runtime",
        ];
        const serverCommand = endpoint
            ? [
                  ...(plan.session.storage === "local"
                      ? ["env", "--", `COPILOT_HOME=${shellQuote(plan.session.baseDirectory)}`]
                      : []),
                  shellQuote(plan.target.cliPath.trim() || "copilot"),
                  "--headless",
                  "--port",
                  String(endpoint.port),
                  ...(plan.session.idleTimeoutSeconds
                      ? ["--session-idle-timeout", String(plan.session.idleTimeoutSeconds)]
                      : []),
              ].join(" ")
            : undefined;
        return {
            files: [
                {
                    path: "requirements.txt",
                    content:
                        "# Copyright (c) Microsoft Corporation. All rights reserved.\n# Installed by setup-sdk.sh after verifying the exact SDK commit.\n./.sdk-source/copilot-sdk/python\n",
                    language: "text",
                },
                {
                    path: "python-bootstrap.json",
                    content:
                        JSON.stringify(
                            {
                                schemaVersion: 1,
                                sdkCommit: SDK_COMMIT,
                                runtimeVersion: RUNTIME_VERSION,
                                plan,
                                externalAddress: endpoint?.address ?? null,
                                session: pythonSession(plan),
                                tools: toolDefinitions(plan).map((tool) =>
                                    aliases(tool, TOOL_ALIASES, "tool"),
                                ),
                            },
                            null,
                            2,
                        ) + "\n",
                    language: "json",
                },
                { path: "agent.py", content: render(pythonAgent), language: "python" },
                { path: HOST_FILE, content: render(pythonHost), language: "python" },
                { path: "provision_runtime.py", content: render(pythonProvision), language: "python" },
                { path: "setup-sdk.sh", content: render(pythonSetup), language: "text" },
                { path: "run-agent.sh", content: render(pythonRunner), language: "text" },
                {
                    path: ".sdk-source/.gitignore",
                    content: "# Copyright (c) Microsoft Corporation. All rights reserved.\n*\n!.gitignore\n",
                    language: "text",
                },
            ],
            commands: {
                install: ["bash setup-sdk.sh --run"],
                check: "bash run-agent.sh --check",
                run: 'bash run-agent.sh --prompt "Say hello and explain your scope."',
                ...(serverCommand ? { startRuntime: serverCommand } : {}),
            },
            requirements,
            notes: [
                "Requires Python 3.11+ and Git; the setup/run wrappers use Bash (Git Bash on Windows). Choose another interpreter with bash setup-sdk.sh --run --python python3.11. The visualizer itself never fetches or imports the SDK.",
                `The Python manifest at ${SDK_COMMIT} is 0.0.0.dev0, not a verified PyPI release. requirements.txt installs the verified source checkout instead of an unresolvable development-version pin.`,
                plan.target.runtime === "external"
                    ? "Source installs have CLI_VERSION=None. Setup installs the Python SDK only for an external target; provision and configure the server separately. No local runtime is downloaded."
                    : `Source installs have CLI_VERSION=None. When no explicit local cliPath or COPILOT_CLI_PATH is provided, setup invokes python -m copilot download-runtime --version ${RUNTIME_VERSION}${plan.target.runtime === "inprocess" ? " --in-process" : ""}. Provisioning is explicit setup work, never part of --check.`,
                "--check uses only local files, package metadata, environment values, and host integration registrations. It never imports the SDK, constructs a client, downloads a runtime, or sends a model request. It can also be run before installation with python3 agent.py --check.",
                "Native preflight inspects file presence, not binary compatibility. A real start is still required to establish ABI/platform compatibility; the explicit setup download selects the host's runtime artifact and verifies its release checksum.",
                "python-bootstrap.json contains explicit Python aliases and the active plan projection. It must agree with harness-plan.json after ignoring retained settings for inactive transports/providers; regenerate after changing active planner decisions. JSON Schema properties and prompt text are not case-converted.",
                "Extend host.py: register tool handlers in TOOL_HANDLERS, assign selected PRE_TOOL_HOOK/POST_TOOL_HOOK/SESSION_FS_FACTORY integrations, and replace the default-deny permission function only after implementing real authority checks. No selected integration is satisfied by a success-shaped stub.",
                "GitHub host-token mode reads GITHUB_TOKEN and GITHUB_TOKEN_EXPIRES_AT (absolute UNIX seconds). BYOK API keys use the plan's credentialEnv; bearer callbacks read MODEL_BEARER_TOKEN. These single-process environment adapters are starters, not production refresh or tenant identity services.",
                "The console input handler honors choices and allowFreeform and returns answer/wasFreeform. Hook payloads also retain SDK camelCase keys even though Python registration names use snake_case.",
                "Virtual session storage requires a real SessionFsProvider returned by create_session_fs_handler. The starter advertises no SQLite capability. Session storage is not universal host-filesystem virtualization; large-output handling and selected native tools retain their own behavior.",
                "Cleanup preserves the primary failure, adds any cleanup errors as notes, and still attempts both session disconnect and client stop. Disconnect preserves durable state. An idle turn without a final assistant message prints an explicit completion notice, including the terminal-tool case.",
                ...(endpoint
                    ? [
                          `Connects with RuntimeConnection.for_uri(${JSON.stringify(endpoint.address)}). Start the separately managed server on its host using the provided command; selected local state/idle settings apply there, not to the client. Review binding, TLS/tunneling, and tenant authorization before exposing it remotely.`,
                          "Set COPILOT_CONNECTION_TOKEN in the client environment if the external server requires a connection token. The optional server command does not configure remote exposure or credentials for you. Disconnecting this client does not shut down the shared service.",
                      ]
                    : [
                          "Local runtime paths are resolved relative to the generated project. An explicit target.cliPath wins over COPILOT_CLI_PATH; otherwise the source setup's recorded runtime path is used. The generated runner never relies on a development install auto-downloading a runtime.",
                      ]),
                ...(plan.target.runtime === "inprocess"
                    ? [
                          "In-process hosting is experimental and uses stdlib ctypes, not a Python FFI dependency. A compatible native library must be adjacent to the selected runtime entrypoint (or in its platform prebuilds directory). The native library can outlive clients and cannot be replaced with another version in the same process.",
                          "RuntimeConnection.for_inprocess() accepts no path/args. The runner sets COPILOT_CLI_PATH before constructing the client; it does not pass forbidden client env/telemetry/working_directory options. A selected workspace remains a separate session option.",
                      ]
                    : []),
                `Python signatures: https://github.com/github/copilot-sdk/blob/${SDK_COMMIT}/python/copilot/client.py#L2258-L2344; host callbacks: python/copilot/session.py#L403-L576; storage: python/copilot/session_fs_provider.py#L52-L148.`,
            ],
            sources,
        };
    },
} satisfies LanguageAdapter;
