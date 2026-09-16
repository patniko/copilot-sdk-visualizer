// Copyright (c) Microsoft Corporation. All rights reserved.
import { BUILTIN_NAMES } from "../plan";
import type { HarnessPlan } from "../plan";
import { reference } from "../../content/reference";
import type { BootstrapFile, BootstrapProject, BootstrapRequirement } from "./types";

export function projectName(plan: HarnessPlan): string {
    const slug = plan.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
    return `copilot-harness-${slug || "agent"}`;
}

export function toolDefinitions(plan: HarnessPlan) {
    return [
        ...BUILTIN_NAMES.flatMap((name) =>
            plan.tools[name].action !== "override"
                ? []
                : [
                      {
                          name,
                          description: plan.tools[name].description,
                          parameters: JSON.parse(plan.tools[name].parameters) as unknown,
                          overridesBuiltInTool: true,
                          isTerminal: false,
                      },
                  ],
        ),
        ...plan.customTools.map((tool) => ({
            name: tool.name,
            description: tool.description,
            parameters: JSON.parse(tool.parameters) as unknown,
            overridesBuiltInTool: false,
            isTerminal: tool.terminal,
        })),
    ];
}

export function sessionData(plan: HarnessPlan) {
    const prompt =
        plan.prompt.mode === "customize"
            ? {
                  mode: "customize",
                  content: plan.prompt.content,
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
              }
            : { mode: plan.prompt.mode, content: plan.prompt.content };
    return {
        ...(plan.model.id.trim() ? { model: plan.model.id.trim() } : {}),
        ...(plan.model.reasoningEffort === "default" ? {} : { reasoningEffort: plan.model.reasoningEffort }),
        ...(plan.model.contextTier === "default" ? {} : { contextTier: plan.model.contextTier }),
        systemMessage: prompt,
        ...(plan.inventory === "explicit"
            ? {
                  availableTools: [
                      ...BUILTIN_NAMES.flatMap((name) =>
                          plan.tools[name].action === "remove"
                              ? []
                              : [plan.tools[name].action === "override" ? name : `builtin:${name}`],
                      ),
                      ...plan.customTools.map((tool) => `custom:${tool.name}`),
                      ...plan.mcpServers.flatMap((server) =>
                          server.tools.map((tool) => `mcp:${tool.wireName}`),
                      ),
                  ],
              }
            : {}),
        excludedTools: BUILTIN_NAMES.filter((name) => plan.tools[name].action === "remove"),
        ...(plan.context.workspace.trim() ? { workingDirectory: plan.context.workspace } : {}),
        enableConfigDiscovery: plan.context.discovery,
        enableSkills: plan.context.skills,
        enableFileHooks: plan.context.fileHooks,
        enableHostGitOperations: plan.context.hostGit,
        skillDirectories: plan.context.skillDirectories,
        pluginDirectories: plan.context.pluginDirectories,
        mcpServers: Object.fromEntries(
            plan.mcpServers.map((server) => [
                server.name,
                {
                    type: "http",
                    url: server.url,
                    tools: server.tools.map((tool) => tool.name),
                },
            ]),
        ),
        customAgents: plan.agents.map((agent) => ({
            name: agent.name,
            description: agent.description,
            prompt: agent.prompt,
            ...(agent.model.trim() ? { model: agent.model.trim() } : {}),
            tools: agent.tools,
        })),
        ...(plan.selectedAgent ? { agent: plan.selectedAgent } : {}),
        ...(plan.rootExcludedTools.length ? { defaultAgent: { excludedTools: plan.rootExcludedTools } } : {}),
        infiniteSessions: { enabled: plan.session.infinite },
        largeOutput: { enabled: plan.session.largeOutput },
        streaming: plan.events.streaming,
        ...(plan.model.provider === "copilot"
            ? {}
            : {
                  provider: {
                      type: plan.model.provider,
                      baseUrl: plan.model.endpoint,
                      ...(plan.model.provider === "anthropic" ? {} : { wireApi: plan.model.wireApi }),
                  },
              }),
    };
}

export function environmentNames(plan: HarnessPlan): string[] {
    return [
        ...(!plan.model.id.trim() ? ["COPILOT_MODEL"] : []),
        ...(plan.model.provider === "copilot" && plan.identity === "host-token"
            ? ["GITHUB_TOKEN", "GITHUB_TOKEN_EXPIRES_AT"]
            : []),
        ...(plan.model.provider === "copilot" &&
        plan.identity === "s2s-installation" &&
        plan.target.runtime !== "external"
            ? ["COPILOT_GITHUB_TOKEN"]
            : []),
        ...(plan.model.provider !== "copilot"
            ? [plan.model.credential === "api-key" ? plan.model.credentialEnv : "MODEL_BEARER_TOKEN"]
            : []),
    ];
}

export function commonRequirements(plan: HarnessPlan, hostFile: string): BootstrapRequirement[] {
    const items: BootstrapRequirement[] = [
        {
            id: "permission-policy",
            title: "Review the safe default permission policy",
            detail: "The bootstrap must not approve effects by default. Integrate your identity, tenant, resource, and approval rules before allowing tools.",
            file: hostFile,
            kind: "review",
        },
    ];
    if (plan.model.provider !== "copilot" && !plan.model.endpoint.trim())
        items.push({
            id: "provider-endpoint",
            title: "Provide the inference provider endpoint",
            detail: `Set the provider endpoint string in ${hostFile}. Local preflight and startup reject the missing implementation; no example or default endpoint is used.`,
            file: hostFile,
            kind: "host-code",
        });
    for (const name of environmentNames(plan))
        items.push({
            id: `env-${name}`,
            title: `Set ${name}`,
            detail: "Set this in the process environment. No secret value is exported by the builder.",
            file: ".env.example",
            kind: "environment",
            environmentVariable: name,
        });
    for (const tool of toolDefinitions(plan))
        items.push({
            id: `tool-${tool.name}`,
            title: `Implement ${tool.name}`,
            detail: "Replace the explicit unimplemented host handler. Validate arguments and resource authority, then return the SDK's supported tool result.",
            file: hostFile,
            kind: "host-code",
        });
    if (plan.policy.preToolHook)
        items.push({
            id: "pre-hook",
            title: "Implement the pre-tool policy hook",
            detail: "Connect your policy or context logic; a configured hook is not satisfied by a no-op.",
            file: hostFile,
            kind: "host-code",
        });
    if (plan.policy.postToolHook)
        items.push({
            id: "post-hook",
            title: "Implement the post-tool result hook",
            detail: "Integrate the selected result-inspection or redaction behavior.",
            file: hostFile,
            kind: "host-code",
        });
    if (plan.session.storage === "virtual")
        items.push({
            id: "session-storage",
            title: "Implement the session filesystem provider",
            detail: "Provide real session persistence semantics. The generated interface/stub is not a no-op store or universal filesystem virtualization.",
            file: hostFile,
            kind: "host-code",
        });
    if (plan.target.runtime === "external")
        items.push({
            id: "external-runtime",
            title: "Start and configure the existing runtime",
            detail: `Operate the server at ${plan.target.serverUrl}. Apply server-owned state and idle policies there; secure non-loopback access and tenant authorization.`,
            file: "README.md",
            kind: "runtime",
        });
    if (plan.model.provider === "copilot" && plan.identity === "s2s-installation") {
        items.push({
            id: "s2s-token-operations",
            title: "Implement GitHub App installation-token operations",
            detail: "Use the app private key and installation ID only in trusted host infrastructure to mint an installation token. The request must include at least one repository_ids entry and permissions.copilot_requests=write. Never write the app private key, app JWT, token, or expiry into this project or plan.",
            file: "README.md",
            kind: "host-code",
        });
        items.push({
            id: "s2s-eligibility",
            title: "Confirm GitHub App Copilot eligibility and installation",
            detail: "GitHub must separately enable the billing/attribution account or organization. Configure Copilot Requests read/write, install on that account, and currently select All repositories. This selection does not grant enablement, billing approval, model access, or a fixed higher rate limit.",
            file: "README.md",
            kind: "review",
        });
        items.push({
            id: "s2s-refresh",
            title: "Replace the one-hour installation token by restarting the runtime",
            detail: "Mint a replacement before expiry, restart or reconfigure the runtime with the new COPILOT_GITHUB_TOKEN, then resume the session as appropriate. The per-session GitHub token callback is not supported for this mode.",
            file: "README.md",
            kind: "runtime",
        });
        if (plan.target.runtime === "external")
            items.push({
                id: "s2s-external-runtime",
                title: "Configure S2S authentication on the external runtime host",
                detail: "Set COPILOT_GITHUB_TOKEN and useLoggedInUser=false on the independently operated runtime. Do not expose or inject the installation token from this connecting client.",
                file: "README.md",
                kind: "runtime",
            });
    }
    if (plan.target.runtime === "inprocess")
        items.push({
            id: "native-runtime",
            title: "Provide a compatible native runtime",
            detail: "Check this language's native dependency/feature opt-in and OS/architecture bundle. In-process hosting is experimental and shares process state.",
            file: "README.md",
            kind: "runtime",
        });
    return items;
}

export function commonFiles(plan: HarnessPlan, project: Omit<BootstrapProject, "files">): BootstrapFile[] {
    const longestFence = Math.max(2, ...[...plan.evaluation.matchAll(/`+/g)].map((match) => match[0].length));
    const evaluationFence = "`".repeat(longestFence + 1);
    const env = [
        "# Copy variable names into your process environment. Values are intentionally blank.",
        "# This file is a reference; it is not loaded automatically by the bootstrap.",
        ...Array.from(
            new Set([
                ...environmentNames(plan),
                ...project.requirements.flatMap((requirement) =>
                    requirement.environmentVariable ? [requirement.environmentVariable] : [],
                ),
            ]),
        ).map((name) => {
            if (!/^[A-Z_][A-Z0-9_]*$/.test(name))
                throw new Error(`Invalid environment variable name: ${name}`);
            return `${name}=`;
        }),
        ...(plan.target.runtime === "inprocess"
            ? [
                  "# Optional: point to a matching runtime package before the first native client starts.",
                  "# COPILOT_CLI_PATH=",
              ]
            : []),
        "",
    ].join("\n");
    const notes = [
        "<!-- Copyright (c) Microsoft Corporation. All rights reserved. -->",
        `# ${project.name}`,
        "",
        `A ${project.languageLabel} agent bootstrap generated from your harness plan.`,
        "",
        "## 1. Install the project dependencies",
        "",
        "```sh",
        ...project.commands.install,
        "```",
        "",
        "## 2. Provide environment values and host integrations",
        "",
        "`.env.example` lists names only. Set them in your shell/process; this bootstrap does not automatically source an environment file. Never commit secret values.",
        ...(plan.model.provider === "copilot" && plan.identity === "host-token"
            ? [
                  "The environment-backed GitHub token provider uses `GITHUB_TOKEN_EXPIRES_AT` as the token issuer's actual future expiry in UNIX seconds, not a duration to reset on each request. Replace that starter adapter with your real acquisition/refresh service for production.",
              ]
            : []),
        ...(plan.model.provider === "copilot" && plan.identity === "s2s-installation"
            ? [
                  plan.target.runtime === "external"
                      ? "The connecting client does not accept or inject the installation token. Configure `COPILOT_GITHUB_TOKEN` and `useLoggedInUser=false` on the separately operated runtime host."
                      : plan.target.runtime === "inprocess"
                        ? "Set `COPILOT_GITHUB_TOKEN` in the host environment before the in-process runtime loads. The generated client disables logged-in-user fallback and does not install a session token callback."
                        : "The host-side `COPILOT_GITHUB_TOKEN` value is injected into the managed child runtime. The generated client disables logged-in-user fallback and does not install a session token callback.",
                  "Installation tokens expire after one hour. Mint a replacement in trusted host infrastructure, restart or reconfigure the runtime with the new environment, then resume the session when appropriate.",
                  "Authoritative setup: https://docs.github.com/en/copilot/how-tos/copilot-sdk/auth/server-to-server-tokens",
              ]
            : []),
        "",
        ...project.requirements.map((item) => `- **${item.title}** — \`${item.file}\`: ${item.detail}`),
        "",
        "Selected custom tools, hooks, and virtual storage may contain explicit unimplemented integration points. Complete those before a real workload; do not replace them with success-shaped no-ops.",
        "",
        "## 3. Check the bootstrap before using a model",
        "",
        "```sh",
        project.commands.check,
        "```",
        "",
        "The check command is local preflight, not an agent turn. Resolve its missing-environment and host-integration messages first.",
        "",
        ...(project.commands.startRuntime
            ? [
                  "## 4. Start your separate runtime service",
                  "",
                  "Run this separately on the server host. Loopback is appropriate for local development; secure any remote exposure.",
                  "",
                  "```sh",
                  project.commands.startRuntime,
                  "```",
                  "",
              ]
            : []),
        `## ${project.commands.startRuntime ? "5" : "4"}. Run an agent turn`,
        "",
        "```sh",
        project.commands.run,
        "```",
        "",
        "Running the generated project can make real model requests and execute effects permitted by your host policy. The builder itself never does so.",
        "",
        "## Runtime placement and limitations",
        "",
        ...project.notes.map((note) => `- ${note}`),
        ...(project.language === "java" || project.language === "rust"
            ? [
                  "",
                  "Generated Java/Rust source and manifest syntax were checked, but full compilation/native startup was not verified on the visualizer author's installed toolchains. Build with the specified JDK/Rust version and test the exact platform before deployment.",
              ]
            : []),
        "",
        "## Configuration and quality ownership",
        "",
        "`harness-plan.json` preserves the original planner decisions. Configuration data is not executable host code, and a client mode is not a live runtime operating-mode switch.",
        "",
        "### Your evaluation criteria",
        "",
        `${evaluationFence}text`,
        plan.evaluation,
        evaluationFence,
        "",
        "## Source snapshot",
        "",
        `SDK: \`${reference.revisions.sdk}\`. Runtime: \`${reference.revisions.runtime}\`.`,
        "",
        ...project.sources.map((id) => {
            const source = reference.sources[id];
            if (!source) throw new Error(`Unknown bootstrap source: ${id}`);
            return source.url ? `- [${source.label}](${source.url})` : `- ${source.label}`;
        }),
        "",
    ].join("\n");
    return [
        { path: "README.md", content: notes, language: "markdown" },
        { path: ".env.example", content: env, language: "text" },
        {
            path: ".gitignore",
            content:
                "# Copyright (c) Microsoft Corporation. All rights reserved.\n.env\n.env.*\n!.env.example\n.sdk-source/\nnode_modules/\ndist/\n.venv/\n__pycache__/\nbin/\nobj/\ntarget/\n.harness-state/\n",
            language: "text",
        },
        { path: "harness-plan.json", content: JSON.stringify(plan, null, 2) + "\n", language: "json" },
    ];
}
