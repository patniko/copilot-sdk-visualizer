// Copyright (c) Microsoft Corporation. All rights reserved.
import type { LanguageAdapter } from "./types";
import { commonRequirements, environmentNames, toolDefinitions } from "./common";
import { sourceSetupScript } from "./source-setup";
import type { SourceCheckout } from "./source-setup";
import { COPILOT_CLI_VERSION, RUNTIME_SOURCE_REVISION } from "./revisions";
import { HANDLER_CALLBACKS, generateSdkCode, hookCallbackName } from "../export";
import { runtimeEndpoint } from "../target";

/** The TypeScript SDK is built from the runtime repository, where it now lives (src/sdk/nodejs). */
export const NODE_SDK_CHECKOUT: SourceCheckout = {
    repository: "https://github.com/github/copilot-agent-runtime.git",
    revision: RUNTIME_SOURCE_REVISION,
    directory: ".sdk-source/copilot-agent-runtime",
    // The SDK's build tools are vendored outside the package directory.
    sparse: [
        "src/sdk/nodejs",
        "third_party/build-tools/prettier-3.8.1",
        "third_party/build-tools/tsx-4.22.4",
        "third_party/build-tools/vite-8.3.4",
    ],
    access: "read access to the private github/copilot-agent-runtime repository (cli-1.0.100-1)",
};
const NODE_SDK_PATH = `${NODE_SDK_CHECKOUT.directory}/src/sdk/nodejs`;

export const typescriptAdapter: LanguageAdapter = {
    language: "typescript",
    label: "TypeScript / Node.js",
    check: () => [],
    generate(plan) {
        const s2s = plan.model.provider === "copilot" && plan.identity === "s2s-installation";
        const requiredTools = toolDefinitions(plan).map((tool) => tool.name);
        const integrationData = {
            env: environmentNames(plan),
            tools: requiredTools,
            permissionMode: plan.policy.permissionMode,
            preToolHook: plan.policy.preToolHook,
            postToolHook: plan.policy.postToolHook,
            hooks: plan.policy.hooks.map(hookCallbackName),
            handlers: plan.policy.handlers.map((handler) => HANDLER_CALLBACKS[handler]),
            skillProvider: plan.context.skillProvider,
            virtualStorage: plan.session.storage === "virtual",
            userInput: plan.tools.ask_user.action === "keep",
            observeEvents: plan.events.observer,
            githubProvider: plan.model.provider === "copilot" && plan.identity === "host-token",
            providerCallback:
                plan.model.provider !== "copilot" && plan.model.credential === "bearer-callback",
            providerEndpoint: plan.model.provider !== "copilot" && !plan.model.endpoint.trim(),
            model: plan.model.id.trim(),
        };
        const githubExtension = s2s ? "" : '    githubTokenProvider?: Callbacks["gitHubTokenProvider"];\n';
        const githubCredential = s2s
            ? ""
            : `
function githubCredential() {
    const accessToken = env("GITHUB_TOKEN");
    const expiresAt = Number(env("GITHUB_TOKEN_EXPIRES_AT"));
    const expiresIn = Math.floor(expiresAt - Date.now() / 1000);
    if (!Number.isFinite(expiresAt) || expiresIn <= 0) {
        throw new Error("Supply the credential's real future expiry as UNIX seconds, or implement extensions.githubTokenProvider. Never reset a static token's TTL.");
    }
    return { kind: "token" as const, accessToken, expiresIn };
}
`;
        const githubEnvironmentFilter = s2s
            ? ""
            : `
        !(extensions.githubTokenProvider && ["GITHUB_TOKEN", "GITHUB_TOKEN_EXPIRES_AT"].includes(name)) &&`;
        const githubPreflight = s2s
            ? ""
            : `
    if (spec.githubProvider && !extensions.githubTokenProvider &&
        process.env.GITHUB_TOKEN && process.env.GITHUB_TOKEN_EXPIRES_AT) {
        try { githubCredential(); } catch (error) { issues.push(String(error)); }
    }`;
        const githubBinding = s2s
            ? ""
            : `
    if (spec.githubProvider) callbacks.gitHubTokenProvider = extensions.githubTokenProvider ?? (async () => githubCredential());`;
        const host = `// Copyright (c) Microsoft Corporation. All rights reserved.
import { readFileSync } from "node:fs";
import { createInterface } from "node:readline/promises";
import type { HostBindings } from "./harness.js";

interface IntegrationSpec {
    env: string[]; tools: string[];
    permissionMode: "host" | "allow-all";
    preToolHook: boolean; postToolHook: boolean;
    hooks: LifecycleHookName[]; handlers: HandlerName[]; skillProvider: boolean;
    virtualStorage: boolean;
    userInput: boolean; observeEvents: boolean; githubProvider: boolean;
    providerCallback: boolean; providerEndpoint: boolean; model: string;
}
const spec: IntegrationSpec = JSON.parse(readFileSync(new URL("../integration.json", import.meta.url), "utf8"));
type Callbacks = HostBindings["callbacks"];
type Handler = HostBindings["toolHandlers"][string];
type Hooks = NonNullable<Callbacks["hooks"]>;
type LifecycleHookName = Exclude<keyof Hooks, "onPreToolUse" | "onPostToolUse">;
type HandlerName = "onElicitationRequest" | "onExitPlanModeRequest" | "onAutoModeSwitchRequest" | "onMcpAuthRequest";

// HOST INTEGRATION: add implementations here. No callback is represented by JSON.
// Example shape: tools: { view: async (args, invocation) => { ...validated service call... } }
export const extensions: {
    tools: Record<string, Handler>;
    permissionPolicy?: Callbacks["onPermissionRequest"];
    preToolUse?: Hooks["onPreToolUse"];
    postToolUse?: Hooks["onPostToolUse"];
    // Selected lifecycle hooks, keyed by SDK name (for example onSubagentStart).
    lifecycleHooks?: Partial<Pick<Hooks, LifecycleHookName>>;
    // Selected host request handlers, keyed by SDK name (for example onElicitationRequest).
    handlers?: Partial<Pick<Callbacks, HandlerName>>;
    // Experimental: skills served from host storage (listSkills/readSkill).
    skillProvider?: Callbacks["skillProvider"];
    sessionFs?: Callbacks["createSessionFsProvider"];
${githubExtension}\
    providerToken?: HostBindings["providerToken"];
    providerEndpoint?: string;
} = { tools: {} };

function env(name: string): string {
    const value = process.env[name];
    if (!value) throw new Error(\`Set \${name} in the process environment; see .env.example.\`);
    return value;
}

${githubCredential}

export function integrationIssues(): string[] {
    const requiredEnvironment = spec.env.filter(name =>
${githubEnvironmentFilter}
        !(extensions.providerToken && name === "MODEL_BEARER_TOKEN"));
    const issues = requiredEnvironment.filter(name => !process.env[name]).map(name => \`Missing environment: \${name}\`);
${githubPreflight}
    for (const name of spec.tools) {
        if (!Object.hasOwn(extensions.tools, name) || typeof extensions.tools[name] !== "function") {
            issues.push(\`Implement src/host.ts extensions.tools[\${JSON.stringify(name)}]\`);
        }
    }
    if (spec.permissionMode === "host" && !extensions.permissionPolicy) issues.push("Implement src/host.ts extensions.permissionPolicy");
    if (spec.preToolHook && !extensions.preToolUse) issues.push("Implement src/host.ts extensions.preToolUse");
    if (spec.postToolHook && !extensions.postToolUse) issues.push("Implement src/host.ts extensions.postToolUse");
    for (const name of spec.hooks) {
        if (!extensions.lifecycleHooks?.[name]) issues.push(\`Implement src/host.ts extensions.lifecycleHooks.\${name}\`);
    }
    for (const name of spec.handlers) {
        if (!extensions.handlers?.[name]) issues.push(\`Implement src/host.ts extensions.handlers.\${name}\`);
    }
    if (spec.skillProvider && !extensions.skillProvider) issues.push("Implement src/host.ts extensions.skillProvider (real SkillProvider)");
    if (spec.virtualStorage && !extensions.sessionFs) issues.push("Implement src/host.ts extensions.sessionFs (real SessionFsProvider)");
    if (spec.providerEndpoint && !extensions.providerEndpoint?.trim()) issues.push("Provide src/host.ts extensions.providerEndpoint (provider endpoint string)");
    return issues;
}

export function createHostBindings() {
    const abort = new AbortController();
    let inputTail = Promise.resolve();
    const callbacks: Callbacks = {};
    if (spec.permissionMode === "host") callbacks.onPermissionRequest = extensions.permissionPolicy;
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
${githubBinding}
    if (spec.virtualStorage) callbacks.createSessionFsProvider = extensions.sessionFs;
    if (spec.observeEvents) callbacks.onEvent = event => { console.error(\`[event] \${event.type}\`); };
    callbacks.hooks = {
        ...(spec.preToolHook ? { onPreToolUse: extensions.preToolUse } : {}),
        ...(spec.postToolHook ? { onPostToolUse: extensions.postToolUse } : {}),
        ...Object.fromEntries(spec.hooks.map(name => [name, extensions.lifecycleHooks?.[name]])),
    };
    for (const name of spec.handlers) Object.assign(callbacks, { [name]: extensions.handlers?.[name] });
    if (spec.skillProvider) callbacks.skillProvider = extensions.skillProvider;
    const host: HostBindings = {
        callbacks, toolHandlers: extensions.tools,
        model: spec.model || env("COPILOT_MODEL"),
        ...(spec.providerEndpoint ? { providerEndpoint: extensions.providerEndpoint } : {}),
        ...(spec.providerCallback ? { providerToken: extensions.providerToken ?? (async () => env("MODEL_BEARER_TOKEN")) } : {}),
    };
    return { host, close: () => abort.abort() };
}
`;
        const structured = Boolean(plan.output.responseSchema.trim());
        const main = `// Copyright (c) Microsoft Corporation. All rights reserved.
import { createHarness${structured ? ", responseSchema" : ""} } from "./harness.js";
import { createHostBindings, integrationIssues } from "./host.js";

async function main() {
    const issues = integrationIssues();
    if (issues.length) {
        console.error("Complete these integrations before starting the agent:\\n- " + issues.join("\\n- "));
        process.exitCode = 1;
        return;
    }
    if (process.argv.includes("--check")) {
        console.log("Local preflight passed. No runtime or model was started. Review the selected permission policy before allowing effects.");
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
        const response = await running.session.sendAndWait({ prompt${structured ? ", responseSchema" : ""} }, 120_000);
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
        if (plan.target.runtime === "external")
            requirements.push({
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
                                    "@github/copilot-sdk": `file:${NODE_SDK_PATH}`,
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
                    content: sourceSetupScript(
                        [
                            `NODE_SDK="$SDK_DIRECTORY/src/sdk/nodejs"`,
                            'npm --prefix "$NODE_SDK" ci',
                            "# The in-repo SDK is versioned 0.0.0-dev; bake in the runtime it should download.",
                            `(cd "$NODE_SDK" && node scripts/set-cli-version.js ${COPILOT_CLI_VERSION})`,
                            'npm --prefix "$NODE_SDK" run build',
                            "# Restore the two version files so a rerun still sees a clean pinned checkout.",
                            'git -C "$SDK_DIRECTORY" checkout --quiet -- src/sdk/nodejs/package.json src/sdk/nodejs/src/cliVersion.ts',
                            "npm install",
                        ],
                        NODE_SDK_CHECKOUT,
                    ),
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
                        "- `extensions.permissionPolicy`: required when the plan selects host permission handling. Supply production authorization and approval rules before allowing effects.",
                        "- `extensions.providerEndpoint`: supply the endpoint string when it was left blank in the planner. Preflight and startup fail until it is provided.",
                        "- `extensions.preToolUse` / `postToolUse`: required only if selected; replace with real policy/result processing.",
                        ...(plan.policy.hooks.length
                            ? [
                                  `- \`extensions.lifecycleHooks\`: implement ${plan.policy.hooks.map((hook) => `\`${hookCallbackName(hook)}\``).join(", ")}. userPromptSubmitted can return { decision: "block", reason }; subagentStop can block with a nonempty reason or rewrite the response.`,
                              ]
                            : []),
                        ...(plan.policy.handlers.length
                            ? [
                                  `- \`extensions.handlers\`: implement ${plan.policy.handlers.map((handler) => `\`${HANDLER_CALLBACKS[handler]}\``).join(", ")}.`,
                              ]
                            : []),
                        ...(plan.context.skillProvider
                            ? [
                                  "- `extensions.skillProvider` (experimental): return skill descriptors and SKILL.md text from your skill store. Calls must finish within 30 seconds; pass the provider again when resuming.",
                              ]
                            : []),
                        "- `extensions.sessionFs`: return a real SDK SessionFsProvider when virtual storage is selected.",
                        ...(s2s
                            ? [
                                  "- GitHub App S2S: mint the installation token outside this project. Managed children receive `COPILOT_GITHUB_TOKEN`; in-process hosts require it before runtime load; external runtimes are configured separately.",
                                  "- GitHub App S2S has no per-session token callback. Replace the one-hour token by restarting or reconfiguring the runtime, then resume the session as appropriate.",
                              ]
                            : [
                                  "- `extensions.githubTokenProvider`: replace the environment adapter with your actual token acquisition/refresh integration.",
                              ]),
                        "- `extensions.providerToken`: replace the provider environment adapter with managed identity or your credential service if appropriate.",
                        "",
                        "SessionFsProvider requires async readFile, writeFile, appendFile, exists, stat, mkdir, readdir, readdirWithTypes, rm, and rename. The sketch does not advertise SQLite. Never substitute an empty/no-op implementation.",
                        "",
                        ...(s2s
                            ? []
                            : [
                                  "The environment GitHub adapter expects GITHUB_TOKEN_EXPIRES_AT as the token issuer's actual absolute UNIX expiry. It computes remaining lifetime, never resets a static token's expiry.",
                              ]),
                        "",
                        "The TypeScript SDK now lives in github/copilot-agent-runtime (src/sdk/nodejs). Setup sparse-checks out the pinned cli-1.0.100-1 commit under .sdk-source, sets the runtime version it downloads, and builds it locally; the visualizer itself does not fetch or run it.",
                        "",
                    ].join("\n"),
                },
            ],
            commands: {
                install: ["bash setup-sdk.sh --run", "npm run build"],
                check: "npm run check",
                run: 'npm start -- "Introduce yourself and explain your configured role."',
                ...(plan.target.runtime === "external"
                    ? {
                          startRuntime: [
                              ...(s2s ? ['test -n "$COPILOT_GITHUB_TOKEN" &&'] : []),
                              "copilot --headless",
                              ...(s2s ? ["--no-auto-login"] : []),
                              `--port ${runtimeEndpoint(plan.target).port}`,
                          ].join(" "),
                      }
                    : {}),
            },
            requirements,
            notes: [
                `The SDK source is pinned to copilot-agent-runtime tag cli-1.0.100-1 (src/sdk/nodejs), not a registry package. Setup requires Git, npm, network access, and read access to that private repository; the built SDK downloads Copilot CLI runtime ${COPILOT_CLI_VERSION}.`,
                plan.target.runtime === "inprocess"
                    ? "RuntimeConnection.forInProcess is experimental. Supply the matching native bundle; COPILOT_CLI_PATH can point into a runtime package before startup. Process state and the loaded native library are shared."
                    : plan.target.runtime === "external"
                      ? `The client connects to ${plan.target.serverUrl}. Configure server-owned state directory (${plan.session.baseDirectory}) and idle policy (${plan.session.idleTimeoutSeconds}s) on that server; they are not passed as client process options. COPILOT_CONNECTION_TOKEN can supply a connection credential.`
                      : "RuntimeConnection.forStdio explicitly selects a managed subprocess; SDK cleanup owns that child. A separate process is not an OS or tenant sandbox.",
                "Credential values are never exported. Environment references are starter adapters, not a production credential-refresh service.",
                plan.policy.permissionMode === "host"
                    ? "Host permission handling is an explicit integration requirement; --check fails until extensions.permissionPolicy is supplied. Selected host tools/hooks/storage behave the same way."
                    : "The generated harness explicitly binds the SDK approveAll helper. It approves ordinary requests once and does not override managed policy, content exclusion, downstream authorization, tool validity, or sandbox enablement; enabled sandbox bypass can also be approved.",
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
