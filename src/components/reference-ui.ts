// Copyright (c) Microsoft Corporation. All rights reserved.
import type { ViewId } from "./editor";

const editableControls: Record<string, ViewId> = {
    systemMessage: "prompt",
    availableTools: "tools",
    excludedTools: "tools",
    tools: "tools",
    overridesBuiltInTool: "tools",
    parameters: "tools",
    isTerminal: "tools",
    mcpServers: "tools",
    workingDirectory: "context",
    enableConfigDiscovery: "context",
    enableSkills: "context",
    skillDirectories: "context",
    pluginDirectories: "context",
    customAgents: "agents",
    agent: "agents",
    defaultAgent: "agents",
    "customAgents[].model": "agents",
    model: "models",
    reasoningEffort: "models",
    contextTier: "models",
    provider: "models",
    useLoggedInUser: "models",
    hooks: "policy",
    infiniteSessions: "policy",
    largeOutput: "policy",
    sessionFs: "policy",
    mode: "overview",
    baseDirectory: "policy",
    sessionIdleTimeoutSeconds: "policy",
    streaming: "policy",
    "Harness methods and evals": "policy",
};

const hostControls: Record<string, ViewId> = {
    handler: "tools",
    onPermissionRequest: "policy",
    onUserInputRequest: "tools",
    onEvent: "policy",
    createSessionFsProvider: "policy",
    gitHubTokenProvider: "models",
    bearerTokenProvider: "models",
};

export function controlCoverage(name: string): { label: string; view?: ViewId } {
    if (editableControls[name]) return { label: "Planner subset", view: editableControls[name] };
    if (hostControls[name]) return { label: "Host binding", view: hostControls[name] };
    return { label: "Reference only" };
}

const scopeLabels: Record<string, string> = {
    client: "Startup / client",
    session: "Session",
    live: "Live",
    tool: "Tool declaration",
    runtime: "Runtime",
    host: "Host",
};

export function scopeLabel(scope: string) {
    return scopeLabels[scope] ?? scope;
}
