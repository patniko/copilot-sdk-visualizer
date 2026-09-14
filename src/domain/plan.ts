// Copyright (c) Microsoft Corporation. All rights reserved.
import { z } from "zod";

export const PRESET_IDS = ["empty", "minimal", "copilot"] as const;
export const BUILTIN_NAMES = [
    "view",
    "apply_patch",
    "grep",
    "glob",
    "bash",
    "ask_user",
    "task_complete",
    "task",
    "skill",
] as const;
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
export type BuiltinName = (typeof BUILTIN_NAMES)[number];
export type SectionName = (typeof SECTION_NAMES)[number];

export interface BuiltinSpec {
    label: string;
    description: string;
    group: "Workspace" | "Session";
    workspace: boolean;
    parameters: string;
}

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

export const BUILTIN_SPECS: Record<BuiltinName, BuiltinSpec> = {
    view: {
        label: "Read files",
        description: "Read a file through the runtime's native view tool.",
        group: "Workspace",
        workspace: true,
        parameters: objectSchema("path"),
    },
    apply_patch: {
        label: "Edit files",
        description: "Apply changes to files.",
        group: "Workspace",
        workspace: true,
        parameters: objectSchema("patch"),
    },
    grep: {
        label: "Search content",
        description: "Search for relevant content.",
        group: "Workspace",
        workspace: true,
        parameters: objectSchema("query"),
    },
    glob: {
        label: "Find files",
        description: "Find paths matching a pattern.",
        group: "Workspace",
        workspace: true,
        parameters: objectSchema("pattern"),
    },
    bash: {
        label: "Run commands",
        description: "Execute a command in the host environment.",
        group: "Workspace",
        workspace: true,
        parameters: objectSchema("command"),
    },
    ask_user: {
        label: "Ask the user",
        description: "Request user input through the host.",
        group: "Session",
        workspace: false,
        parameters: objectSchema("question"),
    },
    task_complete: {
        label: "Complete a task",
        description: "Report completion when supported by the active runtime mode.",
        group: "Session",
        workspace: false,
        parameters: objectSchema("summary"),
    },
    task: {
        label: "Delegate work",
        description: "Delegate a bounded task to another agent.",
        group: "Session",
        workspace: false,
        parameters: objectSchema("prompt"),
    },
    skill: {
        label: "Load a skill",
        description: "Load a configured skill into context.",
        group: "Session",
        workspace: false,
        parameters: objectSchema("skill"),
    },
};

const identifier = z
    .string()
    .min(1)
    .max(64)
    .regex(/^[a-zA-Z0-9_-]+$/, "Use letters, digits, underscores, or hyphens.");
const boundedText = z.string().max(12_000);
const id = z.string().min(1).max(100);
export const MAX_PLAN_BYTES = 1_000_000;
export const ToolActionSchema = z.enum(["keep", "override", "remove"]);
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

export const CustomToolSchema = z
    .object({
        id,
        name: identifier,
        description: z.string().min(1).max(600),
        parameters: boundedText,
        terminal: z.boolean(),
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
        description: z.string().max(600),
        prompt: z.string().min(1).max(8000),
        model: z.string().max(120),
        tools: z.array(identifier).max(50),
    })
    .strict();
export type Agent = z.infer<typeof AgentSchema>;

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
    } catch {
        return "Enter a complete HTTP or HTTPS endpoint.";
    }
    return undefined;
}

export const HarnessPlanSchema = z
    .object({
        schemaVersion: z.literal(1),
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
                mode: z.enum(["replace", "append", "customize"]),
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
        rootExcludedTools: z.array(identifier).max(50),
        context: z
            .object({
                workspace: z.string().max(1000),
                discovery: z.boolean(),
                skills: z.boolean(),
                fileHooks: z.boolean(),
                hostGit: z.boolean(),
                skillDirectories: z.array(z.string().min(1).max(1000)).max(20),
                pluginDirectories: z.array(z.string().min(1).max(1000)).max(20),
            })
            .strict(),
        policy: z
            .object({
                preToolHook: z.boolean(),
                postToolHook: z.boolean(),
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
            })
            .strict(),
        identity: z.enum(["host-token", "developer"]),
        session: z
            .object({
                storage: z.enum(["local", "virtual"]),
                baseDirectory: z.string().max(1000),
                idleTimeoutSeconds: z.number().int().min(0).max(Number.MAX_SAFE_INTEGER),
                infinite: z.boolean(),
                largeOutput: z.boolean(),
            })
            .strict(),
        events: z.object({ streaming: z.boolean(), observer: z.boolean() }).strict(),
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
        if (plan.model.provider !== "copilot" || plan.model.endpoint.trim()) {
            const error = endpointError(plan.model.endpoint);
            if (error) issue(["model", "endpoint"], error);
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
    const result = HarnessPlanSchema.safeParse(parsed);
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
        description: "Review the task against the supplied criteria.",
        prompt: "Review the supplied material. Explain findings and do not take external actions.",
        model: "",
        tools: [],
    };
}

export function splitLines(value: string): string[] {
    return value
        .split(/[\n,]/)
        .map((line) => line.trim())
        .filter(Boolean);
}
