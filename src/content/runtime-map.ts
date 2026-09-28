// Copyright (c) Microsoft Corporation. All rights reserved.
import type { ViewId } from "../components/editor";

export type RuntimeCapabilityId =
    | "loop"
    | "plugins"
    | "skills"
    | "tools"
    | "mcp"
    | "agents"
    | "inference"
    | "auth"
    | "policy"
    | "context"
    | "sessions";

export interface RuntimeCapability {
    id: RuntimeCapabilityId;
    name: string;
    seam: string;
    headline: string;
    summary: string;
    provides: [string, string];
    owns: [string, string];
    boundary: string;
    controls: string[];
    related: RuntimeCapabilityId[];
    sources: string[];
    view: ViewId;
    action: string;
}

export const runtimeCapabilities: RuntimeCapability[] = [
    {
        id: "loop",
        name: "Agent loop",
        seam: "The shared engine",
        headline: "An agent engine, not just a model client.",
        summary:
            "Send a task. The runtime coordinates model requests, tool calls, results, and the next turn. Your application does not have to rebuild that loop.",
        provides: [
            "The model → tool → result cycle, with session context carried into subsequent requests.",
            "Lifecycle and completion events across the same execution machinery.",
        ],
        owns: [
            "The task, operating instructions, allowed capabilities, and definition of success.",
            "Your product experience and the decision to continue, steer, or stop work.",
        ],
        boundary:
            "An idle session is not proof that the task succeeded. Evaluate the result in your host; a wait timeout does not itself abort execution.",
        controls: ["createSession", "send", "session.on", "abort"],
        related: ["inference", "tools", "context", "sessions"],
        sources: ["sdk-agent-loop", "runtime-core", "sdk-events"],
        view: "reference",
        action: "Explore the reference",
    },
    {
        id: "plugins",
        name: "Plugins",
        seam: "Package → components",
        headline: "Compose a capability pack, not bespoke glue.",
        summary:
            "The runtime loads supported plugin packages and discovers their skills, MCP servers, agents, and hooks. A package is a distribution unit for capabilities, not another agent engine.",
        provides: [
            "Manifest interpretation and discovery of supported components in enabled plugin directories.",
            "Integration of those components with the corresponding runtime subsystems.",
        ],
        owns: [
            "Which packages to install, trust, enable, and make available to the runtime.",
            "Review of executable components, external services, and their credentials.",
        ],
        boundary:
            "Marketplace listing, format compatibility, loading, and authorization are separate. CLI marketplace management and host-specific extensions are not universal SDK APIs.",
        controls: ["pluginDirectories", "enableConfigDiscovery"],
        related: ["skills", "mcp", "agents", "policy"],
        sources: ["plugin-components", "plugin-management", "sdk-pack-inputs", "plugin-host-enable"],
        view: "context",
        action: "Configure context & packs",
    },
    {
        id: "skills",
        name: "Skills",
        seam: "Knowledge → instructions",
        headline: "Reusable know-how, loaded when needed.",
        summary:
            "Skill discovery makes reusable instructions available to the agent. The runtime handles the catalog and loading path rather than requiring your harness to paste every skill into every prompt.",
        provides: [
            "Discovery of skill metadata from configured directories and supported plugins.",
            "On-demand loading of skill instructions into the agent's context.",
        ],
        owns: [
            "The domain guidance, skill content, supporting assets, and quality of that material.",
            "Which skills are available and what authority their suggested actions actually have.",
        ],
        boundary:
            "Instructions are not executable authority. Directory loading is SDK-configurable; an internal skill-provider transport does not imply a high-level callback in every SDK.",
        controls: ["skillDirectories", "disabledSkills"],
        related: ["plugins", "context", "tools"],
        sources: ["sdk-pack-inputs", "runtime-skills", "runtime-skill-contract", "sdk-callbacks"],
        view: "context",
        action: "Configure context & packs",
    },
    {
        id: "tools",
        name: "Tools",
        seam: "Intent → execution",
        headline: "One tool loop. Different implementations.",
        summary:
            "Built-in tools, host callbacks, and MCP tools participate in the runtime's tool-use cycle. You define the capability the model sees and choose where its effects happen.",
        provides: [
            "Tool descriptions, schemas, selection, dispatch, and result delivery back to the model.",
            "Built-in implementations plus explicit host tools and supported same-name overrides.",
        ],
        owns: [
            "Custom handlers, domain APIs, argument validation, and the effects those services perform.",
            "The tool inventory and resource authorization inside your implementations.",
        ],
        boundary:
            "Available does not mean authorized. Built-ins have model, platform, and capability gates; overrides are explicit and do not inherit the old tool's authority.",
        controls: ["tools", "availableTools", "excludedTools", "overridesBuiltInTool"],
        related: ["mcp", "policy", "loop"],
        sources: ["runtime-tools", "sdk-tools", "override-planning", "override-permissions"],
        view: "tools",
        action: "Configure tools",
    },
    {
        id: "mcp",
        name: "MCP",
        seam: "Servers → agent tools",
        headline: "Connect services through a common protocol.",
        summary:
            "The runtime integrates Model Context Protocol servers into the agent's tool inventory, so each integration does not need a new model-facing execution loop.",
        provides: [
            "MCP connection and tool discovery for supported local and remote transports.",
            "Dispatch of selected MCP tools through the shared tool-use machinery.",
        ],
        owns: [
            "The MCP servers, endpoint or process configuration, and required service credentials.",
            "Service availability, trust decisions, and authorization at the resource boundary.",
        ],
        boundary:
            "MCP standardizes the integration protocol, not service trust or permissions. The builder plans explicit HTTP integrations; the SDK surface also includes local/stdio and SSE.",
        controls: ["mcpServers", "tools", "headers"],
        related: ["tools", "plugins", "policy"],
        sources: ["sdk-mcp", "runtime-tools"],
        view: "tools",
        action: "Configure tools & MCP",
    },
    {
        id: "agents",
        name: "Delegation",
        seam: "Roles → sub-agents",
        headline: "Specialists on the same engine.",
        summary:
            "Custom agents scope instructions and capabilities for delegated work. The runtime supplies the execution machinery; your harness supplies the roles and coordination strategy.",
        provides: [
            "Custom-agent definitions and selection, with scoped tools, instructions, and model choices.",
            "Runtime support for delegated work; experimental fleet APIs can coordinate parallel tasks.",
        ],
        owns: [
            "Useful role boundaries, task decomposition, and how to combine results.",
            "Budgets, authorization, and evaluation across parent and delegated work.",
        ],
        boundary:
            "A scoped tool list is not a sandbox. Delegation requires the relevant tools and gates; experimental fleet bindings are not uniform across SDKs.",
        controls: ["customAgents", "agent", "defaultAgent.excludedTools"],
        related: ["tools", "inference", "policy"],
        sources: ["sdk-agents", "sdk-fleet"],
        view: "agents",
        action: "Configure agents",
    },
    {
        id: "inference",
        name: "Inference",
        seam: "Models → shared loop",
        headline: "Adapt providers without rebuilding the agent.",
        summary:
            "The runtime handles supported provider and model interaction behind a shared session interface. Choose Copilot-backed inference or an explicitly configured provider.",
        provides: [
            "Provider adaptation for requests, responses, streaming, and tool-use interaction.",
            "Model selection and provider configuration carried through the same agent loop.",
        ],
        owns: [
            "Model choice, a supported endpoint, credentials, and access to the selected service.",
            "Latency, cost, output-quality evaluation, and provider-specific deployment decisions.",
        ],
        boundary:
            "A common interface is not identical model behavior. Tool use, images, structured output, and credential modes depend on provider and model support.",
        controls: ["model", "provider", "reasoningEffort"],
        related: ["auth", "context", "loop"],
        sources: ["sdk-providers", "runtime-output", "sdk-model-change"],
        view: "models",
        action: "Configure models & identity",
    },
    {
        id: "auth",
        name: "Authentication",
        seam: "Credentials → access",
        headline: "Credential plumbing, not your identity system.",
        summary:
            "Runtime and SDK credential surfaces connect sessions to Copilot or configured inference providers. Keep credential acquisition and application identity under host control.",
        provides: [
            "Supported GitHub credential paths and per-session credential bindings.",
            "Provider API-key and supported bearer-token integration; token callbacks are experimental.",
        ],
        owns: [
            "User sign-in, tenant identity, token acquisition, secret storage, and revocation.",
            "Resource authorization and credentials for the external services your tools call.",
        ],
        boundary:
            "Inference authentication does not authenticate every MCP server or authorize tenant data. BYOK supplies inference access, not a GitHub identity.",
        controls: ["gitHubTokenProvider", "provider.apiKey", "provider.bearerTokenProvider"],
        related: ["inference", "policy", "mcp"],
        sources: ["sdk-auth", "sdk-providers", "sdk-multitenancy"],
        view: "models",
        action: "Configure models & identity",
    },
    {
        id: "policy",
        name: "Permissions & hooks",
        seam: "Execution → checkpoints",
        headline: "A place to enforce your decisions.",
        summary:
            "Permission requests and lifecycle hooks give your host integration points around agent activity. The runtime applies supported decisions; your host supplies the policy.",
        provides: [
            "Permission-request and resolution machinery around supported operations.",
            "Lifecycle and pre/post-tool hook integration for host callbacks.",
        ],
        owns: [
            "Approval UX and the actual rules for users, tenants, resources, and effects.",
            "Callback implementations and authorization inside every effectful service.",
        ],
        boundary:
            "Hooks are not OS isolation. Omitting a permission handler does not mean blanket approval or guaranteed automatic denial; handle pending requests explicitly.",
        controls: ["onPermissionRequest", "hooks.onPreToolUse", "hooks.onPostToolUse"],
        related: ["tools", "auth", "agents"],
        sources: ["sdk-permissions", "sdk-hooks", "override-permissions"],
        view: "policy",
        action: "Configure policy & state",
    },
    {
        id: "context",
        name: "Context",
        seam: "History → model input",
        headline: "Manage the context, not just a messages array.",
        summary:
            "The runtime assembles model context from the session's instructions, conversation, and tool results, with machinery for long-running sessions and large outputs.",
        provides: [
            "Prompt and history processing, plus supported attachment and skill integration.",
            "Configurable compaction and large-tool-output handling.",
        ],
        owns: [
            "Relevant instructions, retrieval, domain data, and what the agent is allowed to see.",
            "Retention requirements and evaluation of what may be lost through compaction.",
        ],
        boundary:
            "Compaction is not perfect memory or a knowledge store. Empty mode does not remove every prompt or filesystem dependency; large outputs may use temporary files.",
        controls: ["systemMessage", "infiniteSessions", "largeOutput"],
        related: ["skills", "inference", "sessions"],
        sources: ["sdk-prompts", "sdk-infinite-options", "sdk-large-output", "sdk-empty"],
        view: "context",
        action: "Configure context & packs",
    },
    {
        id: "sessions",
        name: "Sessions & events",
        seam: "Work → observable state",
        headline: "A lifecycle your application can observe.",
        summary:
            "The runtime maintains session state and emits structured events. The SDK exposes those events and lifecycle operations so your product can render and manage the work.",
        provides: [
            "Create, resume, disconnect, and delete semantics, with persisted conversation state.",
            "Streaming and lifecycle events, tool progress, and supported usage signals.",
        ],
        owns: [
            "Storage placement, retention, deployment isolation, and how events appear in your UX.",
            "Rebinding host callbacks on resume, observability sinks, and your quality checks.",
        ],
        boundary:
            "Disconnecting is not deleting durable state. Storage adapters and event features vary by SDK; a separate runtime process is not a tenant sandbox.",
        controls: ["sessionId", "streaming", "session.on", "resumeSession"],
        related: ["context", "loop", "policy"],
        sources: ["sdk-lifecycle", "sdk-stream-options", "sdk-resume-bindings", "sdk-storage"],
        view: "policy",
        action: "Configure policy & state",
    },
];

export function runtimeCapability(id: RuntimeCapabilityId): RuntimeCapability {
    const capability = runtimeCapabilities.find((entry) => entry.id === id);
    if (!capability) throw new Error(`Unknown runtime capability: ${id}`);
    return capability;
}

export const capabilitySides: { left: RuntimeCapabilityId[]; right: RuntimeCapabilityId[] } = {
    left: ["plugins", "skills", "tools", "mcp", "agents"],
    right: ["inference", "auth", "policy", "context", "sessions"],
};

export const turnWalkthrough: {
    title: string;
    owner: string;
    description: string;
    focus: RuntimeCapabilityId;
    active: RuntimeCapabilityId[];
}[] = [
    {
        title: "Configure",
        owner: "Your harness → SDK",
        description:
            "Your host creates a session with instructions, model choices, tools, and real callbacks. The SDK transports those choices; configuration is not itself execution.",
        focus: "loop",
        active: ["loop", "plugins", "skills", "tools", "policy"],
    },
    {
        title: "Assemble",
        owner: "Runtime",
        description:
            "The runtime prepares the configured instructions, available skills, conversation history, and tool definitions for the model. Your domain data still comes from your chosen sources.",
        focus: "context",
        active: ["loop", "context", "skills", "tools"],
    },
    {
        title: "Infer",
        owner: "Runtime ↔ inference provider",
        description:
            "The runtime calls the selected model using the configured credential path. The model can answer directly or request an available tool; this example follows a tool request.",
        focus: "inference",
        active: ["loop", "inference", "auth"],
    },
    {
        title: "Authorize",
        owner: "Runtime ↔ your host policy",
        description:
            "For an operation that requires permission, the runtime asks through the permission surface. Your host makes the decision. A denial changes the path; this example continues with approval.",
        focus: "policy",
        active: ["loop", "policy", "tools"],
    },
    {
        title: "Execute",
        owner: "Runtime → selected implementation",
        description:
            "Dispatch goes to a built-in implementation, your SDK-bound handler, or an MCP server. The effectful service must still validate arguments and authorize access to the actual resource.",
        focus: "tools",
        active: ["loop", "tools", "mcp"],
    },
    {
        title: "Continue",
        owner: "Runtime → SDK → your product",
        description:
            "Tool results feed the next model request. Events let your UI show progress and the eventual answer. The cycle can repeat; an idle signal means this run has stopped, not that your quality bar was met.",
        focus: "sessions",
        active: ["loop", "context", "inference", "sessions"],
    },
];
