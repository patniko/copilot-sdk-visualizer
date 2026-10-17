// Copyright (c) Microsoft Corporation. All rights reserved.
/// <reference types="node" />
import { spawnSync } from "node:child_process";
import { describe, expect, it } from "vitest";
import { reference } from "../../content/reference";
import { createAgent, createCustomTool, createMcpServer } from "../plan";
import { createPreset } from "../presets";
import type { RuntimeKind } from "../target";
import { javaAdapter } from "./java";
import { JAVA_RUST_SDK_REVISION } from "./java-rust-shared";
import { rustAdapter } from "./rust";
import type { LanguageAdapter } from "./types";

function generatedFile(project: ReturnType<LanguageAdapter["generate"]>, path: string): string {
    const file = project.files.find((file) => file.path === path);
    if (!file) throw new Error(`The exported project is missing ${path}`);
    return file.content;
}

const adapters = [
    {
        adapter: javaAdapter,
        dataPath: "src/main/resources/bootstrap-config.json",
        source: "src/main/java/harness/Configuration.java",
    },
    { adapter: rustAdapter, dataPath: "bootstrap-config.json", source: "src/config.rs" },
];
const runtimes: RuntimeKind[] = ["managed", "external", "inprocess"];

describe.each(adapters)("$adapter.label bootstrap adapter", ({ adapter, dataPath, source }) => {
    it.each(runtimes)("exports a complete %s project without taking over the parent's files", (runtime) => {
        const plan = createPreset("empty");
        plan.target = { language: adapter.language, runtime, serverUrl: "tcp://[::1]:5432", cliPath: "" };
        expect(adapter.check(plan)).toEqual([]);
        const project = adapter.generate(plan);
        expect(new Set(project.files.map((file) => file.path)).size).toBe(project.files.length);
        expect(
            project.files.some((file) =>
                ["README.md", ".env.example", "harness-plan.json"].includes(file.path),
            ),
        ).toBe(false);
        const data: unknown = JSON.parse(generatedFile(project, dataPath));
        expect(data).toMatchObject({
            client: { runtime, mode: "empty", baseDirectory: "./.harness-state", idleTimeoutSeconds: 0 },
            storage: "local",
            session: { systemMessage: { mode: "replace" }, enableConfigDiscovery: false },
        });
        expect(project.commands.check).toContain("--check");
        expect(project.commands.install.length).toBeGreaterThan(0);
        expect(project.requirements.map((requirement) => requirement.id)).toContain(
            "env-GITHUB_TOKEN_EXPIRES_AT",
        );
        expect(project.sources.every((id) => Boolean(reference.sources[id]))).toBe(true);
        if (runtime === "external") {
            expect(data).toMatchObject({ client: { host: "::1", port: 5432, address: "[::1]:5432" } });
            expect(project.commands.startRuntime).toBe("bash start-runtime.sh --run");
            expect(generatedFile(project, "start-runtime.sh")).toContain("--port 5432");
        } else {
            expect(project.commands.startRuntime).toBeUndefined();
        }
    });

    it("preserves selected configuration and schemas without injecting user text into source", () => {
        const plan = createPreset("copilot");
        plan.target.language = adapter.language;
        plan.name = 'Case with Unicode and "quotes"';
        plan.identity = "host-token";
        plan.inventory = "explicit";
        plan.prompt = {
            mode: "customize",
            content: 'Exact\ncontent: "quotes", \\u000a and ${notCode}',
            sections: [
                { name: "tone", action: "prepend", content: "Concise" },
                { name: "safety", action: "preserve", content: "" },
            ],
        };
        plan.tools.view.action = "override";
        plan.tools.bash.action = "remove";
        const finalTool = { ...createCustomTool("final", "submit_answer"), terminal: true };
        plan.customTools = [finalTool];
        plan.mcpServers = [createMcpServer("mcp", "documents")];
        plan.agents = [
            { ...createAgent("agent", "reviewer"), tools: ["documents-search"], model: "review-model" },
        ];
        plan.selectedAgent = "reviewer";
        plan.rootExcludedTools = ["bash", "documents-search"];
        plan.context.skillDirectories = ["/future-host/skills"];
        plan.context.pluginDirectories = ["/future-host/plugins"];
        plan.policy = { ...plan.policy, permissionMode: "host", preToolHook: true, postToolHook: true };
        plan.model = {
            ...plan.model,
            provider: "openai",
            id: "chosen-model",
            endpoint: "https://model.example.test/v1",
            credential: "api-key",
            credentialEnv: "TENANT_MODEL_KEY",
            reasoningEffort: "high",
            contextTier: "long_context",
        };
        plan.session.idleTimeoutSeconds = 317;
        plan.session.infinite = false;
        const project = adapter.generate(plan);
        const data: unknown = JSON.parse(generatedFile(project, dataPath));
        expect(data).toMatchObject({
            identity: "host-token",
            credentialEnv: "TENANT_MODEL_KEY",
            preToolHook: true,
            postToolHook: true,
            client: { idleTimeoutSeconds: 317 },
            session: {
                model: "chosen-model",
                reasoningEffort: "high",
                contextTier: "long_context",
                systemMessage: {
                    content: plan.prompt.content,
                    sections: {
                        tone: { action: "prepend", content: "Concise" },
                        safety: { action: "preserve" },
                    },
                },
                availableTools: expect.arrayContaining([
                    "view",
                    "custom:submit_answer",
                    "mcp:documents-search",
                ]),
                excludedTools: ["bash"],
                customAgents: [{ name: "reviewer", tools: ["documents-search"], model: "review-model" }],
                agent: "reviewer",
                defaultAgent: { excludedTools: ["bash", "documents-search"] },
                enableConfigDiscovery: true,
                enableSkills: true,
                enableFileHooks: true,
                enableHostGitOperations: true,
                skillDirectories: ["/future-host/skills"],
                pluginDirectories: ["/future-host/plugins"],
                infiniteSessions: { enabled: false },
                largeOutput: { enabled: true },
                streaming: true,
                provider: { type: "openai", baseUrl: "https://model.example.test/v1", wireApi: "responses" },
            },
            tools: [
                {
                    name: "view",
                    overridesBuiltInTool: true,
                    isTerminal: false,
                    parameters: JSON.parse(plan.tools.view.parameters),
                },
                {
                    name: "submit_answer",
                    overridesBuiltInTool: false,
                    isTerminal: true,
                    parameters: JSON.parse(finalTool.parameters),
                },
            ],
        });
        expect(generatedFile(project, source)).not.toContain(plan.prompt.content);
        expect(project.requirements.map((requirement) => requirement.id)).toEqual(
            expect.arrayContaining([
                "tool-view",
                "tool-submit_answer",
                "pre-hook",
                "post-hook",
                "env-TENANT_MODEL_KEY",
            ]),
        );
        expect(project.requirements.map((requirement) => requirement.id)).not.toContain("env-GITHUB_TOKEN");
        plan.model.provider = "copilot";
        expect(adapter.generate(plan).requirements.map((requirement) => requirement.id)).toContain(
            "env-GITHUB_TOKEN",
        );
    });

    it("blocks unsupported MCP renaming and non-managed executable overrides with remedies", () => {
        const plan = createPreset("empty");
        plan.target.language = adapter.language;
        plan.target.runtime = "inprocess";
        plan.target.cliPath = "/runtime/copilot-runtime";
        plan.mcpServers = [createMcpServer("mcp", "documents")];
        const tool = plan.mcpServers[0]?.tools[0];
        if (!tool) throw new Error("The MCP test fixture is missing its tool");
        tool.wireName = "arbitrary_name";
        const blockers = adapter.check(plan);
        expect(blockers).toHaveLength(2);
        expect(blockers.every((blocker) => blocker.detail.length > 30 && blocker.fields.length > 0)).toBe(
            true,
        );
        expect(() => adapter.generate(plan)).toThrow(/Clear target.cliPath/);
    });

    it("exports syntax-valid safe-by-default scripts with quoted future-host paths", () => {
        const plan = createPreset("empty");
        plan.target.language = adapter.language;
        plan.target.runtime = "external";
        plan.session.baseDirectory = "/future-host/tenant's $(not-a-command)\nstate";
        plan.session.idleTimeoutSeconds = 123;
        const project = adapter.generate(plan);
        for (const file of project.files.filter((file) => file.path.endsWith(".sh"))) {
            const parsed = spawnSync("bash", ["-n"], { input: file.content, encoding: "utf8" });
            expect(
                { error: parsed.error?.message, status: parsed.status, stderr: parsed.stderr },
                file.path,
            ).toEqual({
                error: undefined,
                status: 0,
                stderr: "",
            });
            for (const args of [[], ["--help"]]) {
                const help = spawnSync("bash", ["-s", "--", ...args], {
                    input: file.content,
                    encoding: "utf8",
                });
                expect(help.status, help.stderr).toBe(0);
                expect(help.stdout).toContain("Without --run");
            }
        }
        expect(generatedFile(project, "start-runtime.sh")).toContain("args+=(--session-idle-timeout 123)");
    });
});

describe("language-specific bootstrap contracts", () => {
    it("blocks Java virtual storage and integer-overflow timeout values rather than approximating them", () => {
        const plan = createPreset("minimal");
        plan.target.language = "java";
        plan.session.idleTimeoutSeconds = 2_147_483_648;
        expect(javaAdapter.check(plan).map((blocker) => blocker.id)).toEqual([
            "java-session-fs",
            "java-idle-timeout-range",
        ]);
        expect(() => javaAdapter.generate(plan)).toThrow(/Select local session storage or Rust/);
    });

    it("provisions source-built Java artifacts and experimental/JNA dependencies only where needed", () => {
        const plan = createPreset("empty");
        plan.target.language = "java";
        plan.target.runtime = "inprocess";
        const project = javaAdapter.generate(plan);
        const pom = generatedFile(project, "pom.xml");
        expect(pom).toContain("<copilot.version>1.0.15-preview.1-SNAPSHOT</copilot.version>");
        expect(pom).not.toContain("1.0.14-SNAPSHOT");
        expect(pom).toContain("5.19.1");
        // The pinned source cannot build native classifier JARs; the runtime comes from COPILOT_CLI_PATH.
        expect(pom).not.toContain("copilot-sdk-java-runtime");
        expect(pom).not.toContain("COPILOT_JAVA_RUNTIME_CLASSIFIER");
        expect(project.requirements.map((requirement) => requirement.id)).toContain("env-COPILOT_CLI_PATH");
        const setup = generatedFile(project, "setup-sdk.sh");
        expect(setup).toContain(JAVA_RUST_SDK_REVISION);
        expect(setup).toContain("git clone --filter=blob:none --no-checkout");
        expect(setup).toContain("status --porcelain --untracked-files=normal");
        expect(setup).toContain("native_args=(-Dcopilot.native.skip.download=true)");
        expect(setup).not.toMatch(/-Pnative-|validate-native-host/);
        expect(setup).not.toMatch(/git (reset|clean)|rm -rf/);
        expect(JSON.parse(generatedFile(project, "src/main/resources/bootstrap-config.json"))).toMatchObject({
            cliPathRuntime: true,
        });
        expect(generatedFile(project, "src/main/java/harness/HostExtensions.java")).toContain(
            'System.getenv("COPILOT_CLI_PATH")',
        );
        const configuration = generatedFile(project, "src/main/java/harness/Configuration.java");
        for (const setter of [
            "setEnableFileHooks",
            "setEnableConfigDiscovery",
            "setEnableHostGitOperations",
            "setOnPermissionRequest",
            "setGitHubTokenProvider",
        ]) {
            expect(configuration).toContain(setter);
        }
        const host = generatedFile(project, "src/main/java/harness/HostExtensions.java");
        expect(host).toContain("Math.subtractExact(expiresAt, Instant.now().getEpochSecond())");
        expect(host).toContain("CompletableFuture.failedFuture");
        expect(host).toContain("getAllowFreeform().orElse(true)");
        expect(host).not.toContain("APPROVE_ALL");
    });

    it("pins Rust and retains pre-start observations, real expiry, safe permissions, and failing SessionFs", () => {
        const plan = createPreset("minimal");
        plan.target.language = "rust";
        plan.target.runtime = "inprocess";
        const project = rustAdapter.generate(plan);
        expect(generatedFile(project, "Cargo.toml")).toContain(`rev = "${JAVA_RUST_SDK_REVISION}"`);
        expect(generatedFile(project, "Cargo.toml")).toContain('features = ["bundled-in-process"]');
        expect(generatedFile(project, "rust-toolchain.toml")).toContain('channel = "1.94.0"');
        const main = generatedFile(project, "src/main.rs");
        expect(main.indexOf("Observer::start(prepared.subscribe()")).toBeLessThan(
            main.indexOf("prepared.start()"),
        );
        expect(main).toContain("host.ensure_healthy()");
        expect(main).toContain("Turn completed without an assistant message.");
        expect(main).toContain("with_cleanup");
        const configuration = generatedFile(project, "src/config.rs");
        expect(configuration).toContain("deny_unknown_fields");
        expect(configuration).toContain("with_permission_handler");
        expect(configuration).toContain(".with_parameters(serde_json::to_value(&tool.parameters)?)");
        expect(configuration).toContain("with_session_fs_provider");
        const host = generatedFile(project, "src/host.rs");
        expect(host).toContain("expires_at.checked_sub(now)");
        expect(host).toContain("if remaining <= 0");
        expect(host).toContain("thread::Builder::new()");
        expect(generatedFile(project, "src/session_fs.rs")).toContain(
            'Err(unimplemented_operation("write_file"))',
        );
        for (const file of project.files.filter((file) => file.language === "rust")) {
            expect(file.content, file.path).not.toContain(".unwrap()");
            expect(file.content, file.path).not.toContain("..Default::default()");
        }
    });
});

function v3Plan(language: "java" | "rust") {
    const plan = createPreset("copilot");
    plan.target.language = language;
    plan.identity = "host-token";
    plan.context = {
        ...plan.context,
        skills: true,
        agentDirectories: ["/future-host/agents"],
        hookDirectories: ["/future-host/hooks"],
        instructionDirectories: ["/future-host/instructions"],
        additionalDirectories: ["/future-host/extra"],
        skillProvider: true,
        includedBuiltinSkills: ["pdf"],
        customInstructions: "skip",
        onDemandInstructions: true,
        refreshCustomInstructions: true,
        organizationInstructions: "Follow org policy.",
    };
    plan.policy = {
        ...plan.policy,
        hooks: ["subagentStart", "userPromptSubmitted"],
        handlers: ["elicitation", "mcpAuth"],
        managed: { ...plan.policy.managed, load: true, enforceModelDefaults: true, deny: ["shell(rm)"] },
    };
    plan.model = {
        ...plan.model,
        id: "gpt-5",
        autoTier: "balance",
        reasoningSummary: "concise",
        allowedModels: ["gpt-5", "claude-sonnet-4.5"],
    };
    plan.capabilities = {
        imageGeneration: true,
        toolSearch: "enabled",
        toolSearchDeferThreshold: 40,
        askUserVariant: "elicitation",
    };
    plan.excludedBuiltinAgents = ["explore"];
    plan.session = { ...plan.session, name: "Nightly triage", interactiveUser: true, diagnostics: "debug" };
    plan.events = { ...plan.events, subAgentStreaming: false, logLevel: "debug" };
    plan.output = {
        responseSchema: JSON.stringify({ type: "object", properties: { ok: { type: "boolean" } } }),
    };
    plan.customTools = [
        { ...createCustomTool("tool", "lookup_record"), defer: "never", skipPermission: true },
    ];
    plan.agents = [
        {
            ...createAgent("agent", "reviewer"),
            displayName: "Reviewer",
            hooks: '{"preToolUse":[{"type":"command"}]}',
        },
    ];
    return plan;
}

describe("plan schema v3 options", () => {
    it.each(adapters)("maps new session keys and host data for $adapter.label", ({ adapter, dataPath }) => {
        const plan = v3Plan(adapter.language as "java" | "rust");
        expect(adapter.check(plan)).toEqual([]);
        const project = adapter.generate(plan);
        const data: unknown = JSON.parse(generatedFile(project, dataPath));
        expect(data).toMatchObject({
            hooks: ["subagentStart", "userPromptSubmitted"],
            handlers: ["elicitation", "mcpAuth"],
            skillProvider: true,
            allowedModels: ["gpt-5", "claude-sonnet-4.5"],
            logLevel: "debug",
            responseSchema: { type: "object" },
            session: {
                agentDirectories: ["/future-host/agents"],
                skipCustomInstructions: true,
                capi: { autoTier: "balance" },
                reasoningSummary: "concise",
                managedSettings: { permissions: { deny: ["shell(rm)"] } },
                toolSearch: { enabled: true, deferThreshold: 40 },
                askUserVariant: "elicitation",
                diagnostics: { sources: { mcp: { level: "debug" } } },
                includeSubAgentStreamingEvents: false,
                customAgents: [{ displayName: "Reviewer", hooks: { preToolUse: [{ type: "command" }] } }],
            },
            tools: [{ name: "lookup_record", defer: "never", skipPermission: true }],
        });
        expect(project.requirements.map((requirement) => requirement.id)).toEqual(
            expect.arrayContaining([
                "hook-subagentStart",
                "hook-userPromptSubmitted",
                "handler-elicitation",
                "handler-mcpAuth",
                "skill-provider",
            ]),
        );
        for (const file of project.files) expect(file.content, file.path).not.toMatch(/<\/?opt:/);
    });

    it("binds Java setters, the allowlist RPC, hooks, handlers, skill provider, and response schema", () => {
        const project = javaAdapter.generate(v3Plan("java"));
        const main = generatedFile(project, "src/main/java/harness/Main.java");
        expect(main).toContain("session.getRpc().model.setAllowedModels(");
        expect(main).toContain("new SessionModelSetAllowedModelsParams(null, allowedModels)");
        expect(main.indexOf("setAllowedModels")).toBeLessThan(main.indexOf("sendAndWait"));
        expect(main).toContain("options.setResponseSchema(responseSchema)");
        const configuration = generatedFile(project, "src/main/java/harness/Configuration.java");
        for (const setter of [
            "setCapi(new CapiSessionOptions().setAutoTier(AutoTier.fromValue(",
            "setReasoningSummary",
            "setAgentDirectories",
            "setHookDirectories",
            "setInstructionDirectories",
            "setAdditionalDirectories",
            "setIncludedBuiltinSkills",
            "setSkipCustomInstructions",
            "setEnableOnDemandInstructionDiscovery",
            "setRefreshCustomInstructions",
            "setOrganizationCustomInstructions",
            "setEnableManagedSettings",
            "setEnforceManagedModelDefaults",
            "setManagedSettings",
            "setImageGeneration",
            "setToolSearch",
            "setAskUserVariant",
            "setExcludedBuiltInAgents",
            "setName",
            "setInteractiveUser",
            "setDiagnostics",
            "setIncludeSubAgentStreamingEvents",
            "setDisplayName",
            "value.setHooks(",
            "ToolDefer.fromValue",
            "options.setLogLevel",
        ]) {
            expect(configuration).toContain(setter);
        }
        expect(configuration).toContain("lifecycle.setOnSubagentStart(host::subagentStart)");
        expect(configuration).toContain("lifecycle.setOnUserPromptSubmitted(host::userPromptSubmitted)");
        expect(configuration).not.toContain("setOnSessionEnd");
        expect(configuration).toContain("config.setOnElicitationRequest(host::elicitation)");
        expect(configuration).toContain("config.setOnMcpAuthRequest(host::mcpAuth)");
        expect(configuration).not.toContain("setOnExitPlanMode");
        expect(configuration).toContain("config.setSkillProvider(host.skillProvider())");
        const host = generatedFile(project, "src/main/java/harness/HostExtensions.java");
        expect(host).toContain(
            "CompletableFuture<SubagentStartHookOutput> subagentStart(SubagentStartHookInput _input, HookInvocation _context)",
        );
        expect(host).toContain(
            "CompletableFuture<McpAuthResult> mcpAuth(McpAuthRequest _request, McpAuthInvocation _context)",
        );
        expect(host).toContain('"HOST TODO: implement and register the " + hook + " hook in HostExtensions"');
        expect(host).toContain(
            '"HOST TODO: implement and register the " + handler + " handler in HostExtensions"',
        );
        expect(host).toContain("HOST TODO: implement and register HostExtensions.skillProvider");
        expect(host).toContain("import com.github.copilot.SkillProvider;");
    });

    it("blocks the Java errorOccurred hook, which has no SessionHooks setter", () => {
        const plan = v3Plan("java");
        plan.policy.hooks = ["errorOccurred"];
        expect(javaAdapter.check(plan).map((blocker) => blocker.id)).toEqual(["java-hook-errorOccurred"]);
        plan.target.language = "rust";
        expect(rustAdapter.check(plan)).toEqual([]);
    });

    it("binds Rust config fields, the allowlist, hook overrides, handlers, skill provider, and response schema", () => {
        const project = rustAdapter.generate(v3Plan("rust"));
        const configuration = generatedFile(project, "src/config.rs");
        for (const assignment of [
            "config.with_allowed_models(models.clone())",
            "CapiSessionOptions::new().with_auto_tier(tier)",
            "config.reasoning_summary",
            "config.agent_directories",
            "config.hook_directories",
            "config.instruction_directories",
            "config.additional_directories",
            "config.included_builtin_skills",
            "config.skip_custom_instructions",
            "config.enable_on_demand_instruction_discovery",
            "config.refresh_custom_instructions",
            "config.organization_custom_instructions",
            "config.enable_managed_settings",
            "config.enforce_managed_model_defaults",
            "config.managed_settings",
            "config.image_generation",
            "config.tool_search",
            "config.ask_user_variant",
            "config.excluded_builtin_agents",
            "config.name",
            "config.interactive_user",
            "config.diagnostics",
            "config.include_sub_agent_streaming_events",
            "value.display_name",
            "value.hooks = agent.hooks.clone()",
            ".with_skip_permission(tool.skip_permission)",
            "value.with_defer(",
            "options.log_level",
            "config.with_elicitation_handler(Arc::new(host.clone()))",
            "config.with_mcp_auth_handler(Arc::new(host.clone()))",
            "config.with_skill_provider(Arc::new(host.skill_provider()))",
            "HOST TODO: implement and register the {hook} hook in src/host.rs",
        ]) {
            expect(configuration).toContain(assignment);
        }
        expect(configuration).not.toContain("with_exit_plan_mode_handler");
        const host = generatedFile(project, "src/host.rs");
        expect(host).toContain("async fn on_subagent_start(");
        expect(host).toContain("async fn on_user_prompt_submitted(");
        expect(host).toContain('output.decision = Some("block".into());');
        expect(host).not.toContain("async fn on_session_end(");
        expect(host).toContain("impl github_copilot_sdk::handler::ElicitationHandler for Host");
        expect(host).toContain("impl github_copilot_sdk::handler::McpAuthHandler for Host");
        expect(host).not.toContain("ExitPlanModeHandler");
        expect(host).toContain("impl github_copilot_sdk::SkillProvider for HostSkillProvider");
        expect(generatedFile(project, "src/main.rs")).toContain(
            "message.with_response_schema(schema.clone())",
        );
    });

    it.each(adapters)("adds nothing to a default $adapter.label plan", ({ adapter, dataPath }) => {
        const plan = createPreset("copilot");
        plan.target.language = adapter.language;
        const project = adapter.generate(plan);
        const data = JSON.parse(generatedFile(project, dataPath)) as Record<string, unknown>;
        for (const key of [
            "hooks",
            "handlers",
            "skillProvider",
            "allowedModels",
            "logLevel",
            "responseSchema",
        ])
            expect(data).not.toHaveProperty(key);
        const session = data.session as Record<string, unknown>;
        for (const key of [
            "capi",
            "managedSettings",
            "diagnostics",
            "name",
            "includeSubAgentStreamingEvents",
        ])
            expect(session).not.toHaveProperty(key);
        for (const file of project.files) {
            expect(file.content, file.path).not.toMatch(/<\/?opt:/);
            expect(file.content, file.path).not.toMatch(
                /subagentStart|on_subagent_start|SkillProvider|skillProvider\(\)|ElicitationHandler|setOnElicitationRequest/,
            );
        }
        expect(project.requirements.map((requirement) => requirement.id)).not.toEqual(
            expect.arrayContaining(["skill-provider"]),
        );
    });

    it("enables the Rust runtime feature for every non-bundled transport", () => {
        const plan = createPreset("empty");
        plan.target.language = "rust";
        plan.target.runtime = "external";
        plan.target.serverUrl = "tcp://127.0.0.1:4321";
        const dependency = (cargo: string) =>
            cargo.split("\n").find((line) => line.startsWith("github-copilot-sdk"));
        expect(dependency(generatedFile(rustAdapter.generate(plan), "Cargo.toml"))).toContain(
            'default-features = false, features = ["runtime"]',
        );
        plan.target.runtime = "managed";
        plan.target.cliPath = "/opt/copilot/copilot-runtime";
        expect(dependency(generatedFile(rustAdapter.generate(plan), "Cargo.toml"))).toContain(
            'default-features = false, features = ["runtime"]',
        );
        plan.target.cliPath = "";
        expect(dependency(generatedFile(rustAdapter.generate(plan), "Cargo.toml"))).not.toContain("features");
    });
});
