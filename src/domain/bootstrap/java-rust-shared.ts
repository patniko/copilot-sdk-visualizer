// Copyright (c) Microsoft Corporation. All rights reserved.
import type { HarnessPlan } from "../plan";
import { runtimeEndpoint } from "../target";
import { commonRequirements, sessionData, toolDefinitions } from "./common";
import type { BootstrapBlocker, BootstrapFile, BootstrapRequirement } from "./types";

export const JAVA_RUST_SDK_REVISION = "f45c46fd1812f8bed5b4cbc250f47177c83068f0";

export function javaRustSources(plan: HarnessPlan): string[] {
    return [
        plan.target.runtime === "managed"
            ? "sdk-managed-runtime"
            : plan.target.runtime === "external"
              ? "sdk-existing-runtime"
              : "sdk-inprocess-guide",
    ];
}

export function javaRustChecks(plan: HarnessPlan, language: "java" | "rust"): BootstrapBlocker[] {
    const blockers: BootstrapBlocker[] = [];
    const sources = javaRustSources(plan);
    if (plan.target.cliPath.trim() && plan.target.runtime !== "managed") {
        blockers.push({
            id: `${language}-managed-cli-path-only`,
            title: "An executable override is only supported for managed children",
            detail: "Clear target.cliPath. For in-process hosting, provision a matching runtime package through the host's COPILOT_CLI_PATH before startup; for an existing service, configure its executable on the server host.",
            fields: ["target.cliPath", "target.runtime"],
            sources,
        });
    }
    if (plan.target.runtime === "external") {
        try {
            runtimeEndpoint(plan.target);
        } catch {
            blockers.push({
                id: `${language}-invalid-runtime-endpoint`,
                title: "The existing runtime needs a valid TCP endpoint",
                detail: "Use host:port or tcp://host:port, without credentials, query parameters, or a path.",
                fields: ["target.serverUrl"],
                sources,
            });
        }
    }
    for (const server of plan.mcpServers) {
        for (const tool of server.tools) {
            if (tool.wireName === `${server.name}-${tool.name}`) continue;
            blockers.push({
                id: `${language}-mcp-name-${server.name}-${tool.name}`,
                title: `Correct the runtime name of ${server.name}/${tool.name}`,
                detail: `This SDK exposes the tool as ${server.name}-${tool.name}. Change its wire name and any agent/root references to that name; the SDK does not provide an arbitrary MCP tool renaming layer.`,
                fields: ["mcpServers", "agents", "rootExcludedTools"],
                sources,
            });
        }
    }
    return blockers;
}

export function javaRustConfiguration(plan: HarnessPlan) {
    const endpoint =
        plan.target.runtime === "external"
            ? runtimeEndpoint(plan.target)
            : { host: "", port: 0, address: "" };
    return {
        client: {
            runtime: plan.target.runtime,
            mode: plan.clientMode,
            cliPath: plan.target.cliPath,
            ...endpoint,
            baseDirectory: plan.session.baseDirectory,
            idleTimeoutSeconds: plan.session.idleTimeoutSeconds,
        },
        storage: plan.session.storage,
        identity: plan.identity,
        credential: plan.model.credential,
        credentialEnv: plan.model.credentialEnv,
        observer: plan.events.observer,
        preToolHook: plan.policy.preToolHook,
        postToolHook: plan.policy.postToolHook,
        session: sessionData(plan),
        tools: toolDefinitions(plan),
    };
}

export function javaRustRequirements(plan: HarnessPlan, hostFile: string): BootstrapRequirement[] {
    const requirements = commonRequirements(plan, hostFile);
    const environment = (name: string, detail: string) => {
        const id = `env-${name}`;
        if (!requirements.some((requirement) => requirement.id === id)) {
            requirements.push({
                id,
                title: `Set ${name}`,
                detail,
                file: hostFile,
                kind: "environment",
                environmentVariable: name,
            });
        }
    };
    if (plan.identity === "host-token" && plan.model.provider === "copilot") {
        environment(
            "GITHUB_TOKEN",
            "Supply the host's GitHub access token for the selected Copilot authentication route.",
        );
        environment(
            "GITHUB_TOKEN_EXPIRES_AT",
            "Supply the token's real expiry as a UNIX timestamp in seconds. Each acquisition subtracts the current time and rejects nonpositive remaining lifetime; the adapter never invents or resets a TTL. Replace the host provider to integrate an actual refreshing token broker.",
        );
    } else if (plan.model.provider === "copilot") {
        requirements.push({
            id: "developer-auth",
            title: "Provision developer authentication on the runtime host",
            detail: "The bootstrap permits the runtime's logged-in-user authentication; --check cannot verify that login without contacting the runtime. Empty mode disables the system keychain, so credentials must be available in the selected runtime state location.",
            file: hostFile,
            kind: "review",
        });
    }
    if (plan.target.runtime === "external") {
        environment(
            "COPILOT_CONNECTION_TOKEN",
            "Use the same nonempty connection token in the application and the separately operated runtime. It is never written into configuration data.",
        );
        requirements.push({
            id: "env-COPILOT_RUNTIME_EXECUTABLE",
            environmentVariable: "COPILOT_RUNTIME_EXECUTABLE",
            title: "Set COPILOT_RUNTIME_EXECUTABLE on the server host",
            detail: "Only the separate server launch recipe needs this variable. Point it at the compatible executable runtime wrapper with its adjacent runtime.node/assets; the application does not need access to that server-local file.",
            file: "start-runtime.sh",
            kind: "environment",
        });
        requirements.push({
            id: "server-launch",
            title: "Apply the selected server-owned settings",
            detail: "Run start-runtime.sh --run on the runtime host, with COPILOT_RUNTIME_EXECUTABLE pointing at the compatible runtime wrapper. The script applies the planned state directory, idle timeout, and login policy. These cannot be changed by connecting a client to an already-running service. Secure remote binding and tenant authorization separately.",
            file: "start-runtime.sh",
            kind: "runtime",
        });
    }
    if (plan.model.provider !== "copilot" && plan.model.credential === "bearer-callback") {
        requirements.push({
            id: "bearer-provider",
            title: "Integrate bearer credential rotation",
            detail: "The host callback reads MODEL_BEARER_TOKEN before each provider request. Supply the raw token without a Bearer prefix. An environment variable is not a refreshing credential broker; replace this exact callback for live credential rotation.",
            file: hostFile,
            kind: "review",
        });
    }
    return requirements;
}

function shellLiteral(value: string): string {
    return `'${value.replaceAll("'", "'\"'\"'")}'`;
}

export function javaRustServerFiles(plan: HarnessPlan): BootstrapFile[] {
    if (plan.target.runtime !== "external") return [];
    const endpoint = runtimeEndpoint(plan.target);
    return [
        {
            path: "start-runtime.sh",
            language: "text",
            content: `#!/usr/bin/env bash
# Copyright (c) Microsoft Corporation. All rights reserved.
set -euo pipefail
usage() {
    cat <<'HELP'
Usage: bash start-runtime.sh [--run | --help]
Without --run, print this help and perform no operation.
Run on the existing runtime's host, not necessarily the application machine.
Required environment:
  COPILOT_RUNTIME_EXECUTABLE  Compatible copilot-runtime wrapper (adjacent runtime.node/assets).
  COPILOT_CONNECTION_TOKEN   Nonempty shared TCP connection token, also set on the client.
This script sets the planned server state/login/idle policy. It does not set up
TLS, public binding, a sandbox, or tenant authorization.
HELP
}
if [[ $# -eq 0 || \${1:-} == --help ]]; then usage; exit 0; fi
if [[ $# -ne 1 || $1 != --run ]]; then usage >&2; exit 2; fi
: "\${COPILOT_RUNTIME_EXECUTABLE:?Set the compatible runtime wrapper on the server host}"
: "\${COPILOT_CONNECTION_TOKEN:?Set the shared TCP connection token on both hosts}"
if [[ ! -f $COPILOT_RUNTIME_EXECUTABLE || ! -x $COPILOT_RUNTIME_EXECUTABLE ]]; then
    printf '%s\\n' 'COPILOT_RUNTIME_EXECUTABLE must name an executable file.' >&2
    exit 1
fi
${plan.session.storage === "local" ? `export COPILOT_HOME=${shellLiteral(plan.session.baseDirectory)}\n` : "# SessionFs paths belong to the client provider; server-global storage remains host-owned.\n"}${plan.clientMode === "empty" ? "export COPILOT_DISABLE_KEYTAR=1\n" : ""}args=(--server --no-auto-update --port ${endpoint.port})
${plan.session.idleTimeoutSeconds > 0 ? `args+=(--session-idle-timeout ${plan.session.idleTimeoutSeconds})\n` : ""}${plan.identity === "host-token" ? "args+=(--no-auto-login)\n" : ""}exec "$COPILOT_RUNTIME_EXECUTABLE" "\${args[@]}"
`,
        },
    ];
}
