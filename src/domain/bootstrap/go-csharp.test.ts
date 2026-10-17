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
import { SDK_SOURCE_REVISION } from "./revisions";
import type { LanguageAdapter } from "./types";

const revision = SDK_SOURCE_REVISION;
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
        ...plan.context,
        workspace: "/logical/workspace",
        discovery: true,
        skills: true,
        fileHooks: true,
        hostGit: true,
        skillDirectories: ["/skills/with spaces"],
        pluginDirectories: ["/plugins/selected"],
    };
    plan.policy = { ...plan.policy, permissionMode: "host", preToolHook: true, postToolHook: true };
    plan.session = {
        ...plan.session,
        storage: "virtual",
        baseDirectory: "/logical/state",
        idleTimeoutSeconds: 321,
        infinite: false,
        largeOutput: true,
    };
    plan.events = { ...plan.events, streaming: false, observer: true };
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
        expect(host).toContain(
            adapter.language === "go"
                ? "implement and register PermissionPolicy in host.go"
                : "Implement and register PermissionPolicy in Host.cs.",
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

const responseSchema =
    '{"type":"object","properties":{"total":{"type":"integer","maximum":9007199254740993}},"required":["total"]}';

function v3Plan(adapter: LanguageAdapter): HarnessPlan {
    const plan = selectedPlan(adapter);
    plan.target.runtime = "managed";
    plan.target.serverUrl = "";
    plan.context = {
        ...plan.context,
        agentDirectories: ["/agents"],
        hookDirectories: ["/hooks"],
        instructionDirectories: ["/instructions"],
        additionalDirectories: ["/extra"],
        skillProvider: true,
        includedBuiltinSkills: ["docs"],
        customInstructions: "skip",
        onDemandInstructions: true,
        refreshCustomInstructions: true,
        organizationInstructions: "Follow organization rules.",
    };
    plan.policy = {
        ...plan.policy,
        hooks: ["subagentStart", "preMcpToolCall"],
        handlers: ["elicitation", "mcpAuth"],
        managed: {
            ...plan.policy.managed,
            load: true,
            enforceModelDefaults: true,
            deny: ["Shell(rm *)"],
            limitTo: ["Domain(example.com)"],
            disableBypassPermissionsMode: "disable",
            disableAssistedPermissionsMode: true,
        },
    };
    plan.model = {
        ...plan.model,
        autoTier: "balance",
        reasoningSummary: "concise",
        allowedModels: ["selected-model", "other-model"],
        modelProvider: "azure_openai",
        wireModel: "deployment-a",
        maxPromptTokens: 1000,
        maxOutputTokens: 500,
    };
    plan.capabilities = {
        imageGeneration: true,
        toolSearch: "enabled",
        toolSearchDeferThreshold: 12,
        askUserVariant: "elicitation",
    };
    plan.excludedBuiltinAgents = ["explore"];
    plan.session = {
        ...plan.session,
        name: "Nightly run",
        interactiveUser: true,
        diagnostics: "debug",
        sessionStore: true,
        fileChangeTracking: true,
    };
    plan.events = { ...plan.events, subAgentStreaming: false, logLevel: "debug" };
    plan.output = { responseSchema };
    plan.customTools = plan.customTools.map((tool) => ({ ...tool, defer: "never", skipPermission: true }));
    plan.agents = plan.agents.map((agent) => ({
        ...agent,
        displayName: "Reviewer",
        hooks: '{"preToolUse":[{"type":"command","bash":"./check.sh"}]}',
    }));
    return HarnessPlanSchema.parse(plan);
}

/**
 * Session-config members at SDK b96cd2b5 that each session.json key binds to. Go decodes
 * case-insensitively into untagged SessionConfig fields (go/types.go ~1603-2000); .NET uses
 * JsonSerializerDefaults.Web over SessionConfigBase/SessionConfig (dotnet/src/Types.cs ~3787-4630).
 */
const sdkMembers = {
    go: {
        agentDirectories: "AgentDirectories",
        hookDirectories: "HookDirectories",
        instructionDirectories: "InstructionDirectories",
        additionalDirectories: "AdditionalDirectories",
        includedBuiltinSkills: "IncludedBuiltinSkills",
        skipCustomInstructions: "SkipCustomInstructions",
        enableOnDemandInstructionDiscovery: "EnableOnDemandInstructionDiscovery",
        refreshCustomInstructions: "RefreshCustomInstructions",
        organizationCustomInstructions: "OrganizationCustomInstructions",
        enableManagedSettings: "EnableManagedSettings",
        enforceManagedModelDefaults: "EnforceManagedModelDefaults",
        managedSettings: "ManagedSettings",
        capi: "Capi",
        reasoningSummary: "ReasoningSummary",
        imageGeneration: "ImageGeneration",
        toolSearch: "ToolSearch",
        askUserVariant: "AskUserVariant",
        excludedBuiltinAgents: "ExcludedBuiltInAgents",
        name: "Name",
        interactiveUser: "InteractiveUser",
        diagnostics: "Diagnostics",
        enableSessionStore: "EnableSessionStore",
        enableFileChangeTracking: "EnableFileChangeTracking",
        includeSubAgentStreamingEvents: "IncludeSubAgentStreamingEvents",
    },
    csharp: {
        agentDirectories: "AgentDirectories",
        hookDirectories: "HookDirectories",
        instructionDirectories: "InstructionDirectories",
        additionalDirectories: "AdditionalDirectories",
        includedBuiltinSkills: "IncludedBuiltinSkills",
        skipCustomInstructions: "SkipCustomInstructions",
        enableOnDemandInstructionDiscovery: "EnableOnDemandInstructionDiscovery",
        refreshCustomInstructions: "RefreshCustomInstructions",
        organizationCustomInstructions: "OrganizationCustomInstructions",
        enableManagedSettings: "EnableManagedSettings",
        enforceManagedModelDefaults: "EnforceManagedModelDefaults",
        managedSettings: "ManagedSettings",
        capi: "Capi",
        reasoningSummary: "ReasoningSummary",
        imageGeneration: "ImageGeneration",
        toolSearch: "ToolSearch",
        askUserVariant: "AskUserVariant",
        excludedBuiltinAgents: "ExcludedBuiltInAgents",
        name: "Name",
        interactiveUser: "InteractiveUser",
        diagnostics: "Diagnostics",
        enableSessionStore: "EnableSessionStore",
        enableFileChangeTracking: "EnableFileChangeTracking",
        includeSubAgentStreamingEvents: "IncludeSubAgentStreamingEvents",
    },
} as const;

const legacyHostKeys = [
    "runtime",
    "serverAddress",
    "cliPath",
    "clientMode",
    "identity",
    "credential",
    "credentialEnv",
    "permissionMode",
    "storage",
    "baseDirectory",
    "idleTimeoutSeconds",
    "userInput",
    "observer",
    "preToolHook",
    "postToolHook",
];

describe.each(adapters)("$label plan schema v3 options", (adapter) => {
    const go = adapter.language === "go";
    const mainFile = go ? "main.go" : "Program.cs";
    const hostFile = go ? "host.go" : "Host.cs";

    it("maps every new session key to a pinned SessionConfig member with a compatible shape", () => {
        const plan = v3Plan(adapter);
        const data = JSON.parse(file(adapter, plan, "config/session.json")) as Record<string, unknown>;
        expect(data).toMatchObject({
            agentDirectories: ["/agents"],
            hookDirectories: ["/hooks"],
            instructionDirectories: ["/instructions"],
            additionalDirectories: ["/extra"],
            includedBuiltinSkills: ["docs"],
            skipCustomInstructions: true,
            enableOnDemandInstructionDiscovery: true,
            refreshCustomInstructions: true,
            organizationCustomInstructions: "Follow organization rules.",
            enableManagedSettings: true,
            enforceManagedModelDefaults: true,
            managedSettings: {
                permissions: {
                    disableBypassPermissionsMode: "disable",
                    disableAssistedPermissionsMode: true,
                    deny: ["Shell(rm *)"],
                    limitTo: ["Domain(example.com)"],
                },
            },
            capi: { autoTier: "balance" },
            reasoningSummary: "concise",
            imageGeneration: { enabled: true },
            toolSearch: { enabled: true, deferThreshold: 12 },
            askUserVariant: "elicitation",
            excludedBuiltinAgents: ["explore"],
            name: "Nightly run",
            interactiveUser: true,
            diagnostics: { sources: { mcp: { level: "debug" } } },
            enableSessionStore: true,
            enableFileChangeTracking: true,
            includeSubAgentStreamingEvents: false,
            provider: {
                modelProvider: "azure_openai",
                wireModel: "deployment-a",
                maxPromptTokens: 1000,
                maxOutputTokens: 500,
            },
            customAgents: [
                {
                    name: "reviewer",
                    displayName: "Reviewer",
                    hooks: { preToolUse: [{ type: "command", bash: "./check.sh" }] },
                },
            ],
        });
        expect(data).not.toHaveProperty("autoTier");
        expect(data).not.toHaveProperty("allowedModels");
        const members: Record<string, string> = sdkMembers[go ? "go" : "csharp"];
        expect(Object.keys(sessionKeysBeyond(data)).sort()).toEqual(Object.keys(members).sort());
        for (const key of Object.keys(sessionKeysBeyond(data)))
            expect(members[key]?.toLowerCase(), key).toBe(key.toLowerCase());
    });

    it("applies allowedModels through session.model.setAllowedModels right after creation", () => {
        const plan = v3Plan(adapter);
        expect(JSON.parse(file(adapter, plan, "config/host.json"))).toMatchObject({
            allowedModels: ["selected-model", "other-model"],
            logLevel: "debug",
        });
        const main = file(adapter, plan, mainFile);
        if (go) {
            expect(main).toContain("AllowedModels []string");
            expect(main).toMatch(
                /session, err := client\.CreateSession\(ctx, config\)[\s\S]*?session\.Disconnect\(\)[^\n]*\n\tif len\(settings\.AllowedModels\) > 0 \{\n\t\tif _, err := session\.RPC\.Model\.SetAllowedModels\(ctx, &rpc\.ModelSetAllowedModelsRequest\{/,
            );
            expect(main).toContain('return fmt.Errorf("apply allowed models: %w", err)');
        } else {
            expect(main).toContain("public IList<string>? AllowedModels { get; init; }");
            expect(main).toContain(
                "await using var session = await client.CreateSessionAsync(config, cancellation.Token);\n                if (settings.AllowedModels is { Count: > 0 } allowedModels)\n                    await session.Rpc.Model.SetAllowedModelsAsync(allowedModels, cancellation.Token);",
            );
        }
    });

    it("binds selected lifecycle hooks, request handlers, and the skill provider with preflight checks", () => {
        const plan = v3Plan(adapter);
        const host = file(adapter, plan, hostFile);
        if (go) {
            for (const fragment of [
                "var SubagentStartHook copilot.SubagentStartHandler",
                "var PreMCPToolCallHook copilot.PreMCPToolCallHandler",
                "var ElicitationRequestHandler copilot.ElicitationHandler",
                "var MCPAuthRequestHandler copilot.MCPAuthHandler",
                "var SkillProvider copilot.SkillProvider",
                'add(errors.New("implement and register SubagentStartHook in host.go"))',
                'add(errors.New("implement and register MCPAuthRequestHandler in host.go"))',
                'add(errors.New("implement and register SkillProvider in host.go"))',
                "config.Hooks.OnSubagentStart = SubagentStartHook",
                "config.Hooks.OnPreMCPToolCall = PreMCPToolCallHook",
                "config.OnElicitationRequest = ElicitationRequestHandler",
                "config.OnMCPAuthRequest = MCPAuthRequestHandler",
                "config.SkillProvider = SkillProvider",
            ])
                expect(host).toContain(fragment);
            expect(host).not.toContain("SessionStartHook");
        } else {
            for (const fragment of [
                "public static Func<SubagentStartHookInput, HookInvocation, Task<SubagentStartHookOutput?>>? SubagentStartHook { get; set; }",
                "public static Func<PreMcpToolCallHookInput, HookInvocation, Task<PreMcpToolCallHookOutput?>>? PreMcpToolCallHook { get; set; }",
                "public static Func<ElicitationContext, Task<ElicitationResult>>? ElicitationRequestHandler { get; set; }",
                "public static Func<McpAuthContext, Task<McpAuthResult?>>? McpAuthRequestHandler { get; set; }",
                "public static ISkillProvider? SkillProvider { get; set; }",
                'problems.Add("- Implement and register SubagentStartHook in Host.cs.");',
                'problems.Add("- Implement and register McpAuthRequestHandler in Host.cs.");',
                'problems.Add("- Implement and register SkillProvider in Host.cs.");',
                "config.Hooks ??= new SessionHooks();",
                "config.Hooks.OnSubagentStart = SubagentStartHook",
                "config.Hooks.OnPreMcpToolCall = PreMcpToolCallHook",
                "config.OnElicitationRequest = ElicitationRequestHandler",
                "config.OnMcpAuthRequest = McpAuthRequestHandler",
                "config.SkillProvider = SkillProvider",
            ])
                expect(host).toContain(fragment);
        }
        const ids = adapter.generate(plan).requirements.map((item) => item.id);
        expect(ids).toEqual(
            expect.arrayContaining([
                "hook-subagentStart",
                "hook-preMcpToolCall",
                "handler-elicitation",
                "handler-mcpAuth",
                "skill-provider",
            ]),
        );
        expect(new Set(ids).size).toBe(ids.length);
    });

    it("passes the response schema verbatim with the run prompt and sets the client log level", () => {
        const plan = v3Plan(adapter);
        expect(file(adapter, plan, "config/response-schema.json")).toBe(responseSchema + "\n");
        const main = file(adapter, plan, mainFile);
        if (go) {
            expect(main).toContain("config/tools.json config/response-schema.json");
            expect(main).toContain("Prompt: prompt, ResponseSchema: responseSchema,");
            expect(main).toContain("options.LogLevel = settings.LogLevel");
        } else {
            expect(file(adapter, plan, "HarnessAgent.csproj")).toContain(
                'LogicalName="Harness.response-schema.json"',
            );
            expect(main).toContain('ReadConfiguration<JsonElement>("response-schema.json")');
            expect(main).toContain("new MessageOptions { Prompt = prompt, ResponseSchema = responseSchema }");
            expect(main).toContain("options.LogLevel = new CopilotLogLevel(settings.LogLevel);");
        }
        plan.target.runtime = "external";
        plan.target.serverUrl = "tcp://127.0.0.1:45123";
        const external = adapter.generate(plan);
        const externalMain = external.files.find((entry) => entry.path === mainFile)?.content ?? "";
        expect(externalMain).not.toContain("LogLevel = ");
        expect(JSON.parse(file(adapter, plan, "config/host.json"))).not.toHaveProperty("logLevel");
        expect(external.notes.some((note) => note.includes("log level (debug) is not applied"))).toBe(true);
    });

    it("forwards custom tool defer and skipPermission", () => {
        const plan = v3Plan(adapter);
        const tools = JSON.parse(file(adapter, plan, "config/tools.json")) as Record<string, unknown>[];
        expect(tools.find((tool) => tool.name === "lookup_record")).toMatchObject({
            defer: "never",
            skipPermission: true,
        });
        expect(tools.find((tool) => tool.name === "bash")).not.toHaveProperty("defer");
        const host = file(adapter, plan, hostFile);
        expect(host).not.toContain("must not skip the host permission policy");
        if (!go) {
            expect(host).toContain("SkipPermission = definition.SkipPermission");
            expect(host).toContain('"never" => CopilotToolDefer.Never');
            expect(file(adapter, plan, mainFile)).toContain("public string? Defer { get; init; }");
        }
    });

    it("leaves default-plan output free of v3 bindings", () => {
        for (const plan of [createPreset("empty"), selectedPlan(adapter)]) {
            plan.target.language = adapter.language;
            const files = adapter.generate(plan).files;
            expect(Object.keys(JSON.parse(file(adapter, plan, "config/host.json")))).toEqual(legacyHostKeys);
            expect(files.some((entry) => entry.path === "config/response-schema.json")).toBe(false);
            const source = files.map((entry) => entry.content).join("\n");
            for (const marker of [
                "SetAllowedModels",
                "ResponseSchema",
                "SkillProvider",
                "LogLevel",
                "SubagentStart",
                "OnElicitationRequest",
                '"defer"',
            ])
                expect(source, marker).not.toContain(marker);
            expect(source).toContain(
                go ? "must not skip the host permission policy" : "SkipPermission = false",
            );
        }
    });
});

/** session.json keys introduced by plan schema v3 (everything else predates it). */
function sessionKeysBeyond(data: Record<string, unknown>): Record<string, unknown> {
    const legacy = new Set([
        "model",
        "reasoningEffort",
        "contextTier",
        "systemMessage",
        "availableTools",
        "excludedTools",
        "workingDirectory",
        "enableConfigDiscovery",
        "enableSkills",
        "enableFileHooks",
        "enableHostGitOperations",
        "skillDirectories",
        "pluginDirectories",
        "mcpServers",
        "customAgents",
        "agent",
        "defaultAgent",
        "infiniteSessions",
        "largeOutput",
        "streaming",
        "provider",
    ]);
    return Object.fromEntries(Object.entries(data).filter(([key]) => !legacy.has(key)));
}
