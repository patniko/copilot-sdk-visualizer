// Copyright (c) Microsoft Corporation. All rights reserved.
import { z } from "zod";
import snapshot from "./tool-catalog.json";

export const BUILTIN_NAMES = [
    "apply_patch",
    "ask_user",
    "bash",
    "catalog_search",
    "context_board",
    "create",
    "create_pull_request",
    "edit",
    "execution_subagent",
    "exit_plan_mode",
    "extensions_manage",
    "extensions_reload",
    "factories_manage",
    "fetch_copilot_cli_documentation",
    "file_search",
    "generic_tool_search",
    "glob",
    "grep",
    "grep_search",
    "invoke_canvas_action",
    "lexical_code_search",
    "list_agents",
    "list_bash",
    "list_canvas_capabilities",
    "list_powershell",
    "lsp",
    "manage_schedule",
    "open_canvas",
    "powershell",
    "read_agent",
    "read_bash",
    "read_file",
    "read_inbox",
    "read_memories",
    "read_powershell",
    "reply_to_comment",
    "report_dreaming_artifact",
    "report_progress",
    "rg",
    "run_factory",
    "search_code_subagent",
    "semantic_code_search",
    "semantic_search",
    "send_inbox",
    "session_store_sql",
    "skill",
    "sql",
    "stop_bash",
    "stop_powershell",
    "store_memory",
    "str_replace_editor",
    "task",
    "task_complete",
    "tool_search_tool",
    "update_todo",
    "view",
    "vote_memory",
    "web_fetch",
    "write_agent",
] as const;
export type BuiltinName = (typeof BUILTIN_NAMES)[number];

const SpecSchema = z.object({
    name: z.enum(BUILTIN_NAMES),
    label: z.string(),
    description: z.string(),
    group: z.enum(["Workspace", "Session"]),
    workspace: z.boolean(),
    parameters: z.string(),
    inputKind: z.enum(["json-object", "custom-grammar", "specialized-json"]),
    overrideable: z.boolean(),
    defaultStatus: z.enum(["baseline-enabled", "conditional", "platform-specific", "internal"]),
    defaultReason: z.string(),
    sources: z.array(z.string()),
});
export type BuiltinSpec = z.infer<typeof SpecSchema>;
export type BuiltinDefaultStatus = BuiltinSpec["defaultStatus"];
export const TOOL_CATALOG_REVISION = snapshot.revision;
export const toolCatalog = {
    revision: snapshot.revision,
    context: snapshot.context,
    tools: z.array(SpecSchema).parse(snapshot.tools),
};
export const BUILTIN_SPECS = z
    .record(z.enum(BUILTIN_NAMES), SpecSchema)
    .parse(Object.fromEntries(toolCatalog.tools.map((tool) => [tool.name, tool])));
if (toolCatalog.tools.length !== BUILTIN_NAMES.length)
    throw new Error("The typed tool catalog and snapshot differ.");

export const DEFAULT_STATUS_LABELS: Record<BuiltinDefaultStatus, string> = {
    "baseline-enabled": "Default in reference profile",
    conditional: "Conditionally enabled",
    "platform-specific": "Platform-specific default",
    internal: "Internal / specialized",
};

export function aliasesForTool(name: BuiltinName) {
    return toolCatalog.context.aliases.filter((alias) => alias.targets.includes(name));
}
