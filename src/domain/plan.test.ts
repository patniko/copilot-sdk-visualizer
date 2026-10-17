// Copyright (c) Microsoft Corporation. All rights reserved.
import { describe, expect, it } from "vitest";
import {
    BUILTIN_NAMES,
    createAgent,
    createCustomTool,
    createMcpServer,
    HarnessPlanSchema,
    parsePlan,
    PLAN_SCHEMA_VERSION,
    planIssues,
    RETIRED_TOOL_NAMES,
    schemaError,
    v3Defaults,
} from "./plan";
import type { HarnessPlan } from "./plan";
import { BUILTIN_SPECS } from "../content/builtin-tools";
import { changedAxes, createPreset } from "./presets";
import { analyzePlan, hostContracts, toolSummary } from "./analysis";
import { reference } from "../content/reference";

describe("harness plan and presets", () => {
    it.each(["empty", "minimal", "copilot"] as const)("round-trips the %s composition", (preset) => {
        const plan = createPreset(preset);
        expect(parsePlan(JSON.stringify(plan))).toEqual(plan);
        expect(changedAxes(plan)).toEqual([]);
    });

    it("accepts the S2S identity without a schema bump and defaults older missing identity safely", () => {
        const plan = createPreset("minimal");
        plan.identity = "s2s-installation";
        expect(parsePlan(JSON.stringify(plan))).toEqual(plan);
        const { identity: _identity, ...older } = createPreset("minimal");
        expect(parsePlan(JSON.stringify(older)).identity).toBe("host-token");
    });

    it("migrates older plans to host permission handling without broadening authority", () => {
        const plan = createPreset("minimal");
        const { permissionMode: _permissionMode, ...olderPolicy } = plan.policy;
        const migrated = parsePlan(JSON.stringify({ ...plan, policy: olderPolicy }));
        expect(migrated.policy.permissionMode).toBe("host");
        expect(hostContracts(migrated)).toContain("Permission policy");
    });

    it("surfaces explicit allow-all without claiming it replaces other policy boundaries", () => {
        const plan = createPreset("minimal");
        plan.policy.permissionMode = "allow-all";
        expect(hostContracts(plan)).not.toContain("Permission policy");
        expect(analyzePlan(plan).find((decision) => decision.id === "allow-all-permissions")).toMatchObject({
            kind: "review",
        });
    });

    it("defines genuinely different configurations over the same available tools", () => {
        const empty = createPreset("empty");
        const minimal = createPreset("minimal");
        const coding = createPreset("copilot");
        expect(toolSummary(empty).knownVisible).toBe(0);
        expect(toolSummary(minimal).kept).toEqual(["ask_user", "task_complete"]);
        expect(minimal.session).toMatchObject({ storage: "virtual", largeOutput: false });
        expect(coding.inventory).toBe("coding-defaults");
        expect(toolSummary(coding).kept).toEqual([...BUILTIN_NAMES]);
        expect(coding.context).toMatchObject({
            discovery: true,
            skills: true,
            fileHooks: true,
            hostGit: true,
        });
    });

    it("does not confuse empty client mode with an inherited inventory", () => {
        const plan = createPreset("empty");
        plan.inventory = "coding-defaults";
        expect(HarnessPlanSchema.safeParse(plan).success).toBe(false);
    });

    it("validates override schema JSON only when that replacement is selected", () => {
        const plan = createPreset("minimal");
        plan.tools.view.action = "override";
        plan.tools.view.parameters = '{"type":"string"}';
        expect(HarnessPlanSchema.safeParse(plan).success).toBe(false);
        plan.tools.view.action = "remove";
        expect(HarnessPlanSchema.safeParse(plan).success).toBe(true);
        expect(schemaError("[")).toMatch(/Invalid JSON/);
        expect(schemaError('{"type":"object"}')).toBeUndefined();
    });

    it("rejects reserved tool additions, duplicate IDs and ambiguous MCP names", () => {
        const plan = createPreset("empty");
        plan.customTools.push(createCustomTool("one", "catalog_search"));
        expect(HarnessPlanSchema.safeParse(plan).success).toBe(false);
        plan.customTools = [createCustomTool("one", "lookup"), createCustomTool("one", "another")];
        expect(HarnessPlanSchema.safeParse(plan).success).toBe(false);
        plan.customTools = [createCustomTool("one", "lookup")];
        const server = createMcpServer("two");
        server.tools[0] = { name: "search", wireName: "lookup" };
        plan.mcpServers = [server];
        expect(HarnessPlanSchema.safeParse(plan).success).toBe(false);
    });

    it("requires a declared selected agent and keeps IDs stable across renames", () => {
        const plan = createPreset("empty");
        const agent = createAgent("stable-id");
        plan.agents = [agent];
        plan.selectedAgent = agent.name;
        expect(HarnessPlanSchema.safeParse(plan).success).toBe(true);
        agent.name = "changed";
        expect(agent.id).toBe("stable-id");
        expect(HarnessPlanSchema.safeParse(plan).success).toBe(false);
    });

    it("rejects credential-bearing URLs, secret properties, and unsupported versions", () => {
        const plan = createPreset("minimal");
        plan.model.endpoint = "https://name:password@example.com";
        expect(HarnessPlanSchema.safeParse(plan).success).toBe(false);
        plan.model.endpoint = "https://example.com?API_KEY=example-only";
        expect(HarnessPlanSchema.safeParse(plan).success).toBe(false);
        expect(() => parsePlan(JSON.stringify({ ...createPreset("minimal"), schemaVersion: 99 }))).toThrow();
        const injected = {
            ...createPreset("minimal"),
            model: { ...createPreset("minimal").model, apiKey: "not-allowed" },
        };
        expect(() => parsePlan(JSON.stringify(injected))).toThrow();
        expect(() => parsePlan("界".repeat(400_000))).toThrow(/1 MB/);
    });

    it.each(["copilot", "openai", "azure", "anthropic"] as const)(
        "allows deferred %s endpoints but still validates provided URLs",
        (provider) => {
            const plan = createPreset("empty");
            plan.model.provider = provider;
            for (const endpoint of ["", " \t "]) {
                plan.model.endpoint = endpoint;
                expect(parsePlan(JSON.stringify(plan))).toEqual(plan);
                expect(hostContracts(plan).includes("Provider endpoint")).toBe(provider !== "copilot");
            }
            for (const endpoint of [
                "not-an-endpoint",
                "ftp://example.com",
                "https://example.com?api_key=example-only",
            ]) {
                plan.model.endpoint = endpoint;
                expect(HarnessPlanSchema.safeParse(plan).success).toBe(false);
            }
            plan.model.endpoint = "https://example.com/v1";
            expect(HarnessPlanSchema.safeParse(plan).success).toBe(true);
            expect(hostContracts(plan)).not.toContain("Provider endpoint");
        },
    );

    it("still requires an endpoint for declared MCP servers", () => {
        const plan = createPreset("empty");
        plan.mcpServers = [{ ...createMcpServer("mcp"), url: "" }];
        expect(HarnessPlanSchema.safeParse(plan).success).toBe(false);
    });
});

describe("plan decisions", () => {
    it("treats an overridden view as a host handler rather than enabling host disk", () => {
        const plan = createPreset("empty");
        plan.tools.view = {
            action: "override",
            description: "Read only documents authorized for the current tenant and principal.",
            parameters: BUILTIN_SPECS.view.parameters,
        };
        expect(toolSummary(plan).overridden).toEqual(["view"]);
        expect(analyzePlan(plan).some((decision) => decision.id === "workspace-tools")).toBe(false);
        expect(hostContracts(plan)).toContain("Tool handler: view");
        expect(analyzePlan(plan).some((decision) => decision.id === "override")).toBe(true);
    });

    it("updates actual guidance when a conflicting decision is resolved", () => {
        const plan = createPreset("minimal");
        plan.tools.bash.action = "keep";
        expect(analyzePlan(plan).map((decision) => decision.id)).toContain("workspace-tools");
        plan.tools.bash.action = "remove";
        expect(analyzePlan(plan).map((decision) => decision.id)).not.toContain("workspace-tools");
        plan.session.largeOutput = true;
        expect(analyzePlan(plan).map((decision) => decision.id)).toContain("output-spill");
    });

    it("surfaces placement-specific S2S host operations without a session callback", () => {
        const plan = createPreset("minimal");
        plan.identity = "s2s-installation";
        expect(hostContracts(plan)).toContain("GitHub App installation-token runtime environment");
        const managed = analyzePlan(plan).find((decision) => decision.id === "s2s-installation-identity");
        expect(managed?.title).toContain("coming soon");
        expect(managed?.detail).toContain("behind a feature flag");
        expect(managed?.detail).toContain("managed child");
        expect(managed?.detail).toContain("one-hour expiry");
        plan.target.runtime = "external";
        expect(hostContracts(plan)).toContain("External runtime installation-token operations");
        expect(
            analyzePlan(plan).find((decision) => decision.id === "s2s-installation-identity")?.detail,
        ).toContain("connecting client must not inject");
    });

    it("links every decision to a materialized independent source", () => {
        const plan = createPreset("copilot");
        plan.tools.view.action = "override";
        plan.context.workspace = "";
        plan.context.pluginDirectories = ["/approved"];
        plan.session.storage = "virtual";
        plan.context.skills = false;
        plan.agents = [{ ...createAgent("review"), model: "host-model" }];
        plan.rootExcludedTools = ["view"];
        plan.mcpServers = [createMcpServer("mcp")];
        plan.model.provider = "openai";
        plan.model.endpoint = "https://example.com";
        plan.model.credential = "bearer-callback";
        for (const decision of analyzePlan(plan)) {
            expect(decision.sources.length).toBeGreaterThan(0);
            for (const source of decision.sources) expect(reference.sources[source], source).toBeDefined();
        }
        expect(reference.controls).toHaveLength(64);
        expect(reference.gaps).toHaveLength(6);
    });

    it("links every v3 decision to a materialized source", () => {
        const plan = createPreset("copilot");
        plan.context.agentDirectories = ["./agents"];
        plan.context.skillProvider = true;
        plan.policy.hooks = ["userPromptSubmitted", "subagentStop"];
        plan.agents = [{ ...createAgent("review"), hooks: '{ "preToolUse": [ { "type": "command" } ] }' }];
        plan.policy.managed = { ...plan.policy.managed, load: true, limitTo: ["Domain(example.com)"] };
        plan.model.allowedModels = ["claude-sonnet-5.5"];
        plan.model.id = "claude-sonnet-5.5";
        plan.capabilities.imageGeneration = true;
        plan.session.diagnostics = "trace";
        plan.session.continuePendingWork = true;
        const ids = analyzePlan(plan).map((decision) => decision.id);
        expect(ids).toEqual(
            expect.arrayContaining([
                "discovery-roots",
                "skill-provider",
                "blocking-hooks",
                "agent-hooks",
                "managed-settings",
                "model-allowlist",
                "image-generation",
                "diagnostics",
                "continue-pending",
            ]),
        );
        for (const decision of analyzePlan(plan))
            for (const source of decision.sources) expect(reference.sources[source], source).toBeDefined();
        expect(hostContracts(plan)).toEqual(
            expect.arrayContaining([
                "Lifecycle hook: userPromptSubmitted",
                "Lifecycle hook: subagentStop",
                "Skill provider (listSkills/readSkill)",
            ]),
        );
    });
});

describe("plan schema v3", () => {
    function v2(plan: HarnessPlan) {
        const {
            excludedBuiltinAgents: _excluded,
            capabilities: _capabilities,
            output: _output,
            ...rest
        } = plan;
        const context = { ...plan.context } as Record<string, unknown>;
        for (const key of Object.keys(v3Defaults().context)) delete context[key];
        const policy = { ...plan.policy } as Record<string, unknown>;
        for (const key of Object.keys(v3Defaults().policy)) delete policy[key];
        const model = { ...plan.model } as Record<string, unknown>;
        for (const key of Object.keys(v3Defaults().model)) delete model[key];
        const session = { ...plan.session } as Record<string, unknown>;
        for (const key of Object.keys(v3Defaults().session)) delete session[key];
        return {
            ...rest,
            schemaVersion: 2,
            context,
            policy,
            model,
            session,
            events: { streaming: plan.events.streaming, observer: plan.events.observer },
            customTools: plan.customTools.map(({ defer: _defer, skipPermission: _skip, ...tool }) => tool),
            agents: plan.agents.map(({ displayName: _name, hooks: _hooks, ...agent }) => agent),
        };
    }

    it.each(["empty", "minimal", "copilot"] as const)(
        "migrates a v2 %s draft to identical v3 defaults",
        (preset) => {
            const plan = createPreset(preset);
            plan.customTools = [createCustomTool("tool")];
            plan.agents = [createAgent("agent")];
            expect(PLAN_SCHEMA_VERSION).toBe(3);
            expect(parsePlan(JSON.stringify(v2(plan)))).toEqual(plan);
        },
    );

    it("renames retired factory tools to dynamic workflows and drops removed PR-agent tools", () => {
        const plan = createPreset("copilot");
        const old = v2(plan) as Record<string, unknown> & { tools: Record<string, unknown> };
        const { run_dynamic_workflow: _run, dynamic_workflows_manage: _manage, ...tools } = old.tools;
        old.tools = {
            ...tools,
            run_factory: {
                ...plan.tools.run_dynamic_workflow,
                action: "override",
                description: "Host runner",
            },
            factories_manage: { ...plan.tools.dynamic_workflows_manage, action: "remove" },
            create_pull_request: { ...plan.tools.view, action: "keep" },
            report_progress: { ...plan.tools.view, action: "keep" },
        };
        old.rootExcludedTools = ["run_factory", "report_progress", "view"];
        const migrated = parsePlan(JSON.stringify(old));
        expect(migrated.tools.run_dynamic_workflow.action).toBe("override");
        expect(migrated.tools.run_dynamic_workflow.description).toBe("Host runner");
        expect(migrated.tools.dynamic_workflows_manage.action).toBe("remove");
        expect(migrated.tools.image_generation.action).toBe("keep");
        expect(Object.keys(migrated.tools)).not.toContain("create_pull_request");
        expect(migrated.rootExcludedTools).toEqual(["run_dynamic_workflow", "view"]);
        expect(Object.keys(RETIRED_TOOL_NAMES).every((name) => !BUILTIN_NAMES.includes(name as never))).toBe(
            true,
        );
    });

    it("validates new cross-field rules", () => {
        const plan = createPreset("minimal");
        const paths = (value: HarnessPlan) => planIssues(value).map((issue) => issue.path);
        plan.capabilities.askUserVariant = "elicitation";
        expect(paths(plan)).toContain("capabilities.askUserVariant");
        plan.policy.handlers = ["elicitation"];
        expect(paths(plan)).not.toContain("capabilities.askUserVariant");
        plan.context.skillProvider = true;
        expect(paths(plan)).toContain("context.skillProvider");
        plan.context.skills = true;
        expect(paths(plan)).not.toContain("context.skillProvider");
        for (const name of [" leading", 'has "quotes"', "tab\there"]) {
            plan.session.name = name;
            expect(paths(plan)).toContain("session.name");
        }
        plan.session.name = "Release review";
        expect(paths(plan)).not.toContain("session.name");
        plan.model.id = "gpt-6-sol";
        plan.model.allowedModels = ["claude-sonnet-5.5"];
        expect(paths(plan)).toContain("model.allowedModels");
        plan.model.allowedModels = ["claude-sonnet-5.5", "gpt-6-sol"];
        expect(paths(plan)).not.toContain("model.allowedModels");
        plan.model.modelProvider = "ollama";
        expect(paths(plan)).toContain("model.modelProvider");
        plan.model.provider = "openai";
        expect(paths(plan)).not.toContain("model.modelProvider");
        plan.output.responseSchema = '{ "type": "string" }';
        expect(paths(plan)).toContain("output.responseSchema");
        plan.agents = [{ ...createAgent("agent"), hooks: '{ "preToolUse": {} }' }];
        expect(paths(plan)).toContain("agents.0.hooks");
        plan.policy.hooks = ["sessionStart", "sessionStart"];
        expect(paths(plan)).toContain("policy.hooks");
    });

    it("tracks v3 option groups as changed axes", () => {
        const plan = createPreset("copilot");
        plan.capabilities.imageGeneration = true;
        plan.output.responseSchema = '{ "type": "object" }';
        plan.excludedBuiltinAgents = ["rubber-duck"];
        expect(changedAxes(plan)).toEqual(["Built-in tools", "Agents", "Events / evaluation"]);
    });
});
