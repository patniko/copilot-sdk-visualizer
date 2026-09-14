// Copyright (c) Microsoft Corporation. All rights reserved.
import {
    BUILTIN_NAMES,
    BUILTIN_SPECS,
    DEFAULT_STATUS_LABELS,
    aliasesForTool,
} from "../content/builtin-tools";
import type { BuiltinDefaultStatus, BuiltinName, BuiltinSpec } from "../content/builtin-tools";
import type { ToolAction } from "../domain/plan";

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
