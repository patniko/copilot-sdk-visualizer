// Copyright (c) Microsoft Corporation. All rights reserved.
import { reference } from "./reference";
import type { ToggleHelp } from "./help-types";

export const CONTEXT_TOGGLE_KEYS = ["discovery", "skills", "fileHooks", "hostGit"] as const;
export type ContextToggleKey = (typeof CONTEXT_TOGGLE_KEYS)[number];
export interface ContextToggleHelp extends ToggleHelp {
    option: "enableConfigDiscovery" | "enableSkills" | "enableFileHooks" | "enableHostGitOperations";
    sources: { label: string; url: string }[];
}

const types = `https://github.com/github/copilot-sdk/blob/${reference.revisions.sdk}/nodejs/src/types.ts`;
const runtime = `https://github.com/github/copilot-agent-runtime/blob/${reference.revisions.runtime}`;

export const contextToggleHelp: Record<ContextToggleKey, ContextToggleHelp> = {
    discovery: {
        title: "Configuration discovery",
        option: "enableConfigDiscovery",
        summary:
            "Discover supported host/project configuration; explicitly supplied settings take precedence.",
        enabled:
            "Let the runtime discover supported configuration from its host/project environment. Your explicitly supplied configuration takes precedence over discovered values.",
        disabled:
            "Do not opt into that automatic discovery. Explicit configuration still applies: for example, pluginDirectories can load approved plugin agents and rules even with discovery off.",
        example:
            "A developer-local coding agent can pick up approved project configuration. A service can leave discovery off and supply a deliberate per-tenant configuration.",
        boundary:
            "This is not a blanket file-access switch or permission grant. Skills, file-based hooks, tool availability, and host authorization are separate decisions.",
        sources: [
            { label: "Discovery option and precedence", url: `${types}#L2374-L2380` },
            { label: "Explicit plugin-directory opt-in", url: `${types}#L2781-L2793` },
        ],
    },
    skills: {
        title: "Skills",
        option: "enableSkills",
        summary:
            "Permit built-in and directory-based skill loading; selecting the skill tool is a separate choice.",
        enabled:
            "Allow the runtime to load skills, including built-in skills and skills from configured or discovered directories. This permits loading; it does not put every skill's full content into the prompt immediately.",
        disabled:
            "No skills are loaded through this surface, even if skillDirectories are configured or configuration discovery is on.",
        example:
            "A review workflow can use a reviewed SKILL.md instruction pack containing its rubric and operating procedure.",
        boundary:
            "Enabling skills does not automatically select the skill tool in the tool inventory. Selecting that tool does not override this switch. Ordinary system/custom instructions are separate from skills.",
        sources: [{ label: "Skill-loading gate", url: `${types}#L2927-L2932` }],
    },
    fileHooks: {
        title: "File-based hooks",
        option: "enableFileHooks",
        summary: "Load lifecycle hooks defined in files; SDK callback hooks remain a separate integration.",
        enabled:
            "Enable loading file-defined hooks from .github/hooks/. When a matching lifecycle event occurs, configured command hooks can run code in the runtime host.",
        disabled:
            "Do not enable file-based hook loading through this flag. Host callback hooks supplied through the SDK's hooks option are controlled separately.",
        example:
            "A trusted repository can provide a pre-tool policy or validation hook that runs at its configured event.",
        boundary:
            "Review hook files as executable project configuration. This is not the Pre-tool policy hook or Post-tool result hook switch in Policy & state; those wire functions implemented by your host.",
        sources: [
            { label: "File hooks versus SDK callbacks", url: `${types}#L2906-L2911` },
            {
                label: "Hook commands execute as subprocesses",
                url: `${runtime}/src/runtime/src/hooks/command_executor.rs#L7-L18`,
            },
        ],
    },
    hostGit: {
        title: "Host Git operations",
        option: "enableHostGitOperations",
        summary:
            "Supply Git repository context such as branch, status, and history—not authority to commit or push.",
        enabled:
            "Allow the runtime's host Git integration to inspect repository information such as branch detection, file status, and commit history and surface Git context in the system prompt.",
        disabled: "No Git context is surfaced in the system prompt by this host integration.",
        example:
            "A coding assistant can receive branch and working-tree context for the intended project instead of relying only on what the user describes.",
        boundary:
            "This is not GitHub authentication, permission to commit/push, or a prohibition on running git through an allowed shell or custom tool. Control those effects with tool selection, permission handlers, and service policy.",
        sources: [{ label: "Host Git context contract", url: `${types}#L2913-L2918` }],
    },
};
