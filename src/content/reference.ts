// Copyright (c) Microsoft Corporation. All rights reserved.
import { z } from "zod";
import snapshot from "./reference.public.json";
import { SDK_SOURCE_REVISION } from "../domain/bootstrap/revisions";

const SourceSchema = z.object({ label: z.string(), scope: z.string(), url: z.string().optional() });
const ControlSchema = z.object({
    name: z.string(),
    axis: z.string(),
    description: z.string(),
    scopes: z.array(z.string()),
    when: z.string(),
    stability: z.string(),
    source: z.string(),
});
const GapSchema = z.object({
    id: z.string(),
    title: z.string(),
    status: z.string(),
    summary: z.string(),
    runtime: z.string(),
    boundary: z.string(),
    opportunity: z.string(),
    sources: z.array(z.string()),
});
const ReferenceSchema = z.object({
    asOf: z.string(),
    revisions: z.object({ runtime: z.string(), sdk: z.string() }),
    sources: z.record(z.string(), SourceSchema),
    controls: z.array(ControlSchema),
    axes: z.array(
        z.object({
            id: z.string(),
            title: z.string(),
            label: z.string(),
            summary: z.string(),
            interfaces: z.array(z.string()),
            sources: z.array(z.string()),
        }),
    ),
    gaps: z.array(GapSchema),
});

const sdkBase = "https://github.com/github/copilot-sdk/blob/main";
const sdkTypes = (start: number, end: number) =>
    `https://github.com/github/copilot-sdk/blob/${SDK_SOURCE_REVISION}/nodejs/src/types.ts#L${start}-L${end}`;
const typesScope = (start: number, end: number, detail: string) =>
    `copilot-sdk · nodejs/src/types.ts:${start}–${end} · ${detail}`;
const pinned = (label: string, start: number, end: number, detail: string) => ({
    label,
    scope: typesScope(start, end, detail),
    url: sdkTypes(start, end),
});
export const reference = ReferenceSchema.parse({
    ...snapshot,
    sources: {
        ...snapshot.sources,
        "sdk-discovery-roots": pinned(
            "Explicit agent, hook, and instruction roots",
            3002,
            3080,
            "discovery-only roots that work without enableConfigDiscovery; relative paths resolve once",
        ),
        "sdk-skill-provider": pinned(
            "Session-scoped skill provider (experimental)",
            2465,
            2520,
            "listSkills/readSkill from host storage; 30-second calls; not persisted across resume",
        ),
        "sdk-lifecycle-hooks": pinned(
            "SDK callback hooks",
            1917,
            1990,
            "session, prompt, MCP, error, agent, and sub-agent lifecycle callbacks",
        ),
        "sdk-subagent-hooks": pinned(
            "Sub-agent start and stop hooks",
            1862,
            1915,
            "start context injection; stop block-with-reason or response rewrite",
        ),
        "sdk-prompt-block": pinned(
            "Blocking a submitted prompt",
            1695,
            1708,
            "userPromptSubmitted decision: block emits a policy_blocked session.warning",
        ),
        "sdk-agent-hooks": pinned(
            "Agent-scoped declarative hooks",
            2059,
            2075,
            "CustomAgentConfig.hooks and displayName",
        ),
        "sdk-managed-settings": pinned(
            "Managed settings and permission rules",
            2418,
            2462,
            "deny/ask/allow, Domain limitTo boundary, bypass and Assisted-permission disables",
        ),
        "sdk-managed-session": pinned(
            "Managed settings on a session",
            3120,
            3170,
            "enableManagedSettings, enforceManagedModelDefaults, interactiveUser, host-injected managedSettings",
        ),
        "sdk-model-allowlist": pinned(
            "Session model allowlist",
            2528,
            2531,
            "allowedModels exact IDs; other SDK languages use session.model.setAllowedModels",
        ),
        "sdk-auto-tier": pinned(
            "Auto routing tier and reasoning summary",
            2320,
            2333,
            "autoTier preference for the auto model; persisted across cold resume",
        ),
        "sdk-provider-product": pinned(
            "Provider product and wire overrides",
            3411,
            3530,
            "modelProvider telemetry product, wireModel, and token limits",
        ),
        "sdk-image-generation": pinned(
            "Image generation opt-in (experimental)",
            864,
            880,
            "non-persisted opt-in; not available with BYOK providers",
        ),
        "sdk-tool-search-config": pinned(
            "Tool search and deferral",
            800,
            900,
            "per-tool defer and skipPermission; session toolSearch enabled/deferThreshold",
        ),
        "sdk-session-name": pinned(
            "Naming a session at creation",
            3284,
            3303,
            "name persists the session immediately; refreshCustomInstructions is create-only",
        ),
        "sdk-resume-recovery": pinned(
            "Resume recovery and pending work",
            3313,
            3346,
            "allowTranscriptRecovery and continuePendingWork",
        ),
        "sdk-diagnostics": pinned(
            "Session MCP diagnostics",
            2565,
            2577,
            "off by default; debug/trace entries can contain payloads and paths",
        ),
        "sdk-structured-output": pinned(
            "Structured output per run",
            3757,
            3772,
            "MessageOptions.responseSchema; typed sendAndWait in every SDK language",
        ),
        "sdk-host-handlers": pinned(
            "Host request handlers",
            2840,
            2925,
            "MCP OAuth, elicitation-based ask_user, exit-plan-mode, and auto-mode-switch callbacks",
        ),
        "sdk-instruction-options": pinned(
            "Custom-instruction loading options",
            2800,
            2812,
            "skipCustomInstructions defaults to true in empty mode",
        ),
        "sdk-client-log-level": pinned(
            "Client runtime log level",
            435,
            445,
            "logLevel for the managed or in-process runtime",
        ),
        "runtime-workflows": {
            label: "Dynamic workflows (formerly factories)",
            scope: "Maintained in the private research snapshot. run_dynamic_workflow and dynamic_workflows_manage replace run_factory and factories_manage; experimental and gated by session capability and quota policy.",
        },
        "sdk-inprocess-guide": {
            label: "In-process hosting across the six SDKs",
            scope: "copilot-sdk · docs/setup/in-process-runtime.md · native loading, prerequisites, lifecycle, and shared-process limits",
            url: `${sdkBase}/docs/setup/in-process-runtime.md`,
        },
        "sdk-managed-runtime": {
            label: "SDK-managed child process and runtime packaging",
            scope: "copilot-sdk · docs/setup/bundled-cli.md · language-specific bundled/downloaded/manual runtime setup",
            url: `${sdkBase}/docs/setup/bundled-cli.md`,
        },
        "sdk-existing-runtime": {
            label: "Existing headless runtime service",
            scope: "copilot-sdk · docs/setup/backend-services.md · TCP connection and independently operated lifecycle",
            url: `${sdkBase}/docs/setup/backend-services.md`,
        },
        "sdk-setup-paths": {
            label: "Choosing a setup path",
            scope: "copilot-sdk · docs/setup/choosing-a-setup-path.md · personas and decision matrix (bundled CLI, local CLI, backend, in-process)",
            url: `${sdkBase}/docs/setup/choosing-a-setup-path.md`,
        },
        "sdk-local-cli": {
            label: "Local CLI setup",
            scope: "copilot-sdk · docs/setup/local-cli.md · point the SDK at your own CLI binary or a running instance",
            url: `${sdkBase}/docs/setup/local-cli.md`,
        },
        "sdk-multitenancy": {
            label: "Multi-tenancy and server deployments",
            scope: "copilot-sdk · docs/setup/multi-tenancy.md · empty mode, per-session tokens, and isolated runtime state for concurrent users",
            url: `${sdkBase}/docs/setup/multi-tenancy.md`,
        },
        "sdk-agent-loop": {
            label: "The agent loop",
            scope: "copilot-sdk · docs/features/agent-loop.md · tool-use loop, turns, and session.idle vs session.task_complete",
            url: `${sdkBase}/docs/features/agent-loop.md`,
        },
        "sdk-fleet": {
            label: "Fleet mode",
            scope: "copilot-sdk · docs/features/fleet-mode.md · parallel sub-agents via the task tool; experimental RPC surface",
            url: `${sdkBase}/docs/features/fleet-mode.md`,
        },
        "sdk-session-limits": {
            label: "Session limits",
            scope: "copilot-sdk · docs/features/session-limits.md · sessionLimits.maxAiCredits soft cap per accounting window",
            url: `${sdkBase}/docs/features/session-limits.md`,
        },
        "sdk-steering": {
            label: "Steering and queueing",
            scope: "copilot-sdk · docs/features/steering-and-queueing.md · MessageOptions.mode immediate (steer) vs enqueue",
            url: `${sdkBase}/docs/features/steering-and-queueing.md`,
        },
        "sdk-usage-billing": {
            label: "Usage and billing",
            scope: "copilot-sdk · docs/features/usage-and-billing.md · token counts, context-window utilization, AI-credit cost, and account quota",
            url: `${sdkBase}/docs/features/usage-and-billing.md`,
        },
        "sdk-citations": {
            label: "Citations",
            scope: "copilot-sdk · docs/features/citations.md · link assistant responses back to supporting sources",
            url: `${sdkBase}/docs/features/citations.md`,
        },
        "sdk-image-input": {
            label: "Image input",
            scope: "copilot-sdk · docs/features/image-input.md · send images to sessions as attachments",
            url: `${sdkBase}/docs/features/image-input.md`,
        },
        "sdk-remote-sessions": {
            label: "Remote sessions",
            scope: "copilot-sdk · docs/features/remote-sessions.md · enableRemoteSessions shares a local session to GitHub web/mobile via Mission Control",
            url: `${sdkBase}/docs/features/remote-sessions.md`,
        },
        "sdk-cloud-sessions": {
            label: "Cloud sessions",
            scope: "copilot-sdk · docs/features/cloud-sessions.md · run sessions on GitHub-hosted compute through Mission Control",
            url: `${sdkBase}/docs/features/cloud-sessions.md`,
        },
        "sdk-client-info": {
            label: "Client info",
            scope: "copilot-sdk · docs/features/client-info.md · declare application and integration identity for runtime telemetry attribution",
            url: `${sdkBase}/docs/features/client-info.md`,
        },
        "sdk-s2s-auth": {
            label: "GitHub App server-to-server authentication (coming soon)",
            scope: "copilot-sdk · docs/auth/server-to-server-tokens.md · feature-flagged eligibility, installation token minting, runtime environment placement, expiry, and billing attribution",
            url: `${sdkBase}/docs/auth/server-to-server-tokens.md`,
        },
        "sdk-context-clearing": {
            label: "Context clearing",
            scope: "copilot-sdk · docs/features/context-management.md · replace conversation context safely with terminal tools",
            url: `${sdkBase}/docs/features/context-management.md`,
        },
    },
    controls: [
        ...snapshot.controls,
        {
            name: "connection",
            axis: "cfg-storage",
            description:
                "Choose an SDK-managed child, an existing TCP runtime, or an experimental native in-process connection. This changes deployment and lifecycle, not the harness engine.",
            scopes: ["client"],
            when: "Client construction",
            stability: "In-process APIs and packaging are experimental in every SDK",
            source: "sdk-inprocess-guide",
        },
        {
            name: "tool-use loop (turns)",
            axis: "cfg-quality",
            description:
                "The runtime, not the SDK, drives the agentic loop: each turn is one model call that may request tools whose results feed the next turn until a final answer. session.idle is the reliable done signal; session.task_complete is an optional, persisted model signal.",
            scopes: ["runtime"],
            when: "Every send()",
            stability:
                "Documented CLI/runtime behavior; the SDK passes events through and does not control the loop",
            source: "sdk-agent-loop",
        },
        {
            name: "fleet.start",
            axis: "cfg-agents",
            description:
                "Dispatch multiple sub-agents in parallel for large, independent workstreams, coordinated via the task tool and shared SQL todos. Reference-only in this planner; it is a live session RPC, not a create-session option.",
            scopes: ["session", "live"],
            when: "session.rpc.fleet.start",
            stability:
                "Experimental RPC surface; pin the SDK and CLI. No Java binding observed on the inspected branch",
            source: "sdk-fleet",
        },
        {
            name: "sessionLimits.maxAiCredits",
            axis: "cfg-storage",
            description:
                "Set an AI-credit soft cap for a session's current accounting window. Usage is checked after model calls return, so one response can exceed the cap before the next model call is blocked.",
            scopes: ["session"],
            when: "createSession / resumeSession",
            stability: "Forwarded to the CLI; a soft cap, not a hard mid-response guarantee",
            source: "sdk-session-limits",
        },
        {
            name: "send.mode (steering / queueing)",
            axis: "cfg-events",
            description:
                "Deliver a message while the agent is working: mode 'immediate' injects into the current turn (steering); mode 'enqueue' buffers it for after the current turn (queueing). Reference-only in this planner.",
            scopes: ["session", "live"],
            when: "MessageOptions.mode on send / sendAndWait",
            stability: "Live interaction API; not part of a static session composition",
            source: "sdk-steering",
        },
        {
            name: "session.usage",
            axis: "cfg-events",
            description:
                "Read token counts, context-window utilization, AI-credit cost, and account quota for a session. A host observation surface, not an editable composition value.",
            scopes: ["session", "host"],
            when: "Session events / usage APIs",
            stability: "Host-owned observation; values originate in the runtime",
            source: "sdk-usage-billing",
        },
        {
            name: "citations",
            axis: "cfg-events",
            description:
                "Link assistant responses back to their supporting sources so the host can render provenance. Reference-only: consumed from events, not configured as a session option.",
            scopes: ["session", "host"],
            when: "Session events",
            stability: "Availability depends on model and content",
            source: "sdk-citations",
        },
        {
            name: "image attachments",
            axis: "cfg-context",
            description:
                "Send images to a session as message attachments. Reference-only in this planner; attachments are supplied at send time by the host, not declared as static context here.",
            scopes: ["session"],
            when: "Message attachments at send time",
            stability: "Depends on the selected model's multimodal support",
            source: "sdk-image-input",
        },
        {
            name: "clientInfo",
            axis: "cfg-identity",
            description:
                "Declare application and integration identity so runtime telemetry can attribute usage to your host. Reference-only in this planner.",
            scopes: ["client"],
            when: "Client construction",
            stability: "Telemetry attribution metadata; not a credential",
            source: "sdk-client-info",
        },
        {
            name: "enableRemoteSessions",
            axis: "cfg-storage",
            description:
                "Share a locally hosted session to GitHub web and mobile via Mission Control, producing a shareable URL. Requires an authenticated user and a session working directory that is a GitHub repository.",
            scopes: ["client", "session"],
            when: "Client construction / createSession",
            stability: "Reference-only here; enabling it publishes a link and has clear prerequisites",
            source: "sdk-remote-sessions",
        },
        {
            name: "cloud sessions",
            axis: "cfg-storage",
            description:
                "Run sessions on GitHub-hosted compute through Mission Control instead of local/host-owned runtime placement. Reference-only in this planner's local-first scope.",
            scopes: ["session", "runtime"],
            when: "Mission Control",
            stability: "A hosted execution option distinct from the three local placements",
            source: "sdk-cloud-sessions",
        },
        {
            name: "context clearing",
            axis: "cfg-context",
            description:
                "Replace conversation context safely using terminal tools so a long session can continue without stale history. Reference-only: a live interaction, not a static composition value.",
            scopes: ["session", "live"],
            when: "During a session",
            stability: "Runtime-provided terminal tools; behavior is documented",
            source: "sdk-context-clearing",
        },
    ],
});
export type SourceRef = z.infer<typeof SourceSchema>;
export type ReferenceControl = z.infer<typeof ControlSchema>;
export type ReferenceGap = z.infer<typeof GapSchema>;

export function getSource(id: string): SourceRef {
    const source = reference.sources[id];
    if (!source) throw new Error(`Unknown source reference: ${id}`);
    return source;
}
