// Copyright (c) Microsoft Corporation. All rights reserved.
/// <reference types="node" />
import { execFileSync } from "node:child_process";
import { existsSync, mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { createAgent, createCustomTool, createMcpServer, HarnessPlanSchema } from "../plan";
import type { HarnessPlan } from "../plan";
import { createPreset } from "../presets";
import { reference } from "../../content/reference";
import { csharpAdapter } from "./csharp";
import { goAdapter } from "./go";
import type { LanguageAdapter } from "./types";

const revision = "f45c46fd1812f8bed5b4cbc250f47177c83068f0";
const adapters = [goAdapter, csharpAdapter];
const temporaryDirectories: string[] = [];

afterEach(() => {
    for (const directory of temporaryDirectories.splice(0))
        rmSync(directory, { recursive: true, force: true });
});

function selectedPlan(adapter: LanguageAdapter): HarnessPlan {
    const plan = createPreset("empty");
    plan.target.language = adapter.language;
    plan.target.runtime = "external";
    plan.target.serverUrl = "tcp://[::1]:45123";
    plan.prompt = {
        mode: "customize",
        content: "Keep `literal` text and ${interpolation} outside executable code.",
        sections: [
            { name: "tone", action: "replace", content: "Precise\nand concise." },
            { name: "tool_instructions", action: "preserve", content: "" },
        ],
    };
    plan.model = {
        ...plan.model,
        id: "selected-model",
        provider: "azure",
        endpoint: "https://models.example.com",
        credential: "bearer-callback",
        credentialEnv: "TENANT_MODEL_KEY",
        reasoningEffort: "high",
        contextTier: "long_context",
    };
    const schema = {
        type: "object",
        $defs: { query: { type: "string", pattern: "^a.+$" } },
        properties: {
            query: { $ref: "#/$defs/query" },
            options: {
                type: "array",
                items: { anyOf: [{ type: "integer" }, { type: "boolean" }] },
            },
        },
        required: ["query"],
        additionalProperties: false,
    };
    plan.tools.bash = {
        action: "override",
        description: "Host-controlled execution",
        parameters: JSON.stringify(schema),
    };
    plan.tools.ask_user.action = "keep";
    plan.customTools = [
        { ...createCustomTool("custom"), parameters: JSON.stringify(schema), terminal: true },
    ];
    plan.mcpServers = [createMcpServer("mcp")];
    plan.agents = [
        { ...createAgent("agent"), model: "agent-model", tools: ["lookup_record", "documents-search"] },
    ];
    plan.selectedAgent = "reviewer";
    plan.rootExcludedTools = ["bash"];
    plan.context = {
        workspace: "/logical/workspace",
        discovery: true,
        skills: true,
        fileHooks: true,
        hostGit: true,
        skillDirectories: ["/skills/with spaces"],
        pluginDirectories: ["/plugins/selected"],
    };
    plan.policy = { preToolHook: true, postToolHook: true };
    plan.session = {
        storage: "virtual",
        baseDirectory: "/logical/state",
        idleTimeoutSeconds: 321,
        infinite: false,
        largeOutput: true,
    };
    plan.events = { streaming: false, observer: true };
    return HarnessPlanSchema.parse(plan);
}

function file(adapter: LanguageAdapter, plan: HarnessPlan, path: string): string {
    const found = adapter.generate(plan).files.find((entry) => entry.path === path);
    if (!found) throw new Error(`Missing generated ${path}`);
    return found.content;
}

describe.each(adapters)("$label bootstrap", (adapter) => {
    it("preserves selected session controls, schemas, and host bindings without mutating the plan", () => {
        const plan = selectedPlan(adapter);
        const before = structuredClone(plan);
        expect(adapter.check(plan)).toEqual([]);
        const project = adapter.generate(plan);
        expect(plan).toEqual(before);
        expect(JSON.parse(file(adapter, plan, "config/session.json"))).toMatchObject({
            model: "selected-model",
            reasoningEffort: "high",
            contextTier: "long_context",
            systemMessage: {
                mode: "customize",
                content: plan.prompt.content,
                sections: {
                    tone: { action: "replace", content: "Precise\nand concise." },
                    tool_instructions: { action: "preserve" },
                },
            },
            workingDirectory: "/logical/workspace",
            enableConfigDiscovery: true,
            enableSkills: true,
            enableFileHooks: true,
            enableHostGitOperations: true,
            skillDirectories: ["/skills/with spaces"],
            pluginDirectories: ["/plugins/selected"],
            defaultAgent: { excludedTools: ["bash"] },
            agent: "reviewer",
            customAgents: [
                { name: "reviewer", model: "agent-model", tools: ["lookup_record", "documents-search"] },
            ],
            mcpServers: {
                documents: { type: "http", url: "https://mcp.example.com", tools: ["search"] },
            },
            infiniteSessions: { enabled: false },
            largeOutput: { enabled: true },
            streaming: false,
            provider: { type: "azure", baseUrl: "https://models.example.com", wireApi: "responses" },
        });
        const tools = JSON.parse(file(adapter, plan, "config/tools.json"));
        expect(tools).toEqual([
            {
                name: "bash",
                description: plan.tools.bash.description,
                parameters: JSON.parse(plan.tools.bash.parameters),
                overridesBuiltInTool: true,
                isTerminal: false,
            },
            {
                name: "lookup_record",
                description: plan.customTools[0]?.description,
                parameters: JSON.parse(plan.tools.bash.parameters),
                overridesBuiltInTool: false,
                isTerminal: true,
            },
        ]);
        expect(JSON.parse(file(adapter, plan, "config/host.json"))).toMatchObject({
            runtime: "external",
            serverAddress: "[::1]:45123",
            clientMode: "empty",
            credential: "bearer-callback",
            credentialEnv: "TENANT_MODEL_KEY",
            storage: "virtual",
            baseDirectory: "/logical/state",
            idleTimeoutSeconds: 321,
            userInput: true,
            observer: true,
            preToolHook: true,
            postToolHook: true,
        });
        expect(project.requirements.map((item) => item.id)).toEqual(
            expect.arrayContaining([
                "tool-bash",
                "tool-lookup_record",
                "pre-hook",
                "post-hook",
                "session-storage",
            ]),
        );
        expect(
            project.files.some((entry) =>
                ["README.md", ".env.example", "harness-plan.json"].includes(entry.path),
            ),
        ).toBe(false);
        for (const source of project.sources) expect(reference.sources[source], source).toBeDefined();
    });

    it.each(["managed", "external", "inprocess"] as const)(
        "generates %s deployment and offline check commands",
        (runtime) => {
            const plan = selectedPlan(adapter);
            plan.target.runtime = runtime;
            const project = adapter.generate(plan);
            expect(project.commands.check).toContain("--check");
            expect(project.commands.run).toContain("Describe the task");
            expect(project.sources).toContain(
                runtime === "managed"
                    ? "sdk-managed-runtime"
                    : runtime === "external"
                      ? "sdk-existing-runtime"
                      : "sdk-inprocess-guide",
            );
            if (runtime === "external") {
                expect(project.commands.startRuntime).toContain("--port 45123");
                expect(project.commands.startRuntime).toContain("--session-idle-timeout 321");
                expect(
                    project.requirements.some((item) => item.title.includes("COPILOT_CONNECTION_TOKEN")),
                ).toBe(true);
            } else expect(project.commands.startRuntime).toBeUndefined();
            if (adapter.language === "go" && runtime === "inprocess")
                expect(project.commands.check).toContain("-tags copilot_inprocess");
        },
    );

    it("requires the real GitHub token expiration without placing credentials in data", () => {
        const plan = createPreset("empty");
        plan.target.language = adapter.language;
        const project = adapter.generate(plan);
        expect(project.requirements.some((item) => item.title.includes("GITHUB_TOKEN_EXPIRES_AT"))).toBe(
            true,
        );
        for (const entry of project.files.filter((item) => item.language === "json")) {
            expect(entry.content).not.toMatch(/"(?:githubToken|apiKey|bearerToken)"\s*:/);
        }
        const host = file(adapter, plan, adapter.language === "go" ? "host.go" : "Host.cs");
        expect(host).toContain("GITHUB_TOKEN_EXPIRES_AT");
        expect(host).toMatch(/expiresAt <= now/);
        expect(host).toMatch(/ExpiresIn\s*[:=]\s*expiresAt - now/);
        expect(host).not.toContain("ApproveAll");
        expect(host).toContain(
            adapter.language === "go" ? "PermissionDecisionReject" : "PermissionDecision.Reject",
        );
    });

    it("preserves schema numeric literals beyond JavaScript's safe integer range", () => {
        const plan = selectedPlan(adapter);
        plan.tools.bash.parameters =
            '{"type":"object","properties":{"id":{"const":9007199254740993},"scale":{"multipleOf":1.0000000000000001}}}';
        const data = file(adapter, plan, "config/tools.json");
        expect(data).toContain('"const":9007199254740993');
        expect(data).toContain('"multipleOf":1.0000000000000001');
        expect(() => JSON.parse(data)).not.toThrow();
    });

    it("rejects unsupported MCP aliases instead of keeping mismatched tool filters", () => {
        const plan = selectedPlan(adapter);
        const tool = plan.mcpServers[0]?.tools[0];
        if (!tool) throw new Error("Missing test MCP tool");
        tool.wireName = "unsupported-alias";
        expect(adapter.check(plan)).toEqual([
            expect.objectContaining({ fields: ["mcpServers.0.tools.0.wireName"] }),
        ]);
        expect(() => adapter.generate(plan)).toThrow("documents-search");
    });

    it.each(["external", "inprocess"] as const)("does not discard cliPath for %s", (runtime) => {
        const plan = selectedPlan(adapter);
        plan.target.runtime = runtime;
        plan.target.cliPath = "/selected/copilot-runtime";
        expect(adapter.check(plan)).toEqual([
            expect.objectContaining({ fields: ["target.cliPath", "target.runtime"] }),
        ]);
    });
});

describe("source dependency policy and setup safety", () => {
    it("pins Go installation to the source SHA", () => {
        const plan = selectedPlan(goAdapter);
        expect(goAdapter.generate(plan).commands.install).toEqual([
            `go get github.com/github/copilot-sdk/go@${revision}`,
        ]);
        expect(file(goAdapter, plan, "go.mod")).toContain("go 1.24.0");
    });

    it("calls the Go event-type method and does not log the event payload", () => {
        const host = file(goAdapter, selectedPlan(goAdapter), "host.go");
        expect(host).toContain('fmt.Fprintf(os.Stderr, "event=%s\\n", event.Type())');
        expect(host).not.toMatch(/Fprintf\([^)]*event\.Data/);
    });

    it("uses a .NET 10 source ProjectReference and opts into the exact experimental diagnostic", () => {
        const plan = selectedPlan(csharpAdapter);
        const project = file(csharpAdapter, plan, "HarnessAgent.csproj");
        expect(project).toContain("<TargetFramework>net10.0</TargetFramework>");
        expect(project).toContain("$(NoWarn);GHCP001");
        expect(project).toContain(
            'ProjectReference Include=".sdk-source/copilot-sdk/dotnet/src/GitHub.Copilot.SDK.csproj"',
        );
        expect(project).toContain('AdditionalProperties="CopilotSkipCliDownload=true"');
        expect(project).not.toContain("<PackageReference");
        expect(project).not.toContain("0.0.0-dev");
        const host = file(csharpAdapter, plan, "Host.cs");
        expect(host).toContain("public override JsonElement JsonSchema => schema;");
        expect(host).toContain("metadata.AdditionalProperties");
        expect(host).toContain("OverridesBuiltInTool = definition.OverridesBuiltInTool");
        expect(host).toContain("IsTerminal = definition.IsTerminal");
    });

    it("reports .NET integer overflow rather than truncating idle settings", () => {
        const plan = selectedPlan(csharpAdapter);
        plan.target.runtime = "managed";
        plan.session.idleTimeoutSeconds = 2_147_483_648;
        expect(csharpAdapter.check(plan)).toEqual([
            expect.objectContaining({ fields: ["session.idleTimeoutSeconds"] }),
        ]);
        expect(goAdapter.check({ ...plan, target: { ...plan.target, language: "go" } })).toEqual([]);
        plan.target.runtime = "external";
        expect(csharpAdapter.check(plan)).toEqual([]);
        expect(csharpAdapter.generate(plan).commands.startRuntime).toContain(
            "--session-idle-timeout 2147483648",
        );
    });

    it("previews setup without provisioning and refuses to overwrite existing files", () => {
        const directory = mkdtempSync(join(tmpdir(), "go-csharp-setup-"));
        temporaryDirectories.push(directory);
        const script = join(directory, "setup-sdk.sh");
        writeFileSync(script, file(csharpAdapter, selectedPlan(csharpAdapter), "setup-sdk.sh"));
        expect(execFileSync("bash", ["-n", script], { encoding: "utf8" })).toBe("");
        expect(execFileSync("bash", [script], { encoding: "utf8" })).toContain("Would provision SDK");
        expect(existsSync(join(directory, ".sdk-source/copilot-sdk"))).toBe(false);
        const existing = join(directory, ".sdk-source/copilot-sdk");
        mkdirSync(existing, { recursive: true });
        const sentinel = join(existing, "keep.txt");
        writeFileSync(sentinel, "existing user content");
        expect(() => execFileSync("bash", [script, "--run"], { encoding: "utf8", stdio: "pipe" })).toThrow(
            "leaving it untouched",
        );
        expect(readFileSync(sentinel, "utf8")).toBe("existing user content");
        expect(existsSync(join(existing, ".git"))).toBe(false);
    });
});
