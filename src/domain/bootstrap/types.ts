// Copyright (c) Microsoft Corporation. All rights reserved.
import type { HarnessPlan } from "../plan";
import type { BootstrapLanguage } from "../target";

export interface BootstrapFile {
    path: string;
    content: string;
    language:
        | "typescript"
        | "python"
        | "go"
        | "csharp"
        | "java"
        | "rust"
        | "json"
        | "markdown"
        | "text"
        | "xml"
        | "toml";
}
export interface BootstrapRequirement {
    id: string;
    title: string;
    detail: string;
    file: string;
    kind: "environment" | "host-code" | "runtime" | "review";
    environmentVariable?: string;
}
export interface BootstrapBlocker {
    id: string;
    title: string;
    detail: string;
    fields: string[];
    sources: string[];
}
export interface BootstrapCommands {
    install: string[];
    check: string;
    run: string;
    startRuntime?: string;
}
export interface BootstrapProject {
    name: string;
    language: BootstrapLanguage;
    languageLabel: string;
    files: BootstrapFile[];
    commands: BootstrapCommands;
    requirements: BootstrapRequirement[];
    notes: string[];
    sources: string[];
}
export type BootstrapResult =
    | { ok: true; project: BootstrapProject; blockers: [] }
    | { ok: false; blockers: BootstrapBlocker[] };

export interface LanguageAdapter {
    language: BootstrapLanguage;
    label: string;
    check(plan: HarnessPlan): BootstrapBlocker[];
    generate(plan: HarnessPlan): Omit<BootstrapProject, "name" | "language" | "languageLabel">;
}
