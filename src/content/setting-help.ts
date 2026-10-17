// Copyright (c) Microsoft Corporation. All rights reserved.
import { getSource } from "./reference";
import type { HelpSource, ToggleHelp, ValueHelp } from "./help-types";
import { S2S_AUTH_AVAILABILITY } from "./sdk-docs";

const sessionScope =
    "A new-session configuration choice. Editing this planner does not change a running agent.";
const hostScope =
    "This planner requires application-owned code in the generated host. A JSON declaration cannot implement the callback.";
const refs = (...ids: string[]): HelpSource[] =>
    ids.map((id) => {
        const source = getSource(id);
        return { label: source.label };
    });
const contract = (label: string, _lines: string): HelpSource[] => [{ label }];
const callbackLabels = { enabled: "Host callback required", disabled: "No callback generated for this slot" };
const createScope =
    "Applied only when the session is created. Resuming an existing session does not re-apply it, and editing this planner does not change a running agent.";
const resumeScope =
    "Applies when the generated host resumes an existing session, not when it creates one. Editing this planner does not change a running agent.";
const experimentalScope =
    "Experimental SDK option: it may change or be removed in a future SDK or runtime release. A new-session configuration choice; editing this planner does not change a running agent.";
const managedScope =
    "Host-injected managed policy for a new or resumed session. It is not persisted, so the generated host supplies it again on every resume.";

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
    skipPermission: {
        title: "Skip permission prompt",
        option: "Tool.skipPermission",
        scope: "A property of this custom tool declaration, not a session-wide permission mode.",
        summary: "Let this host tool run without asking the permission handler first.",
        enabled:
            "Declare that calls to this tool need no permission prompt. Use it only for read-only or already-authorized operations that your handler checks itself.",
        disabled:
            "Calls go through the normal permission flow: your permission handler (or the explicit allow-all helper) decides each request.",
        example:
            "A lookup tool that only reads records the signed-in user can already see can skip the prompt; a refund tool should not.",
        boundary:
            "Skipping the prompt does not authorize the operation. Your handler must still validate the caller, tenant, and resource, and managed policy still applies.",
        sources: refs("sdk-tool-search-config", "sdk-permissions"),
    },
    skillProvider: {
        title: "Skill provider",
        option: "skillProvider",
        scope: experimentalScope,
        summary: "Serve skills from host storage through listSkills/readSkill instead of SKILL.md folders.",
        enabled:
            "Require a host SkillProvider. The runtime calls listSkills to build the catalog and readSkill when a skill is loaded. Calls can run concurrently and must finish within 30 seconds.",
        disabled:
            "Skills come only from built-in, directory, plugin, and discovered sources. No provider binding is generated.",
        example:
            "A support product serves per-tenant playbooks from its CMS so each customer's agent sees only that tenant's skills.",
        boundary:
            "Skills must stay enabled or the provider receives no calls. The provider is not persisted: pass it again on every resume, or its skills disappear. Provider errors are hidden from the model, and cloud sessions do not support providers.",
        valueLabels: callbackLabels,
        sources: refs("sdk-skill-provider", "runtime-skill-contract"),
    },
    onDemandInstructions: {
        title: "On-demand instruction discovery",
        option: "enableOnDemandInstructionDiscovery",
        scope: sessionScope,
        summary: "Pick up instruction files such as AGENTS.md as the agent views files in other folders.",
        enabled:
            "After a successful file view, the runtime can discover instruction files that apply to that location and add them to context.",
        disabled:
            "Instruction files are loaded only through the normal startup sources and any explicit instruction roots.",
        example:
            "A monorepo agent working in packages/billing picks up that package's AGENTS.md when it first reads a file there.",
        boundary:
            "This does not re-enable custom instructions that are skipped, and it does not grant file access. It only follows files the agent already viewed.",
        sources: refs("sdk-instruction-options"),
    },
    refreshCustomInstructions: {
        title: "Refresh instruction cache",
        option: "refreshCustomInstructions",
        scope: createScope,
        summary: "Clear the runtime's shared instruction cache before this session is created.",
        enabled:
            "Invalidate the process-wide custom-instruction discovery cache, so this session reads instruction files that changed while the runtime kept running.",
        disabled:
            "Use the runtime's cached instruction discovery results, which is faster for repeated sessions.",
        example:
            "A long-lived service updates a repository's copilot-instructions.md and wants the next session to see the change.",
        boundary:
            "Other sessions in the same runtime may also see the updated instructions later. This does not watch files or enable instruction loading that is turned off.",
        sources: refs("sdk-session-name", "sdk-instruction-options"),
    },
    managedLoad: {
        title: "Load managed settings",
        option: "enableManagedSettings",
        scope: sessionScope,
        summary: "Have the runtime fetch enterprise managed policy using the session's GitHub token.",
        enabled:
            "At session start the runtime fetches account, organization, and device managed policy. It needs a GitHub token on the session and rejects creation without one (fail-closed).",
        disabled:
            "The runtime does not self-fetch managed policy. Host-injected rules below and device-managed policy can still apply.",
        example:
            "An enterprise integration honors the same bypass-permissions policy its administrators set for other Copilot clients.",
        boundary:
            "This needs GitHub identity, so it does not fit a bring-your-own-key route without a GitHub token. It does not replace host authorization.",
        sources: refs("sdk-managed-session", "sdk-managed-settings"),
    },
    enforceModelDefaults: {
        title: "Enforce managed model defaults",
        option: "enforceManagedModelDefaults",
        scope: sessionScope,
        summary: "Apply locked model controls from managed policy and reject conflicting model changes.",
        enabled:
            "Locked managed model values replace conflicting session options at startup, and conflicting model changes are rejected. Overridable defaults stay editable.",
        disabled: "Managed model defaults are not enforced through this option.",
        example: "An organization locks the session model to an approved ID for regulated workloads.",
        boundary:
            "This does not fetch policy by itself; pair it with managed settings. It is not a model allowlist you author here.",
        sources: refs("sdk-managed-session"),
    },
    disableAssisted: {
        title: "Disable Assisted permissions",
        option: "managedSettings.permissions.disableAssistedPermissionsMode",
        scope: managedScope,
        summary: "Prevent the experimental Assisted permissions mode from being turned on in this session.",
        enabled:
            "Inject a managed rule that blocks Assisted permissions. Users and the session cannot opt in while the rule applies.",
        disabled: "Impose no restriction on Assisted permissions through host-injected policy.",
        example: "A compliance-sensitive deployment requires every approval to come from the host handler.",
        boundary:
            "Assisted permissions are experimental runtime behavior. This rule restricts that mode only; it does not change deny/ask/allow rules or your permission handler.",
        sources: refs("sdk-managed-settings"),
    },
    interactiveUser: {
        title: "Interactive user",
        option: "interactiveUser",
        scope: sessionScope,
        summary: "Declare that a human types this session's messages, not an automated pipeline.",
        enabled:
            "Mark the session as human-driven, which enables user-message analysis telemetry for user-authored messages. Automated messages stay excluded.",
        disabled: "The SDK default for SDK sessions: messages are treated as automated for that telemetry.",
        example: "A chat UI where people type prompts turns this on; a nightly batch job leaves it off.",
        boundary:
            "This is ignored for cloud sessions and when resuming an already active session. It is not an identity, approval, or authorization signal.",
        sources: refs("sdk-managed-session"),
    },
    sessionStore: {
        title: "Cross-session store",
        option: "enableSessionStore",
        scope: sessionScope,
        summary: "Allow this session's content to be written to and searched from the shared session store.",
        enabled:
            "Session content is written to the runtime's cross-session store so later sessions can search and retrieve it.",
        disabled: "Session content is not written to or read from the shared session store.",
        example: "A personal developer assistant recalls how a similar problem was solved last week.",
        boundary:
            "The store is shared within the runtime's state. For multi-tenant services keep it off or isolate state per tenant; it is not a retention policy.",
        sources: refs("sdk-session-config"),
    },
    fileChangeTracking: {
        title: "File change tracking",
        option: "enableFileChangeTracking",
        scope: sessionScope,
        summary: "Capture file changes so the session can be rewound and show a cumulative diff.",
        enabled:
            "Record file changes starting with the first turn, enabling rewind and a cumulative session diff.",
        disabled:
            "No change baseline is captured. Rewind and cumulative diff are unavailable for these turns.",
        example: "A coding assistant lets users review everything the agent changed before committing.",
        boundary:
            "On resume this can start tracking only if a valid baseline still exists; it cannot reconstruct earlier untracked changes. It is not version control.",
        sources: refs("sdk-session-config"),
    },
    allowTranscriptRecovery: {
        title: "Transcript recovery",
        option: "allowTranscriptRecovery",
        scope: resumeScope,
        summary: "Let the runtime repair a damaged transcript when resuming instead of failing.",
        enabled:
            "The SDK default: when a stored transcript is damaged, the runtime proposes a repair and backs up the original before continuing.",
        disabled: "Resume rejects a damaged transcript so the host can decide what to do.",
        example:
            "A service that must never silently alter conversation history turns recovery off and alerts an operator.",
        boundary: "This does not create backups of healthy sessions or recover deleted state.",
        sources: refs("sdk-resume-recovery"),
    },
    continuePendingWork: {
        title: "Continue pending work",
        option: "continuePendingWork",
        scope: resumeScope,
        summary: "Resume tool calls and permission prompts that were still pending when the session stopped.",
        enabled:
            "Pending tool calls and permission prompts continue. Permission requests are re-emitted to your handler, so handlers must be registered before resuming.",
        disabled:
            "The SDK default: pending work is treated as interrupted. Completed tool results that were already recorded are kept.",
        example: "A long-running job resumes after a deploy and finishes the approval it was waiting on.",
        boundary:
            "This does not replay completed calls or make tool handlers idempotent. Your host must be ready to answer re-emitted requests.",
        sources: refs("sdk-resume-recovery"),
    },
    subAgentStreaming: {
        title: "Sub-agent streaming",
        option: "includeSubAgentStreamingEvents",
        scope: sessionScope,
        summary: "Forward streaming deltas from sub-agents to this connection.",
        enabled:
            "The SDK default: sub-agent message and reasoning deltas arrive with an agentId so a UI can show nested progress.",
        disabled:
            "Only non-streaming sub-agent events and subagent lifecycle events are forwarded, which reduces event volume.",
        example: "A dashboard that only shows final results turns this off to keep the event stream small.",
        boundary: "This does not change what sub-agents do or which events the parent agent sees.",
        sources: refs("sdk-subagent-hooks", "sdk-session-config"),
    },
    imageGeneration: {
        title: "Image generation",
        option: "imageGeneration.enabled",
        scope: experimentalScope,
        summary: "Opt in to generating images through an authorized Copilot image model.",
        enabled:
            "Request the image generation capability for this session. The opt-in is not persisted, so the host supplies it again after a runtime restart.",
        disabled: "The SDK default: image generation stays off.",
        example: "A design assistant creates a PNG mockup when the user explicitly asks for one.",
        boundary:
            "Not available with a custom (bring-your-own) provider. Policy, permissions, offline mode, and tool filters still apply, and account access is not guaranteed.",
        sources: refs("sdk-image-generation"),
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
    permissionMode: setting(
        "Permission handling",
        "onPermissionRequest",
        "Choose whether your application supplies approval logic or explicitly approves every ordinary request.",
        [
            {
                title: "Host permission handler",
                value: "host",
                text: "Require application-owned callback code. Generated preflight fails until the host integration is implemented.",
            },
            {
                title: "Explicit allow all",
                value: "allow-all",
                text: "Bind the SDK's built-in approve-all helper. It returns approve-once for each ordinary permission request rather than creating a persistent wildcard grant.",
            },
        ],
        "Use a host handler for tenant/resource authorization; choose allow-all only for a deliberately unrestricted trusted workload.",
        "Allow-all does not override managed policy, content exclusion, downstream service authorization, missing or invalid tools, or sandbox enablement. It can approve a sandbox-bypass request when bypass capability is enabled.",
        refs("sdk-permissions", "override-permissions"),
        hostScope,
    ),
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
        "Choose whether to keep, extend, replace, or selectively customize the foundation prompt.",
        [
            {
                title: "Default",
                value: "default",
                text: "Leave systemMessage unset so the runtime uses its built-in prompt unchanged. You can switch later.",
            },
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
            {
                title: "Selection aliases",
                text: "Filter names can be aliases such as shell, search, web, and todo. Each expands only to matching tools that are actually available; an alias is not an extra tool.",
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
            { label: "SDK live model discovery" },
            { label: "Runtime public model catalog" },
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
                title: "GitHub App service identity (coming soon)",
                value: "s2s-installation",
                text: `${S2S_AUTH_AVAILABILITY} The runtime receives a one-hour installation token through COPILOT_GITHUB_TOKEN with logged-in-user fallback disabled; there is no session callback refresh.`,
            },
        ],
        "Use scoped session identity for shared services. The GitHub App route also requires feature-flag enablement.",
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
    agentDirectories: setting(
        "Agent directories",
        "agentDirectories",
        "Load custom agent definition files from explicit roots, separate from agents declared in this plan.",
        [
            {
                title: "Discovery-only roots",
                text: "The runtime reads agent files from these roots even with configuration discovery off. Relative paths resolve once against the working directory. Source and managed disables still apply.",
            },
        ],
        "Ship a reviewed ./agents folder with a team's reviewer and planner definitions.",
        "Roots grant no general filesystem access and do not install anything. The browser does not read these paths.",
        refs("sdk-discovery-roots", "sdk-agents"),
    ),
    hookDirectories: setting(
        "Hook directories",
        "hookDirectories",
        "Load file-defined hooks from explicit roots, independently of the File-based hooks switch.",
        [
            {
                title: "Discovery-only roots",
                text: "These roots work without configuration discovery or enableFileHooks (which covers repository hooks only). Hook and managed disables still apply.",
            },
        ],
        "Point at a reviewed ./policy-hooks folder that runs a compliance check before shell commands.",
        "Hook files run commands in the runtime host, so review them like code. They are separate from the SDK callback hooks on Policy & state.",
        refs("sdk-discovery-roots", "sdk-lifecycle-hooks"),
    ),
    instructionDirectories: setting(
        "Instruction directories",
        "instructionDirectories",
        "Load instruction files from explicit roots using the SDK's existing instruction formats.",
        [
            {
                title: "Discovery-only roots",
                text: "Instruction files under these roots load even with configuration discovery off. Instruction and managed disables, including Skip custom instructions, still apply.",
            },
        ],
        "Share one ./team-instructions folder across services without copying it into every repository.",
        "Roots grant no general filesystem access, and instructions are guidance, not enforced policy.",
        refs("sdk-discovery-roots", "sdk-instruction-options"),
    ),
    additionalDirectories: setting(
        "Additional accessible directories",
        "additionalDirectories",
        "Let the agent work in directories beyond the working directory.",
        [
            {
                title: "Access, not discovery",
                text: "Unlike the discovery-only roots, these directories extend where tools may operate. Relative paths resolve against the working directory. Re-supply them when resuming.",
            },
        ],
        "Allow a coding agent to read a shared ../proto folder next to the service it edits.",
        "This is not a sandbox or an authorization grant for downstream services. Permission handling and managed rules still decide each operation.",
        refs("sdk-session-config"),
    ),
    includedBuiltinSkills: setting(
        "Included built-in skills",
        "includedBuiltinSkills",
        "Opt specific runtime-bundled skills back in, mainly for the Empty client baseline.",
        [
            {
                title: "Empty baseline",
                text: "In Empty mode, omitting this list excludes every bundled skill; listing names opts those back in. Skills from other sources remain eligible.",
            },
            {
                title: "Copilot CLI baseline",
                text: "Bundled skills are already eligible, so this list rarely changes behavior there.",
            },
        ],
        "Keep an Empty-mode service minimal but include one bundled skill your workflow relies on.",
        "Skills must still be enabled. Names are not validated against a live runtime here.",
        refs("sdk-pack-inputs", "sdk-empty"),
    ),
    customInstructions: setting(
        "Custom instruction files",
        "skipCustomInstructions",
        "Choose whether files such as .github/copilot-instructions.md, AGENTS.md, and CLAUDE.md are loaded.",
        [
            {
                title: "Baseline default",
                value: "default",
                text: "Leave the option unset: instructions load with the Copilot CLI baseline and are skipped with the Empty baseline.",
            },
            {
                title: "Load",
                value: "load",
                text: "Send skipCustomInstructions: false to load them in any baseline.",
            },
            {
                title: "Skip",
                value: "skip",
                text: "Send skipCustomInstructions: true to ignore those files.",
            },
        ],
        "A service that supplies its own prompt skips repository instructions so a checked-in file cannot redirect it.",
        "Organization instructions you supply here are separate and still apply. Instructions guide the model; they do not enforce policy.",
        refs("sdk-instruction-options", "sdk-empty"),
    ),
    organizationInstructions: setting(
        "Organization instructions",
        "organizationCustomInstructions",
        "Inject organization-wide guidance into the system prompt without instruction files.",
        [
            {
                title: "Where it goes",
                text: "The text is added to the system prompt for this session. Blank leaves the option unset.",
            },
        ],
        "Remind every session to follow the company's data-handling and citation rules.",
        "This is prompt guidance, not enforced policy, and it is visible to the model. Keep secrets out of it.",
        refs("sdk-instruction-options", "sdk-prompts"),
    ),
    lifecycleHooks: setting(
        "SDK lifecycle hooks",
        "hooks.onUserPromptSubmitted, onSessionStart, onSubagentStop, …",
        "Require host callbacks at session, prompt, MCP, error, and agent lifecycle points.",
        [
            {
                title: "Callbacks you implement",
                text: "Each selected hook becomes a required slot in the generated host. Preflight fails until your code registers it.",
            },
            {
                title: "Hooks that can block",
                text: "userPromptSubmitted can refuse a prompt (decision: block). agentStop and subagentStop can keep an agent working by returning block with a reason; subagentStop can also rewrite the response reported to the parent.",
            },
        ],
        "Use sessionStart to load tenant context, userPromptSubmitted to block prompts that violate policy, and errorOccurred to page an operator.",
        "These run on every matching event, so keep them fast and deterministic. They are separate from file-based hooks and from the permission handler.",
        refs("sdk-lifecycle-hooks", "sdk-prompt-block", "sdk-subagent-hooks"),
        hostScope,
    ),
    hostHandlers: setting(
        "Host request handlers",
        "onElicitationRequest, onExitPlanModeRequest, onAutoModeSwitchRequest, onMcpAuthRequest",
        "Answer structured requests the agent or MCP servers send to your application.",
        [
            {
                title: "Elicitation",
                value: "elicitation",
                text: "Show form-based questions to the user. Required for the elicitation ask_user shape.",
            },
            {
                title: "Exit plan mode",
                value: "exitPlanMode",
                text: "Approve or reject the agent's plan before it acts.",
            },
            {
                title: "Auto-mode switch",
                value: "autoModeSwitch",
                text: "Decide whether the agent may switch into an automatic mode.",
            },
            {
                title: "MCP auth",
                value: "mcpAuth",
                text: "Supply OAuth token data, or cancel, when an MCP server needs sign-in.",
            },
        ],
        "A product UI renders elicitation forms and handles MCP OAuth through its own identity service.",
        "Selecting a handler only generates a required slot. Your host owns the UI, token storage, and decisions.",
        refs("sdk-host-handlers"),
        hostScope,
    ),
    managedRules: setting(
        "Managed permission rules",
        "managedSettings.permissions.deny / ask / allow",
        "Inject permission rules that apply as enterprise managed policy.",
        [
            { title: "Deny", text: "Operations that are always denied, for example Shell(git push *)." },
            { title: "Ask", text: "Operations that must prompt for approval." },
            {
                title: "Allow",
                text: "Operations permitted without prompting. Every declared allow list across managed layers must admit an operation.",
            },
        ],
        "Deny Shell(rm -rf *) and require approval for Write(**) in a shared service.",
        "Rules use the runtime's managed vocabulary; malformed rules reject session creation. The session cannot relax them, and they do not replace host authorization.",
        refs("sdk-managed-settings"),
        managedScope,
    ),
    managedLimitTo: setting(
        "Network host boundary",
        "managedSettings.permissions.limitTo",
        "Restrict network access to an explicit list of hosts.",
        [
            {
                title: "Domain rules",
                text: "Use Domain(hostname), Domain(IP), or Domain(*.example.com). Schemes, ports, paths, queries, and fragments are rejected.",
            },
            {
                title: "Closed world",
                text: "Once set, only listed hosts are allowed. Multiple managed layers intersect their lists. Leaving the list empty here omits the rule.",
            },
        ],
        "Limit a support agent to Domain(api.example.com) and Domain(*.docs.example.com).",
        "This is runtime policy for agent-initiated network access, not a firewall for your host process.",
        refs("sdk-managed-settings"),
        managedScope,
    ),
    bypassMode: setting(
        "Bypass-permissions policy",
        "managedSettings.permissions.disableBypassPermissionsMode",
        "Restrict modes that skip permission prompts.",
        [
            { title: "No restriction", value: "", text: "Omit the rule." },
            { title: "Disable", value: "disable", text: "Turn bypass-permissions mode off entirely." },
            {
                title: "Allow auto only",
                value: "allow-auto-only",
                text: "Permit automatic bypass but block full allow-all.",
            },
        ],
        "Prevent users of a shared deployment from switching the agent into allow-all.",
        "This restricts runtime modes only. The planner's Explicit allow all handler is your own host choice and is not affected.",
        refs("sdk-managed-settings"),
        managedScope,
    ),
    sessionName: setting(
        "Session name",
        "name",
        "Name the session at creation so it persists immediately and can be listed and resumed.",
        [
            {
                title: "Rules",
                text: "At most 100 characters, with no leading or trailing whitespace, control characters, or double quotes. Blank leaves it unnamed.",
            },
        ],
        "Name each session after the support ticket it handles, such as Ticket 4821.",
        "Local sessions only; cloud creation rejects a name. It is a label, not an identifier for authorization.",
        refs("sdk-session-name"),
        createScope,
    ),
    diagnostics: setting(
        "MCP diagnostics",
        "diagnostics.sources.mcp.level",
        "Capture session-scoped MCP diagnostic entries at the chosen level.",
        [
            { title: "Off", value: "off", text: "The SDK default: no diagnostics are captured." },
            { title: "Error to info", text: "Capture problems and normal activity for troubleshooting." },
            {
                title: "Debug or trace",
                text: "Entries can contain MCP payloads, tool arguments, paths, and server stderr. Treat them as sensitive.",
            },
        ],
        "Turn on warning-level diagnostics while integrating a new MCP server.",
        "Do not upload entries as telemetry or export them without deliberate host action. This is not the client log level.",
        refs("sdk-diagnostics"),
    ),
    logLevel: setting(
        "Runtime log level",
        "CopilotClientOptions.logLevel",
        "Set how verbosely the runtime started by the SDK logs.",
        [
            {
                title: "Default",
                value: "default",
                text: "Leave unset; the runtime uses its own default (currently info).",
            },
            { title: "Explicit level", text: "none, error, warning, info, debug, or all." },
        ],
        "Use debug while developing locally and warning in production.",
        "A client option for a managed or in-process runtime; an existing runtime service keeps its own logging. It is not MCP diagnostics.",
        refs("sdk-client-log-level"),
        "Client construction, not a per-session setting.",
    ),
    responseSchema: setting(
        "Structured response schema",
        "MessageOptions.responseSchema",
        "Ask the model to answer each run's prompt in a JSON shape you define.",
        [
            {
                title: "Per run",
                text: "The generated host passes this schema when it sends the run prompt, including requests after tool calls. Independent sends do not inherit it.",
            },
            { title: "Blank", text: "No schema; the model answers in free text." },
        ],
        'Require { "type": "object", "properties": { "verdict": { "type": "string" } }, "required": ["verdict"] } from a reviewer run.',
        "Not a persisted session default. Streaming events remain text, and your host should still validate the result.",
        refs("sdk-structured-output"),
        "Message-level option used by the generated host when it sends a prompt.",
    ),
    autoTier: setting(
        "Auto routing tier",
        "capi.autoTier",
        "Choose the routing preference used when the session model is auto.",
        [
            {
                title: "Runtime default",
                value: "default",
                text: "Leave unset and use the runtime's routing.",
            },
            { title: "Efficiency", value: "efficiency", text: "Prefer faster, lower-cost models." },
            { title: "Balance", value: "balance", text: "Balance speed and capability." },
            { title: "Intelligence", value: "intelligence", text: "Prefer the most capable models." },
            { title: "Fast", value: "fast", text: "A latency preset available to integrators only." },
        ],
        "A chat product picks Efficiency for quick answers and Intelligence for deep analysis sessions.",
        "Only meaningful when the model is auto, and requires a runtime with Auto tier support. It does not guarantee a particular model.",
        refs("sdk-auto-tier"),
    ),
    reasoningSummary: setting(
        "Reasoning summary",
        "reasoningSummary",
        "Choose how much reasoning summary text supported models return.",
        [
            { title: "Model default", value: "default", text: "Leave unset." },
            { title: "None", value: "none", text: "Suppress summary output even when reasoning is enabled." },
            {
                title: "Concise or detailed",
                text: "Request a shorter or longer summary where the model supports it.",
            },
        ],
        "Show concise reasoning summaries in a UI that explains what the agent is doing.",
        "Summaries describe reasoning; they are not the full reasoning trace or an audit record.",
        refs("sdk-auto-tier", "sdk-model-policy"),
    ),
    allowedModels: setting(
        "Model allowlist",
        "allowedModels / session.model.setAllowedModels",
        "Limit the session to exact model IDs your host approves.",
        [
            {
                title: "TypeScript and Rust",
                text: "Generated projects set allowedModels in the session config.",
            },
            {
                title: "Python, Go, C#, and Java",
                text: "Generated projects call session.model.setAllowedModels right after create and resume, so it applies from the first turn.",
            },
        ],
        "Allow only gpt-5.5 and claude-sonnet-5 so users cannot switch to an unapproved model.",
        "Use exact IDs; no wildcards. Include the selected session model. Account and organization policy still decide availability.",
        refs("sdk-model-allowlist"),
    ),
    providerProduct: setting(
        "Serving product",
        "provider.modelProvider",
        "Report which product serves your custom provider's model.",
        [
            { title: "Unset", value: "", text: "Omit the field." },
            {
                title: "Product",
                text: "openai, anthropic, azure_openai, ollama, lm_studio, foundry_local, or llama_cpp.",
            },
        ],
        "Report ollama when an OpenAI-compatible endpoint is a local Ollama server.",
        "Only affects telemetry (model_provider). It does not change routing, the wire API, or compatibility.",
        refs("sdk-provider-product"),
    ),
    wireModel: setting(
        "Wire model name",
        "provider.wireModel",
        "Send a different model name to the provider API than the session's model ID.",
        [
            {
                title: "Fallback",
                text: "Blank falls back to the model ID. Use it for Azure deployment names or fine-tune names.",
            },
        ],
        "Keep model gpt-4.1 in the plan but send my-gpt41-deployment to Azure.",
        "The browser does not verify that the provider accepts this name.",
        refs("sdk-provider-product"),
    ),
    maxPromptTokens: setting(
        "Max prompt tokens",
        "provider.maxPromptTokens",
        "Override the prompt size at which the runtime compacts the conversation.",
        [
            { title: "0", value: "0", text: "Unset: use the resolved model's default." },
            {
                title: "Positive value",
                text: "Compaction runs before a request whose system message, history, tool definitions, and user message would exceed it.",
            },
        ],
        "Set 32000 for a local model with a smaller context window than the runtime expects.",
        "This does not enlarge the provider's real context window.",
        refs("sdk-provider-product"),
    ),
    maxOutputTokens: setting(
        "Max output tokens",
        "provider.maxOutputTokens",
        "Override the model's default output limit.",
        [
            { title: "0", value: "0", text: "Unset: use the resolved model's default." },
            {
                title: "Positive value",
                text: "When reached, the model stops and returns a truncated response.",
            },
        ],
        "Cap responses at 4096 tokens to control cost on a pay-per-token endpoint.",
        "A hard stop, not a request for shorter answers. The provider's own maximum still applies.",
        refs("sdk-provider-product"),
    ),
    toolSearch: setting(
        "Tool search",
        "toolSearch.enabled",
        "Choose whether large tool sets are deferred behind on-demand tool search.",
        [
            { title: "Runtime default", value: "default", text: "Leave unset." },
            {
                title: "Enabled",
                value: "enabled",
                text: "When the tool count exceeds the threshold, MCP and external tools are deferred and found through tool_search_tool.",
            },
            { title: "Disabled", value: "disabled", text: "Preload every tool; nothing is deferred." },
        ],
        "A harness with dozens of MCP tools keeps the prompt small by letting the model search for tools.",
        "Search changes when tools are loaded, not which tools are allowed. Inventory, permissions, and per-tool defer still apply.",
        refs("sdk-tool-search-config"),
    ),
    toolSearchThreshold: setting(
        "Deferral threshold",
        "toolSearch.deferThreshold",
        "Set the total tool count at which MCP and external tools start being deferred.",
        [
            { title: "0", value: "0", text: "Unset: use the built-in threshold (30)." },
            { title: "Positive value", text: "Defer once the total tool count exceeds this number." },
        ],
        "Raise the threshold to 60 for a model that handles many tool definitions well.",
        "Built-in tools and tools marked never-defer are still preloaded.",
        refs("sdk-tool-search-config"),
    ),
    toolDefer: setting(
        "Tool deferral",
        "Tool.defer",
        "Choose whether this custom tool can be loaded lazily through tool search.",
        [
            { title: "SDK default", value: "default", text: "Omit the field; the SDK treats it as auto." },
            {
                title: "Auto",
                value: "auto",
                text: "The tool may be deferred and surfaced through tool search.",
            },
            { title: "Never", value: "never", text: "Always preload this tool." },
        ],
        "Mark a core submit_result tool as never so the model always sees it.",
        "Deferral affects loading only. It does not hide the tool from permission checks or authorize its use.",
        refs("sdk-tool-search-config"),
        "A property of this custom tool declaration.",
    ),
    askUserVariant: setting(
        "ask_user shape",
        "askUserVariant",
        "Choose the model-facing shape of the built-in ask_user tool.",
        [
            {
                title: "SDK default",
                value: "default",
                text: "Leave unset; the runtime uses the legacy shape.",
            },
            {
                title: "Legacy",
                value: "legacy",
                text: "Question-and-answer prompts answered by the user input handler.",
            },
            {
                title: "Elicitation",
                value: "elicitation",
                text: "Structured forms. Requires the elicitation request handler on Policy & state.",
            },
        ],
        "A product UI with rich forms chooses elicitation so the agent can ask for several fields at once.",
        "Applied when the session is created or cold-resumed. ask_user must still be in the tool inventory.",
        refs("sdk-host-handlers"),
    ),
    agentDisplayName: setting(
        "Agent display name",
        "customAgents[].displayName",
        "Show a friendly name for this agent in your UI and in sub-agent events.",
        [{ title: "Blank", text: "Omit the field; UIs fall back to the agent name." }],
        "Name the reviewer agent Security reviewer in a dashboard.",
        "A label only. The agent name remains the identifier used for selection.",
        refs("sdk-agent-hooks"),
    ),
    agentHooks: setting(
        "Agent-scoped hooks",
        "customAgents[].hooks",
        "Declare hook actions that run only while this agent is active.",
        [
            {
                title: "Shape",
                text: 'A JSON object keyed by hook event, each mapping to an array of action objects, for example { "preToolUse": [ { ... } ] }. Blank means none.',
            },
        ],
        "Run a lint check after this agent edits files, without affecting other agents.",
        "Declarative hooks execute like file hooks: review commands as code and keep secrets out of the plan.",
        refs("sdk-agent-hooks"),
    ),
    excludedBuiltinAgents: setting(
        "Excluded built-in agents",
        "excludedBuiltinAgents",
        "Hide runtime-provided agents from discovery and selection.",
        [
            {
                title: "Effect",
                text: "Excluded built-in agents cannot be selected or invoked unless a custom agent with the same name is configured.",
            },
        ],
        "Hide a general-purpose built-in agent so delegation goes only to your reviewed specialists.",
        "Names are not validated against a live runtime here. This does not remove tools the parent agent can still use.",
        refs("sdk-agents"),
    ),
} satisfies Record<string, ValueHelp>;
