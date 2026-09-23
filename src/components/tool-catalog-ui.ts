// Copyright (c) Microsoft Corporation. All rights reserved.
import {
    BUILTIN_NAMES,
    BUILTIN_SPECS,
    DEFAULT_STATUS_LABELS,
    aliasesForTool,
} from "../content/builtin-tools";
import type { BuiltinDefaultStatus, BuiltinName, BuiltinSpec } from "../content/builtin-tools";
import type { ToolAction } from "../domain/plan";

export const PRIMARY_TOOL_NAMES = [
    "apply_patch",
    "ask_user",
    "bash",
    "create",
    "edit",
    "glob",
    "grep",
    "list_bash",
    "list_powershell",
    "powershell",
    "read_bash",
    "read_powershell",
    "rg",
    "stop_bash",
    "stop_powershell",
    "str_replace_editor",
    "view",
    "web_fetch",
] as const satisfies readonly BuiltinName[];

export const ADVANCED_TOOL_NAMES = [
    "lexical_code_search",
    "lsp",
    "semantic_code_search",
    "session_store_sql",
    "skill",
    "sql",
    "task",
    "tool_search_tool",
] as const satisfies readonly BuiltinName[];

const primaryTools = new Set<BuiltinName>(PRIMARY_TOOL_NAMES);
const advancedTools = new Set<BuiltinName>(ADVANCED_TOOL_NAMES);

export const INTERNAL_TOOL_NAMES = BUILTIN_NAMES.filter(
    (name) => !primaryTools.has(name) && !advancedTools.has(name),
);

export type ToolCategory = "files" | "search" | "commands" | "interaction" | "advanced";

export function toolCategory(name: BuiltinName): ToolCategory {
    if (["view", "create", "edit", "apply_patch", "str_replace_editor"].includes(name)) return "files";
    if (["glob", "grep", "rg", "lexical_code_search", "semantic_code_search", "lsp"].includes(name))
        return "search";
    if (
        [
            "bash",
            "read_bash",
            "stop_bash",
            "list_bash",
            "powershell",
            "read_powershell",
            "stop_powershell",
            "list_powershell",
        ].includes(name)
    )
        return "commands";
    if (["ask_user", "web_fetch"].includes(name)) return "interaction";
    return "advanced";
}

export const REFERENCE_DEFAULT_STATUSES = [
    "baseline-enabled",
    "conditional",
    "platform-specific",
    "internal",
] as const satisfies readonly BuiltinDefaultStatus[];

export const referenceDefaultGroups = REFERENCE_DEFAULT_STATUSES.map((status) => ({
    status,
    label: DEFAULT_STATUS_LABELS[status],
    names: BUILTIN_NAMES.filter((name) => BUILTIN_SPECS[name].defaultStatus === status),
}));

export const referenceBaselineNames = BUILTIN_NAMES.filter(
    (name) => BUILTIN_SPECS[name].defaultStatus === "baseline-enabled",
);

export const inputKindLabels: Record<BuiltinSpec["inputKind"], string> = {
    "json-object": "JSON object input",
    "custom-grammar": "Custom / grammar input",
    "specialized-json": "Specialized JSON protocol",
};

export function toolActionLabel(action: ToolAction, inherited: boolean): string {
    if (action === "keep") return inherited ? "Runtime default" : "Keep (selected name)";
    return action === "override" ? "Override requested" : "Removed";
}

export function toolSearchText(name: BuiltinName): string {
    const spec = BUILTIN_SPECS[name];
    return [
        name,
        spec.label,
        spec.description,
        spec.group,
        spec.defaultStatus,
        DEFAULT_STATUS_LABELS[spec.defaultStatus],
        spec.defaultReason,
        spec.inputKind,
        inputKindLabels[spec.inputKind],
        ...aliasesForTool(name).map((alias) => alias.name),
    ]
        .join(" ")
        .toLowerCase();
}
