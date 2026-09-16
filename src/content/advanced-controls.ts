// Copyright (c) Microsoft Corporation. All rights reserved.
import { reference } from "./reference";

export type AdvancedCategory =
    | "Security posture"
    | "Privacy & persistence"
    | "Model execution"
    | "Lifecycle"
    | "Context & capabilities"
    | "Diagnostics";

export type AdvancedSupport = "Documented SDK" | "Typed SDK" | "Runtime contract" | "Experimental";

export type AdvancedControl = {
    id: string;
    category: AdvancedCategory;
    title: string;
    key: string;
    summary: string;
    opportunity: string;
    layer: string;
    scope: string;
    support: AdvancedSupport;
    readOnlyReason: string;
    sourceLabel: string;
    sourceUrl: string;
    sensitive?: boolean;
};

const sdk = `https://github.com/github/copilot-sdk/blob/${reference.revisions.sdk}`;
const runtime = `https://github.com/github/copilot-agent-runtime/blob/${reference.revisions.runtime}`;

export const advancedCategories: AdvancedCategory[] = [
    "Security posture",
    "Privacy & persistence",
    "Model execution",
    "Lifecycle",
    "Context & capabilities",
    "Diagnostics",
];

export const advancedSupportLevels: AdvancedSupport[] = [
    "Documented SDK",
    "Typed SDK",
    "Runtime contract",
    "Experimental",
];

export const advancedControls: AdvancedControl[] = [
    {
        id: "managed-permissions",
        category: "Security posture",
        title: "Managed permission rule composition",
        key: "managedSettings.permissions.{deny,ask,allow,disableBypassPermissionsMode}",
        summary:
            "Adds an application-supplied restriction layer to runtime permission evaluation, including explicit deny, ask, and allow rules.",
        opportunity:
            "Inspect why a tool request is allowed, denied, or escalated and which policy source constrained it.",
        layer: "SDK → runtime policy",
        scope: "Session bootstrap",
        support: "Typed SDK",
        readOnlyReason:
            "Security-critical startup policy; editing could imply the browser enforces rules that the future host has not installed.",
        sourceLabel: "ManagedSettingsPermissions",
        sourceUrl: `${sdk}/nodejs/src/types.ts#L2265-L2309`,
    },
    {
        id: "permission-mode",
        category: "Security posture",
        title: "Permission mode and assisted approval",
        key: "session.permissions.setMode({ mode, assistedApprovalModel })",
        summary:
            "Selects manual approval, model-assisted approval, or allow-all behavior and optionally chooses the approval judge model.",
        opportunity:
            "Explain why otherwise identical tool calls receive different approval treatment in a live session.",
        layer: "Runtime RPC",
        scope: "Session / tool",
        support: "Runtime contract",
        readOnlyReason:
            "Allow-all changes the authorization boundary, while assisted approval remains a recommendation rather than a guarantee.",
        sourceLabel: "Permission mode contract",
        sourceUrl: `${runtime}/src/core/generated/api.ts#L6260-L6271`,
        sensitive: true,
    },
    {
        id: "permission-paths",
        category: "Security posture",
        title: "Filesystem permission boundary",
        key: "PermissionPathsConfig",
        summary:
            "Describes the workspace root, additional allowed directories, temporary-directory access, and unrestricted filesystem posture.",
        opportunity:
            "Make effective file-access roots visible when a tool is blocked despite ordinary workspace access.",
        layer: "Runtime permission system",
        scope: "Session / tool",
        support: "Runtime contract",
        readOnlyReason:
            "Adding roots expands filesystem and discovery trust. Paths may also reveal sensitive host topology.",
        sourceLabel: "PermissionPathsConfig",
        sourceUrl: `${runtime}/src/core/generated/api.ts#L6291-L6312`,
        sensitive: true,
    },
    {
        id: "permission-urls",
        category: "Security posture",
        title: "Network destination boundary",
        key: "PermissionUrlsConfig.{initialAllowed,unrestricted}",
        summary:
            "Defines URL patterns that may be contacted without prompting and whether unrestricted network access is active.",
        opportunity: "Diagnose network approval prompts and unexpected destination blocks.",
        layer: "Runtime permission system",
        scope: "Session / tool",
        support: "Runtime contract",
        readOnlyReason:
            "Unrestricted mode is an exfiltration boundary and URL patterns can disclose internal service names.",
        sourceLabel: "PermissionUrlsConfig",
        sourceUrl: `${runtime}/src/core/generated/api.ts#L6360-L6371`,
        sensitive: true,
    },
    {
        id: "sandbox-posture",
        category: "Security posture",
        title: "Sandbox activation and bypass posture",
        key: "sandboxConfig.{enabled,allowBypass,addCurrentWorkingDirectory,allowDevToolAccess}",
        summary:
            "Shows whether shell effects are OS-confined, whether the workspace is mounted, and whether approved commands may bypass containment.",
        opportunity: "Separate permission approval from the stronger process-containment boundary.",
        layer: "Runtime sandbox",
        scope: "Session / process",
        support: "Runtime contract",
        readOnlyReason:
            "Changing containment is a host deployment decision. Bypass capability must never look like a routine preference.",
        sourceLabel: "SandboxConfig",
        sourceUrl: `${runtime}/src/core/generated/api.ts#L7762-L7784`,
        sensitive: true,
    },
    {
        id: "sandbox-routing",
        category: "Security posture",
        title: "MCP and language-server sandbox routing",
        key: "sandboxConfig.{sandboxMcpServers,sandboxLspServers,managedMcpRoutingLocked,managedLspRoutingLocked}",
        summary:
            "Reports whether MCP and language-server child processes share the sandbox and whether managed policy locks that routing.",
        opportunity:
            "Expose child-process trust boundaries that are currently hidden behind a single tools view.",
        layer: "Runtime sandbox",
        scope: "Runtime / process",
        support: "Runtime contract",
        readOnlyReason:
            "Routing child processes outside containment can bypass filesystem or egress controls; lock fields are provenance only.",
        sourceLabel: "Sandbox routing fields",
        sourceUrl: `${runtime}/src/core/generated/api.ts#L7762-L7784`,
        sensitive: true,
    },
    {
        id: "sandbox-policy",
        category: "Security posture",
        title: "Sandbox filesystem and network policy",
        key: "sandboxConfig.userPolicy.{filesystem,network,proxy}",
        summary:
            "Contains denied, read-only, and writable paths plus outbound, local-network, host-list, and proxy policy.",
        opportunity:
            "Explain command failures using the effective process policy rather than generic permission messages.",
        layer: "Runtime sandbox",
        scope: "Process / tool",
        support: "Runtime contract",
        readOnlyReason:
            "Path and host lists reveal infrastructure; proxy credentials must never be displayed or persisted.",
        sourceLabel: "Sandbox user policy",
        sourceUrl: `${runtime}/src/core/generated/api.ts#L7821-L7865`,
        sensitive: true,
    },
    {
        id: "content-exclusion",
        category: "Security posture",
        title: "Additional content-exclusion policy",
        key: "additionalContentExclusionPolicies",
        summary:
            "Combines host-supplied path rules with natively discovered content-exclusion policy and source provenance.",
        opportunity: "Show why a file remains unavailable even when ordinary path permissions allow it.",
        layer: "SDK / runtime policy",
        scope: "Session / tool",
        support: "Runtime contract",
        readOnlyReason:
            "Patterns may reveal protected paths, and local edits must not imply they can weaken enterprise policy.",
        sourceLabel: "Content-exclusion contract",
        sourceUrl: `${runtime}/src/core/generated/api.ts#L6380-L6423`,
        sensitive: true,
    },
    {
        id: "file-change-tracking",
        category: "Privacy & persistence",
        title: "File-change tracking baseline",
        key: "enableFileChangeTracking",
        summary: "Enables rewind and cumulative session diffs beginning with the first tracked root turn.",
        opportunity: "Make recovery and session-diff availability explicit before work begins.",
        layer: "Public SDK",
        scope: "Session creation",
        support: "Typed SDK",
        readOnlyReason:
            "It cannot reconstruct earlier changes, and tracked diffs may persist sensitive source content.",
        sourceLabel: "File change tracking",
        sourceUrl: `${sdk}/nodejs/src/types.ts#L2558-L2564`,
        sensitive: true,
    },
    {
        id: "session-store",
        category: "Privacy & persistence",
        title: "Cross-session search store",
        key: "enableSessionStore",
        summary:
            "Controls whether session content is written to and retrieved from the runtime's cross-session store.",
        opportunity: "Clarify recall behavior, retention, and multi-tenant isolation expectations.",
        layer: "Public SDK",
        scope: "Session",
        support: "Typed SDK",
        readOnlyReason:
            "This changes privacy and retention boundaries; effective defaults also vary by client mode.",
        sourceLabel: "Session store option",
        sourceUrl: `${sdk}/nodejs/src/types.ts#L2920-L2925`,
        sensitive: true,
    },
    {
        id: "embedding-isolation",
        category: "Privacy & persistence",
        title: "Embedding retrieval and cache isolation",
        key: "skipEmbeddingRetrieval / embeddingCacheStorage",
        summary:
            "Controls retrieval initialization and whether embedding cache data is persistent or in-memory.",
        opportunity: "Show the tradeoff between cross-session recall and stronger tenant isolation.",
        layer: "Public SDK",
        scope: "Session",
        support: "Typed SDK",
        readOnlyReason:
            "Persistent caches can cross session boundaries, while disabling retrieval can reduce answer quality.",
        sourceLabel: "Embedding storage options",
        sourceUrl: `${sdk}/nodejs/src/types.ts#L2879-L2891`,
        sensitive: true,
    },
    {
        id: "agent-memory",
        category: "Privacy & persistence",
        title: "Agent memory",
        key: "memory.enabled",
        summary: "Enables runtime-supported persistent recall of facts across turns.",
        opportunity:
            "Expose whether long-lived recall exists separately from conversation history and session storage.",
        layer: "Public SDK",
        scope: "Session / cross-turn",
        support: "Typed SDK",
        readOnlyReason:
            "The public contract does not fully specify retention, deletion, provenance, or tenant isolation.",
        sourceLabel: "MemoryConfiguration",
        sourceUrl: `${sdk}/nodejs/src/types.ts#L1965-L1974`,
        sensitive: true,
    },
    {
        id: "session-telemetry",
        category: "Privacy & persistence",
        title: "GitHub session telemetry",
        key: "enableSessionTelemetry",
        summary:
            "Controls GitHub session telemetry independently from host OpenTelemetry export; BYOK sessions disable it.",
        opportunity:
            "Make the effective telemetry source and authentication-dependent behavior understandable.",
        layer: "Public SDK",
        scope: "Session",
        support: "Typed SDK",
        readOnlyReason:
            "A future editor must distinguish product telemetry from host tracing and respect deployment policy.",
        sourceLabel: "Session telemetry option",
        sourceUrl: `${sdk}/nodejs/src/types.ts#L2539-L2555`,
        sensitive: true,
    },
    {
        id: "reasoning-summary",
        category: "Model execution",
        title: "Reasoning-summary policy",
        key: "reasoningSummary: none | concise | detailed",
        summary: "Controls reasoning-summary visibility independently from the selected reasoning effort.",
        opportunity: "Let hosts choose whether and how model reasoning summaries appear in product UX.",
        layer: "SDK / runtime model",
        scope: "Session / turn",
        support: "Experimental",
        readOnlyReason:
            "Provider support varies, and detailed summaries can expose sensitive contextual material.",
        sourceLabel: "Reasoning summary field",
        sourceUrl: `${sdk}/nodejs/src/types.ts#L2339-L2343`,
        sensitive: true,
    },
    {
        id: "verbosity",
        category: "Model execution",
        title: "Output verbosity",
        key: "verbosity",
        summary:
            "Requests provider-supported response length or detail independently from prompt wording and reasoning effort.",
        opportunity: "Separate response-style controls from behavioral instructions.",
        layer: "Runtime model option",
        scope: "Session / model",
        support: "Runtime contract",
        readOnlyReason:
            "There is not yet a consistent high-level SDK field across languages, and providers interpret it differently.",
        sourceLabel: "Runtime verbosity option",
        sourceUrl: `${runtime}/src/core/sharedApi/sessionTypes.ts#L440-L447`,
    },
    {
        id: "auto-tier",
        category: "Model execution",
        title: "Auto-model routing preference",
        key: "capi.autoTier",
        summary:
            "Guides the virtual auto model toward efficiency, balance, or intelligence rather than naming a concrete model.",
        opportunity: "Express product priorities while allowing GitHub's model router to adapt availability.",
        layer: "Public SDK",
        scope: "Session / model",
        support: "Documented SDK",
        readOnlyReason:
            "It applies only to compatible auto routing and is a preference, not a guaranteed model selection.",
        sourceLabel: "Auto tier documentation",
        sourceUrl: `${sdk}/docs/features/session-persistence.md#L238-L291`,
    },
    {
        id: "websocket-responses",
        category: "Model execution",
        title: "CAPI Responses transport",
        key: "capi.enableWebSocketResponses",
        summary:
            "Chooses WebSocket Responses transport when supported, with HTTP fallback for proxy or network compatibility.",
        opportunity: "Diagnose connection problems without confusing transport with the provider wire API.",
        layer: "Public SDK",
        scope: "Session / process",
        support: "Documented SDK",
        readOnlyReason:
            "Process environment can override session intent, so a useful editor first needs effective-value provenance.",
        sourceLabel: "WebSocket Responses fallback",
        sourceUrl: `${sdk}/docs/features/session-persistence.md#L315-L327`,
    },
    {
        id: "model-capabilities",
        category: "Model execution",
        title: "Model capability overrides",
        key: "modelCapabilities / modelCapabilitiesOverrides",
        summary:
            "Overrides runtime knowledge of vision, reasoning, adaptive thinking, token limits, image limits, and media types.",
        opportunity: "Support custom or newly deployed models before runtime metadata catches up.",
        layer: "SDK over runtime contract",
        scope: "Session / model",
        support: "Experimental",
        readOnlyReason:
            "Overstating capabilities can cause invalid requests, truncation, or context overflow.",
        sourceLabel: "Model capability overrides",
        sourceUrl: `${sdk}/nodejs/src/generated/rpc.ts#L13418-L13482`,
        sensitive: true,
    },
    {
        id: "rate-limit-fallback",
        category: "Model execution",
        title: "Rate-limit fallback to Auto",
        key: "continueOnAutoMode",
        summary:
            "Allows an eligible rate-limited session to switch to Auto instead of pausing for a host or user decision.",
        opportunity: "Improve continuity for long-running service workloads under model-specific limits.",
        layer: "Runtime model option",
        scope: "Session / turn",
        support: "Runtime contract",
        readOnlyReason:
            "Fallback can change model, cost, latency, and output characteristics without explicit user selection.",
        sourceLabel: "continueOnAutoMode",
        sourceUrl: `${runtime}/src/core/sharedApi/sessionTypes.ts#L998-L1008`,
    },
    {
        id: "compaction-thresholds",
        category: "Lifecycle",
        title: "Infinite-session compaction thresholds",
        key: "infiniteSessions.{backgroundCompactionThreshold,bufferExhaustionThreshold}",
        summary:
            "Sets when background compaction begins and when new turns block to prevent context exhaustion.",
        opportunity: "Tune latency and context safety beneath the existing infinite-sessions toggle.",
        layer: "Public SDK",
        scope: "Session",
        support: "Typed SDK",
        readOnlyReason:
            "Poor thresholds can create repeated compaction, latency spikes, or context exhaustion.",
        sourceLabel: "Infinite session thresholds",
        sourceUrl: `${sdk}/nodejs/src/types.ts#L1943-L1963`,
    },
    {
        id: "resume-pending-work",
        category: "Lifecycle",
        title: "Resume pending-work behavior",
        key: "continuePendingWork / suppressResumeEvent",
        summary:
            "Controls whether interrupted tools and permission prompts restart and whether resume events are emitted.",
        opportunity: "Make recovery side effects explicit when resuming a persisted session.",
        layer: "Public SDK",
        scope: "Resume boundary",
        support: "Typed SDK",
        readOnlyReason:
            "Repeating pending work may repeat external side effects; these are one-shot historical decisions.",
        sourceLabel: "ResumeSessionConfig",
        sourceUrl: `${sdk}/nodejs/src/types.ts#L3000-L3018`,
        sensitive: true,
    },
    {
        id: "autopilot-continuation",
        category: "Lifecycle",
        title: "Runtime-owned autopilot continuation",
        key: "autopilotContinuation.{enabled,maxContinues,noProgressStopEnabled}",
        summary:
            "Re-prompts an autopilot agent that stops without task completion, with bounded continuation and no-progress guards.",
        opportunity:
            "Support more autonomous workflows without requiring every host to implement its own loop.",
        layer: "Runtime behavior",
        scope: "Session / turn",
        support: "Experimental",
        readOnlyReason:
            "Continuation can consume credits or repeat actions and may conflict with host-owned orchestration.",
        sourceLabel: "Autopilot continuation contract",
        sourceUrl: `${runtime}/src/core/generated/runtime-contracts.ts#L90-L95`,
        sensitive: true,
    },
    {
        id: "agent-locality",
        category: "Lifecycle",
        title: "Custom-agent execution locality",
        key: "customAgentsLocalOnly",
        summary: "Controls whether custom agents must remain local or may be dispatched to remote workers.",
        opportunity: "Make code and context placement an explicit trust-boundary decision.",
        layer: "Public SDK",
        scope: "Session / agent",
        support: "Typed SDK",
        readOnlyReason:
            "Allowing remote dispatch can move code and context off-host; defaults also vary by client mode.",
        sourceLabel: "Custom agent locality",
        sourceUrl: `${sdk}/nodejs/src/types.ts#L2583-L2590`,
        sensitive: true,
    },
    {
        id: "skill-policy",
        category: "Context & capabilities",
        title: "Built-in skill allow and deny policy",
        key: "includedBuiltinSkills / disabledSkills",
        summary: "Selects which bundled skills are admitted and which skill names are explicitly excluded.",
        opportunity: "Add catalog-level control beneath the existing all-or-nothing skills switch.",
        layer: "Public SDK",
        scope: "Session / context",
        support: "Documented SDK",
        readOnlyReason:
            "Skill names are version-dependent and can collide with project, plugin, or organization sources.",
        sourceLabel: "Skills selection",
        sourceUrl: `${sdk}/docs/features/skills.md#L334-L364`,
    },
    {
        id: "instruction-discovery",
        category: "Context & capabilities",
        title: "Fine-grained instruction discovery",
        key: "organizationCustomInstructions / instructionDirectories / disabledInstructionSources",
        summary:
            "Adds organization instructions, extra discovery roots, lazy discovery, cache refresh, and source-level exclusions.",
        opportunity: "Show instruction provenance beyond the current discovery toggle.",
        layer: "SDK / runtime context",
        scope: "Session / context",
        support: "Typed SDK",
        readOnlyReason:
            "Instruction content may be sensitive, and cache refresh behavior is lifecycle-dependent.",
        sourceLabel: "Instruction discovery fields",
        sourceUrl: `${sdk}/nodejs/src/types.ts#L2893-L2918`,
        sensitive: true,
    },
    {
        id: "mcp-instructions",
        category: "Context & capabilities",
        title: "All MCP server instructions",
        key: "allowAllMcpServerInstructions",
        summary:
            "Includes initialization instructions from every configured MCP server rather than only approved sources.",
        opportunity: "Make MCP-provided prompt influence visible and reviewable.",
        layer: "Runtime MCP",
        scope: "Session / prompt",
        support: "Runtime contract",
        readOnlyReason:
            "This expands prompt-injection surface and context cost by trusting instructions from more servers.",
        sourceLabel: "MCP instruction option",
        sourceUrl: `${runtime}/src/core/sharedApi/sessionTypes.ts#L780-L794`,
        sensitive: true,
    },
    {
        id: "native-web-search",
        category: "Context & capabilities",
        title: "Provider-native web search",
        key: "webSearch.enabled",
        summary:
            "Permits provider-native search independently from any ordinary web-search tool supplied by the host.",
        opportunity: "Distinguish provider-side retrieval from a visible tool implementation.",
        layer: "Runtime model capability",
        scope: "Session / subagent",
        support: "Runtime contract",
        readOnlyReason:
            "Availability is provider- and rollout-dependent and enabling it changes external data flow.",
        sourceLabel: "Web search contract",
        sourceUrl: `${runtime}/src/core/generated/runtime-contracts.ts#L1158-L1160`,
        sensitive: true,
    },
    {
        id: "schedule-exposure",
        category: "Context & capabilities",
        title: "Scheduled-prompt tool exposure",
        key: "manageScheduleEnabled",
        summary: "Controls whether the model can access the runtime's schedule-management tool.",
        opportunity: "Plan recurring and self-paced agent workflows as a distinct capability.",
        layer: "Public SDK",
        scope: "Session / tool",
        support: "Typed SDK",
        readOnlyReason:
            "Schedules create future autonomous invocations and resource use; runtime availability may remain separately gated.",
        sourceLabel: "Schedule tool option",
        sourceUrl: `${sdk}/nodejs/src/types.ts#L2604-L2612`,
        sensitive: true,
    },
    {
        id: "client-info",
        category: "Diagnostics",
        title: "Client attribution",
        key: "clientInfo.{name,version,integrationName,integrationVersion}",
        summary: "Declares application and integration identity for runtime telemetry attribution.",
        opportunity:
            "Make generated hosts identify themselves consistently across languages and deployments.",
        layer: "Public SDK",
        scope: "Connection",
        support: "Documented SDK",
        readOnlyReason:
            "It changes attribution, not what telemetry is collected, and applies for the connection lifetime.",
        sourceLabel: "Client info guide",
        sourceUrl: `${sdk}/docs/features/client-info.md#L1-L22`,
    },
    {
        id: "otel",
        category: "Diagnostics",
        title: "OpenTelemetry export and content capture",
        key: "telemetry.{otlpEndpoint,otlpProtocol,filePath,exporterType,sourceName,captureContent}",
        summary:
            "Configures host tracing export and whether prompts and responses are included in telemetry.",
        opportunity: "Plan production observability and privacy posture together.",
        layer: "Public SDK / host",
        scope: "Client / process",
        support: "Documented SDK",
        readOnlyReason:
            "Destinations can reveal infrastructure and content capture can export code, prompts, responses, and secrets.",
        sourceLabel: "OpenTelemetry guide",
        sourceUrl: `${sdk}/docs/observability/opentelemetry.md#L102-L151`,
        sensitive: true,
    },
    {
        id: "event-logs",
        category: "Diagnostics",
        title: "Event-log sink and subagent inclusion",
        key: "eventsLogDirectory / eventsLogIncludesSubagents",
        summary:
            "Selects a durable runtime event-log destination and whether subagent events join the root log.",
        opportunity: "Support audit, replay, and debugging workflows with explicit retention expectations.",
        layer: "Runtime diagnostics",
        scope: "Session / process",
        support: "Runtime contract",
        readOnlyReason: "Paths and transcripts may contain sensitive project and interaction data.",
        sourceLabel: "CLI session log defaults",
        sourceUrl: `${runtime}/src/cli/sessions/cliSessionDefaults.ts#L52-L80`,
        sensitive: true,
    },
    {
        id: "feature-flags",
        category: "Diagnostics",
        title: "Resolved feature flags",
        key: "enableExperimentalMode / featureFlags",
        summary:
            "Reports hidden rollout dependencies that can explain capability differences between otherwise identical sessions.",
        opportunity: "Improve support diagnostics by showing effective names, values, and provenance.",
        layer: "SDK / runtime experiments",
        scope: "Session",
        support: "Experimental",
        readOnlyReason:
            "Unknown flags are unsupported internal levers. Experiment assignments and payloads should not be exposed.",
        sourceLabel: "Feature flag fields",
        sourceUrl: `${sdk}/nodejs/src/types.ts#L2959-L2977`,
        sensitive: true,
    },
];
