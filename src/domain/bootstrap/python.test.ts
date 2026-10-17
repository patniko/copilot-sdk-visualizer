// Copyright (c) Microsoft Corporation. All rights reserved.
import { describe, expect, it } from "vitest";
import { createPreset } from "../presets";
import { createAgent, createCustomTool } from "../plan";
import type { HarnessPlan } from "../plan";
import { buildBootstrapProject } from "./index";
import { COPILOT_CLI_VERSION } from "./revisions";

function pythonPlan(preset: Parameters<typeof createPreset>[0] = "copilot"): HarnessPlan {
    const plan = createPreset(preset);
    plan.target.language = "python";
    return plan;
}

function generate(plan: HarnessPlan) {
    const result = buildBootstrapProject(plan);
    if (!result.ok) throw new Error(JSON.stringify(result.blockers));
    const files = new Map(result.project.files.map((file) => [file.path, file.content]));
    const data = JSON.parse(files.get("python-bootstrap.json") ?? "{}") as {
        runtimeVersion: string;
        session: Record<string, unknown>;
        tools: Record<string, unknown>[];
    };
    return { project: result.project, files, data };
}

const NEW_SESSION_KEYS = [
    "agent_directories",
    "hook_directories",
    "instruction_directories",
    "additional_directories",
    "included_builtin_skills",
    "skip_custom_instructions",
    "enable_on_demand_instruction_discovery",
    "refresh_custom_instructions",
    "organization_custom_instructions",
    "enable_managed_settings",
    "enforce_managed_model_defaults",
    "managed_settings",
    "capi",
    "reasoning_summary",
    "image_generation",
    "tool_search",
    "ask_user_variant",
    "excluded_builtin_agents",
    "name",
    "interactive_user",
    "diagnostics",
    "enable_session_store",
    "enable_file_change_tracking",
    "include_sub_agent_streaming_events",
];

describe("Python bootstrap for plan schema v3", () => {
    it("pins the runtime download to the current CLI version", () => {
        const { data, files, project } = generate(pythonPlan());
        expect(data.runtimeVersion).toBe(COPILOT_CLI_VERSION);
        expect(files.get("agent.py")).toContain(`RUNTIME_VERSION = "${COPILOT_CLI_VERSION}"`);
        expect(files.get("provision_runtime.py")).toContain(
            '"download-runtime", "--version", RUNTIME_VERSION',
        );
        expect(project.notes.join("\n")).toContain(`download-runtime --version ${COPILOT_CLI_VERSION}`);
        expect(files.get("agent.py")).toContain('plan["schemaVersion"] != 3');
    });

    it("emits no v3 session keys or bindings for a default plan", () => {
        const { data, files, project } = generate(pythonPlan());
        for (const key of NEW_SESSION_KEYS) expect(data.session).not.toHaveProperty(key);
        for (const tool of data.tools) {
            expect(tool).not.toHaveProperty("defer");
            expect(tool).not.toHaveProperty("skip_permission");
        }
        const notes = project.notes.join("\n");
        expect(notes).not.toContain("LIFECYCLE_HOOKS");
        expect(notes).not.toContain("set_allowed_models");
        expect(notes).not.toContain("response_schema");
        expect(notes).not.toContain("log_level");
        // Bindings are data-driven from the embedded plan; the default plan selects none.
        expect(files.get("agent.py")).toContain('if plan["model"]["allowedModels"]:');
    });

    it("maps every new session option to the Python create_session keyword and shape", () => {
        const plan = pythonPlan();
        plan.model.provider = "openai";
        plan.model.endpoint = "https://inference.example.test/v1";
        plan.model.modelProvider = "ollama";
        plan.model.wireModel = "wire-model";
        plan.model.maxPromptTokens = 1000;
        plan.model.maxOutputTokens = 200;
        plan.model.autoTier = "intelligence";
        plan.model.reasoningSummary = "concise";
        plan.context.agentDirectories = ["agents"];
        plan.context.hookDirectories = ["hooks"];
        plan.context.instructionDirectories = ["instructions"];
        plan.context.additionalDirectories = ["extra"];
        plan.context.includedBuiltinSkills = ["pdf"];
        plan.context.customInstructions = "skip";
        plan.context.onDemandInstructions = true;
        plan.context.refreshCustomInstructions = true;
        plan.context.organizationInstructions = "Follow org policy.";
        plan.policy.managed = {
            ...plan.policy.managed,
            load: true,
            enforceModelDefaults: true,
            deny: ["Shell(git push *)"],
            limitTo: ["Domain(example.com)"],
            disableBypassPermissionsMode: "allow-auto-only",
            disableAssistedPermissionsMode: true,
        };
        plan.capabilities = {
            imageGeneration: true,
            toolSearch: "enabled",
            toolSearchDeferThreshold: 12,
            askUserVariant: "legacy",
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
        plan.events = { ...plan.events, subAgentStreaming: false };
        const { data } = generate(plan);
        const session = data.session;
        expect(session).toMatchObject({
            agent_directories: ["agents"],
            hook_directories: ["hooks"],
            instruction_directories: ["instructions"],
            additional_directories: ["extra"],
            included_builtin_skills: ["pdf"],
            skip_custom_instructions: true,
            enable_on_demand_instruction_discovery: true,
            refresh_custom_instructions: true,
            organization_custom_instructions: "Follow org policy.",
            enable_managed_settings: true,
            enforce_managed_model_defaults: true,
            managed_settings: {
                permissions: {
                    disable_bypass_permissions_mode: "allow-auto-only",
                    disable_assisted_permissions_mode: true,
                    deny: ["Shell(git push *)"],
                    limit_to: ["Domain(example.com)"],
                },
            },
            capi: { auto_tier: "intelligence" },
            reasoning_summary: "concise",
            image_generation: { enabled: true },
            tool_search: { enabled: true, defer_threshold: 12 },
            ask_user_variant: "legacy",
            excluded_builtin_agents: ["explore"],
            name: "Nightly run",
            interactive_user: true,
            diagnostics: { sources: { mcp: { level: "debug" } } },
            enable_session_store: true,
            enable_file_change_tracking: true,
            include_sub_agent_streaming_events: false,
            provider: {
                type: "openai",
                model_provider: "ollama",
                wire_model: "wire-model",
                max_prompt_tokens: 1000,
                max_output_tokens: 200,
            },
        });
        expect(session).not.toHaveProperty("autoTier");
        expect(session).not.toHaveProperty("auto_tier");
    });

    it("maps custom agent and custom tool v3 fields", () => {
        const plan = pythonPlan();
        const agent = createAgent("agent-1");
        plan.agents = [agent];
        agent.displayName = "Reviewer";
        agent.hooks = JSON.stringify({ preToolUse: [{ type: "command", bash: "true" }] });
        const tool = createCustomTool("tool-1");
        plan.customTools = [tool];
        tool.defer = "never";
        tool.skipPermission = true;
        const { data } = generate(plan);
        const agents = data.session.custom_agents as Record<string, unknown>[];
        expect(agents[0]).toMatchObject({
            display_name: "Reviewer",
            hooks: { preToolUse: [{ type: "command", bash: "true" }] },
        });
        expect(data.tools.find((item) => item.name === tool.name)).toMatchObject({
            defer: "never",
            skip_permission: true,
        });
    });

    it("applies allowedModels through session.model.setAllowedModels right after create_session", () => {
        const plan = pythonPlan();
        plan.model.id = "gpt-5";
        plan.model.allowedModels = ["gpt-5", "claude-sonnet-4.5"];
        const { files, project } = generate(plan);
        const agent = files.get("agent.py") ?? "";
        const created = agent.indexOf("session = await client.create_session(");
        const restricted = agent.indexOf("await session.rpc.model.set_allowed_models(");
        expect(created).toBeGreaterThan(0);
        expect(restricted).toBeGreaterThan(created);
        expect(agent).toContain("ModelSetAllowedModelsRequest(allowed_models=");
        expect(restricted).toBeLessThan(agent.indexOf("session.send_and_wait("));
        expect(project.notes.join("\n")).toContain("set_allowed_models");
    });

    it("binds selected lifecycle hooks and handlers with preflight issues", () => {
        const plan = pythonPlan();
        plan.policy = {
            ...plan.policy,
            hooks: ["subagentStart", "userPromptSubmitted"],
            handlers: ["elicitation"],
        };
        const { files, project } = generate(plan);
        const host = files.get("host.py") ?? "";
        const agent = files.get("agent.py") ?? "";
        expect(host).toContain('"subagentStart":"on_subagent_start"');
        expect(host).toContain('"elicitation":"on_elicitation_request"');
        expect(host).toContain("LIFECYCLE_HOOKS = {}");
        expect(host).toContain("HOST_HANDLERS = {}");
        expect(host).toContain(
            'blockers.append(f"Implement and register LIFECYCLE_HOOKS[{name!r}] in host.py.")',
        );
        expect(host).toContain(
            'blockers.append(f"Implement and register HOST_HANDLERS[{name!r}] in host.py.")',
        );
        expect(agent).toContain("hooks[name] = host.make_lifecycle_hook(name)");
        expect(agent).toContain("options[name] = host.make_host_handler(name)");
        const notes = project.notes.join("\n");
        expect(notes).toContain("on_subagent_start, on_user_prompt_submitted");
        expect(notes).toContain("on_elicitation_request");
    });

    it("requires a real skill provider when selected", () => {
        const plan = pythonPlan();
        plan.context.skills = true;
        plan.context.skillProvider = true;
        const { files, project } = generate(plan);
        const host = files.get("host.py") ?? "";
        expect(host).toContain("SKILL_PROVIDER = None");
        expect(host).toContain("Implement and register SKILL_PROVIDER in host.py (a real SkillProvider).");
        expect(host).toContain("isinstance(SKILL_PROVIDER, SkillProvider)");
        expect(files.get("agent.py")).toContain('options["skill_provider"] = host.skill_provider()');
        expect(project.notes.join("\n")).toContain("SKILL_PROVIDER");
    });

    it("sends the run prompt with the plan's response schema", () => {
        const plan = pythonPlan();
        plan.output.responseSchema = JSON.stringify({
            type: "object",
            properties: { ok: { type: "boolean" } },
        });
        const { files, project } = generate(plan);
        const agent = files.get("agent.py") ?? "";
        expect(agent).toContain(
            'send_options["response_schema"] = json.loads(plan["output"]["responseSchema"])',
        );
        expect(agent).toContain("session.send_and_wait(prompt, timeout=timeout, **send_options)");
        expect(project.notes.join("\n")).toContain("response_schema");
    });

    it.each(["managed", "external"] as const)("handles the client log level for a %s runtime", (runtime) => {
        const plan = pythonPlan();
        plan.target.runtime = runtime;
        plan.events.logLevel = "debug";
        const { files, project } = generate(plan);
        expect(files.get("agent.py")).toContain('client_options["log_level"] = plan["events"]["logLevel"]');
        expect(project.notes.join("\n")).toContain(
            runtime === "external" ? "log level is not applied" : 'log_level="debug"',
        );
    });
});
