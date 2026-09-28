// Copyright (c) Microsoft Corporation. All rights reserved.
import { useState } from "react";
import type { HarnessPlan, PlanIssue } from "../domain/plan";
import type { Decision } from "../domain/analysis";
import type { ReferenceControl, ReferenceGap } from "../content/reference";

export type ViewId =
    | "overview"
    | "runtime"
    | "base-profile"
    | "prompt"
    | "tools"
    | "context"
    | "agents"
    | "models"
    | "policy"
    | "bootstrap"
    | "deploy"
    | "reference";

export type Evidence =
    | { kind: "decision"; value: Decision }
    | { kind: "control"; value: ReferenceControl }
    | { kind: "gap"; value: ReferenceGap }
    | { kind: "topic"; title: string; detail: string; sources: string[] };

export interface EditorProps {
    plan: HarnessPlan;
    issues: PlanIssue[];
    edit: (recipe: (draft: HarnessPlan) => void) => void;
    onEvidence: (evidence: Evidence) => void;
}

export function issueFor(issues: PlanIssue[], path: string): string | undefined {
    return issues.find((issue) => issue.path === path || issue.path.startsWith(`${path}.`))?.message;
}

export function uniqueName(base: string, names: readonly string[]): string {
    const existing = new Set(names);
    let candidate = base;
    let suffix = 2;
    while (existing.has(candidate)) candidate = `${base}_${suffix++}`;
    return candidate;
}

/** Editors remount on history/replacement; these IDs survive edits to names and removal of sibling rows. */
export function useEditorRowIds(count: number) {
    const [ids, setIds] = useState(() => Array.from({ length: count }, () => crypto.randomUUID()));
    return {
        ids,
        appendId: () => {
            const id = crypto.randomUUID();
            setIds((current) => [...current, id]);
        },
        removeId: (index: number) => setIds((current) => current.filter((_, row) => row !== index)),
    };
}

export function viewForPath(path: string): ViewId {
    const first = path.split(".")[0];
    if (first === "target") return "bootstrap";
    if (first === "clientMode" || first === "preset") return "base-profile";
    if (first === "prompt") return "prompt";
    if (first === "tools" || first === "customTools" || first === "mcpServers" || first === "inventory")
        return "tools";
    if (first === "context") return "context";
    if (first === "agents" || first === "selectedAgent" || first === "rootExcludedTools") return "agents";
    if (first === "model" || first === "identity") return "models";
    if (first === "session" || first === "policy" || first === "events" || first === "evaluation")
        return "policy";
    return "overview";
}
