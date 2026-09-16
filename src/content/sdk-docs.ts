// Copyright (c) Microsoft Corporation. All rights reserved.
import type { ViewId } from "../components/editor";

/**
 * Cross-reference from each builder step to the official GitHub Copilot SDK docs.
 *
 * These links point at the living documentation on the SDK's default branch, not
 * the pinned research snapshot. The reference catalog (see `reference.ts`) is the
 * evidence layer and stays commit-pinned; this map is a reading aid that tells a
 * user "to actually build this, read here". Links may require organization access.
 */
export const SDK_REPO = "github/copilot-sdk";
export const SDK_DOCS_BRANCH = "main";
const base = `https://github.com/${SDK_REPO}/blob/${SDK_DOCS_BRANCH}`;

export const SDK_DOCS_HOME = `${base}/docs/README.md`;
export const SDK_GETTING_STARTED = `${base}/docs/getting-started.md`;
export const S2S_AUTH_DOCS =
    "https://docs.github.com/en/copilot/how-tos/copilot-sdk/auth/server-to-server-tokens";

export type SdkDocLink = { label: string; url: string; note: string };
export type SdkDocGroup = { view: ViewId; title: string; summary: string; links: SdkDocLink[] };

function doc(path: string): string {
    return `${base}/docs/${path}`;
}

/** One group per builder view, in workflow order, each pointing at the matching SDK feature/setup guides. */
export const SDK_DOC_MAP: SdkDocGroup[] = [
    {
        view: "runtime",
        title: "Runtime capability map",
        summary: "What the runtime provides, how the SDK connects it, and what your application still owns.",
        links: [
            {
                label: "The agent loop",
                url: doc("features/agent-loop.md"),
                note: "The shared execution engine behind the map; not a loop you implement in the SDK.",
            },
            {
                label: "Plugin directories",
                url: doc("features/plugin-directories.md"),
                note: "Bundle supported skills, hooks, agents, and integrations for runtime loading.",
            },
            {
                label: "Multi-tenancy & servers",
                url: doc("setup/multi-tenancy.md"),
                note: "Application identity, credential scope, and isolation remain host responsibilities.",
            },
        ],
    },
    {
        view: "overview",
        title: "Start & mental model",
        summary: "The end-to-end tutorial and how the SDK, CLI, and runtime fit together.",
        links: [
            {
                label: "Getting started",
                url: doc("getting-started.md"),
                note: "Zero-to-working app with streaming and custom tools.",
            },
            {
                label: "The agent loop",
                url: doc("features/agent-loop.md"),
                note: "Turns, the tool-use loop, and completion signals.",
            },
            {
                label: "Choosing a setup path",
                url: doc("setup/choosing-a-setup-path.md"),
                note: "Personas and a decision matrix for deployment.",
            },
        ],
    },
    {
        view: "base-profile",
        title: "Choose a base profile",
        summary: "Pick the SDK starting point that best matches the behavior and ownership you need.",
        links: [
            {
                label: "Choosing a setup path",
                url: doc("setup/choosing-a-setup-path.md"),
                note: "Personas and a decision matrix for selecting a starting composition.",
            },
            {
                label: "Getting started",
                url: doc("getting-started.md"),
                note: "See a complete baseline application before customizing each decision.",
            },
        ],
    },
    {
        view: "prompt",
        title: "Behavior & instructions",
        summary: "How the prompt is processed and how to keep long sessions coherent.",
        links: [
            {
                label: "The agent loop",
                url: doc("features/agent-loop.md"),
                note: "The model sees full history each turn; there are no hidden calls.",
            },
            {
                label: "Context clearing",
                url: doc("features/context-management.md"),
                note: "Replace conversation context safely with terminal tools.",
            },
        ],
    },
    {
        view: "tools",
        title: "Capabilities & implementations",
        summary: "Custom tools, external MCP servers, and bundled plugins.",
        links: [
            {
                label: "Getting started: custom tools",
                url: doc("getting-started.md"),
                note: "Give Copilot the ability to call your code.",
            },
            {
                label: "MCP servers",
                url: doc("features/mcp.md"),
                note: "Integrate Model Context Protocol servers for external tools.",
            },
            {
                label: "Plugin directories",
                url: doc("features/plugin-directories.md"),
                note: "Bundle skills, hooks, MCP servers, and agents as one plugin.",
            },
        ],
    },
    {
        view: "context",
        title: "Inputs & discovery",
        summary: "Skills, plugins, image input, and context lifecycle.",
        links: [
            {
                label: "Skills",
                url: doc("features/skills.md"),
                note: "Load reusable prompt modules (SKILL.md) from directories.",
            },
            {
                label: "Plugin directories",
                url: doc("features/plugin-directories.md"),
                note: "Package skills, hooks, MCP, and agents together.",
            },
            {
                label: "Image input",
                url: doc("features/image-input.md"),
                note: "Send images to sessions as attachments.",
            },
            {
                label: "Context clearing",
                url: doc("features/context-management.md"),
                note: "Manage conversation context over long runs.",
            },
        ],
    },
    {
        view: "agents",
        title: "Delegation",
        summary: "Scoped sub-agents and parallel orchestration.",
        links: [
            {
                label: "Custom agents",
                url: doc("features/custom-agents.md"),
                note: "Define specialists with scoped tools and instructions.",
            },
            {
                label: "Fleet mode",
                url: doc("features/fleet-mode.md"),
                note: "Dispatch multiple sub-agents in parallel.",
            },
        ],
    },
    {
        view: "models",
        title: "Connection & identity",
        summary: "Authentication, bring-your-own-key, and usage accounting.",
        links: [
            {
                label: "Authentication",
                url: doc("auth/README.md"),
                note: "GitHub OAuth, server-to-server auth, environment variables, BYOK.",
            },
            {
                label: "Server-to-server authentication",
                url: S2S_AUTH_DOCS,
                note: "GitHub App installation eligibility, token minting, runtime environment, expiry, and billing attribution.",
            },
            {
                label: "Azure managed identity",
                url: doc("setup/azure-managed-identity.md"),
                note: "BYOK with Microsoft Foundry, no API keys.",
            },
            {
                label: "Usage and billing",
                url: doc("features/usage-and-billing.md"),
                note: "Token counts, AI-credit cost, and account quota.",
            },
            {
                label: "Client info",
                url: doc("features/client-info.md"),
                note: "Declare integration identity for telemetry attribution.",
            },
        ],
    },
    {
        view: "policy",
        title: "Host responsibilities",
        summary: "Hooks, budgets, and session persistence.",
        links: [
            {
                label: "Hooks",
                url: doc("features/hooks.md"),
                note: "Intercept tool execution, transform results, handle errors.",
            },
            {
                label: "Hooks reference",
                url: doc("hooks/README.md"),
                note: "Detailed API reference for each hook type.",
            },
            {
                label: "Session limits",
                url: doc("features/session-limits.md"),
                note: "Set an AI-credit budget and observe budget events.",
            },
            {
                label: "Session persistence",
                url: doc("features/session-persistence.md"),
                note: "Resume sessions across restarts; manage storage.",
            },
        ],
    },
    {
        view: "advanced",
        title: "Advanced runtime surfaces",
        summary:
            "Documented and emerging controls for budgets, hooks, MCP, persistence, observability, and remote execution.",
        links: [
            {
                label: "Session limits",
                url: doc("features/session-limits.md"),
                note: "Apply an AI-credit soft cap and observe budget events.",
            },
            {
                label: "Hooks",
                url: doc("features/hooks.md"),
                note: "Inspect the full host callback lifecycle beyond pre- and post-tool hooks.",
            },
            {
                label: "OpenTelemetry",
                url: doc("observability/opentelemetry.md"),
                note: "Configure trace export while treating content capture as sensitive.",
            },
        ],
    },
    {
        view: "bootstrap",
        title: "Deployment & runtime placement",
        summary: "Where the CLI/runtime runs and how to scale it.",
        links: [
            {
                label: "Choosing a setup path",
                url: doc("setup/choosing-a-setup-path.md"),
                note: "Match a persona to a setup.",
            },
            {
                label: "Default setup (bundled CLI)",
                url: doc("setup/bundled-cli.md"),
                note: "The SDK includes the CLI — install and go (≈ managed child).",
            },
            {
                label: "Local CLI",
                url: doc("setup/local-cli.md"),
                note: "Use your own CLI binary or a running instance.",
            },
            {
                label: "Backend services",
                url: doc("setup/backend-services.md"),
                note: "Server-side with a headless CLI over TCP (≈ existing service).",
            },
            {
                label: "In-process runtime",
                url: doc("setup/in-process-runtime.md"),
                note: "Host the runtime in your process (experimental).",
            },
            {
                label: "Multi-tenancy & servers",
                url: doc("setup/multi-tenancy.md"),
                note: "empty mode, per-session tokens, isolated runtime state.",
            },
        ],
    },
    {
        view: "reference",
        title: "More capabilities",
        summary: "Events, remote/cloud sessions, and the full feature index.",
        links: [
            {
                label: "All features",
                url: doc("features/README.md"),
                note: "The complete list of SDK capabilities.",
            },
            {
                label: "Streaming events",
                url: doc("features/streaming-events.md"),
                note: "Subscribe to 40+ real-time session events.",
            },
            {
                label: "Steering & queueing",
                url: doc("features/steering-and-queueing.md"),
                note: "Redirect mid-turn or queue messages.",
            },
            {
                label: "Remote sessions",
                url: doc("features/remote-sessions.md"),
                note: "Share a local session to GitHub web/mobile.",
            },
            {
                label: "Cloud sessions",
                url: doc("features/cloud-sessions.md"),
                note: "Run on GitHub-hosted compute via Mission Control.",
            },
        ],
    },
];

export function sdkDocsForView(view: ViewId): SdkDocGroup | undefined {
    return SDK_DOC_MAP.find((group) => group.view === view);
}
