// Copyright (c) Microsoft Corporation. All rights reserved.

export type FileHookEffect = "Can block" | "Can modify" | "Adds context" | "Observe only";

export interface FileHookEvent {
    name: string;
    firesWhen: string;
    effect: FileHookEffect;
    detail: string;
}

export interface FileHookEventGroup {
    phase: string;
    events: FileHookEvent[];
}

export const FILE_HOOKS_REFERENCE_URL = "https://docs.github.com/en/copilot/reference/hooks-reference";

export const fileHookEventGroups: FileHookEventGroup[] = [
    {
        phase: "Session",
        events: [
            {
                name: "sessionStart",
                firesWhen: "A new or resumed session begins.",
                effect: "Adds context",
                detail: "Can inject additionalContext into the session.",
            },
            {
                name: "sessionEnd",
                firesWhen: "The session terminates.",
                effect: "Observe only",
                detail: "Output is not processed.",
            },
        ],
    },
    {
        phase: "Prompt",
        events: [
            {
                name: "userPromptSubmitted",
                firesWhen: "The user submits a prompt.",
                effect: "Observe only",
                detail: "modifiedPrompt is honored only by SDK programmatic hooks.",
            },
            {
                name: "userPromptTransformed",
                firesWhen: "The prompt becomes model-facing content, just before it is added to history.",
                effect: "Can modify",
                detail: "Can rewrite what the model receives, but not block the turn.",
            },
        ],
    },
    {
        phase: "Tools",
        events: [
            {
                name: "preToolUse",
                firesWhen: "Before each tool executes.",
                effect: "Can block",
                detail: "Can allow, deny, or modify the call.",
            },
            {
                name: "permissionRequest",
                firesWhen: "Before the permission service decides a tool request.",
                effect: "Can block",
                detail: "Can allow or deny programmatically; sandbox-bypass requests still need the user.",
            },
            {
                name: "postToolUse",
                firesWhen: "After each tool completes successfully.",
                effect: "Can modify",
                detail: "Can modify the result or add context for the model.",
            },
            {
                name: "postToolUseFailure",
                firesWhen: "After a tool completes with a failure.",
                effect: "Adds context",
                detail: "Can provide recovery guidance through additionalContext.",
            },
        ],
    },
    {
        phase: "Agents",
        events: [
            {
                name: "agentStop",
                firesWhen: "The main agent finishes a turn.",
                effect: "Can block",
                detail: "Can block the stop and force another turn.",
            },
            {
                name: "subagentStart",
                firesWhen: "A subagent is spawned, before it runs.",
                effect: "Adds context",
                detail: "Cannot block creation; additionalContext is prepended to the subagent prompt.",
            },
            {
                name: "subagentStop",
                firesWhen: "A subagent completes.",
                effect: "Can block",
                detail: "Can block the stop and force continuation.",
            },
        ],
    },
    {
        phase: "Context & signals",
        events: [
            {
                name: "preCompact",
                firesWhen: "Context compaction is about to begin (manual or automatic).",
                effect: "Observe only",
                detail: "Notification only; cannot block compaction.",
            },
            {
                name: "errorOccurred",
                firesWhen: "An error occurs during execution.",
                effect: "Observe only",
                detail: "Output is not processed.",
            },
            {
                name: "notification",
                firesWhen: "The host emits a system notification, such as a permission prompt or idle agent.",
                effect: "Adds context",
                detail: "Fire-and-forget; never blocks the session.",
            },
        ],
    },
];
