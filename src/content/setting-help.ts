// Copyright (c) Microsoft Corporation. All rights reserved.
import { getSource, reference } from "./reference";
import type { HelpSource, ToggleHelp, ValueHelp } from "./help-types";
import { copilotModelCatalog } from "./models";

const sessionScope =
    "A new-session configuration choice. Editing this planner does not change a running agent.";
const hostScope =
    "This planner requires application-owned code in the generated host. A JSON declaration cannot implement the callback.";
const refs = (...ids: string[]): HelpSource[] =>
    ids.map((id) => {
        const source = getSource(id);
        return { label: source.label, ...(source.url ? { url: source.url } : {}) };
    });
const types = `https://github.com/github/copilot-sdk/blob/${reference.revisions.sdk}/nodejs/src/types.ts`;
const contract = (label: string, lines: string): HelpSource[] => [{ label, url: `${types}#${lines}` }];
const callbackLabels = { enabled: "Host callback required", disabled: "No callback generated for this slot" };

export const toggleHelp = {
    preToolHook: {
        title: "Pre-tool policy hook",
        option: "hooks.onPreToolUse",
        scope: hostScope,
        summary: "Run your host callback before tool execution; it can inspect or modify a proposed call.",
        enabled:
            "Require your pre-tool callback. Supported outputs can change arguments, add context, or return an allow/deny/ask decision before execution.",
        disabled:
            "Do not generate this host callback binding. The permission handler, managed policy, and separately enabled file hooks are not disabled.",
        example:
            "Check the requested resource against the current tenant before a tool call, or add a task-specific restriction.",
        boundary:
            "This does not implement the policy for you or replace checks inside the downstream service. It is not the File-based hooks toggle.",
        valueLabels: callbackLabels,
        sources: contract("Pre-tool callback and supported outputs", "L1441-L1458"),
    },
    postToolHook: {
        title: "Post-tool result hook",
        option: "hooks.onPostToolUse",
        scope: hostScope,
        summary: "Process successful tool results in host code before they are reused in the conversation.",
        enabled:
            "Require the post-tool callback for successful results. It can supply a modified result, add context, or suppress output where supported.",
        disabled:
            "Omit this post-tool binding. Tool execution, ordinary result handling, permissions, and other hooks continue normally.",
        example:
            "Redact sensitive fields from a successful service response before the agent reuses the result.",
        boundary:
            "This hook does not fire for failed results; onPostToolUseFailure is a separate SDK surface. It is not an audit/authorization system by itself.",
        valueLabels: callbackLabels,
        sources: contract("Post-tool output and successful-result boundary", "L1501-L1516").concat(
            contract("Separate failed-result hook", "L1748-L1763"),
        ),
    },
    infinite: {
        title: "Infinite sessions",
        option: "infiniteSessions.enabled",
        scope: sessionScope,
        summary: "Enable automatic context compaction for work that outgrows one model context window.",
        enabled:
            "Enable the runtime's infinite-session behavior: automatically manage context limits through background compaction and workspace persistence.",
        disabled:
            "Do not enable this automatic infinite-session behavior. Plan for context limits and explicit state/lifecycle management instead.",
        example:
            "A long investigation can compact older conversation context while the host maintains its durable workflow records.",
        boundary:
            "This does not mean unlimited tokens, unlimited runtime, perfect recall, or a retention policy. It is not a command to delete existing session history.",
        sources: contract("Infinite sessions and compaction", "L1938-L1962"),
    },
    largeOutput: {
        title: "Large-output handling",
        option: "largeOutput.enabled",
        scope: sessionScope,
        summary: "Spill oversized tool results to a temporary file and give the model a reference instead.",
        enabled:
            "When a tool result exceeds the configured size, write it to a temporary file and return a reference rather than the entire payload. The inspected SDK default threshold is 51,200 bytes.",
        disabled:
            "Do not use this large-output spill path. Bound or summarize results in host tools so they do not overwhelm the model context.",
        example:
            "A large search result or command log can be referenced instead of inserted into the conversation in full.",
        boundary:
            "This can use the host's temporary filesystem independently of virtual session storage. Off does not disable all filesystem access or remove other result-size limits.",
        sources: contract("Large tool output behavior", "L1973-L1999"),
    },
    streaming: {
        title: "Streaming",
        option: "streaming",
        scope: sessionScope,
        summary:
            "Request incremental message/reasoning deltas instead of waiting only for completed messages.",
        enabled:
            "Deliver supported incremental delta events while a response is generated. A host UI can accumulate deltaContent and render progress.",
        disabled:
            "Do not request those incremental deltas. Completed messages and other session events remain separate surfaces.",
        example:
            "A chat UI can show an answer growing as the model responds instead of a single final update.",
        boundary:
            "Streaming is not an event handler, telemetry switch, speed guarantee, or successful-completion signal. The live options patch uses enableStreaming, not the session setup field streaming.",
        sources: contract("Streaming event contract", "L2714-L2732").concat(refs("sdk-mutable-options")),
    },
    observer: {
        title: "Event observer",
        option: "onEvent",
        scope: hostScope,
        summary: "Bind a host listener early enough to observe events emitted during session creation.",
        enabled:
            "Require the bootstrap's host observer. It is attached early in the session lifecycle so startup events are not missed.",
        disabled:
            "Omit this generated observer binding. The bootstrap can still print its final result, and application code can subscribe later through session.on.",
        example:
            "Translate session events into your UI, workflow progress, diagnostics, or evaluation traces.",
        boundary:
            "This is not a telemetry opt-out, a durable audit store, or a guarantee that logged content is safe. The generated observer records event types only; production handling remains host-owned.",
        valueLabels: callbackLabels,
        sources: contract("Creation-time event observer", "L2943-L2951"),
    },
    terminal: {
        title: "Terminal tool",
        option: "isTerminal",
        scope: "A property of this custom tool declaration, not a process-lifecycle setting.",
        summary:
            "A successful call to this tool ends the current agent turn without another model iteration.",
        enabled:
            "Mark this tool as terminal. A successful execution ends the agent turn; the host should handle completion even if there is no final assistant message.",
        disabled:
            "Treat the tool as a normal capability. Its result can feed another model iteration according to the runtime loop.",
        example: "A structured submit_answer tool can provide the task result and finish that turn.",
        boundary:
            "Failure does not become successful completion, and this does not stop the client process or delete the session. Implement the handler and its permissions separately.",
        sources: refs("sdk-tools", "override-schema"),
    },
} satisfies Record<string, ToggleHelp>;

function setting(
    title: string,
    option: string,
    summary: string,
    details: ValueHelp["details"],
    example: string,
    boundary: string,
    sources: HelpSource[],
    scope = sessionScope,
): ValueHelp {
    return { title, option, summary, details, example, boundary, sources, scope };
}

export const valueHelp = {
    storage: setting(
        "Session storage",
        "sessionFs / createSessionFsProvider / baseDirectory",
        "Choose who supplies the session filesystem, independently of the project's files.",
        [
            {
                title: "Local directory",
                value: "local",
                text: "Use a state directory on the future runtime host. For an existing service, its operator owns that server setting.",
            },
            {
                title: "Virtual provider",
                value: "virtual",
                text: "Require a real host SessionFs implementation. The current bootstrap declares no SQLite capability; the inspected Java SDK cannot represent this choice.",
            },
        ],
        "Keep conversation state in a host-controlled storage adapter while domain tools access a separate document service.",
        "SessionFs is filesystem-shaped, not universal filesystem virtualization, an arbitrary database API, or tenant isolation.",
        refs("sdk-storage", "sdk-storage-capabilities", "runtime-storage"),
    ),
    stateDirectory: setting(
        "Session state directory",
        "baseDirectory",
        "The future host path used for local runtime state.",
        [
            {
                title: "Path ownership",
                text: "Owned runtimes resolve this in the application host. For an external runtime it belongs to that server, and must be configured there.",
            },
        ],
        "Give a local integration its own .harness-state directory rather than sharing an unrelated user's state.",
        "This browser does not create the directory. A state location does not define data retention or authorization.",
        refs("sdk-default", "sdk-startup-options"),
        "Client/runtime startup configuration; not a live turn setting.",
    ),
    idle: setting(
        "Idle cleanup timeout",
        "sessionIdleTimeoutSeconds",
        "Set how long an inactive session can remain before the runtime cleans it up.",
        [
            { title: "Zero", value: "0", text: "Disable idle cleanup through this setting." },
            {
                title: "Positive seconds",
                text: "Allow automatic cleanup after the configured period without activity. An existing service's operator controls its startup policy.",
            },
        ],
        "Use a 900-second idle policy for a service that releases inactive sessions after fifteen minutes.",
        "This is not sendAndWait's timeout, an execution deadline, or a data-retention/deletion policy.",
        refs("sdk-idle-option"),
        "Client/runtime startup configuration. Connecting a client does not reconfigure an existing server.",
    ),
    evaluation: setting(
        "Workload evaluation criteria",
        "Planner-owned evaluation notes",
        "Record how your application will decide whether this harness performs its job correctly.",
        [
            {
                title: "Where it goes",
                text: "Kept in the planner JSON and generated README. It is not sent as a magical SDK option and is not automatically evaluated.",
            },
        ],
        "Require answers to cite authorized records and verify that denied tool calls never execute.",
        "The builder does not score model quality, prove policy correctness, or run benchmarks. Your host/team owns the datasets, methods, and release bar.",
        [{ label: "Planner format and generated project documentation" }],
        "Host-owned design and release criteria, not a runtime configuration field.",
    ),
    clientMode: setting(
        "SDK client baseline",
        "CopilotClientOptions.mode",
        "Choose the initial SDK defaults before adding your explicit configuration.",
        [
            {
                title: "Empty",
                value: "empty",
                text: "Suppress ambient coding-oriented defaults. The builder requires an explicit inventory and separately replaces the prompt in its Empty profile.",
            },
            {
                title: "Copilot CLI",
                value: "copilot-cli",
                text: "Start from the coding-oriented foundation. Additional discovery/skills/hooks opt-ins are still separate choices.",
            },
        ],
        "Use Empty for a service that supplies only reviewed tools; use the coding foundation for a trusted developer-local experience.",
        "This is a client construction choice, not interactive/plan/autopilot mode or a live-session switch. Neither mode creates a sandbox.",
        refs("sdk-modes", "sdk-empty", "runtime-mode"),
        "Client construction. The builder applies this to a new-session bootstrap.",
    ),
    promptMode: setting(
        "System message mode",
        "systemMessage.mode",
        "Choose whether to extend, replace, or selectively customize the foundation prompt.",
        [
            { title: "Append", value: "append", text: "Keep the foundation and add your instructions." },
            {
                title: "Replace",
                value: "replace",
                text: "Supply the whole system message instead of inheriting the foundation's guidance.",
            },
            {
                title: "Customize",
                value: "customize",
                text: "Apply static actions to named sections while retaining the prompt structure.",
            },
        ],
        "Change tone through Customize, or create a non-coding domain persona through Replace.",
        "Prompt ownership is separate from tool exposure and enforced authorization. The built-in viewer is a source reference, not the exact live model prompt.",
        refs("sdk-prompts"),
    ),
    sectionName: setting(
        "Prompt section",
        "systemMessage.sections",
        "Address the part of the foundation whose text or behavior you want to change.",
        [
            {
                title: "Sections and groups",
                text: "Some IDs are individual sections; identity and tool_instructions address groups. Use the built-in reference to understand their members.",
            },
        ],
        "Change tone without replacing coding rules, tool guidance, or environment context.",
        "Section-local previews do not resolve every group-precedence rule, model-specific fragment, or runtime input.",
        refs("sdk-prompts"),
    ),
    sectionAction: setting(
        "Section action",
        "SectionOverride.action",
        "Choose how this section changes relative to the foundation.",
        [
            {
                title: "Replace / remove",
                text: "Replace supplies the section content; remove requests that the section be omitted.",
            },
            {
                title: "Append / prepend",
                text: "Add guidance after or before the inherited section content.",
            },
            {
                title: "Preserve",
                value: "preserve",
                text: "Keep an individually addressable section, including opting it out of a group removal where supported.",
            },
        ],
        "Prepend a domain tone rule while keeping the default tone instructions.",
        "This editor produces static overrides. Runtime transform callbacks and final group/model assembly are separate mechanisms.",
        refs("sdk-prompts"),
    ),
    inventory: setting(
        "Tool inventory",
        "availableTools / excludedTools",
        "Choose exposure policy without confusing it with implementation or authority.",
        [
            {
                title: "Explicit",
                value: "explicit",
                text: "Only selected names are included. Empty mode requires this; runtime feature and platform gates still apply.",
            },
            {
                title: "Coding defaults",
                value: "coding-defaults",
                text: "Leave runtime selection intact except for your exclusions and replacements. This does not force every compiled descriptor on.",
            },
        ],
        "Expose only an authorized lookup tool to a business workflow while retaining the runtime's session machinery.",
        "Selecting a name does not grant resource access, enable every prerequisite, or implement the tool handler.",
        refs("sdk-filter-rules", "sdk-filter-names", "sdk-modes"),
    ),
    toolAction: setting(
        "Tool selection and implementation",
        "Tool availability / overridesBuiltInTool",
        "Keep, replace, or remove this capability through different mechanisms.",
        [
            {
                title: "Keep / runtime default",
                value: "keep",
                text: "Select the native name, or retain the runtime's own selection policy in inherited mode.",
            },
            {
                title: "Override",
                value: "override",
                text: "Use an explicitly marked host definition and handler under the same name, where the snapshot verifies that path.",
            },
            {
                title: "Remove",
                value: "remove",
                text: "Exclude the name from exposure; do not delete runtime code or revoke OS privileges.",
            },
        ],
        "Replace view with a tenant-authorized document reader instead of using native disk access.",
        "An override is not an automatic wrapper/fallback to native code. Unverified and reserved routes must not produce misleading runnable exports.",
        refs("override-planning", "override-dispatch", "override-permissions"),
    ),
    toolSchema: setting(
        "Tool parameter schema",
        "Tool.parameters",
        "Describe the JSON arguments that the model should supply to your handler.",
        [
            {
                title: "Shape versus implementation",
                text: "Use a top-level object schema. The override example is your custom contract, not a claim to reproduce the native tool's schema.",
            },
        ],
        "Require a recordId string, then validate that the current principal may read that record inside the handler.",
        "A schema or defineTool declaration is not business validation, authorization, or an implementation. The handler owns those checks.",
        refs("sdk-tools", "override-schema"),
        "Tool declaration and host handler contract.",
    ),
    workspace: setting(
        "Project working directory",
        "workingDirectory",
        "Describe the project directory on the host where the future session runs.",
        [
            {
                title: "Local versus service",
                text: "With an existing runtime, this path belongs to that runtime host. Blank leaves the project directory unspecified; it does not disable native file or shell tools.",
            },
        ],
        "Point a coding session at /workspace/project; leave it unspecified for a service-backed document workflow.",
        "This browser does not inspect or create the path. Project context, session storage, and process isolation are different concerns.",
        refs("sdk-session-config", "sdk-existing-runtime"),
    ),
    skillDirectories: setting(
        "Skill directories",
        "skillDirectories",
        "Supply reviewed directories containing skill instruction packs.",
        [
            {
                title: "Loading gate",
                text: "The Skills switch must allow loading. Directory configuration is separate from selecting the skill tool and from supplying a lazy service-backed skill provider.",
            },
        ],
        "Make a team's review rubric available as a versioned SKILL.md pack.",
        "Adding a path does not materialize files, install a marketplace package, or grant authority. Paths are on the future host.",
        refs("sdk-pack-inputs", "runtime-skill-contract"),
    ),
    pluginDirectories: setting(
        "Plugin directories",
        "pluginDirectories",
        "Provide explicit, reviewed capability bundles to the runtime.",
        [
            {
                title: "Explicit opt-in",
                text: "Explicit plugin directories can load supported plugin agents/rules even when general configuration discovery is off.",
            },
        ],
        "Ship an approved team pack rather than relying on whatever is installed in a user's ambient marketplace inventory.",
        "Format compatibility is component-specific. Paths do not imply installation, authorization, or an atomic live reload of every resource.",
        refs("sdk-pack-inputs", "plugin-components", "plugin-reload-boundary"),
    ),
    modelProvider: setting(
        "Inference access",
        "provider",
        "Choose whether GitHub Copilot manages inference or your host connects to an inference provider.",
        [
            {
                title: "Managed versus bring your own",
                text: "GitHub Copilot manages billing, inference, entitlements, and model availability for its account route. Bring your own uses the endpoint and provider credential binding operated by your host.",
            },
        ],
        "Use a local OpenAI-compatible server, a third-party provider, or Azure inference while keeping the same approved tool workflow.",
        "Bring your own means your application owns provider billing, capacity, credentials, compatibility, and availability. No model discovery or inference runs here.",
        refs("sdk-providers", "runtime-loop"),
    ),
    modelId: setting(
        "Model ID",
        "model",
        "Name a model available to your chosen runtime/provider, or have the host supply it.",
        [
            {
                title: "Copilot model catalog",
                text: "GitHub Copilot uses a bundled snapshot of the runtime's public model IDs. The SDK's client.listModels() discovers live account models in your future host. Existing IDs outside the snapshot are retained; BYOK accepts the identifier exposed by your endpoint.",
            },
            {
                title: "Blank value",
                text: "Host supplied keeps the model ID blank. The generated host requires a model value instead of inventing a model ID. Explicit values are passed to the configured model route.",
            },
        ],
        "Keep model selection in an enterprise policy service rather than hardcoding it in each harness.",
        "The builder does not validate live availability or quality. A recognizable ID is not proof that an account or provider can use it.",
        refs("sdk-model-change", "sdk-providers").concat([
            { label: "SDK live model discovery", url: copilotModelCatalog.sources.sdk },
            { label: "Runtime public model catalog", url: copilotModelCatalog.sources.runtime },
        ]),
    ),
    providerEndpoint: setting(
        "Provider endpoint",
        "provider.baseUrl",
        "The HTTP(S) inference endpoint used by a BYOK provider.",
        [
            {
                title: "Optional in the planner",
                text: "Leave this blank to supply the endpoint string in the generated host, like an enabled callback implementation. Saving and exporting remain available; generated preflight and startup report the missing endpoint until you implement it. No example endpoint is substituted.",
            },
            {
                title: "Different endpoints",
                text: "This is not the SDK/runtime TCP connection or an MCP server. Choose the API format the inference service actually supports.",
            },
        ],
        "Use the approved provider gateway URL while keeping its credential in an environment binding or callback.",
        "Nonempty endpoints must be valid HTTP(S) URLs without usernames, passwords, or credential query parameters. The browser does not call or verify this endpoint.",
        refs("sdk-providers"),
    ),
    wireApi: setting(
        "Provider wire API",
        "provider.wireApi",
        "Select the protocol shape used by OpenAI-compatible or Azure inference.",
        [
            { title: "Responses", value: "responses", text: "Use a compatible Responses API endpoint." },
            {
                title: "Chat completions",
                value: "completions",
                text: "Use a compatible Chat Completions endpoint.",
            },
        ],
        "Match a gateway's supported API instead of assuming that every OpenAI-compatible endpoint serves both.",
        "Changing the wire API does not translate an arbitrary service, fix authentication, or guarantee provider-native feature parity.",
        refs("sdk-providers"),
    ),
    reasoning: setting(
        "Reasoning effort",
        "reasoningEffort",
        "Request a supported reasoning-effort setting for the selected model.",
        [
            {
                title: "Model default",
                value: "default",
                text: "Omit an explicit effort override and defer to the selected model/runtime.",
            },
            {
                title: "Explicit effort",
                text: "Pass the selected supported value. Available levels differ by model and provider.",
            },
        ],
        "Evaluate whether a higher effort improves the actual workload enough to justify latency or usage differences.",
        "This is not a quality score, a token budget, or a guarantee that every model accepts the same values.",
        refs("sdk-model-policy", "sdk-mutable-options"),
    ),
    contextTier: setting(
        "Context tier",
        "contextTier",
        "Choose a supported model context tier, separately from automatic compaction.",
        [
            {
                title: "Default",
                value: "default",
                text: "Use the model/runtime's normal context-tier resolution.",
            },
            {
                title: "Long context",
                value: "long_context",
                text: "Request the supported long-context tier where the selected model/provider offers it.",
            },
        ],
        "Compare long-context operation with a compacting workflow using representative inputs.",
        "It does not enable infinite history or make unsupported models accept larger contexts. Availability and cost need workload validation.",
        refs("sdk-mutable-options", "sdk-model-policy"),
    ),
    credentials: setting(
        "Provider credential source",
        "provider.apiKey / bearerTokenProvider",
        "Choose how the future host acquires a provider credential without storing the value in the plan.",
        [
            {
                title: "Environment variable",
                value: "api-key",
                text: "Read a named variable in the host process.",
            },
            {
                title: "Bearer callback",
                value: "bearer-callback",
                text: "Use the experimental on-demand callback; the host owns acquisition, caching, and refresh.",
            },
        ],
        "Use a credential broker or managed-identity library rather than baking tokens into configuration files.",
        "This is separate from a GitHub session token provider. Browser storage is not a secret vault.",
        refs("sdk-providers", "sdk-auth"),
        hostScope,
    ),
    credentialEnv: setting(
        "Credential environment variable",
        "Provider credential reference",
        "Enter the variable name, not its secret value.",
        [
            {
                title: "Resolution",
                text: "The generated process reads this variable when it starts the selected provider route. The web app never reads its value.",
            },
        ],
        "Enter MODEL_API_KEY, then set that value in the deployment environment or secret manager.",
        "The plan and generated files can be shared with variable names, but prompts, URLs, and other text fields can still contain sensitive content if you paste it there.",
        refs("sdk-providers"),
        "A reference resolved by the generated host, not a browser credential input.",
    ),
    identity: setting(
        "Copilot credential ownership",
        "gitHubTokenProvider / useLoggedInUser",
        "Choose the authentication route used for Copilot inference.",
        [
            {
                title: "Host token callback",
                value: "host-token",
                text: "Require explicit per-session token acquisition/refresh. Starter environment adapters need the token's actual expiry.",
            },
            {
                title: "Developer identity",
                value: "developer",
                text: "Permit the future local runtime to use its developer login; an external service owns its own identity.",
            },
            {
                title: "GitHub App service identity",
                value: "s2s-installation",
                text: "For accounts GitHub has separately enabled for GitHub App installation authentication. The runtime receives a one-hour installation token through COPILOT_GITHUB_TOKEN with logged-in-user fallback disabled; there is no session callback refresh.",
            },
        ],
        "Use scoped session identity for a shared service, or the eligible GitHub App route when service-owned attribution is required.",
        "The stored choice is inactive for the planner's BYOK inference route. Selection does not enable an account, approve billing, grant model access, promise rate limits, or authorize tools, MCP, and downstream services. Never store app keys, JWTs, installation tokens, or expiry here.",
        refs("sdk-auth", "sdk-s2s-auth", "sdk-default", "sdk-existing-runtime"),
        "Host/session authentication; runtime process ownership still matters.",
    ),
    agentModel: setting(
        "Agent model preference",
        "customAgents[].model",
        "Set a specialist's preferred model without confusing it with a hard model policy.",
        [
            {
                title: "Fallback behavior",
                text: "The inspected agent configuration can fall back to the parent model when the preference is unavailable. Blank uses the parent/session selection.",
            },
        ],
        "Evaluate a cheaper reviewer model while keeping the workload's allowed model policy explicit.",
        "This is not a fail-if-unavailable guarantee. Session model allowlists have a different scope.",
        refs("sdk-agents", "sdk-model-policy"),
    ),
    agentTools: setting(
        "Agent allowed tools",
        "customAgents[].tools",
        "Constrain the capabilities a specialist is intended to use.",
        [
            {
                title: "Scope",
                text: "Use the actual tool names for the role. An empty explicit list gives no tools in this declaration; it is not an authorization identity.",
            },
        ],
        "Give a reviewer lookup tools but no write/publish capability.",
        "Tool visibility does not grant missing capabilities or replace service-side authorization. Child context separation is not process or tenant isolation.",
        refs("sdk-agents", "sdk-tools"),
    ),
    selectedAgent: setting(
        "Selected root agent",
        "agent",
        "Choose the custom role used as the session's primary agent.",
        [
            {
                title: "Default role",
                text: "Leave selection empty to use the runtime's default agent. Selecting a declared role applies that role's configuration.",
            },
        ],
        "Start directly in a domain reviewer instead of asking a general agent to delegate.",
        "Selection is not a change to user identity, a separate engine, or a sandbox. Verify the role's prompt, tools, and model behavior.",
        refs("sdk-agents"),
    ),
    rootExclusions: setting(
        "Root-only tool exclusions",
        "defaultAgent.excludedTools",
        "Hide capabilities from the primary agent while retaining them for subagent use.",
        [
            {
                title: "Direction matters",
                text: "These exclusions act on the root agent. They are not a marker saying a tool may run only at the top level.",
            },
        ],
        "Keep a specialized operation out of the general root agent while a reviewed specialist can use it.",
        "This does not revoke child access or establish a trusted per-agent authorization identity. Enforce sensitive authority in the effect owner.",
        refs("sdk-agents", "sdk-session-config"),
    ),
    mcpEndpoint: setting(
        "MCP service endpoint",
        "mcpServers[].url",
        "Connect the future runtime to a service that exposes tools through MCP.",
        [
            {
                title: "Service boundary",
                text: "This is separate from the model endpoint and runtime TCP connection. Configure the actual service and explicit tool list.",
            },
        ],
        "Expose approved document retrieval through an MCP server instead of embedding the service implementation in every host.",
        "The browser does not connect to the service. A URL and tool list are not authentication, tenant authorization, or confinement.",
        refs("sdk-mcp"),
    ),
    mcpNames: setting(
        "MCP tool names",
        "Server tool name / canonical runtime wire name",
        "Keep the service's raw tool name separate from the name used by runtime availability filters.",
        [
            {
                title: "Use discovered names",
                text: "The raw name belongs to the MCP server. The canonical wire name belongs in runtime tool selectors. Do not invent a renaming layer or infer arbitrary prefixes.",
            },
        ],
        "A server's search tool may appear as documents-search in the runtime; verify that exact name against the selected SDK/runtime.",
        "Aliases, selection filters, and service tool names are different surfaces. Some bootstrap adapters reject unsupported mappings rather than hide a tool silently.",
        refs("sdk-filter-names", "sdk-mcp"),
    ),
    runtime: setting(
        "Runtime placement",
        "RuntimeConnection / transport",
        "Choose where the shared engine runs and who owns its lifecycle.",
        [
            {
                title: "Managed child",
                value: "managed",
                text: "The SDK launches and cleans up an out-of-process runtime over stdio.",
            },
            {
                title: "Existing service",
                value: "external",
                text: "Connect to a separately operated runtime over TCP; the service operator owns its lifecycle and server settings.",
            },
            {
                title: "In-process",
                value: "inprocess",
                text: "Load a matching native library into the host. This is experimental and shares process state.",
            },
        ],
        "Use managed mode for a local integration or a separately managed service for a backend deployment.",
        "A process boundary is not a sandbox. Native hosting requires language/platform packaging and does not guarantee library unloading or version replacement.",
        refs("sdk-managed-runtime", "sdk-existing-runtime", "sdk-inprocess-guide"),
        "Client construction and deployment; not a live session toggle.",
    ),
    runtimePath: setting(
        "Managed runtime executable",
        "RuntimeConnection.forStdio path",
        "Override the executable entrypoint for an SDK-managed child process.",
        [
            {
                title: "Blank path",
                text: "Use the language SDK's documented bundle, cache, or runtime discovery route.",
            },
            {
                title: "Explicit path",
                text: "The future host must provision a compatible runtime package and its adjacent assets.",
            },
        ],
        "Point a local integration at a pinned runtime bundle supplied by your deployment.",
        "This is not a native-library path argument or an external server location. Inactive transport settings are retained but not applied.",
        refs("sdk-managed-runtime", "sdk-inprocess-guide"),
        "Managed-child startup only.",
    ),
    runtimeEndpoint: setting(
        "Existing runtime endpoint",
        "RuntimeConnection.forUri / external transport",
        "Identify the headless runtime service your application will connect to.",
        [
            {
                title: "Address",
                text: "Use a validated host:port or TCP address without credentials. The bootstrap normalizes it to the language's connection API.",
            },
        ],
        "Connect an application to 127.0.0.1:4321 after starting a compatible headless runtime separately.",
        "This is not a model or MCP URL. Transport credentials belong in host environment bindings; an SDK client does not deploy or secure the server.",
        refs("sdk-existing-runtime"),
        "Client connection setup; server lifecycle and policy remain host-owned.",
    ),
    language: setting(
        "Bootstrap language",
        "Generated project target",
        "Choose the host SDK and project layout while preserving the harness decisions.",
        [
            {
                title: "Compatibility",
                text: "The generator creates dependency setup, entrypoint, host integration files, and run/preflight instructions. Unsupported choices produce explicit blockers.",
            },
        ],
        "Use a Python service or C# application with the same configured tools, while reviewing the language's callback and native-packaging requirements.",
        "A shared protocol does not prove uniform SDK feature coverage. A generated project still needs real host code, credentials, and platform dependencies.",
        refs("sdk-overview", "sdk-inprocess-guide"),
        "Code generation, not a runtime API property or a language-conversion service.",
    ),
} satisfies Record<string, ValueHelp>;
