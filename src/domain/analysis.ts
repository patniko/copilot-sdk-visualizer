// Copyright (c) Microsoft Corporation. All rights reserved.
import { BUILTIN_NAMES, BUILTIN_SPECS } from "./plan";
import type { HarnessPlan, HostHandler } from "./plan";
import { S2S_AUTH_AVAILABILITY } from "../content/sdk-docs";

export const HANDLER_LABELS: Record<HostHandler, string> = {
    elicitation: "elicitation requests",
    exitPlanMode: "exit-plan-mode requests",
    autoModeSwitch: "auto-mode switch requests",
    mcpAuth: "MCP OAuth requests",
};

export interface Decision {
    id: string;
    kind: "host" | "review" | "gap";
    title: string;
    detail: string;
    sources: string[];
}

export function toolSummary(plan: HarnessPlan) {
    const kept = BUILTIN_NAMES.filter((name) => plan.tools[name].action === "keep");
    const overridden = BUILTIN_NAMES.filter((name) => plan.tools[name].action === "override");
    const removed = BUILTIN_NAMES.filter((name) => plan.tools[name].action === "remove");
    return {
        kept,
        overridden,
        removed,
        knownVisible: kept.length + overridden.length + plan.customTools.length,
        inherited: plan.inventory === "coding-defaults",
        mcpTools: plan.mcpServers.reduce((count, server) => count + server.tools.length, 0),
    };
}

export function hostContracts(plan: HarnessPlan): string[] {
    return hostContractList(plan);
}

function managedRuleCount(plan: HarnessPlan): number {
    const managed = plan.policy.managed;
    return (
        managed.deny.length +
        managed.ask.length +
        managed.allow.length +
        managed.limitTo.length +
        (managed.disableBypassPermissionsMode ? 1 : 0) +
        (managed.disableAssistedPermissionsMode ? 1 : 0)
    );
}

function hostContractList(plan: HarnessPlan): string[] {
    const required = plan.policy.permissionMode === "host" ? ["Permission policy"] : [];
    if (!plan.model.id.trim()) required.push("Model selection");
    if (plan.model.provider !== "copilot" && !plan.model.endpoint.trim()) required.push("Provider endpoint");
    if (plan.model.provider === "copilot" && plan.identity === "host-token")
        required.push("GitHub token provider");
    if (plan.model.provider === "copilot" && plan.identity === "s2s-installation")
        required.push(
            plan.target.runtime === "external"
                ? "External runtime installation-token operations"
                : "GitHub App installation-token runtime environment",
        );
    if (plan.model.provider !== "copilot" && plan.model.credential === "bearer-callback")
        required.push("Provider token callback");
    if (plan.session.storage === "virtual") required.push("Session filesystem provider");
    if (plan.tools.ask_user.action === "keep") required.push("User input handler");
    if (plan.policy.preToolHook) required.push("Pre-tool policy hook");
    if (plan.policy.postToolHook) required.push("Post-tool result hook");
    for (const hook of plan.policy.hooks) required.push(`Lifecycle hook: ${hook}`);
    for (const handler of plan.policy.handlers) required.push(`Host handler: ${HANDLER_LABELS[handler]}`);
    if (plan.context.skillProvider) required.push("Skill provider (listSkills/readSkill)");
    if (plan.events.observer) required.push("Event observer");
    for (const name of BUILTIN_NAMES) {
        if (plan.tools[name].action === "override") required.push(`Tool handler: ${name}`);
    }
    for (const tool of plan.customTools) required.push(`Tool handler: ${tool.name}`);
    return required;
}

export function analyzePlan(plan: HarnessPlan): Decision[] {
    const summary = toolSummary(plan);
    const decisions: Decision[] = [];
    if (plan.policy.permissionMode === "allow-all")
        decisions.push({
            id: "allow-all-permissions",
            kind: "review",
            title: "Every ordinary runtime permission prompt is approved once",
            detail: "The generated host explicitly installs the SDK approve-all helper. Managed policy, content exclusion, service authorization, missing or invalid tools, and sandbox enablement still apply. If sandbox bypass capability is enabled, this policy can approve a sandbox-bypass request.",
            sources: ["sdk-permissions", "override-permissions"],
        });
    const unverifiedOverrides = summary.overridden.filter((name) => !BUILTIN_SPECS[name].overrideable);
    if (unverifiedOverrides.length)
        decisions.push({
            id: "unverified-overrides",
            kind: "gap",
            title: "Some selected override paths need review",
            detail: `${unverifiedOverrides.join(", ")} have no verified external override route in this catalog (catalog_search is explicitly reserved). The selection is retained, but SDK/project generation will not silently route it to a native implementation.`,
            sources: ["override-advertised", "runtime-tools"],
        });
    if (plan.target.runtime === "inprocess")
        decisions.push({
            id: "inprocess-runtime",
            kind: "review",
            title: "In-process runtime shares the application process",
            detail: "Use a matching native bundle and the language's experimental opt-in. Clients share process state and one loaded native library version; stopping a client is not a guarantee that the library unloads.",
            sources: ["sdk-inprocess-guide"],
        });
    if (plan.target.runtime === "external")
        decisions.push({
            id: "external-runtime",
            kind: "host",
            title: "Operate and secure the existing runtime service",
            detail: "The bootstrap connects to your TCP endpoint. Your host owns server startup, lifetime, network access, and service authorization; an SDK connection is not server deployment or tenant isolation.",
            sources: ["sdk-existing-runtime"],
        });
    if (summary.overridden.length)
        decisions.push({
            id: "override",
            kind: "host",
            title: `${summary.overridden.length} built-in replacement${summary.overridden.length === 1 ? "" : "s"}`,
            detail: "The same tool name now uses your description, schema, and handler. The original native effect and its checks are not automatically inherited. Wire declaration updates do not rebind SDK handlers.",
            sources: ["override-planning", "override-dispatch", "override-permissions", "sdk-live-tools"],
        });
    const workspaceTools = summary.kept.filter((name) => BUILTIN_SPECS[name].workspace);
    if (!plan.context.workspace.trim() && workspaceTools.length)
        decisions.push({
            id: "workspace-tools",
            kind: "review",
            title: "Workspace tools without a chosen workspace",
            detail: `${workspaceTools.join(", ")} still select native host effects. Choose a workspace, remove them, or replace their implementations. An empty client mode is not an OS sandbox.`,
            sources: ["runtime-tools", "sdk-empty"],
        });
    if (summary.inherited)
        decisions.push({
            id: "inherited-inventory",
            kind: "review",
            title: "Runtime default selection remains authoritative",
            detail: "The complete compiled catalog includes conditional, platform-specific, and internal tools. In inherited mode, keeping a tool leaves model/platform/capability/experiment selection intact; it does not force every catalog member on.",
            sources: ["sdk-modes", "sdk-filter-rules"],
        });
    if (plan.context.discovery || plan.context.fileHooks || plan.context.hostGit)
        decisions.push({
            id: "ambient-context",
            kind: "review",
            title: "Host and project context is deliberately enabled",
            detail: "Discovery, file hooks, and Git context can bring in more than the visible plan. Use trusted project inputs; these opt-ins are not equivalent to a tenant-safe baseline.",
            sources: ["sdk-discovery-option", "sdk-session-config"],
        });
    if (plan.session.storage === "virtual")
        decisions.push({
            id: "virtual-storage",
            kind: "host",
            title: "Virtual state needs a real provider",
            detail: "Implement createSessionFsProvider with the expected filesystem semantics. This virtualizes session state, not every tool's filesystem access. The sketch declares no SQLite capability, so SQL/todo features are not promised.",
            sources: ["sdk-storage-binding", "sdk-storage-capabilities"],
        });
    if (plan.session.storage === "virtual" && plan.session.largeOutput)
        decisions.push({
            id: "output-spill",
            kind: "review",
            title: "Large results may still write temporary files",
            detail: "Large-output handling can spill to disk independently of session-state virtualization. Disable it and bound tool results for a no-project-workspace host.",
            sources: ["sdk-large-output"],
        });
    if (plan.context.skillDirectories.length || plan.context.pluginDirectories.length)
        decisions.push({
            id: "file-packs",
            kind: "gap",
            title: "Capability packs still have path and lifecycle boundaries",
            detail: "Explicit directories are supported, but a directory is not a programmatic registry or an atomic live swap. Use the experimental skill provider when skills live in host storage.",
            sources: ["sdk-pack-inputs", "runtime-skills", "sdk-skill-provider", "plugin-reload-boundary"],
        });
    if (
        plan.context.agentDirectories.length ||
        plan.context.hookDirectories.length ||
        plan.context.instructionDirectories.length
    )
        decisions.push({
            id: "discovery-roots",
            kind: "review",
            title: "Explicit roots load customizations without broad discovery",
            detail: "Agent, hook, and instruction roots are discovery-only and work without config discovery. They grant no general filesystem access, but hook roots run commands: review their contents like code. Managed and source disables still apply.",
            sources: ["sdk-discovery-roots"],
        });
    if (plan.context.skillProvider)
        decisions.push({
            id: "skill-provider",
            kind: "host",
            title: "Host-stored skills need a provider on every resume",
            detail: "The experimental provider supplies skill metadata and SKILL.md text from host storage. Calls can run concurrently, must finish within 30 seconds, and the provider is not persisted: pass it again when resuming. Provider errors are hidden from the model.",
            sources: ["sdk-skill-provider"],
        });
    if (plan.policy.hooks.includes("subagentStop") || plan.policy.hooks.includes("userPromptSubmitted"))
        decisions.push({
            id: "blocking-hooks",
            kind: "review",
            title: "Selected hooks can block work",
            detail: "userPromptSubmitted can refuse a prompt (decision: block) and subagentStop can keep a sub-agent working (decision: block with a nonempty reason). Both run on every matching event; keep them fast and deterministic.",
            sources: ["sdk-prompt-block", "sdk-subagent-hooks"],
        });
    if (plan.agents.some((agent) => agent.hooks.trim()))
        decisions.push({
            id: "agent-hooks",
            kind: "review",
            title: "Agent-scoped hooks run commands",
            detail: "Declarative hooks on a custom agent are active only while that agent runs. They execute like file hooks, so review commands and keep secrets out of the plan.",
            sources: ["sdk-agent-hooks"],
        });
    if (plan.policy.managed.load || managedRuleCount(plan))
        decisions.push({
            id: "managed-settings",
            kind: "review",
            title: "Managed policy constrains this session",
            detail: `${plan.policy.managed.load ? "The runtime fetches enterprise managed settings with the session's GitHub token and fails closed without one. " : ""}${managedRuleCount(plan) ? "Host-injected rules are enforced as managed policy; limitTo is a closed-world host boundary and an empty list denies all hosts. " : ""}Managed rules cannot be relaxed by the session.`,
            sources: ["sdk-managed-settings", "sdk-managed-session"],
        });
    if (plan.model.allowedModels.length)
        decisions.push({
            id: "model-allowlist",
            kind: "review",
            title: "Model changes are limited to the allowlist",
            detail: "TypeScript and Rust set allowedModels in session config. Python, Go, C#, and Java projects call session.model.setAllowedModels right after create and resume, so the allowlist applies from the first turn but not to session creation itself.",
            sources: ["sdk-model-allowlist"],
        });
    if (plan.capabilities.imageGeneration)
        decisions.push({
            id: "image-generation",
            kind: plan.model.provider === "copilot" ? "review" : "gap",
            title: "Image generation is experimental",
            detail: `The opt-in is not persisted, so the host must supply it again after a runtime restart. Policy, permissions, offline mode, and tool filters still apply.${plan.model.provider === "copilot" ? "" : " It is not available with a custom (BYOK) provider."}`,
            sources: ["sdk-image-generation"],
        });
    if (["debug", "trace"].includes(plan.session.diagnostics))
        decisions.push({
            id: "diagnostics",
            kind: "review",
            title: "Verbose diagnostics capture sensitive payloads",
            detail: "At debug and trace levels, MCP diagnostic entries can contain payloads, tool arguments, paths, and server stderr. Do not upload them as telemetry or export them without deliberate host action.",
            sources: ["sdk-diagnostics"],
        });
    if (plan.session.continuePendingWork)
        decisions.push({
            id: "continue-pending",
            kind: "review",
            title: "Resume continues interrupted tool calls",
            detail: "Pending tool calls and permission prompts resume instead of being treated as interrupted. Hosts must be ready to answer re-emitted permission requests and re-bind tool handlers before resuming.",
            sources: ["sdk-resume-recovery"],
        });
    if (plan.tools.skill.action === "keep" && !plan.context.skills)
        decisions.push({
            id: "skill-gate",
            kind: "review",
            title: "The skill tool does not enable skills by itself",
            detail: "Tool availability and feature enablement are separate controls. Enable reviewed skill inputs, or remove the skill tool from this inventory.",
            sources: ["sdk-isolated-tools", "sdk-mutable-options"],
        });
    if (plan.agents.some((agent) => agent.model.trim()))
        decisions.push({
            id: "agent-fallback",
            kind: "review",
            title: "Agent model preference can fall back",
            detail: "A specialist's model setting is not a hard-fail-on-fallback contract. Session model allowlisting is a different policy scope.",
            sources: ["sdk-agents", "sdk-model-policy"],
        });
    if (plan.rootExcludedTools.length)
        decisions.push({
            id: "root-scope",
            kind: "review",
            title: "Root exclusions do not exclude child agents",
            detail: "defaultAgent.excludedTools hides tools from the primary agent while retaining them for subagents. It is not a top-level-only tool marker or an identity boundary.",
            sources: ["sdk-agents", "sdk-session-config"],
        });
    if (plan.mcpServers.length)
        decisions.push({
            id: "mcp-scope",
            kind: "host",
            title: "MCP names and service authority stay explicit",
            detail: "Server tool names and canonical runtime wire names are separate inputs. Verify both against discovery; the builder does not invent prefixes or contact servers. Tool visibility is not service authorization.",
            sources: ["sdk-filter-names", "sdk-mcp", "sdk-pack-inputs"],
        });
    if (plan.model.provider !== "copilot")
        decisions.push({
            id: "provider",
            kind: "host",
            title: "Provider selection does not establish model parity",
            detail: "Supply credentials in host code and verify the model, endpoint, and provider-native features. A blank provider endpoint becomes a required host string, not an export blocker. The application does not discover models or make inference requests.",
            sources: ["sdk-providers", "runtime-output"],
        });
    if (plan.model.credential === "bearer-callback" && plan.model.provider !== "copilot")
        decisions.push({
            id: "bearer-callback",
            kind: "gap",
            title: "Provider bearer callbacks are experimental",
            detail: "The host owns caching and refresh for each provider request. This is distinct from a GitHub session token provider and must be checked against the chosen SDK/runtime pair.",
            sources: ["sdk-providers", "sdk-auth"],
        });
    if (plan.prompt.mode === "replace")
        decisions.push({
            id: "prompt-ownership",
            kind: "host",
            title: "The full prompt is now yours",
            detail: "Replacement does not preserve the foundation's prompt guidance. Supply your own operating rules and evaluations; enforced host/organization policy is still a separate boundary.",
            sources: ["sdk-prompts", "sdk-managed-lifetime"],
        });
    if (plan.identity === "developer" && plan.model.provider === "copilot")
        decisions.push({
            id: "developer-identity",
            kind: "review",
            title: "The future host may use developer credentials",
            detail: "This can fit a local coding experience. Shared services should use explicit per-session identity and downstream authorization rather than inheriting a logged-in user's authority.",
            sources: ["sdk-default", "sdk-auth"],
        });
    if (plan.identity === "s2s-installation" && plan.model.provider === "copilot")
        decisions.push({
            id: "s2s-installation-identity",
            kind: "host",
            title: "GitHub App service identity is coming soon",
            detail:
                `${S2S_AUTH_AVAILABILITY} ` +
                (plan.target.runtime === "external"
                    ? "The independently operated runtime must receive COPILOT_GITHUB_TOKEN and disable logged-in-user fallback; this connecting client must not inject the installation token. Mint a replacement before the one-hour expiry, restart or reconfigure that runtime, and resume the session as appropriate."
                    : plan.target.runtime === "inprocess"
                      ? "Mint the installation token in trusted host code, set COPILOT_GITHUB_TOKEN before loading the in-process runtime, and disable logged-in-user fallback. Replace the token before its one-hour expiry by restarting the host runtime, then resume the session as appropriate."
                      : "Mint the installation token in trusted host code, inject it into the managed child as COPILOT_GITHUB_TOKEN, and disable logged-in-user fallback. Replace the token before its one-hour expiry by restarting the SDK client with the new child environment, then resume the session as appropriate."),
            sources: ["sdk-s2s-auth", "sdk-auth"],
        });
    return decisions;
}
