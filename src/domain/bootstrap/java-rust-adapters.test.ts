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
        plan.policy = { preToolHook: true, postToolHook: true };
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
        expect(pom).toContain("<copilot.version>1.0.14-SNAPSHOT</copilot.version>");
        expect(pom).not.toContain("1.0.13");
        expect(pom).toContain("5.19.1");
        expect(pom).toContain("COPILOT_JAVA_RUNTIME_CLASSIFIER");
        const setup = generatedFile(project, "setup-sdk.sh");
        expect(setup).toContain(JAVA_RUST_SDK_REVISION);
        expect(setup).toContain("git clone --filter=blob:none --no-checkout");
        expect(setup).toContain("status --porcelain --untracked-files=normal");
        expect(setup).toContain("validate-native-host.mjs");
        expect(setup).not.toMatch(/git (reset|clean)|rm -rf/);
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
        expect(host).toContain("PermissionRequestResult.reject");
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
        expect(configuration).toContain("SessionConfig::default().deny_all_permissions()");
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
