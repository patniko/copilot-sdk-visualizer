// Copyright (c) Microsoft Corporation. All rights reserved.
import { describe, expect, it } from "vitest";
import {
    BUILTIN_NAMES,
    createAgent,
    createCustomTool,
    createMcpServer,
    HarnessPlanSchema,
    parsePlan,
    schemaError,
} from "./plan";
import { applyScenario, changedAxes, createPreset } from "./presets";
import { analyzePlan, hostContracts, toolSummary } from "./analysis";
import { reference } from "../content/reference";

describe("harness plan and presets", () => {
    it.each(["empty", "minimal", "copilot"] as const)("round-trips the %s composition", (preset) => {
        const plan = createPreset(preset);
        expect(parsePlan(JSON.stringify(plan))).toEqual(plan);
        expect(changedAxes(plan)).toEqual([]);
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
        expect(() => parsePlan(JSON.stringify({ ...createPreset("minimal"), schemaVersion: 2 }))).toThrow();
        const injected = {
            ...createPreset("minimal"),
            model: { ...createPreset("minimal").model, apiKey: "not-allowed" },
        };
        expect(() => parsePlan(JSON.stringify(injected))).toThrow();
        expect(() => parsePlan("界".repeat(400_000))).toThrow(/1 MB/);
    });
});

describe("scenario decisions", () => {
    it("makes workspace-free changes without discarding existing custom tools", () => {
        const plan = createPreset("copilot");
        plan.customTools.push(createCustomTool("lookup"));
        const changed = applyScenario(plan, "workspace-free");
        expect(plan.clientMode).toBe("copilot-cli");
        expect(changed.clientMode).toBe("empty");
        expect(changed.customTools).toEqual(plan.customTools);
        expect(changed.session.storage).toBe("virtual");
        expect(toolSummary(changed).kept).not.toContain("bash");
        expect(HarnessPlanSchema.safeParse(changed).success).toBe(true);
    });

    it("replaces native view in a tenant scenario rather than enabling host disk", () => {
        const plan = applyScenario(createPreset("empty"), "tenant-documents");
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
        expect(reference.controls).toHaveLength(52);
        expect(reference.gaps).toHaveLength(6);
    });
});
