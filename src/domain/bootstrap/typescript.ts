// Copyright (c) Microsoft Corporation. All rights reserved.
import type { LanguageAdapter } from "./types";
import { commonRequirements, environmentNames, toolDefinitions } from "./common";
import { sourceSetupScript } from "./source-setup";
import { generateSdkCode } from "../export";
import { runtimeEndpoint } from "../target";

export const typescriptAdapter: LanguageAdapter = {
    language: "typescript",
    label: "TypeScript / Node.js",
    check: () => [],
    generate(plan) {
        const requiredTools = toolDefinitions(plan).map((tool) => tool.name);
        const integrationData = {
            env: environmentNames(plan),
            tools: requiredTools,
            preToolHook: plan.policy.preToolHook,
            postToolHook: plan.policy.postToolHook,
            virtualStorage: plan.session.storage === "virtual",
            userInput: plan.tools.ask_user.action === "keep",
            observeEvents: plan.events.observer,
            githubProvider: plan.model.provider === "copilot" && plan.identity === "host-token",
            providerCallback:
                plan.model.provider !== "copilot" && plan.model.credential === "bearer-callback",
            model: plan.model.id.trim(),
        };
        const host = `// Copyright (c) Microsoft Corporation. All rights reserved.
import { readFileSync } from "node:fs";
import { createInterface } from "node:readline/promises";
import type { HostBindings } from "./harness.js";

interface IntegrationSpec {
    env: string[]; tools: string[];
    preToolHook: boolean; postToolHook: boolean; virtualStorage: boolean;
    userInput: boolean; observeEvents: boolean; githubProvider: boolean;
    providerCallback: boolean; model: string;
}
const spec: IntegrationSpec = JSON.parse(readFileSync(new URL("../integration.json", import.meta.url), "utf8"));
type Callbacks = HostBindings["callbacks"];
type Handler = HostBindings["toolHandlers"][string];

// HOST INTEGRATION: add implementations here. No callback is represented by JSON.
// Example shape: tools: { view: async (args, invocation) => { ...validated service call... } }
export const extensions: {
    tools: Record<string, Handler>;
    permissionPolicy?: Callbacks["onPermissionRequest"];
    preToolUse?: NonNullable<Callbacks["hooks"]>["onPreToolUse"];
    postToolUse?: NonNullable<Callbacks["hooks"]>["onPostToolUse"];
    sessionFs?: Callbacks["createSessionFsProvider"];
    githubTokenProvider?: Callbacks["gitHubTokenProvider"];
    providerToken?: HostBindings["providerToken"];
} = { tools: {} };

function env(name: string): string {
    const value = process.env[name];
    if (!value) throw new Error(\`Set \${name} in the process environment; see .env.example.\`);
    return value;
}

function githubCredential() {
    const accessToken = env("GITHUB_TOKEN");
    const expiresAt = Number(env("GITHUB_TOKEN_EXPIRES_AT"));
    const expiresIn = Math.floor(expiresAt - Date.now() / 1000);
    if (!Number.isFinite(expiresAt) || expiresIn <= 0) {
        throw new Error("Supply the credential's real future expiry as UNIX seconds, or implement extensions.githubTokenProvider. Never reset a static token's TTL.");
    }
    return { kind: "token" as const, accessToken, expiresIn };
}

export function integrationIssues(): string[] {
    const requiredEnvironment = spec.env.filter(name =>
        !(extensions.githubTokenProvider && ["GITHUB_TOKEN", "GITHUB_TOKEN_EXPIRES_AT"].includes(name)) &&
        !(extensions.providerToken && name === "MODEL_BEARER_TOKEN"));
    const issues = requiredEnvironment.filter(name => !process.env[name]).map(name => \`Missing environment: \${name}\`);
    if (spec.githubProvider && !extensions.githubTokenProvider &&
        process.env.GITHUB_TOKEN && process.env.GITHUB_TOKEN_EXPIRES_AT) {
        try { githubCredential(); } catch (error) { issues.push(String(error)); }
    }
    for (const name of spec.tools) {
        if (!Object.hasOwn(extensions.tools, name) || typeof extensions.tools[name] !== "function") {
            issues.push(\`Implement src/host.ts extensions.tools[\${JSON.stringify(name)}]\`);
        }
    }
    if (spec.preToolHook && !extensions.preToolUse) issues.push("Implement src/host.ts extensions.preToolUse");
    if (spec.postToolHook && !extensions.postToolUse) issues.push("Implement src/host.ts extensions.postToolUse");
    if (spec.virtualStorage && !extensions.sessionFs) issues.push("Implement src/host.ts extensions.sessionFs (real SessionFsProvider)");
    return issues;
}

export function createHostBindings() {
    const abort = new AbortController();
    let inputTail = Promise.resolve();
    const callbacks: Callbacks = {
        onPermissionRequest: async (request, invocation) => extensions.permissionPolicy
            ? extensions.permissionPolicy(request, invocation)
            : { kind: "reject", feedback: "Default host policy denies tool effects. Implement your authorization policy in src/host.ts." },
    };
    if (spec.userInput) callbacks.onUserInputRequest = async request => {
        const previous = inputTail;
        let release: () => void = () => {};
        inputTail = new Promise<void>(resolve => { release = resolve; });
        await previous;
        const input = createInterface({ input: process.stdin, output: process.stderr });
        try {
            if (!process.stdin.isTTY) throw new Error("User input requires a terminal or a host-specific user-input integration.");
            const choices = request.choices ?? [];
            const answer = await input.question(
                request.question + (choices.length ? "\\nChoices: " + choices.join(" / ") : "") + "\\n> ",
                { signal: abort.signal },
            );
            const isChoice = choices.includes(answer);
            if (!isChoice && request.allowFreeform === false) throw new Error("Answer must match an offered choice.");
            return { answer, wasFreeform: !isChoice };
        } finally { input.close(); release(); }
    };
    if (spec.githubProvider) callbacks.gitHubTokenProvider = extensions.githubTokenProvider ?? (async () => githubCredential());
    if (spec.virtualStorage) callbacks.createSessionFsProvider = extensions.sessionFs;
    if (spec.observeEvents) callbacks.onEvent = event => { console.error(\`[event] \${event.type}\`); };
    callbacks.hooks = {
        ...(spec.preToolHook ? { onPreToolUse: extensions.preToolUse } : {}),
        ...(spec.postToolHook ? { onPostToolUse: extensions.postToolUse } : {}),
    };
    const host: HostBindings = {
        callbacks, toolHandlers: extensions.tools,
        model: spec.model || env("COPILOT_MODEL"),
        ...(spec.providerCallback ? { providerToken: extensions.providerToken ?? (async () => env("MODEL_BEARER_TOKEN")) } : {}),
    };
    return { host, close: () => abort.abort() };
}
`;
        const main = `// Copyright (c) Microsoft Corporation. All rights reserved.
import { createHarness } from "./harness.js";
import { createHostBindings, integrationIssues } from "./host.js";

async function main() {
    const issues = integrationIssues();
    if (issues.length) {
        console.error("Complete these integrations before starting the agent:\\n- " + issues.join("\\n- "));
        process.exitCode = 1;
        return;
    }
    if (process.argv.includes("--check")) {
        console.log("Local preflight passed. No runtime or model was started. Review the default-deny policy before allowing effects.");
        return;
    }
    const prompt = process.argv.slice(2).join(" ").trim();
    if (!prompt) throw new Error('Pass a prompt, for example: npm start -- "Introduce yourself."');
    const bindings = createHostBindings();
    let running: Awaited<ReturnType<typeof createHarness>> | undefined;
    let failure: unknown;
    let failed = false;
    try {
        running = await createHarness(bindings.host);
        const response = await running.session.sendAndWait({ prompt }, 120_000);
        if (response) console.log(response.data.content);
        else console.error("The turn completed without an assistant message (for example, a terminal tool). Inspect the emitted events.");
    } catch (error) { failed = true; failure = error; }
    bindings.close();
    if (running) {
        try { await running.client.stop(); }
        catch (error) { failure = failed ? new AggregateError([failure, error], "Turn and cleanup failed.") : error; failed = true; }
    }
    if (failed) throw failure;
}
main().catch(error => { console.error(error); process.exitCode = 1; });
`;
        const requirements = commonRequirements(plan, "src/host.ts");
        if (plan.target.runtime === "external") requirements.push({
            id: "typescript-connection-token",
            title: "Provide the existing runtime's connection token when required",
            detail: "Set COPILOT_CONNECTION_TOKEN to match the service's transport credential. It is separate from GitHub identity and is never stored in the planner.",
            file: ".env.example",
            kind: "runtime",
            environmentVariable: "COPILOT_CONNECTION_TOKEN",
        });
        return {
            files: [
                {
                    path: "package.json",
                    language: "json",
                    content:
                        JSON.stringify(
                            {
                                name: "generated-copilot-harness",
                                version: "0.1.0",
                                private: true,
                                type: "module",
                                engines: { node: "^20.19.0 || >=22.12.0" },
                                scripts: {
                                    build: "tsc",
                                    check: "tsx src/main.ts --check",
                                    start: "tsx src/main.ts",
                                },
                                dependencies: {
                                    "@github/copilot-sdk": "file:.sdk-source/copilot-sdk/nodejs",
                                },
                                devDependencies: {
                                    typescript: "^6.0.3",
                                    tsx: "^4.20.0",
                                    "@types/node": "^22.0.0",
                                },
                            },
                            null,
                            2,
                        ) + "\n",
                },
                {
                    path: "tsconfig.json",
                    language: "json",
                    content:
                        JSON.stringify(
                            {
                                compilerOptions: {
                                    target: "ES2023",
                                    module: "NodeNext",
                                    moduleResolution: "NodeNext",
                                    strict: true,
                                    skipLibCheck: true,
                                    outDir: "dist",
                                    rootDir: "src",
                                    types: ["node"],
                                },
                                include: ["src/**/*.ts"],
                            },
                            null,
                            2,
                        ) + "\n",
                },
                {
                    path: "setup-sdk.sh",
                    language: "text",
                    content: sourceSetupScript([
                        'npm --prefix "$SDK_DIRECTORY/nodejs" install',
                        'npm --prefix "$SDK_DIRECTORY/nodejs" run build',
                        "npm install",
                    ]),
                },
                {
                    path: "integration.json",
                    language: "json",
                    content: JSON.stringify(integrationData, null, 2) + "\n",
                },
                { path: "src/harness.ts", language: "typescript", content: generateSdkCode(plan) },
                { path: "src/host.ts", language: "typescript", content: host },
                { path: "src/main.ts", language: "typescript", content: main },
                {
                    path: "HOST_INTEGRATION.md",
                    language: "markdown",
                    content: [
                        "# Host integration points",
                        "",
                        "Edit `src/host.ts` rather than rewriting SDK plumbing.",
                        "",
                        "- `extensions.tools`: implement each selected custom/override handler. Validate arguments and tenant/resource authority.",
                        "- `extensions.permissionPolicy`: default is reject. Supply your production authorization and approval rules before allowing effects.",
                        "- `extensions.preToolUse` / `postToolUse`: required only if selected; replace with real policy/result processing.",
                        "- `extensions.sessionFs`: return a real SDK SessionFsProvider when virtual storage is selected.",
                        "- `extensions.githubTokenProvider`: replace the environment adapter with your actual token acquisition/refresh integration.",
                        "- `extensions.providerToken`: replace the provider environment adapter with managed identity or your credential service if appropriate.",
                        "",
                        "SessionFsProvider requires async readFile, writeFile, appendFile, exists, stat, mkdir, readdir, readdirWithTypes, rm, and rename. The sketch does not advertise SQLite. Never substitute an empty/no-op implementation.",
                        "",
                        "The environment GitHub adapter expects GITHUB_TOKEN_EXPIRES_AT as the token issuer's actual absolute UNIX expiry. It computes remaining lifetime, never resets a static token's expiry.",
                        "",
                        "The source SDK is pinned because this snapshot is newer than a verified published package. Setup provisions it locally under .sdk-source; the visualizer itself does not fetch or run it.",
                        "",
                    ].join("\n"),
                },
            ],
            commands: {
                install: ["bash setup-sdk.sh", "npm run build"],
                check: "npm run check",
                run: 'npm start -- "Introduce yourself and explain your configured role."',
                ...(plan.target.runtime === "external"
                    ? { startRuntime: `copilot --headless --port ${runtimeEndpoint(plan.target).port}` }
                    : {}),
            },
            requirements,
            notes: [
                "The SDK source is pinned to the inspected commit, not the unpublished 0.0.0-dev package on a registry. Setup requires Git, npm, and network/access to that source.",
                plan.target.runtime === "inprocess"
                    ? "RuntimeConnection.forInProcess is experimental. Supply the matching native bundle; COPILOT_CLI_PATH can point into a runtime package before startup. Process state and the loaded native library are shared."
                    : plan.target.runtime === "external"
                      ? `The client connects to ${plan.target.serverUrl}. Configure server-owned state directory (${plan.session.baseDirectory}) and idle policy (${plan.session.idleTimeoutSeconds}s) on that server; they are not passed as client process options. COPILOT_CONNECTION_TOKEN can supply a connection credential.`
                      : "RuntimeConnection.forStdio explicitly selects a managed subprocess; SDK cleanup owns that child. A separate process is not an OS or tenant sandbox.",
                "Credential values are never exported. Environment references are starter adapters, not a production credential-refresh service.",
                "The default permission callback rejects effects. Selected host tools/hooks/storage remain explicit integration requirements; --check fails until they are supplied.",
            ],
            sources: [
                "sdk-inprocess-guide",
                "sdk-managed-runtime",
                "sdk-existing-runtime",
                "sdk-tools",
                "sdk-prompts",
                "sdk-auth",
            ],
        };
    },
};
