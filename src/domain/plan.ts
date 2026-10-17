// Copyright (c) Microsoft Corporation. All rights reserved.
import { z } from "zod";
import { BootstrapTargetSchema, defaultTarget } from "./target";
import { BUILTIN_NAMES, BUILTIN_SPECS, TOOL_CATALOG_REVISION } from "../content/builtin-tools";
export { BUILTIN_NAMES, BUILTIN_SPECS } from "../content/builtin-tools";
export type { BuiltinName, BuiltinSpec } from "../content/builtin-tools";
import type { BuiltinName } from "../content/builtin-tools";

export const PRESET_IDS = ["empty", "minimal", "copilot"] as const;
export const PLAN_SCHEMA_VERSION = 3;
/** SDK callback hooks beyond the pre/post tool-use pair. */
export const LIFECYCLE_HOOKS = [
    "preMcpToolCall",
    "userPromptSubmitted",
    "userPromptTransformed",
    "sessionStart",
    "sessionEnd",
    "errorOccurred",
    "agentStop",
    "subagentStart",
    "subagentStop",
] as const;
export type LifecycleHook = (typeof LIFECYCLE_HOOKS)[number];
/** Optional host request handlers beyond permission and user input. */
export const HOST_HANDLERS = ["elicitation", "exitPlanMode", "autoModeSwitch", "mcpAuth"] as const;
export type HostHandler = (typeof HOST_HANDLERS)[number];
export const MODEL_PROVIDER_PRODUCTS = [
    "openai",
    "anthropic",
    "azure_openai",
    "ollama",
    "lm_studio",
    "foundry_local",
    "llama_cpp",
] as const;
export const AUTO_TIERS = ["default", "efficiency", "balance", "intelligence", "fast"] as const;
export const REASONING_SUMMARIES = ["default", "none", "concise", "detailed"] as const;
export const DIAGNOSTIC_LEVELS = ["off", "error", "warning", "info", "debug", "trace"] as const;
export const LOG_LEVELS = ["default", "none", "error", "warning", "info", "debug", "all"] as const;
/** Built-in tools present before plan schema v3 that the runtime has since removed or renamed. */
export const RETIRED_TOOL_NAMES: Readonly<Record<string, string | null>> = {
    run_factory: "run_dynamic_workflow",
    factories_manage: "dynamic_workflows_manage",
    create_pull_request: null,
    reply_to_comment: null,
    report_progress: null,
};
export const SECTION_NAMES = [
    "preamble",
    "identity",
    "tone",
    "tool_efficiency",
    "environment_context",
    "code_change_rules",
    "guidelines",
    "safety",
    "tool_instructions",
    "custom_instructions",
    "runtime_instructions",
    "last_instructions",
] as const;
export type PresetId = (typeof PRESET_IDS)[number];
export type SectionName = (typeof SECTION_NAMES)[number];

const objectSchema = (property: string) =>
    JSON.stringify(
        {
            type: "object",
            properties: { [property]: { type: "string" } },
            required: [property],
        },
        null,
        2,
    );

const identifier = z
    .string()
    .min(1)
    .max(64)
    .regex(/^[a-zA-Z0-9_-]+$/, "Use letters, digits, underscores, or hyphens.");
const boundedText = z.string().max(12_000);
const id = z.string().min(1).max(100);
export const MAX_PLAN_BYTES = 1_000_000;
export const ToolActionSchema = z.enum(["keep", "override", "remove"]);
export const IdentityModeSchema = z.enum(["host-token", "developer", "s2s-installation"]);
export type IdentityMode = z.infer<typeof IdentityModeSchema>;
export const ToolSettingsSchema = z
    .object({
        action: ToolActionSchema,
        description: z.string().max(600),
        parameters: boundedText,
    })
    .strict();
export type ToolAction = z.infer<typeof ToolActionSchema>;
export type ToolSettings = z.infer<typeof ToolSettingsSchema>;
export const ToolMapSchema = z.record(z.enum(BUILTIN_NAMES), ToolSettingsSchema);
export function defaultToolSettings(name: BuiltinName, action: ToolAction): ToolSettings {
    return {
        action,
        description: `Host-controlled implementation of ${name}. Validate inputs and resource authority.`,
        parameters: BUILTIN_SPECS[name].parameters,
    };
}

export const CustomToolSchema = z
    .object({
        id,
        name: identifier,
        description: z.string().min(1).max(600),
        parameters: boundedText,
        terminal: z.boolean(),
        defer: z.enum(["default", "auto", "never"]),
        skipPermission: z.boolean(),
    })
    .strict();
export type CustomTool = z.infer<typeof CustomToolSchema>;

export const McpServerSchema = z
    .object({
        id,
        name: identifier,
        url: z.string().max(1500),
        tools: z
            .array(z.object({ name: identifier, wireName: identifier }).strict())
            .min(1)
            .max(30),
    })
    .strict();
export type McpServer = z.infer<typeof McpServerSchema>;

export const AgentSchema = z
    .object({
        id,
        name: identifier,
        displayName: z
            .string()
            .max(80)
            .regex(/^[^\r\n]*$/, "Keep the display name on one line."),
        description: z.string().max(600),
        prompt: z.string().min(1).max(8000),
        model: z.string().max(120),
        tools: z.array(identifier).max(512),
        hooks: boundedText,
    })
    .strict();
export type Agent = z.infer<typeof AgentSchema>;

/** Parses agent-scoped declarative hooks: `{ "<event>": [ { ...action } ] }`. Empty text means none. */
export function agentHooksError(text: string): string | undefined {
    if (!text.trim()) return undefined;
    try {
        const parsed: unknown = JSON.parse(text);
        if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed))
            return 'Use a JSON object keyed by hook event, for example { "preToolUse": [ { ... } ] }.';
        for (const [event, actions] of Object.entries(parsed)) {
            if (
                !Array.isArray(actions) ||
                actions.some((a) => typeof a !== "object" || a === null || Array.isArray(a))
            )
                return `Hook event "${event}" must map to an array of action objects.`;
        }
    } catch (error) {
        return `Invalid JSON: ${error instanceof Error ? error.message : String(error)}`;
    }
    return undefined;
}

export function parseAgentHooks(text: string): Record<string, Record<string, unknown>[]> | undefined {
    return text.trim() ? (JSON.parse(text) as Record<string, Record<string, unknown>[]>) : undefined;
}

export function schemaError(text: string): string | undefined {
    try {
        const parsed: unknown = JSON.parse(text);
        if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
            return 'Use a JSON object with "type": "object".';
        }
        if (!("type" in parsed) || parsed.type !== "object") {
            return 'The runtime requires a top-level "type": "object" schema.';
        }
        const pending: { value: unknown; depth: number }[] = [{ value: parsed, depth: 0 }];
        let count = 0;
        while (pending.length) {
            const item = pending.pop();
            if (!item) break;
            if (item.depth > 64 || ++count > 5000)
                return "The schema is too deeply nested or complex for this builder.";
            if (typeof item.value === "object" && item.value !== null) {
                for (const value of Object.values(item.value)) pending.push({ value, depth: item.depth + 1 });
            }
        }
    } catch (error) {
        return `Invalid JSON: ${error instanceof Error ? error.message : String(error)}`;
    }
    return undefined;
}

function endpointError(value: string): string | undefined {
    try {
        const url = new URL(value);
        if (!["http:", "https:"].includes(url.protocol)) return "Use an HTTP or HTTPS endpoint.";
        if (url.username || url.password) return "Do not put credentials in endpoint URLs.";
        const credentialKeys = new Set([
            "api_key",
            "apikey",
            "api-key",
            "key",
            "token",
            "access_token",
            "access-token",
            "authorization",
            "password",
            "secret",
        ]);
        const fragment = new URLSearchParams(url.hash.slice(1));
        if (
            [...url.searchParams.keys(), ...fragment.keys()].some((key) =>
                credentialKeys.has(key.toLowerCase()),
            )
        ) {
            return "Keep credential parameters out of endpoint URLs. Use environment references or host callbacks.";
        }
    } catch {
        return "Enter a complete HTTP or HTTPS endpoint.";
    }
    return undefined;
}

const directories = z.array(z.string().min(1).max(1000)).max(20);
const permissionRules = z.array(z.string().min(1).max(500)).max(100);
const modelId = z
    .string()
    .min(1)
    .max(120)
    .regex(/^[A-Za-z0-9][A-Za-z0-9._:/-]*$/, "Use an exact model ID.");
const tokenLimit = z.number().int().min(0).max(100_000_000);

export const HarnessPlanSchema = z
    .object({
        schemaVersion: z.literal(PLAN_SCHEMA_VERSION),
        toolCatalogRevision: z.string().min(1),
        target: BootstrapTargetSchema,
        name: z
            .string()
            .trim()
            .min(1)
            .max(80)
            .regex(/^[^\r\n]+$/, "Keep the name on one line."),
        preset: z.enum(PRESET_IDS),
        clientMode: z.enum(["empty", "copilot-cli"]),
        inventory: z.enum(["explicit", "coding-defaults"]),
        prompt: z
            .object({
                mode: z.enum(["default", "replace", "append", "customize"]),
                content: boundedText,
                sections: z
                    .array(
                        z
                            .object({
                                name: z.enum(SECTION_NAMES),
                                action: z.enum(["replace", "append", "prepend", "remove", "preserve"]),
                                content: boundedText,
                            })
                            .strict(),
                    )
                    .max(12),
            })
            .strict(),
        tools: ToolMapSchema,
        customTools: z.array(CustomToolSchema).max(20),
        mcpServers: z.array(McpServerSchema).max(10),
        agents: z.array(AgentSchema).max(12),
        selectedAgent: z.string().max(64),
        rootExcludedTools: z.array(identifier).max(512),
        excludedBuiltinAgents: z.array(identifier).max(50),
        context: z
            .object({
                workspace: z.string().max(1000),
                discovery: z.boolean(),
                skills: z.boolean(),
                fileHooks: z.boolean(),
                hostGit: z.boolean(),
                skillDirectories: directories,
                pluginDirectories: directories,
                agentDirectories: directories,
                hookDirectories: directories,
                instructionDirectories: directories,
                additionalDirectories: directories,
                skillProvider: z.boolean(),
                includedBuiltinSkills: z.array(identifier).max(50),
                customInstructions: z.enum(["default", "load", "skip"]),
                onDemandInstructions: z.boolean(),
                refreshCustomInstructions: z.boolean(),
                organizationInstructions: boundedText,
            })
            .strict(),
        policy: z
            .object({
                permissionMode: z.enum(["host", "allow-all"]),
                preToolHook: z.boolean(),
                postToolHook: z.boolean(),
                hooks: z.array(z.enum(LIFECYCLE_HOOKS)).max(LIFECYCLE_HOOKS.length),
                handlers: z.array(z.enum(HOST_HANDLERS)).max(HOST_HANDLERS.length),
                managed: z
                    .object({
                        load: z.boolean(),
                        enforceModelDefaults: z.boolean(),
                        deny: permissionRules,
                        ask: permissionRules,
                        allow: permissionRules,
                        limitTo: permissionRules,
                        disableBypassPermissionsMode: z.enum(["", "disable", "allow-auto-only"]),
                        disableAssistedPermissionsMode: z.boolean(),
                    })
                    .strict(),
            })
            .strict(),
        model: z
            .object({
                id: z.string().max(120),
                provider: z.enum(["copilot", "openai", "azure", "anthropic"]),
                endpoint: z.string().max(1500),
                wireApi: z.enum(["responses", "completions"]),
                credential: z.enum(["api-key", "bearer-callback"]),
                credentialEnv: z
                    .string()
                    .regex(/^[A-Z_][A-Z0-9_]*$/, "Use an environment variable name, not a secret."),
                reasoningEffort: z.enum(["default", "low", "medium", "high", "xhigh"]),
                contextTier: z.enum(["default", "long_context"]),
                autoTier: z.enum(AUTO_TIERS),
                reasoningSummary: z.enum(REASONING_SUMMARIES),
                allowedModels: z.array(modelId).max(64),
                modelProvider: z.enum(["", ...MODEL_PROVIDER_PRODUCTS]),
                wireModel: z.string().max(120),
                maxPromptTokens: tokenLimit,
                maxOutputTokens: tokenLimit,
            })
            .strict(),
        capabilities: z
            .object({
                imageGeneration: z.boolean(),
                toolSearch: z.enum(["default", "enabled", "disabled"]),
                toolSearchDeferThreshold: z.number().int().min(0).max(10_000),
                askUserVariant: z.enum(["default", "legacy", "elicitation"]),
            })
            .strict(),
        identity: IdentityModeSchema,
        session: z
            .object({
                storage: z.enum(["local", "virtual"]),
                baseDirectory: z.string().max(1000),
                idleTimeoutSeconds: z.number().int().min(0).max(Number.MAX_SAFE_INTEGER),
                infinite: z.boolean(),
                largeOutput: z.boolean(),
                name: z.string().max(100),
                interactiveUser: z.boolean(),
                diagnostics: z.enum(DIAGNOSTIC_LEVELS),
                sessionStore: z.boolean(),
                fileChangeTracking: z.boolean(),
                allowTranscriptRecovery: z.boolean(),
                continuePendingWork: z.boolean(),
            })
            .strict(),
        events: z
            .object({
                streaming: z.boolean(),
                observer: z.boolean(),
                subAgentStreaming: z.boolean(),
                logLevel: z.enum(LOG_LEVELS),
            })
            .strict(),
        output: z.object({ responseSchema: boundedText }).strict(),
        evaluation: boundedText,
    })
    .strict()
    .superRefine((plan, context) => {
        const issue = (path: (string | number)[], message: string) =>
            context.addIssue({ code: "custom", path, message });
        if (plan.clientMode === "empty" && plan.inventory === "coding-defaults") {
            issue(["inventory"], "Empty client mode requires an explicit tool inventory.");
        }
        if (plan.prompt.mode === "replace" && !plan.prompt.content.trim()) {
            issue(["prompt", "content"], "Provide an explicit replacement prompt.");
        }
        if (plan.session.storage === "local" && !plan.session.baseDirectory.trim()) {
            issue(["session", "baseDirectory"], "A local state directory is required.");
        }
        const sectionNames = new Set<string>();
        plan.prompt.sections.forEach((section, index) => {
            if (sectionNames.has(section.name))
                issue(["prompt", "sections", index, "name"], "Each section can appear once.");
            sectionNames.add(section.name);
        });
        for (const name of BUILTIN_NAMES) {
            const tool = plan.tools[name];
            if (tool.action !== "override") continue;
            if (!tool.description.trim())
                issue(["tools", name, "description"], "Describe the replacement behavior.");
            const error = schemaError(tool.parameters);
            if (error) issue(["tools", name, "parameters"], error);
        }
        const names = new Set<string>([...BUILTIN_NAMES, "catalog_search", "tool_search_tool"]);
        const ids = new Set<string>();
        plan.customTools.forEach((tool, index) => {
            if (names.has(tool.name))
                issue(
                    ["customTools", index, "name"],
                    "This name is reserved or already in use. Use the built-in override control for built-ins.",
                );
            if (ids.has(tool.id)) issue(["customTools", index, "id"], "Duplicate tool identity.");
            names.add(tool.name);
            ids.add(tool.id);
            const error = schemaError(tool.parameters);
            if (error) issue(["customTools", index, "parameters"], error);
        });
        const servers = new Set<string>();
        const wireNames = new Set<string>();
        plan.mcpServers.forEach((server, index) => {
            if (servers.has(server.name)) issue(["mcpServers", index, "name"], "Duplicate MCP server name.");
            if (ids.has(server.id)) issue(["mcpServers", index, "id"], "Duplicate entry identity.");
            ids.add(server.id);
            servers.add(server.name);
            const error = endpointError(server.url);
            if (error) issue(["mcpServers", index, "url"], error);
            const rawNames = new Set<string>();
            server.tools.forEach((tool, toolIndex) => {
                if (rawNames.has(tool.name))
                    issue(
                        ["mcpServers", index, "tools", toolIndex, "name"],
                        "Server tool names must be unique.",
                    );
                if (names.has(tool.wireName))
                    issue(
                        ["mcpServers", index, "tools", toolIndex, "wireName"],
                        "This wire name collides with another planned tool.",
                    );
                rawNames.add(tool.name);
                if (wireNames.has(tool.wireName))
                    issue(
                        ["mcpServers", index, "tools", toolIndex, "wireName"],
                        "Canonical MCP wire names must be unique.",
                    );
                wireNames.add(tool.wireName);
            });
        });
        const agents = new Set<string>();
        plan.agents.forEach((agent, index) => {
            if (agents.has(agent.name)) issue(["agents", index, "name"], "Duplicate agent name.");
            if (ids.has(agent.id)) issue(["agents", index, "id"], "Duplicate entry identity.");
            ids.add(agent.id);
            agents.add(agent.name);
        });
        if (plan.selectedAgent && !agents.has(plan.selectedAgent))
            issue(["selectedAgent"], "Choose a declared agent or the default agent.");
        if (plan.model.endpoint.trim()) {
            const error = endpointError(plan.model.endpoint);
            if (error) issue(["model", "endpoint"], error);
        }
        plan.agents.forEach((agent, index) => {
            const error = agentHooksError(agent.hooks);
            if (error) issue(["agents", index, "hooks"], error);
        });
        if (new Set(plan.policy.hooks).size !== plan.policy.hooks.length)
            issue(["policy", "hooks"], "Select each hook once.");
        if (new Set(plan.policy.handlers).size !== plan.policy.handlers.length)
            issue(["policy", "handlers"], "Select each handler once.");
        if (
            plan.capabilities.askUserVariant === "elicitation" &&
            !plan.policy.handlers.includes("elicitation")
        )
            issue(
                ["capabilities", "askUserVariant"],
                "The elicitation ask_user shape needs an elicitation request handler.",
            );
        if (plan.context.skillProvider && !plan.context.skills)
            issue(
                ["context", "skillProvider"],
                "Enable skills: with skills disabled the provider stays bound but receives no calls.",
            );
        const sessionName = plan.session.name;
        if (
            sessionName &&
            (sessionName.trim() !== sessionName ||
                [...sessionName].some((char) => char.charCodeAt(0) < 32 || char.charCodeAt(0) === 127) ||
                sessionName.includes('"'))
        )
            issue(
                ["session", "name"],
                "Use no leading or trailing whitespace, control characters, or double quotes.",
            );
        if (new Set(plan.model.allowedModels).size !== plan.model.allowedModels.length)
            issue(["model", "allowedModels"], "List each model ID once.");
        if (
            plan.model.allowedModels.length &&
            plan.model.id.trim() &&
            plan.model.id.trim() !== "auto" &&
            !plan.model.allowedModels.includes(plan.model.id.trim())
        )
            issue(["model", "allowedModels"], "Include the selected session model in the allowlist.");
        if (plan.model.provider === "copilot") {
            if (plan.model.modelProvider)
                issue(["model", "modelProvider"], "The serving product applies only to a custom provider.");
            if (plan.model.wireModel.trim() || plan.model.maxPromptTokens || plan.model.maxOutputTokens)
                issue(["model", "wireModel"], "Wire model and token limits apply only to a custom provider.");
        }
        if (plan.output.responseSchema.trim()) {
            const error = schemaError(plan.output.responseSchema);
            if (error) issue(["output", "responseSchema"], error);
        }
        if (new TextEncoder().encode(JSON.stringify(plan, null, 2)).byteLength > MAX_PLAN_BYTES) {
            issue([], "The plan exceeds the 1 MB builder limit.");
        }
    });

export type HarnessPlan = z.infer<typeof HarnessPlanSchema>;
export type PlanIssue = { path: string; message: string };

export function planIssues(plan: HarnessPlan): PlanIssue[] {
    const result = HarnessPlanSchema.safeParse(plan);
    return result.success
        ? []
        : result.error.issues.map((issue) => ({
              path: issue.path.map(String).join("."),
              message: issue.message,
          }));
}

export function parsePlan(text: string): HarnessPlan {
    if (new TextEncoder().encode(text).byteLength > MAX_PLAN_BYTES)
        throw new Error("Plan files must be smaller than 1 MB.");
    const parsed: unknown = JSON.parse(text);
    let migrated = parsed;
    if (
        typeof parsed === "object" &&
        parsed !== null &&
        !Array.isArray(parsed) &&
        "schemaVersion" in parsed &&
        parsed.schemaVersion === 1
    ) {
        if ("target" in parsed) throw new Error("A version 1 plan cannot contain version 2 target settings.");
        migrated = { ...parsed, schemaVersion: 2, target: defaultTarget() };
    }
    if (
        typeof migrated === "object" &&
        migrated !== null &&
        !Array.isArray(migrated) &&
        !("identity" in migrated)
    ) {
        migrated = { ...migrated, identity: "host-token" };
    }
    if (
        typeof migrated === "object" &&
        migrated !== null &&
        !Array.isArray(migrated) &&
        "policy" in migrated &&
        typeof migrated.policy === "object" &&
        migrated.policy !== null &&
        !Array.isArray(migrated.policy) &&
        !("permissionMode" in migrated.policy)
    ) {
        migrated = {
            ...migrated,
            policy: { ...migrated.policy, permissionMode: "host" },
        };
    }
    if (
        typeof migrated === "object" &&
        migrated !== null &&
        !Array.isArray(migrated) &&
        !("toolCatalogRevision" in migrated) &&
        "tools" in migrated &&
        typeof migrated.tools === "object" &&
        migrated.tools !== null &&
        !Array.isArray(migrated.tools)
    ) {
        const inherited = "inventory" in migrated && migrated.inventory === "coding-defaults";
        const defaults = Object.fromEntries(
            BUILTIN_NAMES.map((name) => [name, defaultToolSettings(name, inherited ? "keep" : "remove")]),
        );
        migrated = {
            ...migrated,
            toolCatalogRevision: TOOL_CATALOG_REVISION,
            tools: { ...defaults, ...migrated.tools },
        };
    }
    migrated = migrateToV3(migrated);
    const result = HarnessPlanSchema.safeParse(migrated);
    if (!result.success) {
        throw new Error(
            result.error.issues
                .slice(0, 6)
                .map((issue) => `${issue.path.map(String).join(".") || "plan"}: ${issue.message}`)
                .join("\n"),
        );
    }
    return result.data;
}

export function createCustomTool(id: string, name = "lookup_record"): CustomTool {
    return {
        id,
        name,
        description: "Look up a record authorized for the current user.",
        parameters: objectSchema("recordId"),
        terminal: false,
        defer: "default",
        skipPermission: false,
    };
}

export function createMcpServer(id: string, name = "documents"): McpServer {
    return {
        id,
        name,
        url: "https://mcp.example.com",
        tools: [{ name: "search", wireName: `${name}-search` }],
    };
}

export function createAgent(id: string, name = "reviewer"): Agent {
    return {
        id,
        name,
        displayName: "",
        description: "Review the task against the supplied criteria.",
        prompt: "Review the supplied material. Explain findings and do not take external actions.",
        model: "",
        tools: [],
        hooks: "",
    };
}

/** Defaults for fields introduced by plan schema v3. Each one leaves the SDK option unset. */
export function v3Defaults() {
    return {
        excludedBuiltinAgents: [] as string[],
        context: {
            agentDirectories: [] as string[],
            hookDirectories: [] as string[],
            instructionDirectories: [] as string[],
            additionalDirectories: [] as string[],
            skillProvider: false,
            includedBuiltinSkills: [] as string[],
            customInstructions: "default" as const,
            onDemandInstructions: false,
            refreshCustomInstructions: false,
            organizationInstructions: "",
        },
        policy: {
            hooks: [] as LifecycleHook[],
            handlers: [] as HostHandler[],
            managed: {
                load: false,
                enforceModelDefaults: false,
                deny: [] as string[],
                ask: [] as string[],
                allow: [] as string[],
                limitTo: [] as string[],
                disableBypassPermissionsMode: "" as const,
                disableAssistedPermissionsMode: false,
            },
        },
        model: {
            autoTier: "default" as const,
            reasoningSummary: "default" as const,
            allowedModels: [] as string[],
            modelProvider: "" as const,
            wireModel: "",
            maxPromptTokens: 0,
            maxOutputTokens: 0,
        },
        capabilities: {
            imageGeneration: false,
            toolSearch: "default" as const,
            toolSearchDeferThreshold: 0,
            askUserVariant: "default" as const,
        },
        session: {
            name: "",
            interactiveUser: false,
            diagnostics: "off" as const,
            sessionStore: false,
            fileChangeTracking: false,
            allowTranscriptRecovery: true,
            continuePendingWork: false,
        },
        events: { subAgentStreaming: true, logLevel: "default" as const },
        output: { responseSchema: "" },
    };
}

function record(value: unknown): Record<string, unknown> | undefined {
    return typeof value === "object" && value !== null && !Array.isArray(value)
        ? (value as Record<string, unknown>)
        : undefined;
}

function migrateToV3(input: unknown): unknown {
    const plan = record(input);
    if (!plan || plan.schemaVersion !== 2) return input;
    const defaults = v3Defaults();
    const merge = (key: keyof ReturnType<typeof v3Defaults>) => ({
        ...(defaults[key] as object),
        ...(record(plan[key]) ?? {}),
    });
    const tools = record(plan.tools);
    let migratedTools: Record<string, unknown> | undefined;
    if (tools) {
        const inherited = plan.inventory === "coding-defaults";
        migratedTools = Object.fromEntries(
            BUILTIN_NAMES.map((name) => [name, defaultToolSettings(name, inherited ? "keep" : "remove")]),
        );
        for (const [name, setting] of Object.entries(tools)) {
            if (name in RETIRED_TOOL_NAMES) {
                const replacement = RETIRED_TOOL_NAMES[name];
                if (replacement && !(replacement in tools)) migratedTools[replacement] = setting;
            } else migratedTools[name] = setting;
        }
    }
    // Custom tools named after built-ins added since v2 (for example image_generation)
    // were valid then but are reserved now; rename them so the draft still imports.
    const customNames = Array.isArray(plan.customTools)
        ? plan.customTools.flatMap((tool) => {
              const name = record(tool)?.name;
              return typeof name === "string" ? [name] : [];
          })
        : [];
    const taken = new Set<string>([...BUILTIN_NAMES, "catalog_search", "tool_search_tool", ...customNames]);
    const customRenames = new Map<string, string>();
    for (const name of customNames) {
        if (!(BUILTIN_NAMES as readonly string[]).includes(name) || customRenames.has(name)) continue;
        let suffix = "_custom";
        for (let index = 2; taken.has(`${name.slice(0, 64 - suffix.length)}${suffix}`); index++)
            suffix = `_custom${index}`;
        const replacement = `${name.slice(0, 64 - suffix.length)}${suffix}`;
        taken.add(replacement);
        customRenames.set(name, replacement);
    }
    const rename = (names: unknown) =>
        Array.isArray(names)
            ? names.flatMap((name) => {
                  if (typeof name !== "string") return [name];
                  const custom = customRenames.get(name);
                  if (custom) return [custom];
                  if (customNames.includes(name) || !(name in RETIRED_TOOL_NAMES)) return [name];
                  const replacement = RETIRED_TOOL_NAMES[name];
                  return replacement ? [replacement] : [];
              })
            : names;
    return {
        ...plan,
        schemaVersion: PLAN_SCHEMA_VERSION,
        ...(migratedTools ? { tools: migratedTools, toolCatalogRevision: TOOL_CATALOG_REVISION } : {}),
        excludedBuiltinAgents: plan.excludedBuiltinAgents ?? defaults.excludedBuiltinAgents,
        rootExcludedTools: rename(plan.rootExcludedTools),
        customTools: Array.isArray(plan.customTools)
            ? plan.customTools.map((tool) => {
                  const value = record(tool);
                  const name = value?.name;
                  const renamed = typeof name === "string" ? customRenames.get(name) : undefined;
                  return {
                      defer: "default",
                      skipPermission: false,
                      ...value,
                      ...(renamed ? { name: renamed } : {}),
                  };
              })
            : plan.customTools,
        agents: Array.isArray(plan.agents)
            ? plan.agents.map((agent) => {
                  const value = record(agent);
                  return { displayName: "", hooks: "", ...value, tools: rename(value?.tools) };
              })
            : plan.agents,
        context: merge("context"),
        policy: merge("policy"),
        model: merge("model"),
        capabilities: merge("capabilities"),
        session: merge("session"),
        events: merge("events"),
        output: merge("output"),
    };
}

export function splitLines(value: string): string[] {
    return value
        .split(/[\n,]/)
        .map((line) => line.trim())
        .filter(Boolean);
}
