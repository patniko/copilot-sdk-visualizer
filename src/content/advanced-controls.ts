// Copyright (c) Microsoft Corporation. All rights reserved.
import { reference } from "./reference";

export type AdvancedCategory =
    | "Security posture"
    | "Limits & throughput"
    | "Privacy & persistence"
    | "Model execution"
    | "Lifecycle"
    | "Context & capabilities"
    | "Diagnostics";

export type AdvancedSupport = "Documented SDK" | "Typed SDK" | "Runtime contract" | "Experimental";
export type AdvancedLeverKind =
    | "Configurable today"
    | "Indirectly configurable"
    | "Invocation option"
    | "Future API"
    | "Fixed safeguard";

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
    leverKind?: AdvancedLeverKind;
    valueType?: string;
    defaultValue?: string;
    constraints?: string;
    readOnlyReason: string;
    sourceLabel: string;
    sourceUrl: string;
    sensitive?: boolean;
};

const sdk = `https://github.com/github/copilot-sdk/blob/${reference.revisions.sdk}`;
const runtime = `https://github.com/github/copilot-agent-runtime/blob/${reference.revisions.runtime}`;

export const advancedCategories: AdvancedCategory[] = [
    "Security posture",
    "Limits & throughput",
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
        id: "large-output-policy",
        category: "Limits & throughput",
        title: "Large-output spill policy",
        key: "largeOutput.{enabled,maxSizeBytes,outputDirectory}",
        summary:
            "Spills oversized tool output to a file and returns a preview plus reference instead of placing the full payload in model context.",
        opportunity:
            "Tune the balance between immediate context, storage, and recoverable output beneath the existing large-output toggle.",
        layer: "Public SDK / runtime tool layer",
        scope: "Session / tool result",
        support: "Typed SDK",
        leverKind: "Configurable today",
        valueType: "Boolean, byte count, and host path",
        defaultValue: "SDK documentation: 51,200 bytes; pinned runtime fallback when omitted: 20,480 bytes",
        constraints:
            "Positive byte threshold. The output directory is host-owned and may contain sensitive tool results.",
        readOnlyReason:
            "The SDK and pinned runtime disagree on the omission default, so an editor must show configured and effective values separately.",
        sourceLabel: "LargeOutputConfig",
        sourceUrl: `${sdk}/nodejs/src/types.ts#L1976-L2000`,
        sensitive: true,
    },
    {
        id: "view-read-limits",
        category: "Limits & throughput",
        title: "View and read size limits",
        key: "view.view_range / forceReadLargeFiles / largeOutput.maxSizeBytes",
        summary:
            "The un-ranged view path uses the effective large-output threshold as a soft cutoff, while fixed hard caps protect whole-file and ranged reads.",
        opportunity:
            "Make it clear why a file returns range guidance, truncation, or metadata instead of its complete contents.",
        layer: "Runtime built-in tool",
        scope: "Per view invocation",
        support: "Runtime contract",
        leverKind: "Indirectly configurable",
        valueType: "Byte limits plus one-based inclusive line range",
        defaultValue:
            "Soft cutoff: 20 KiB runtime fallback; hard cap: 10 MiB un-ranged, 1 GiB with view_range",
        constraints:
            "view_range=[start,-1] reads to EOF. forceReadLargeFiles bypasses soft guidance, not hard file-size caps.",
        readOnlyReason:
            "Only the soft budget is indirectly configurable through large-output policy; the hard limits are implementation safeguards.",
        sourceLabel: "Runtime view tool limits",
        sourceUrl: `${runtime}/src/runtime/src/tools/view.rs#L13-L31`,
    },
    {
        id: "tool-search-threshold",
        category: "Limits & throughput",
        title: "Tool-search deferral threshold",
        key: "toolSearch.{enabled,deferThreshold}",
        summary:
            "Defers MCP and external tools behind tool_search_tool once the visible tool inventory crosses a configured threshold.",
        opportunity:
            "Control prompt size and tool-selection quality for harnesses with large capability catalogs.",
        layer: "Public SDK / runtime tool catalog",
        scope: "Session / tool inventory",
        support: "Typed SDK",
        leverKind: "Configurable today",
        valueType: "Boolean and non-negative integer",
        defaultValue: "30 visible tools",
        constraints:
            "The threshold changes which tools are immediately visible; it does not disable deferred tools.",
        readOnlyReason:
            "The UX needs to explain deferred discovery and effective tool visibility before this becomes an editable number.",
        sourceLabel: "ToolSearchConfig",
        sourceUrl: `${sdk}/nodejs/src/types.ts#L790-L813`,
    },
    {
        id: "mcp-timeouts",
        category: "Limits & throughput",
        title: "MCP request and tool timeout",
        key: "mcpServers[name].timeout",
        summary:
            "Bounds metadata, resource, and tool requests for each MCP server, with different runtime defaults by operation.",
        opportunity: "Tune slow remote services without giving every MCP operation an unbounded wait.",
        layer: "Public SDK / MCP client",
        scope: "Per MCP server",
        support: "Documented SDK",
        leverKind: "Configurable today",
        valueType: "Milliseconds",
        defaultValue: "60,000 ms metadata requests; 180,000 ms tool calls",
        constraints:
            "A configured timeout overrides both phases. Progress notifications can reset eligible tool-call deadlines.",
        readOnlyReason:
            "The current planner models only endpoint and tool names; timeout belongs in a fuller per-server transport configuration.",
        sourceLabel: "MCP timeout configuration",
        sourceUrl: `${sdk}/docs/features/mcp.md#L282-L317`,
    },
    {
        id: "session-credit-budget",
        category: "Limits & throughput",
        title: "Session AI-credit budget",
        key: "sessionLimits.maxAiCredits",
        summary:
            "Applies a soft AI-credit ceiling to the current session accounting window, including participating subagents.",
        opportunity:
            "Set a workload budget and stop subsequent model calls after the runtime reconciles usage.",
        layer: "Public SDK / runtime accounting",
        scope: "Session accounting window",
        support: "Documented SDK",
        leverKind: "Configurable today",
        valueType: "Finite number of AI credits",
        defaultValue: "No explicit session ceiling",
        constraints:
            "Minimum 30 credits. One model call may overshoot before the next call is blocked; replacement limits must exceed usage already accrued.",
        readOnlyReason:
            "This is a post-paid soft ceiling rather than a hard pre-request spending guarantee and needs budget-event UX.",
        sourceLabel: "Session limits guide",
        sourceUrl: `${sdk}/docs/features/session-limits.md#L1-L25`,
    },
    {
        id: "worker-limits",
        category: "Limits & throughput",
        title: "Subagent and factory execution limits",
        key: "FactoryLimits / subagents.maxConcurrency / subagents.maxDepth",
        summary:
            "Caps concurrent and total workers, nesting depth, active execution time, and AI-credit use for agent factories and subagent trees.",
        opportunity: "Bound parallelism, cost, and runaway orchestration in advanced multi-agent workloads.",
        layer: "SDK factory API / runtime settings",
        scope: "Factory run / agent tree",
        support: "Typed SDK",
        leverKind: "Configurable today",
        valueType: "Positive integers, seconds, and AI credits",
        defaultValue: "Factory concurrent runs: 4; other limits inherit runtime or factory declarations",
        constraints:
            "CLI subagent concurrency/depth allow 1–128; factory concurrent runs allow 1–16; timeoutSeconds must be positive.",
        readOnlyReason:
            "Factory invocation limits and CLI-wide subagent topology have different owners and should not be collapsed into one global slider.",
        sourceLabel: "FactoryLimits",
        sourceUrl: `${sdk}/nodejs/src/types.ts#L2110-L2129`,
    },
    {
        id: "hook-timeout",
        category: "Limits & throughput",
        title: "Declarative hook timeout",
        key: "hooks[].timeoutSec / timeout",
        summary:
            "Places one deadline around command or HTTP hook execution, including interpreter fallback attempts.",
        opportunity:
            "Prevent file-based automation hooks from stalling session lifecycle and tool boundaries.",
        layer: "Runtime hook configuration",
        scope: "Per hook invocation",
        support: "Runtime contract",
        leverKind: "Configurable today",
        valueType: "Positive seconds",
        defaultValue: "30 seconds",
        constraints:
            "Timeout and failure behavior vary by hook type; several policy hooks fail open with diagnostics.",
        readOnlyReason:
            "This applies to declarative file/HTTP hooks, not SDK callback hooks, and requires a separate trusted hook editor.",
        sourceLabel: "Hook timeout parser",
        sourceUrl: `${runtime}/src/runtime/src/hooks/config.rs#L820-L823`,
        sensitive: true,
    },
    {
        id: "retry-policy",
        category: "Limits & throughput",
        title: "Model retry and rate-limit backoff",
        key: "service.agent.retryPolicy",
        summary:
            "Controls retryable status codes, retry count, and rate-limit delay growth for model transport failures.",
        opportunity:
            "Tune resilience for service workloads without hiding long waits or multiplying provider cost.",
        layer: "Runtime operator settings",
        scope: "Model transport / process",
        support: "Runtime contract",
        leverKind: "Future API",
        valueType: "Retry count, status codes, and delay policy",
        defaultValue: "5 retries; 5 s delay; 1 s initial extra; 2× growth; 180 s Retry-After cap",
        constraints:
            "Responses transport may apply a 60-second maximum. Only retryable error-code selection has an environment override.",
        readOnlyReason: "This is an operator/runtime setting rather than a portable SDK session option.",
        sourceLabel: "Runtime retry policy",
        sourceUrl: `${runtime}/src/native/sdk-contract/src/runtime_contracts.rs#L995-L1029`,
    },
    {
        id: "tool-invocation-safeguards",
        category: "Limits & throughput",
        title: "Built-in tool invocation safeguards",
        key: "bash.initial_wait / read_agent.timeout / event pagination",
        summary:
            "Built-in tools impose bounded waits, result counts, and page sizes even when no persistent session setting exists.",
        opportunity:
            "Document operational ceilings so hosts can design around background execution and pagination rather than treating limits as failures.",
        layer: "Runtime built-in tools",
        scope: "Per invocation",
        support: "Runtime contract",
        leverKind: "Invocation option",
        valueType: "Seconds, recipient counts, event counts, and byte budgets",
        defaultValue:
            "Shell wait 30 s; agent wait 30 s; event page 200; persisted event page soft budget 1 MiB",
        constraints:
            "Shell wait range 30–600 s; agent wait max 180 s; write_agent max 16 recipients; event reads max 1,000 records.",
        readOnlyReason:
            "These are invocation-level contracts or fixed safeguards, not one coherent session configuration.",
        sourceLabel: "Runtime generated tool contracts",
        sourceUrl: `${runtime}/src/core/generated/api.ts`,
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
        leverKind: "Configurable today",
        valueType: "Boolean and persistent | in-memory storage mode",
        defaultValue:
            "Public numeric retrieval tuning is unavailable; runtime internals use top-K 5, candidate-K 20, similarity 0.6, MMR 0.85",
        constraints:
            "Only retrieval enablement and cache storage mode are public; numeric ranking thresholds remain runtime implementation details.",
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
        key: "modelCapabilities / provider.maxPromptTokens / provider.maxOutputTokens",
        summary:
            "Overrides runtime knowledge of vision, reasoning, adaptive thinking, token limits, image limits, and media types.",
        opportunity: "Support custom or newly deployed models before runtime metadata catches up.",
        layer: "Public SDK / provider configuration",
        scope: "Session / model",
        support: "Typed SDK",
        leverKind: "Configurable today",
        valueType: "Partial capability object and token counts",
        defaultValue:
            "BYOK runtime fallbacks before catalog overrides: 128k prompt tokens and 200k context window",
        constraints:
            "Provider and per-model token limits can override runtime knowledge; advertised values must match the actual endpoint.",
        readOnlyReason:
            "Overstating capabilities can cause invalid requests, truncation, or context overflow.",
        sourceLabel: "Model capability overrides",
        sourceUrl: `${sdk}/nodejs/src/types.ts#L3169-L3181`,
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
        id: "structured-output",
        category: "Model execution",
        title: "Per-turn structured output",
        key: 'responseFormat: { type: "json_schema", jsonSchema }',
        summary:
            "Requests provider-native JSON-schema output for every model call in one turn without changing later turns or subagents.",
        opportunity:
            "Support typed downstream workflows without relying entirely on prompt-only JSON instructions.",
        layer: "Runtime send contract",
        scope: "Per turn",
        support: "Runtime contract",
        leverKind: "Future API",
        valueType: "JSON Schema request",
        defaultValue: "No response format constraint",
        constraints:
            "Schema serialization max 32 MiB; incompatible with immediate steering; remote and HydraFusion routes reject it; output remains unvalidated text.",
        readOnlyReason:
            "The pinned public SDK does not expose this runtime field, so generated hosts cannot use it portably yet.",
        sourceLabel: "Runtime responseFormat contract",
        sourceUrl: `${runtime}/src/native/sdk-contract/src/api/rpc.rs#L14946-L14985`,
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
        support: "Documented SDK",
        leverKind: "Configurable today",
        valueType: "Fractions of the model context window",
        defaultValue: "Background compaction 0.80; blocking buffer exhaustion 0.95",
        constraints:
            "Documented range 0–1 with background lower than buffer. Process environment overrides can supersede session values.",
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
        id: "message-delivery",
        category: "Lifecycle",
        title: "Message steering and queueing",
        key: "MessageOptions.mode: enqueue | immediate",
        summary: "Chooses whether a message waits behind current work or steers the active turn immediately.",
        opportunity:
            "Make interactive correction and queued follow-up behavior an explicit host UX decision.",
        layer: "Public SDK / runtime queue",
        scope: "Per message",
        support: "Typed SDK",
        leverKind: "Invocation option",
        valueType: "enqueue | immediate",
        defaultValue: "enqueue",
        constraints:
            "Runtime-only operations also include prepend, queue pause, editing/removal, and sendNow; no queue-length cap was found.",
        readOnlyReason: "This is a live message-delivery choice rather than static harness configuration.",
        sourceLabel: "MessageOptions",
        sourceUrl: `${sdk}/nodejs/src/types.ts#L3376-L3382`,
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
        leverKind: "Configurable today",
        valueType: "Host path and boolean",
        defaultValue: "Subagent inclusion false; event files rotate at 10 MiB",
        constraints:
            "No total event-log retention cap was found. Process debug logs keep one active plus four archived 10 MiB segments per family.",
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
