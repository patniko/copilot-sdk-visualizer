import{F as e,J as t,M as n,Y as r,d as i,et as a,ft as o,i as s,m as c,mt as l,n as u,rt as d,t as f,tt as p,u as m,ut as h}from"./ui-D6Vo2Jyp.js";import{t as g}from"./arrow-up-right-C-Cyrg-u.js";import{c as _,d as v,f as y,l as b,m as x,n as S,o as C,p as w,s as T,t as E,u as ee}from"./download-C0k4niwT.js";import{n as D,r as O,t as k}from"./terminal-Bv7Nv7Uw.js";import{A,B as j,J as M,P as N,Q as P,T as te,W as F,X as ne,Y as re,Z as I,at as L,b as R,et as ie,f as ae,i as oe,it as se,j as z,k as B,nt as ce,t as le,tt as ue,y as de}from"./index-g57z6v8Y.js";import{i as fe,n as pe,r as me,t as he}from"./dist-DTIwlAaH.js";var ge={name:`cable`,size:24,node:[[`path`,{d:`M17 19a1 1 0 0 1-1-1v-2a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2a1 1 0 0 1-1 1z`,key:`trhst0`}],[`path`,{d:`M17 21v-2`,key:`ds4u3f`}],[`path`,{d:`M19 14V6.5a1 1 0 0 0-7 0v11a1 1 0 0 1-7 0V10`,key:`1mo9zo`}],[`path`,{d:`M21 21v-2`,key:`eo0ou`}],[`path`,{d:`M3 5V3`,key:`1k5hjh`}],[`path`,{d:`M4 10a2 2 0 0 1-2-2V6a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2a2 2 0 0 1-2 2z`,key:`1dd30t`}],[`path`,{d:`M7 5V3`,key:`1t1388`}]]};ge.node;var _e=h(ge),ve={name:`folder`,size:24,node:[[`path`,{d:`M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z`,key:`1kt360`}]]};ve.node;var ye=h(ve),be={name:`list-checks`,size:24,node:[[`path`,{d:`M13 5h8`,key:`a7qcls`}],[`path`,{d:`M13 12h8`,key:`h98zly`}],[`path`,{d:`M13 19h8`,key:`c3s6r1`}],[`path`,{d:`m3 17 2 2 4-4`,key:`1jhpwq`}],[`path`,{d:`m3 7 2 2 4-4`,key:`1obspn`}]]};be.node;var xe=h(be),V=l(o(),1),Se={repository:`https://github.com/github/copilot-sdk.git`,revision:z,directory:`.sdk-source/copilot-sdk`};function Ce(e,t=Se){return[`#!/usr/bin/env bash`,`# Copyright (c) Microsoft Corporation. All rights reserved.`,`set -euo pipefail`,`usage() {`,`  cat <<'HELP'`,`Usage: bash setup-sdk.sh [--run | --help]`,`Without --run, explain setup without changing files.`,`Requires Git, Node.js, npm, and ${t.access??`access to the pinned SDK source`}.`,`Provisions ${t.directory} and installs/builds the generated project.`,`Existing symlinks, non-repository directories, dirty checkouts, or another revision are refused.`,`HELP`,`}`,'if [ "$#" -eq 0 ] || [ "${1:-}" = "--help" ]; then usage; exit 0; fi',`if [ "$#" -ne 1 ] || [ "$1" != "--run" ]; then usage >&2; exit 2; fi`,`cd "$(dirname "$0")"`,`SDK_REVISION=${t.revision}`,`SDK_DIRECTORY=${t.directory}`,`if [ -L .sdk-source ] || [ -L "$SDK_DIRECTORY" ]; then`,`  printf "Refusing SDK setup through a symlink.\\n" >&2`,`  exit 1`,`fi`,`if [ -e "$SDK_DIRECTORY" ] && [ ! -d "$SDK_DIRECTORY/.git" ]; then`,`  printf "Refusing to overwrite an existing non-Git SDK directory.\\n" >&2`,`  exit 1`,`fi`,`if [ ! -d "$SDK_DIRECTORY/.git" ]; then`,`  mkdir -p "$SDK_DIRECTORY"`,`  git -C "$SDK_DIRECTORY" init --quiet`,`  git -C "$SDK_DIRECTORY" remote add origin ${t.repository}`,...t.sparse?.length?[`  git -C "$SDK_DIRECTORY" config core.sparseCheckout true`,`  git -C "$SDK_DIRECTORY" sparse-checkout set --no-cone ${t.sparse.map(e=>`'/${e}/'`).join(` `)}`,`  git -C "$SDK_DIRECTORY" fetch --quiet --depth 1 --filter=blob:none origin "$SDK_REVISION"`]:[`  git -C "$SDK_DIRECTORY" fetch --quiet --depth 1 origin "$SDK_REVISION"`],`  git -C "$SDK_DIRECTORY" checkout --quiet --detach "$SDK_REVISION"`,`else`,`  ACTUAL_REVISION=$(git -C "$SDK_DIRECTORY" rev-parse HEAD)`,`  if [ "$ACTUAL_REVISION" != "$SDK_REVISION" ]; then`,`    printf "Existing SDK checkout has another revision; resolve it manually. No reset was performed.\\n" >&2`,`    exit 1`,`  fi`,`  if [ -n "$(git -C "$SDK_DIRECTORY" status --porcelain)" ]; then`,`    printf "Existing SDK checkout has local changes; review them before setup.\\n" >&2`,`    exit 1`,`  fi`,`fi`,...e,`printf "\\nSDK source provisioning complete. Review README.md and host integration points before running.\\n"`,``].join(`
`)}var we={repository:`https://github.com/github/copilot-agent-runtime.git`,revision:A,directory:`.sdk-source/copilot-agent-runtime`,sparse:[`src/sdk/nodejs`,`third_party/build-tools/prettier-3.8.1`,`third_party/build-tools/tsx-4.22.4`,`third_party/build-tools/vite-8.3.4`],access:`read access to the private github/copilot-agent-runtime repository (cli-1.0.100-1)`},Te=`${we.directory}/src/sdk/nodejs`,Ee={language:`typescript`,label:`TypeScript / Node.js`,check:()=>[],generate(e){let t=e.model.provider===`copilot`&&e.identity===`s2s-installation`,n=w(e).map(e=>e.name),r={env:ee(e),tools:n,permissionMode:e.policy.permissionMode,preToolHook:e.policy.preToolHook,postToolHook:e.policy.postToolHook,hooks:e.policy.hooks.map(T),handlers:e.policy.handlers.map(e=>S[e]),skillProvider:e.context.skillProvider,virtualStorage:e.session.storage===`virtual`,userInput:e.tools.ask_user.action===`keep`,observeEvents:e.events.observer,githubProvider:e.model.provider===`copilot`&&e.identity===`host-token`,providerCallback:e.model.provider!==`copilot`&&e.model.credential===`bearer-callback`,providerEndpoint:e.model.provider!==`copilot`&&!e.model.endpoint.trim(),model:e.model.id.trim()},i=`// Copyright (c) Microsoft Corporation. All rights reserved.
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
${t?``:`    githubTokenProvider?: Callbacks["gitHubTokenProvider"];
`}\
    providerToken?: HostBindings["providerToken"];
    providerEndpoint?: string;
} = { tools: {} };

function env(name: string): string {
    const value = process.env[name];
    if (!value) throw new Error(\`Set \${name} in the process environment; see .env.example.\`);
    return value;
}

${t?``:`
function githubCredential() {
    const accessToken = env("GITHUB_TOKEN");
    const expiresAt = Number(env("GITHUB_TOKEN_EXPIRES_AT"));
    const expiresIn = Math.floor(expiresAt - Date.now() / 1000);
    if (!Number.isFinite(expiresAt) || expiresIn <= 0) {
        throw new Error("Supply the credential's real future expiry as UNIX seconds, or implement extensions.githubTokenProvider. Never reset a static token's TTL.");
    }
    return { kind: "token" as const, accessToken, expiresIn };
}
`}

export function integrationIssues(): string[] {
    const requiredEnvironment = spec.env.filter(name =>
${t?``:`
        !(extensions.githubTokenProvider && ["GITHUB_TOKEN", "GITHUB_TOKEN_EXPIRES_AT"].includes(name)) &&`}
        !(extensions.providerToken && name === "MODEL_BEARER_TOKEN"));
    const issues = requiredEnvironment.filter(name => !process.env[name]).map(name => \`Missing environment: \${name}\`);
${t?``:`
    if (spec.githubProvider && !extensions.githubTokenProvider &&
        process.env.GITHUB_TOKEN && process.env.GITHUB_TOKEN_EXPIRES_AT) {
        try { githubCredential(); } catch (error) { issues.push(String(error)); }
    }`}
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
${t?``:`
    if (spec.githubProvider) callbacks.gitHubTokenProvider = extensions.githubTokenProvider ?? (async () => githubCredential());`}
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
`,a=!!e.output.responseSchema.trim(),o=`// Copyright (c) Microsoft Corporation. All rights reserved.
import { createHarness${a?`, responseSchema`:``} } from "./harness.js";
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
        const response = await running.session.sendAndWait({ prompt${a?`, responseSchema`:``} }, 120_000);
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
`,s=b(e,`src/host.ts`);return e.target.runtime===`external`&&s.push({id:`typescript-connection-token`,title:`Provide the existing runtime's connection token when required`,detail:`Set COPILOT_CONNECTION_TOKEN to match the service's transport credential. It is separate from GitHub identity and is never stored in the planner.`,file:`.env.example`,kind:`runtime`,environmentVariable:`COPILOT_CONNECTION_TOKEN`}),{files:[{path:`package.json`,language:`json`,content:JSON.stringify({name:`generated-copilot-harness`,version:`0.1.0`,private:!0,type:`module`,engines:{node:`^20.19.0 || >=22.12.0`},scripts:{build:`tsc`,check:`tsx src/main.ts --check`,start:`tsx src/main.ts`},dependencies:{"@github/copilot-sdk":`file:${Te}`},devDependencies:{typescript:`^6.0.3`,tsx:`^4.20.0`,"@types/node":`^22.0.0`}},null,2)+`
`},{path:`tsconfig.json`,language:`json`,content:JSON.stringify({compilerOptions:{target:`ES2023`,module:`NodeNext`,moduleResolution:`NodeNext`,strict:!0,skipLibCheck:!0,outDir:`dist`,rootDir:`src`,types:[`node`]},include:[`src/**/*.ts`]},null,2)+`
`},{path:`setup-sdk.sh`,language:`text`,content:Ce([`NODE_SDK="$SDK_DIRECTORY/src/sdk/nodejs"`,`npm --prefix "$NODE_SDK" ci`,`# The in-repo SDK is versioned 0.0.0-dev; bake in the runtime it should download.`,`(cd "$NODE_SDK" && node scripts/set-cli-version.js ${B})`,`npm --prefix "$NODE_SDK" run build`,`# Restore the two version files so a rerun still sees a clean pinned checkout.`,`git -C "$SDK_DIRECTORY" checkout --quiet -- src/sdk/nodejs/package.json src/sdk/nodejs/src/cliVersion.ts`,`npm install`],we)},{path:`integration.json`,language:`json`,content:JSON.stringify(r,null,2)+`
`},{path:`src/harness.ts`,language:`typescript`,content:C(e)},{path:`src/host.ts`,language:`typescript`,content:i},{path:`src/main.ts`,language:`typescript`,content:o},{path:`HOST_INTEGRATION.md`,language:`markdown`,content:[`# Host integration points`,``,"Edit `src/host.ts` rather than rewriting SDK plumbing.",``,"- `extensions.tools`: implement each selected custom/override handler. Validate arguments and tenant/resource authority.","- `extensions.permissionPolicy`: required when the plan selects host permission handling. Supply production authorization and approval rules before allowing effects.","- `extensions.providerEndpoint`: supply the endpoint string when it was left blank in the planner. Preflight and startup fail until it is provided.","- `extensions.preToolUse` / `postToolUse`: required only if selected; replace with real policy/result processing.",...e.policy.hooks.length?[`- \`extensions.lifecycleHooks\`: implement ${e.policy.hooks.map(e=>`\`${T(e)}\``).join(`, `)}. userPromptSubmitted can return { decision: "block", reason }; subagentStop can block with a nonempty reason or rewrite the response.`]:[],...e.policy.handlers.length?[`- \`extensions.handlers\`: implement ${e.policy.handlers.map(e=>`\`${S[e]}\``).join(`, `)}.`]:[],...e.context.skillProvider?["- `extensions.skillProvider` (experimental): return skill descriptors and SKILL.md text from your skill store. Calls must finish within 30 seconds; pass the provider again when resuming."]:[],"- `extensions.sessionFs`: return a real SDK SessionFsProvider when virtual storage is selected.",...t?["- GitHub App S2S: mint the installation token outside this project. Managed children receive `COPILOT_GITHUB_TOKEN`; in-process hosts require it before runtime load; external runtimes are configured separately.",`- GitHub App S2S has no per-session token callback. Replace the one-hour token by restarting or reconfiguring the runtime, then resume the session as appropriate.`]:["- `extensions.githubTokenProvider`: replace the environment adapter with your actual token acquisition/refresh integration."],"- `extensions.providerToken`: replace the provider environment adapter with managed identity or your credential service if appropriate.",``,`SessionFsProvider requires async readFile, writeFile, appendFile, exists, stat, mkdir, readdir, readdirWithTypes, rm, and rename. The sketch does not advertise SQLite. Never substitute an empty/no-op implementation.`,``,...t?[]:[`The environment GitHub adapter expects GITHUB_TOKEN_EXPIRES_AT as the token issuer's actual absolute UNIX expiry. It computes remaining lifetime, never resets a static token's expiry.`],``,`The TypeScript SDK now lives in github/copilot-agent-runtime (src/sdk/nodejs). Setup sparse-checks out the pinned cli-1.0.100-1 commit under .sdk-source, sets the runtime version it downloads, and builds it locally; the visualizer itself does not fetch or run it.`,``].join(`
`)}],commands:{install:[`bash setup-sdk.sh --run`,`npm run build`],check:`npm run check`,run:`npm start -- "Introduce yourself and explain your configured role."`,...e.target.runtime===`external`?{startRuntime:[...t?[`test -n "$COPILOT_GITHUB_TOKEN" &&`]:[],`copilot --headless`,...t?[`--no-auto-login`]:[],`--port ${d(e.target).port}`].join(` `)}:{}},requirements:s,notes:[`The SDK source is pinned to copilot-agent-runtime tag cli-1.0.100-1 (src/sdk/nodejs), not a registry package. Setup requires Git, npm, network access, and read access to that private repository; the built SDK downloads Copilot CLI runtime ${B}.`,e.target.runtime===`inprocess`?`RuntimeConnection.forInProcess is experimental. Supply the matching native bundle; COPILOT_CLI_PATH can point into a runtime package before startup. Process state and the loaded native library are shared.`:e.target.runtime===`external`?`The client connects to ${e.target.serverUrl}. Configure server-owned state directory (${e.session.baseDirectory}) and idle policy (${e.session.idleTimeoutSeconds}s) on that server; they are not passed as client process options. COPILOT_CONNECTION_TOKEN can supply a connection credential.`:`RuntimeConnection.forStdio explicitly selects a managed subprocess; SDK cleanup owns that child. A separate process is not an OS or tenant sandbox.`,`Credential values are never exported. Environment references are starter adapters, not a production credential-refresh service.`,e.policy.permissionMode===`host`?`Host permission handling is an explicit integration requirement; --check fails until extensions.permissionPolicy is supplied. Selected host tools/hooks/storage behave the same way.`:`The generated harness explicitly binds the SDK approveAll helper. It approves ordinary requests once and does not override managed policy, content exclusion, downstream authorization, tool validity, or sandbox enablement; enabled sandbox bypass can also be approved.`],sources:[`sdk-inprocess-guide`,`sdk-managed-runtime`,`sdk-existing-runtime`,`sdk-tools`,`sdk-prompts`,`sdk-auth`]}}};function H(e,t,n){let r=e.indexOf(t);if(r<0||e.indexOf(t,r+t.length)>=0)throw Error(`Template anchor must occur exactly once: ${t.trim().slice(0,80)}`);return e.slice(0,r)+n+e.slice(r+t.length)}function De(e){return e.events.logLevel!=="default"&&e.target.runtime!==`external`?e.events.logLevel:void 0}function Oe(e){let t=De(e);return{...t?{logLevel:t}:{},...e.model.allowedModels.length?{allowedModels:e.model.allowedModels}:{}}}var U=e=>e.output.responseSchema.trim()?e.output.responseSchema.trim()+`
`:void 0,ke=e=>e.customTools.some(e=>e.skipPermission),Ae=e=>e.customTools.some(e=>e.defer!=="default");function je(e,t){let n=t===`go`,r=[];return e.model.allowedModels.length&&r.push(n?`allowedModels has no SessionConfig field in the Go SDK. After CreateSession, main.go applies config/host.json allowedModels with session.RPC.Model.SetAllowedModels (session.model.setAllowedModels); a failure disconnects, stops the client, and returns the error.`:`allowedModels has no SessionConfig property in the .NET SDK. After CreateSessionAsync, Program.cs applies config/host.json allowedModels with session.Rpc.Model.SetAllowedModelsAsync (session.model.setAllowedModels); a failure disposes the session and client and reports the error.`),e.events.logLevel!=="default"&&r.push(e.target.runtime===`external`?`The selected runtime log level (${e.events.logLevel}) is not applied: the client LogLevel option only passes --log-level to a runtime this client launches or loads. Configure logging on the separately operated server.`:`Client LogLevel is set to ${e.events.logLevel}; the SDK passes it to the launched or in-process runtime as --log-level.`),e.output.responseSchema.trim()&&r.push(n?`config/response-schema.json is embedded and passed as MessageOptions.ResponseSchema for the run prompt; the SDK requests strict json_schema output named response and the final assistant content is the JSON result.`:`config/response-schema.json is embedded and passed as MessageOptions.ResponseSchema (JsonElement) for the run prompt; the SDK requests strict json_schema output named response and the final assistant content is the JSON result.`),(e.policy.hooks.length||e.policy.handlers.length||e.context.skillProvider)&&r.push(`Selected lifecycle hooks, request handlers, and the skill provider are explicit ${n?`host.go`:`Host.cs`} slots bound on the SDK session config; preflight and startup reject missing registrations rather than installing no-ops.`),ke(e)&&r.push(`Custom tools marked skipPermission run without the host permission callback. Validate authority inside those handlers.`),r}function Me(e,t,n,r){let i=new Set(n.map(e=>e.id));return[...e.policy.hooks.map(e=>({id:`hook-${e}`,title:`Implement the ${e} hook`,detail:`Register ${r.hook(e)} in ${t}. Preflight and startup fail while it is missing; a no-op is not a policy.`,file:t,kind:`host-code`})),...e.policy.handlers.map(e=>({id:`handler-${e}`,title:`Implement the ${e} request handler`,detail:`Register ${r.handler(e)} in ${t}. Preflight and startup fail while it is missing.`,file:t,kind:`host-code`})),...e.context.skillProvider?[{id:`skill-provider`,title:`Implement the session skill provider`,detail:`Register a real ${r.skillProvider} in ${t} (experimental SDK API). Preflight and startup fail while it is missing.`,file:t,kind:`host-code`}]:[]].filter(e=>!i.has(e.id))}function Ne(e){let n=new Map([...t.filter(t=>e.tools[t].action===`override`).map(t=>[t,e.tools[t].parameters]),...e.customTools.map(e=>[e.name,e.parameters])]),r=w(e);return r.length===0?`[]
`:`[
`+r.map(e=>{let t=n.get(e.name);if(t===void 0)throw Error(`Missing schema for ${e.name}`);return[`  {`,`    "name": ${JSON.stringify(e.name)},`,`    "description": ${JSON.stringify(e.description)},`,`    "overridesBuiltInTool": ${e.overridesBuiltInTool},`,`    "isTerminal": ${e.isTerminal},`,...`defer`in e&&e.defer?[`    "defer": ${JSON.stringify(e.defer)},`]:[],...`skipPermission`in e&&e.skipPermission?[`    "skipPermission": true,`]:[],`    "parameters": ${t}`,`  }`].join(`
`)}).join(`,
`)+`
]
`}var Pe=z,Fe=e=>JSON.stringify(e,null,2)+`
`,Ie=e=>`'${e.replace(/'/g,`'\\''`)}'`,Le={preMcpToolCall:{slot:`PreMCPToolCallHook`,field:`OnPreMCPToolCall`,type:`PreMCPToolCallHandler`},userPromptSubmitted:{slot:`UserPromptSubmittedHook`,field:`OnUserPromptSubmitted`,type:`UserPromptSubmittedHandler`},userPromptTransformed:{slot:`UserPromptTransformedHook`,field:`OnUserPromptTransformed`,type:`UserPromptTransformedHandler`},sessionStart:{slot:`SessionStartHook`,field:`OnSessionStart`,type:`SessionStartHandler`},sessionEnd:{slot:`SessionEndHook`,field:`OnSessionEnd`,type:`SessionEndHandler`},errorOccurred:{slot:`ErrorOccurredHook`,field:`OnErrorOccurred`,type:`ErrorOccurredHandler`},agentStop:{slot:`AgentStopHook`,field:`OnAgentStop`,type:`AgentStopHandler`},subagentStart:{slot:`SubagentStartHook`,field:`OnSubagentStart`,type:`SubagentStartHandler`},subagentStop:{slot:`SubagentStopHook`,field:`OnSubagentStop`,type:`SubagentStopHandler`}},Re={elicitation:{slot:`ElicitationRequestHandler`,field:`OnElicitationRequest`,type:`ElicitationHandler`},exitPlanMode:{slot:`ExitPlanModeRequestHandler`,field:`OnExitPlanModeRequest`,type:`ExitPlanModeRequestHandler`},autoModeSwitch:{slot:`AutoModeSwitchRequestHandler`,field:`OnAutoModeSwitchRequest`,type:`AutoModeSwitchRequestHandler`},mcpAuth:{slot:`MCPAuthRequestHandler`,field:`OnMCPAuthRequest`,type:`MCPAuthHandler`}};function ze(e,t){let n=e,r=U(t),i=Oe(t);return Object.keys(i).length&&(n=H(n,`	UserInput, Observer, PreToolHook, PostToolHook        bool
}
`,`	UserInput, Observer, PreToolHook, PostToolHook        bool

	LogLevel      string
	AllowedModels []string
}
`)),De(t)&&(n=H(n,`		options.SessionIdleTimeoutSeconds = int(settings.IdleTimeoutSeconds)
`,`		options.SessionIdleTimeoutSeconds = int(settings.IdleTimeoutSeconds)
		options.LogLevel = settings.LogLevel
`)),r&&(n=H(n,`//go:embed config/session.json config/host.json config/tools.json
`,`//go:embed config/session.json config/host.json config/tools.json config/response-schema.json
`),n=H(n,`func clientOptions(`,`func loadResponseSchema() (map[string]any, error) {
	var schema map[string]any
	if err := readConfig("config/response-schema.json", &schema); err != nil {
		return nil, err
	}
	if schema["type"] != "object" {
		return nil, errors.New("config/response-schema.json must be an object JSON schema")
	}
	return schema, nil
}

func clientOptions(`),n=H(n,`	config, err := loadSession()
	if err != nil {
		return err
	}
`,`	config, err := loadSession()
	if err != nil {
		return err
	}
	responseSchema, err := loadResponseSchema()
	if err != nil {
		return err
	}
`),n=H(n,`copilot.MessageOptions{Prompt: prompt})`,`copilot.MessageOptions{
		Prompt: prompt, ResponseSchema: responseSchema,
	})`)),t.model.allowedModels.length&&(n=H(n,`	defer func() { result = errors.Join(result, session.Disconnect()) }()
`,`	defer func() { result = errors.Join(result, session.Disconnect()) }()
	if len(settings.AllowedModels) > 0 {
		if _, err := session.RPC.Model.SetAllowedModels(ctx, &rpc.ModelSetAllowedModelsRequest{
			AllowedModels: settings.AllowedModels,
		}); err != nil {
			return fmt.Errorf("apply allowed models: %w", err)
		}
	}
`)),n}function Be(e,t){let n=e,r=t.policy.hooks.map(e=>({name:e,...Le[e]})),i=t.policy.handlers.map(e=>({name:e,...Re[e]})),a=[...r.map(e=>`var ${e.slot} copilot.${e.type}\n`),...i.map(e=>`var ${e.slot} copilot.${e.type}\n`),...t.context.skillProvider?[`var SkillProvider copilot.SkillProvider
`]:[]];if(!a.length&&!ke(t))return n;let o=[...r.map(e=>e.slot),...i.map(e=>e.slot),...t.context.skillProvider?[`SkillProvider`]:[]];if(a.length){n=H(n,`var PostToolHook copilot.PostToolUseHandler
`,`var PostToolHook copilot.PostToolUseHandler
`+a.join(``)),n=H(n,`	if settings.Storage == "virtual" && SessionFilesystemFactory == nil {
`,o.map(e=>`\tif ${e} == nil {\n\t\tadd(errors.New("implement and register ${e} in host.go"))\n\t}\n`).join(``)+`	if settings.Storage == "virtual" && SessionFilesystemFactory == nil {
`);let e=(e,t)=>`\tif ${e} == nil {\n\t\treturn errors.New("selected ${t} is not implemented")\n\t}\n`,s=[...r.length?[`	if config.Hooks == nil {
		config.Hooks = &copilot.SessionHooks{}
	}
`]:[],...r.map(t=>e(t.slot,`${t.name} hook`)+`\tconfig.Hooks.${t.field} = ${t.slot}\n`),...i.map(t=>e(t.slot,`${t.name} request handler`)+`\tconfig.${t.field} = ${t.slot}\n`),...t.context.skillProvider?[e(`SkillProvider`,`skill provider`)+`	config.SkillProvider = SkillProvider
`]:[]];n=H(n,`	if settings.Storage == "virtual" {
		config.CreateSessionFSProvider`,s.join(``)+`	if settings.Storage == "virtual" {
		config.CreateSessionFSProvider`)}return ke(t)&&(n=H(n,`		if tool.SkipPermission {
			add(fmt.Errorf("tool %s must not skip the host permission policy", tool.Name))
		}
`,``)),n}function Ve(e,t){if(t.model.provider!==`copilot`||t.identity!==`s2s-installation`)return e.replace(/[ \t]*\/\/ __S2S_RUNTIME_ENV_START__\n[\s\S]*?[ \t]*\/\/ __S2S_RUNTIME_ENV_END__\n?/g,``).replaceAll(/^\s*\/\/ __[A-Z_]+_(?:START|END)__\n/gm,``);let n=t.target.runtime===`managed`?`		token, err := requiredEnv("COPILOT_GITHUB_TOKEN")
		if err != nil {
			return nil, err
		}
		options.Env = append(os.Environ(), "COPILOT_GITHUB_TOKEN="+token)
`:t.target.runtime===`inprocess`?`		if _, err := requiredEnv("COPILOT_GITHUB_TOKEN"); err != nil {
			return nil, err
		}
`:``,r=t.target.runtime===`external`?`		switch settings.Identity {
		case "s2s-installation":
		default:
			add(errors.New("unknown Copilot identity selection"))
		}
`:`		switch settings.Identity {
		case "s2s-installation":
			_, err := requiredEnv("COPILOT_GITHUB_TOKEN")
			add(err)
		default:
			add(errors.New("unknown Copilot identity selection"))
		}
`,i=e.replace(/[ \t]*\/\/ __S2S_RUNTIME_ENV_START__\n[\s\S]*?[ \t]*\/\/ __S2S_RUNTIME_ENV_END__\n?/g,n).replace(/[ \t]*\/\/ __GITHUB_TOKEN_PROVIDER_START__\n[\s\S]*?[ \t]*\/\/ __GITHUB_TOKEN_PROVIDER_END__\n?/g,``).replace(/[ \t]*\/\/ __COPILOT_IDENTITY_PREFLIGHT_START__\n[\s\S]*?[ \t]*\/\/ __COPILOT_IDENTITY_PREFLIGHT_END__\n?/g,r).replace(/[ \t]*\/\/ __COPILOT_IDENTITY_BINDING_START__\n[\s\S]*?[ \t]*\/\/ __COPILOT_IDENTITY_BINDING_END__\n?/g,``);return e.includes(`__GITHUB_TOKEN_PROVIDER_START__`)?i.replace(`	"time"
`,``):i}function He(e){let t=[];e.target.runtime!==`managed`&&e.target.cliPath!==``&&t.push({id:`go-cli-path`,title:`CLI path is a managed-process setting`,detail:`Clear cliPath. Native hosting uses the host's COPILOT_CLI_PATH environment variable; an existing service owns its executable.`,fields:[`target.cliPath`,`target.runtime`],sources:[`sdk-inprocess-guide`,`sdk-existing-runtime`]});for(let[n,r]of e.mcpServers.entries())for(let[e,i]of r.tools.entries())i.wireName!==`${r.name}-${i.name}`&&t.push({id:`go-mcp-name-${n}-${e}`,title:`MCP wire names cannot be aliased`,detail:`The SDK exposes ${r.name}-${i.name}, not ${i.wireName}. Change the planned wire name and any agent/root references.`,fields:[`mcpServers.${n}.tools.${e}.wireName`],sources:[`sdk-mcp`,`sdk-filter-names`]});return t}var Ue={language:`go`,label:`Go`,check:He,generate(e){let t=He(e);if(t.length)throw Error(t.map(e=>e.detail).join(`
`));let n=e.target.runtime===`external`?d(e.target):void 0,r=`go run${e.target.runtime===`inprocess`?` -tags copilot_inprocess`:``} .`,i=b(e,`host.go`);return e.model.provider===`copilot`&&e.identity===`host-token`&&i.push({id:`go-token-expiry`,environmentVariable:`GITHUB_TOKEN_EXPIRES_AT`,title:`Set GITHUB_TOKEN_EXPIRES_AT`,detail:`Supply the token's actual expiration as UNIX seconds alongside GITHUB_TOKEN. Every acquisition recomputes the remaining lifetime and rejects expired or malformed values.`,file:`host.go`,kind:`environment`}),n?i.push({id:`go-connection-token`,environmentVariable:`COPILOT_CONNECTION_TOKEN`,title:`Set COPILOT_CONNECTION_TOKEN on the client and server`,detail:`Use the same non-empty connection secret for the separately operated TCP server. This is not a GitHub credential; do not put it in the endpoint or JSON.`,file:`host.go`,kind:`environment`}):i.push({id:`go-runtime-entrypoint`,environmentVariable:`COPILOT_CLI_PATH`,title:`Provision the compatible runtime entrypoint`,detail:`This source-pinned starter does not bundle a runtime. Set COPILOT_CLI_PATH, or use the managed cliPath selected in the plan. Native hosting needs the matching native library and copilot_inprocess build tag.`,file:`host.go`,kind:`runtime`}),i.push(...Me(e,`host.go`,i,{hook:e=>Le[e].slot,handler:e=>Re[e].slot,skillProvider:`copilot.SkillProvider as SkillProvider`})),{files:[{path:`go.mod`,language:`text`,content:`// Copyright (c) Microsoft Corporation. All rights reserved.
module example.com/copilot-harness

go 1.24.0
`},{path:`main.go`,language:`go`,content:Ve(ze(We,e),e)},{path:`host.go`,language:`go`,content:Ve(Be(Ge,e),e)},{path:`native_enabled.go`,language:`go`,content:`//go:build copilot_inprocess

// Copyright (c) Microsoft Corporation. All rights reserved.
package main

const nativeEnabled = true
`},{path:`native_disabled.go`,language:`go`,content:`//go:build !copilot_inprocess

// Copyright (c) Microsoft Corporation. All rights reserved.
package main

const nativeEnabled = false
`},{path:`config/session.json`,language:`json`,content:Fe(y(e))},{path:`config/tools.json`,language:`json`,content:Ne(e)},...U(e)?[{path:`config/response-schema.json`,language:`json`,content:U(e)??``}]:[],{path:`config/host.json`,language:`json`,content:Fe({runtime:e.target.runtime,serverAddress:n?.address??``,cliPath:e.target.cliPath,clientMode:e.clientMode,identity:e.identity,credential:e.model.credential,credentialEnv:e.model.credentialEnv,permissionMode:e.policy.permissionMode,storage:e.session.storage,baseDirectory:e.session.baseDirectory,idleTimeoutSeconds:e.session.idleTimeoutSeconds,userInput:e.tools.ask_user.action===`keep`,observer:e.events.observer,preToolHook:e.policy.preToolHook,postToolHook:e.policy.postToolHook,...Oe(e)})}],commands:{install:[`go get github.com/github/copilot-sdk/go@${Pe}`],check:`${r} --check`,run:`${r} -- "Describe the task you want the agent to perform."`,...n?{startRuntime:[`test -n "$COPILOT_CONNECTION_TOKEN" &&`,...e.identity===`s2s-installation`?[`test -n "$COPILOT_GITHUB_TOKEN" &&`]:[],...e.session.storage===`local`?[`COPILOT_HOME=${Ie(e.session.baseDirectory)}`]:[],`copilot-runtime --headless --no-auto-update --port ${n.port}`,...e.identity===`s2s-installation`?[`--no-auto-login`]:[],...e.session.idleTimeoutSeconds>0?[`--session-idle-timeout ${e.session.idleTimeoutSeconds}`]:[]].join(` `)}:{}},requirements:i,notes:[`Requires Go 1.24+. The SDK source pin is ${Pe}; the nearest published Go tag does not establish compatibility. The install command records the resolved pseudo-version and checksums in go.mod/go.sum.`,`config/session.json preserves the selected SDK data. config/tools.json preserves arbitrary object schemas, override flags, and terminal flags. Go materializes the interface-typed MCP map explicitly, then attaches callbacks before creating the session. Configuration is embedded at build time; rebuild after editing it.`,e.policy.permissionMode===`host`?`Register PermissionPolicy, real tool handlers, selected pre/post hooks, and a session filesystem factory in host.go. Preflight and normal startup reject missing registrations.`:`The generated host explicitly binds copilot.PermissionHandler.ApproveAll. It approves ordinary requests once; managed policy, content exclusion, downstream authorization, tool validity, and sandbox enablement still apply, while enabled sandbox bypass can also be approved.`,e.model.provider===`copilot`&&e.identity===`s2s-installation`?e.target.runtime===`external`?`GitHub App S2S identity is configured on the separately operated runtime with COPILOT_GITHUB_TOKEN and --no-auto-login. The connecting Go client neither reads nor injects that token and does not install a per-session token callback.`:e.target.runtime===`inprocess`?`GitHub App S2S identity requires COPILOT_GITHUB_TOKEN in the host environment before InProcessConnection loads the runtime. Logged-in-user fallback is false and no per-session token callback is generated.`:`GitHub App S2S identity copies the trusted host's COPILOT_GITHUB_TOKEN into ClientOptions.Env for the managed child. Logged-in-user fallback is false and no per-session token callback is generated.`:`Host-token identity uses per-session GitHubTokenProvider, GITHUB_TOKEN, and GITHUB_TOKEN_EXPIRES_AT. Expiration must be the original absolute UNIX timestamp, never a freshly invented lifetime. Replace the environment acquisition adapter with your identity service when appropriate.`,`BYOK API keys use the selected credentialEnv; bearer callbacks acquire MODEL_BEARER_TOKEN on every request. Replace that environment adapter with scoped managed-identity acquisition and caching for production. GitHub identity settings apply only when the selected model provider is Copilot.`,`The --check path only parses embedded configuration, checks local files/environment, and reports missing host code. It never constructs a client, loads the native runtime, connects to the service, or sends a model request. Go compilation/dependency resolution is separate from that preflight.`,`Existing-runtime identity and process lifecycle belong to the server. The client never sets logged-in-user or client GitHub-token options for URI connections. Apply the selected local base directory and nonzero idle timeout with the separately run server command; zero leaves the runtime's idle default unchanged. The sample command runs on the server host and is for loopback development; secure remote routing or a tunnel separately. A connection token does not add TLS or tenant authorization.`,`Native hosting uses InProcessConnection{} and -tags copilot_inprocess on a supported OS/architecture. Set COPILOT_CLI_PATH to a compatible package entrypoint with copilot_runtime.dll, libcopilot_runtime.dylib, libcopilot_runtime.so, or the matching runtime.node. Per-client environment/cwd/telemetry overrides are not used. One native runtime version may be loaded per process.`,`Session working directories, skills, plugins, discovered configuration, file hooks, and Git context refer to the runtime host's filesystem. A subprocess, an SDK mode, permission callbacks, and session storage are not an OS or tenant sandbox.`,`Virtual storage requires copilot.SessionFSProvider: ReadFile, WriteFile, AppendFile, Exists, Stat, MakeDirectory, ReadDirectory, ReadDirectoryWithTypes, Remove, and Rename. The factory is session-scoped; POSIX virtual paths use the selected workspace (or /) and baseDirectory (or /session-state). SQLite is not advertised; implement SessionFSSqliteProvider and SessionFSSqliteTransactionProvider before opting into SQL capabilities.`,`The observer logs event types only, never prompts, tool arguments/results, credentials, or assistant content. The final assistant content is printed once as the application result; an idle turn without an assistant message is explicitly reported, including terminal-tool completion.`,...je(e,`go`)],sources:[e.target.runtime===`managed`?`sdk-managed-runtime`:e.target.runtime===`external`?`sdk-existing-runtime`:`sdk-inprocess-guide`,`sdk-tools`,`sdk-permissions`,`sdk-hooks`,`sdk-auth`,`sdk-providers`,`sdk-storage-binding`,`sdk-session-config`]}}},We=String.raw`// Copyright (c) Microsoft Corporation. All rights reserved.
package main

import (
	"bytes"
	"context"
	"embed"
	"encoding/json"
	"errors"
	"flag"
	"fmt"
	"io"
	"os"
	"os/signal"
	"strings"
	"time"

	copilot "github.com/github/copilot-sdk/go"
	"github.com/github/copilot-sdk/go/rpc"
)

//go:embed config/session.json config/host.json config/tools.json
var configuration embed.FS

type HostSettings struct {
	Runtime, ServerAddress, CliPath, ClientMode, Identity string
	Credential, CredentialEnv, PermissionMode             string
	Storage, BaseDirectory                                string
	IdleTimeoutSeconds                                    int64
	UserInput, Observer, PreToolHook, PostToolHook        bool
}

func decodeJSON(data []byte, value any) error {
	decoder := json.NewDecoder(bytes.NewReader(data))
	decoder.DisallowUnknownFields()
	decoder.UseNumber()
	if err := decoder.Decode(value); err != nil {
		return err
	}
	var extra any
	if err := decoder.Decode(&extra); err != io.EOF {
		return errors.New("expected exactly one JSON value")
	}
	return nil
}

func readConfig(path string, value any) error {
	data, err := configuration.ReadFile(path)
	if err != nil {
		return err
	}
	if err := decodeJSON(data, value); err != nil {
		return fmt.Errorf("%s: %w", path, err)
	}
	return nil
}

func loadSession() (*copilot.SessionConfig, error) {
	var data map[string]json.RawMessage
	if err := readConfig("config/session.json", &data); err != nil {
		return nil, err
	}
	serversJSON := data["mcpServers"]
	delete(data, "mcpServers")
	encoded, err := json.Marshal(data)
	if err != nil {
		return nil, err
	}
	var config copilot.SessionConfig
	if err := decodeJSON(encoded, &config); err != nil {
		return nil, fmt.Errorf("session config: %w", err)
	}
	var servers map[string]struct {
		Type, URL string
		Tools     []string
	}
	if err := decodeJSON(serversJSON, &servers); err != nil {
		return nil, fmt.Errorf("MCP config: %w", err)
	}
	config.MCPServers = make(map[string]copilot.MCPServerConfig, len(servers))
	for name, server := range servers {
		if server.Type != "http" {
			return nil, fmt.Errorf("MCP server %s: this generated plan requires type http", name)
		}
		config.MCPServers[name] = copilot.MCPHTTPServerConfig{URL: server.URL, Tools: server.Tools}
	}
	return &config, nil
}

func clientOptions(settings HostSettings, config *copilot.SessionConfig) (*copilot.ClientOptions, error) {
	options := &copilot.ClientOptions{}
	switch settings.ClientMode {
	case "empty":
		options.Mode = copilot.ModeEmpty
	case "copilot-cli":
		options.Mode = copilot.ModeCopilotCli
	default:
		return nil, errors.New("unknown client mode")
	}
	switch settings.Runtime {
	case "external":
		token, err := requiredEnv("COPILOT_CONNECTION_TOKEN")
		if err != nil {
			return nil, err
		}
		options.Connection = copilot.URIConnection{
			URL: settings.ServerAddress, ConnectionToken: token,
		}
	case "managed", "inprocess":
		if settings.Runtime == "inprocess" {
			options.Connection = copilot.InProcessConnection{}
		} else {
			path, err := runtimeEntrypoint(settings)
			if err != nil {
				return nil, err
			}
			options.Connection = copilot.StdioConnection{Path: path}
		}
		options.UseLoggedInUser = copilot.Bool(config.Provider == nil && settings.Identity == "developer")
		// __S2S_RUNTIME_ENV_START__
		if config.Provider == nil && settings.Identity == "s2s-installation" {
			token, err := requiredEnv("COPILOT_GITHUB_TOKEN")
			if err != nil {
				return nil, err
			}
			if settings.Runtime == "managed" {
				options.Env = append(os.Environ(), "COPILOT_GITHUB_TOKEN="+token)
			}
		}
		// __S2S_RUNTIME_ENV_END__
		options.SessionIdleTimeoutSeconds = int(settings.IdleTimeoutSeconds)
		if settings.Storage == "local" {
			options.BaseDirectory = settings.BaseDirectory
		}
	default:
		return nil, errors.New("unknown runtime selection")
	}
	if settings.Storage == "virtual" {
		cwd, state := config.WorkingDirectory, settings.BaseDirectory
		if cwd == "" {
			cwd = "/"
		}
		if state == "" {
			state = "/session-state"
		}
		options.SessionFS = &copilot.SessionFSConfig{
			InitialWorkingDirectory: cwd, SessionStatePath: state,
			Conventions: rpc.SessionFSSetProviderConventionsPosix,
		}
	}
	return options, nil
}

func main() {
	if err := run(); err != nil {
		fmt.Fprintln(os.Stderr, err)
		os.Exit(1)
	}
}

func run() (result error) {
	flags := flag.NewFlagSet("agent", flag.ContinueOnError)
	check := flags.Bool("check", false, "local preflight only; never start a runtime or model")
	timeout := flags.Duration("timeout", 5*time.Minute, "turn timeout")
	if err := flags.Parse(os.Args[1:]); err != nil {
		if errors.Is(err, flag.ErrHelp) {
			return nil
		}
		return err
	}
	if *timeout <= 0 {
		return errors.New("--timeout must be positive")
	}
	var settings HostSettings
	var tools []copilot.Tool
	if err := readConfig("config/host.json", &settings); err != nil {
		return err
	}
	if err := readConfig("config/tools.json", &tools); err != nil {
		return err
	}
	config, err := loadSession()
	if err != nil {
		return err
	}
	if problems := preflight(settings, config, tools); len(problems) > 0 {
		return fmt.Errorf("preflight failed:\n%s", strings.Join(problems, "\n"))
	}
	if *check {
		fmt.Println("Local preflight passed. No runtime was started and no model was called.")
		return nil
	}
	prompt := strings.Join(flags.Args(), " ")
	if strings.TrimSpace(prompt) == "" {
		return errors.New("usage: go run . [--check] [--timeout 5m] -- \"Your prompt\"")
	}
	if err := bindHost(settings, config, tools); err != nil {
		return err
	}
	options, err := clientOptions(settings, config)
	if err != nil {
		return err
	}
	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt)
	defer stop()
	ctx, cancel := context.WithTimeout(ctx, *timeout)
	defer cancel()
	client := copilot.NewClient(options)
	defer func() { result = errors.Join(result, client.Stop()) }()
	if err := client.Start(ctx); err != nil {
		return err
	}
	session, err := client.CreateSession(ctx, config)
	if err != nil {
		return err
	}
	defer func() { result = errors.Join(result, session.Disconnect()) }()
	response, err := session.SendAndWait(ctx, copilot.MessageOptions{Prompt: prompt})
	if err != nil {
		if ctx.Err() != nil {
			abortCtx, abortCancel := context.WithTimeout(context.Background(), 10*time.Second)
			defer abortCancel()
			err = errors.Join(err, session.Abort(abortCtx))
		}
		return err
	}
	if response == nil {
		fmt.Fprintln(os.Stderr, "Turn reached idle without an assistant message; a terminal tool may have completed it.")
		return nil
	}
	message, ok := response.Data.(*copilot.AssistantMessageData)
	if !ok || message == nil {
		return errors.New("unexpected final assistant event")
	}
	fmt.Println(message.Content)
	return nil
}
`,Ge=String.raw`// Copyright (c) Microsoft Corporation. All rights reserved.
package main

import (
	"bufio"
	"errors"
	"fmt"
	"io"
	"net"
	"os"
	"os/exec"
	"path/filepath"
	"runtime"
	"strconv"
	"strings"
	"sync"
	"time"

	copilot "github.com/github/copilot-sdk/go"
	"github.com/github/copilot-sdk/go/rpc"
)

// Register implementations here before starting the client. Missing bindings fail preflight.
var ToolHandlers = map[string]copilot.ToolHandler{}
var PermissionPolicy func(copilot.PermissionRequest, copilot.PermissionInvocation) (rpc.PermissionDecision, error)
var PreToolHook copilot.PreToolUseHandler
var PostToolHook copilot.PostToolUseHandler
var SessionFilesystemFactory func(*copilot.Session) copilot.SessionFSProvider
var ProviderEndpoint string

func requiredProviderEndpoint() (string, error) {
	value := strings.TrimSpace(ProviderEndpoint)
	if value == "" {
		return "", errors.New("provide the provider endpoint string in host.go ProviderEndpoint")
	}
	return value, nil
}

func requiredEnv(name string) (string, error) {
	value := os.Getenv(name)
	if strings.TrimSpace(value) == "" {
		return "", fmt.Errorf("set %s in the process environment", name)
	}
	return value, nil
}

// __GITHUB_TOKEN_PROVIDER_START__
func acquireGitHubToken(_ copilot.GitHubTokenProviderArgs) (*copilot.GitHubTokenProviderResult, error) {
	token, err := requiredEnv("GITHUB_TOKEN")
	if err != nil {
		return nil, err
	}
	raw, err := requiredEnv("GITHUB_TOKEN_EXPIRES_AT")
	if err != nil {
		return nil, err
	}
	expiresAt, err := strconv.ParseInt(raw, 10, 64)
	if err != nil {
		return nil, errors.New("GITHUB_TOKEN_EXPIRES_AT must be an integer UNIX timestamp in seconds")
	}
	now := time.Now().Unix()
	if expiresAt <= now {
		return nil, errors.New("GITHUB_TOKEN has expired; replace both token and its actual expiration")
	}
	return copilot.GitHubTokenResult(&copilot.GitHubToken{
		AccessToken: token, ExpiresIn: expiresAt - now,
	}), nil
}
// __GITHUB_TOKEN_PROVIDER_END__

func acquireBearerToken(_ copilot.ProviderTokenArgs) (string, error) {
	// Replace with scoped managed-identity acquisition and caching when selected for production.
	return requiredEnv("MODEL_BEARER_TOKEN")
}

var consoleLock sync.Mutex
var consoleInput = bufio.NewScanner(os.Stdin)

func consoleUserInput(request copilot.UserInputRequest, _ copilot.UserInputInvocation) (copilot.UserInputResponse, error) {
	consoleLock.Lock()
	defer consoleLock.Unlock()
	freeform := request.AllowFreeform == nil || *request.AllowFreeform
	if len(request.Choices) == 0 && !freeform {
		return copilot.UserInputResponse{}, errors.New("agent supplied neither choices nor freeform input")
	}
	fmt.Fprintln(os.Stderr, request.Question)
	for _, choice := range request.Choices {
		fmt.Fprintf(os.Stderr, " - %s\n", choice)
	}
	for {
		fmt.Fprint(os.Stderr, "> ")
		if !consoleInput.Scan() {
			if err := consoleInput.Err(); err != nil {
				return copilot.UserInputResponse{}, fmt.Errorf("console input: %w", err)
			}
			return copilot.UserInputResponse{}, io.EOF
		}
		answer := consoleInput.Text()
		for _, choice := range request.Choices {
			if answer == choice {
				return copilot.UserInputResponse{Answer: answer, WasFreeform: false}, nil
			}
		}
		if freeform {
			return copilot.UserInputResponse{Answer: answer, WasFreeform: true}, nil
		}
		fmt.Fprintln(os.Stderr, "Enter an exact offered choice.")
	}
}

func runtimeEntrypoint(settings HostSettings) (string, error) {
	path := settings.CliPath
	if settings.Runtime == "inprocess" || strings.TrimSpace(path) == "" {
		path = os.Getenv("COPILOT_CLI_PATH")
	}
	if strings.TrimSpace(path) == "" {
		return "", errors.New("provision a compatible runtime and set COPILOT_CLI_PATH (or the managed cliPath)")
	}
	var err error
	if settings.Runtime == "managed" && !strings.HasSuffix(path, ".js") {
		path, err = exec.LookPath(path)
	} else {
		path, err = filepath.Abs(path)
	}
	if err != nil {
		return "", fmt.Errorf("runtime entrypoint: %w", err)
	}
	info, err := os.Stat(path)
	if err != nil {
		return "", fmt.Errorf("runtime entrypoint: %w", err)
	}
	if !info.Mode().IsRegular() {
		return "", errors.New("runtime entrypoint must be a regular file")
	}
	if settings.Runtime == "managed" && strings.HasSuffix(path, ".js") {
		if _, err := exec.LookPath("node"); err != nil {
			return "", errors.New("the selected JavaScript runtime entrypoint requires node on PATH")
		}
	}
	if settings.Runtime == "inprocess" {
		if !nativeEnabled {
			return "", errors.New("native hosting requires go run/build -tags copilot_inprocess")
		}
		library, platform := "", ""
		switch runtime.GOOS {
		case "darwin":
			library, platform = "libcopilot_runtime.dylib", "darwin"
		case "linux":
			library, platform = "libcopilot_runtime.so", "linux"
		case "windows":
			library, platform = "copilot_runtime.dll", "win32"
		default:
			return "", errors.New("unsupported native runtime operating system")
		}
		arch := map[string]string{"amd64": "x64", "arm64": "arm64"}[runtime.GOARCH]
		if arch == "" {
			return "", errors.New("native runtime requires a matching x64 or arm64 bundle")
		}
		directory := filepath.Dir(path)
		candidates := []string{
			filepath.Join(directory, library), filepath.Join(directory, "runtime.node"),
			filepath.Join(directory, "prebuilds", platform+"-"+arch, "runtime.node"),
		}
		if platform == "linux" {
			candidates = append(candidates, filepath.Join(directory, "prebuilds", "linuxmusl-"+arch, "runtime.node"))
		}
		for _, candidate := range candidates {
			if info, err := os.Stat(candidate); err == nil && info.Mode().IsRegular() && info.Size() > 0 {
				return path, nil
			}
		}
		return "", errors.New("native library is missing beside COPILOT_CLI_PATH; provision the matching OS/architecture/libc runtime package")
	}
	return path, nil
}

func preflight(settings HostSettings, config *copilot.SessionConfig, tools []copilot.Tool) []string {
	var problems []string
	add := func(err error) {
		if err != nil {
			problems = append(problems, "- "+err.Error())
		}
	}
	if settings.ClientMode != "empty" && settings.ClientMode != "copilot-cli" {
		add(errors.New("unknown client mode"))
	}
	if settings.Storage != "local" && settings.Storage != "virtual" {
		add(errors.New("unknown storage selection"))
	}
	if settings.PermissionMode == "host" && PermissionPolicy == nil {
		add(errors.New("implement and register PermissionPolicy in host.go"))
	} else if settings.PermissionMode != "host" && settings.PermissionMode != "allow-all" {
		add(errors.New("unknown permission mode"))
	}
	if settings.Storage == "local" && strings.TrimSpace(settings.BaseDirectory) == "" {
		add(errors.New("local storage requires baseDirectory"))
	}
	if settings.IdleTimeoutSeconds < 0 || int64(int(settings.IdleTimeoutSeconds)) != settings.IdleTimeoutSeconds {
		add(errors.New("idleTimeoutSeconds is out of range for this Go target"))
	}
	if settings.Runtime != "managed" && settings.CliPath != "" {
		add(errors.New("cliPath is only valid with a managed child"))
	}
	switch settings.Runtime {
	case "external":
		host, port, err := net.SplitHostPort(settings.ServerAddress)
		if err != nil || host == "" {
			add(errors.New("external serverAddress must be a canonical host:port"))
		}
		number, err := strconv.Atoi(port)
		if err != nil || number < 1 || number > 65535 {
			add(errors.New("external server port is invalid"))
		}
		_, err = requiredEnv("COPILOT_CONNECTION_TOKEN")
		add(err)
	case "managed", "inprocess":
		_, err := runtimeEntrypoint(settings)
		add(err)
	default:
		add(errors.New("unknown runtime selection"))
	}
	if strings.TrimSpace(config.Model) == "" {
		model, err := requiredEnv("COPILOT_MODEL")
		add(err)
		config.Model = strings.TrimSpace(model)
	}
	if config.Provider == nil {
		// __COPILOT_IDENTITY_PREFLIGHT_START__
		switch settings.Identity {
		case "host-token":
			_, err := acquireGitHubToken(copilot.GitHubTokenProviderArgs{})
			add(err)
		case "developer":
		default:
			add(errors.New("unknown Copilot identity selection"))
		}
		// __COPILOT_IDENTITY_PREFLIGHT_END__
	} else {
		if strings.TrimSpace(config.Provider.BaseURL) == "" {
			_, err := requiredProviderEndpoint()
			add(err)
		}
		switch settings.Credential {
		case "api-key":
			_, err := requiredEnv(settings.CredentialEnv)
			add(err)
		case "bearer-callback":
			_, err := acquireBearerToken(copilot.ProviderTokenArgs{})
			add(err)
		default:
			add(errors.New("unknown BYOK credential selection"))
		}
	}
	for _, tool := range tools {
		if ToolHandlers[tool.Name] == nil {
			add(fmt.Errorf("implement and register ToolHandlers[%q] in host.go", tool.Name))
		}
		if tool.Parameters == nil || tool.Parameters["type"] != "object" {
			add(fmt.Errorf("tool %s requires its original object JSON schema", tool.Name))
		}
		if tool.SkipPermission {
			add(fmt.Errorf("tool %s must not skip the host permission policy", tool.Name))
		}
	}
	if settings.PreToolHook && PreToolHook == nil {
		add(errors.New("implement and register PreToolHook in host.go"))
	}
	if settings.PostToolHook && PostToolHook == nil {
		add(errors.New("implement and register PostToolHook in host.go"))
	}
	if settings.Storage == "virtual" && SessionFilesystemFactory == nil {
		add(errors.New("implement and register SessionFilesystemFactory in host.go"))
	}
	return problems
}

func bindHost(settings HostSettings, config *copilot.SessionConfig, tools []copilot.Tool) error {
	if settings.PermissionMode == "host" {
		if PermissionPolicy == nil {
			return errors.New("selected host permission policy is not implemented")
		}
		config.OnPermissionRequest = PermissionPolicy
	} else {
		config.OnPermissionRequest = copilot.PermissionHandler.ApproveAll
	}
	if settings.UserInput {
		config.OnUserInputRequest = consoleUserInput
	}
	if settings.Observer {
		config.OnEvent = func(event copilot.SessionEvent) {
			fmt.Fprintf(os.Stderr, "event=%s\n", event.Type())
		}
	}
	// __COPILOT_IDENTITY_BINDING_START__
	if config.Provider == nil && settings.Identity == "host-token" {
		config.GitHubTokenProvider = acquireGitHubToken
	}
	// __COPILOT_IDENTITY_BINDING_END__
	if config.Provider != nil {
		if strings.TrimSpace(config.Provider.BaseURL) == "" {
			endpoint, err := requiredProviderEndpoint()
			if err != nil {
				return err
			}
			config.Provider.BaseURL = endpoint
		}
		if settings.Credential == "bearer-callback" {
			config.Provider.BearerTokenProvider = acquireBearerToken
		} else {
			key, err := requiredEnv(settings.CredentialEnv)
			if err != nil {
				return err
			}
			config.Provider.APIKey = key
		}
	}
	for i := range tools {
		name := tools[i].Name
		tools[i].Handler = func(invocation copilot.ToolInvocation) (copilot.ToolResult, error) {
			handler := ToolHandlers[name]
			if handler == nil {
				return copilot.ToolResult{}, fmt.Errorf("host tool %s is not implemented", name)
			}
			return handler(invocation)
		}
	}
	config.Tools = tools
	if settings.PreToolHook || settings.PostToolHook {
		config.Hooks = &copilot.SessionHooks{}
		if settings.PreToolHook {
			config.Hooks.OnPreToolUse = func(input copilot.PreToolUseHookInput, invocation copilot.HookInvocation) (*copilot.PreToolUseHookOutput, error) {
				if PreToolHook == nil {
					return nil, errors.New("selected pre-tool hook is not implemented")
				}
				return PreToolHook(input, invocation)
			}
		}
		if settings.PostToolHook {
			config.Hooks.OnPostToolUse = func(input copilot.PostToolUseHookInput, invocation copilot.HookInvocation) (*copilot.PostToolUseHookOutput, error) {
				if PostToolHook == nil {
					return nil, errors.New("selected post-tool hook is not implemented")
				}
				return PostToolHook(input, invocation)
			}
		}
	}
	if settings.Storage == "virtual" {
		config.CreateSessionFSProvider = func(session *copilot.Session) copilot.SessionFSProvider {
			if SessionFilesystemFactory == nil {
				panic("selected session filesystem provider is not implemented")
			}
			return SessionFilesystemFactory(session)
		}
	}
	return nil
}
`,Ke=z,qe=e=>JSON.stringify(e,null,2)+`
`,Je=e=>`'${e.replace(/'/g,`'\\''`)}'`,Ye={preMcpToolCall:{slot:`PreMcpToolCallHook`,property:`OnPreMcpToolCall`,type:`PreMcpToolCall`},userPromptSubmitted:{slot:`UserPromptSubmittedHook`,property:`OnUserPromptSubmitted`,type:`UserPromptSubmitted`},userPromptTransformed:{slot:`UserPromptTransformedHook`,property:`OnUserPromptTransformed`,type:`UserPromptTransformed`},sessionStart:{slot:`SessionStartHook`,property:`OnSessionStart`,type:`SessionStart`},sessionEnd:{slot:`SessionEndHook`,property:`OnSessionEnd`,type:`SessionEnd`},errorOccurred:{slot:`ErrorOccurredHook`,property:`OnErrorOccurred`,type:`ErrorOccurred`},agentStop:{slot:`AgentStopHook`,property:`OnAgentStop`,type:`AgentStop`},subagentStart:{slot:`SubagentStartHook`,property:`OnSubagentStart`,type:`SubagentStart`},subagentStop:{slot:`SubagentStopHook`,property:`OnSubagentStop`,type:`SubagentStop`}},Xe={elicitation:{slot:`ElicitationRequestHandler`,property:`OnElicitationRequest`,type:`Func<ElicitationContext, Task<ElicitationResult>>`},exitPlanMode:{slot:`ExitPlanModeRequestHandler`,property:`OnExitPlanModeRequest`,type:`Func<ExitPlanModeRequest, ExitPlanModeInvocation, Task<ExitPlanModeResult>>`},autoModeSwitch:{slot:`AutoModeSwitchRequestHandler`,property:`OnAutoModeSwitchRequest`,type:`Func<AutoModeSwitchRequest, AutoModeSwitchInvocation, Task<AutoModeSwitchResponse>>`},mcpAuth:{slot:`McpAuthRequestHandler`,property:`OnMcpAuthRequest`,type:`Func<McpAuthContext, Task<McpAuthResult?>>`}};function Ze(e,t){let n=e;return Object.keys(Oe(t)).length&&(n=H(n,`    public bool PostToolHook { get; init; }
}
`,`    public bool PostToolHook { get; init; }
    public string LogLevel { get; init; } = "";
    public IList<string>? AllowedModels { get; init; }
}
`)),Ae(t)&&(n=H(n,`    public bool SkipPermission { get; init; }
}
`,`    public bool SkipPermission { get; init; }
    public string? Defer { get; init; }
}
`)),De(t)&&(n=H(n,`            options.SessionIdleTimeoutSeconds = checked((int)settings.IdleTimeoutSeconds);
`,`            options.SessionIdleTimeoutSeconds = checked((int)settings.IdleTimeoutSeconds);
            options.LogLevel = new CopilotLogLevel(settings.LogLevel);
`)),U(t)&&(n=H(n,`            var tools = ReadConfiguration<ToolDefinition[]>("tools.json");
`,`            var tools = ReadConfiguration<ToolDefinition[]>("tools.json");
            var responseSchema = ReadConfiguration<JsonElement>("response-schema.json");
            if (responseSchema.ValueKind != JsonValueKind.Object
                || !responseSchema.TryGetProperty("type", out var schemaType)
                || schemaType.ValueKind != JsonValueKind.String || schemaType.GetString() != "object")
                throw new InvalidOperationException("response-schema.json must be an object JSON schema.");
`),n=H(n,`new MessageOptions { Prompt = prompt },`,`new MessageOptions { Prompt = prompt, ResponseSchema = responseSchema },`)),t.model.allowedModels.length&&(n=H(n,`                await using var session = await client.CreateSessionAsync(config, cancellation.Token);
`,`                await using var session = await client.CreateSessionAsync(config, cancellation.Token);
                if (settings.AllowedModels is { Count: > 0 } allowedModels)
                    await session.Rpc.Model.SetAllowedModelsAsync(allowedModels, cancellation.Token);
`)),n}function Qe(e,t){let n=e,r=t.policy.hooks.map(e=>({name:e,...Ye[e]})),i=t.policy.handlers.map(e=>({name:e,...Xe[e]})),a=[...r.map(e=>`    public static Func<${e.type}HookInput, HookInvocation, Task<${e.type}HookOutput?>>? ${e.slot} { get; set; }\n`),...i.map(e=>`    public static ${e.type}? ${e.slot} { get; set; }\n`),...t.context.skillProvider?[`    public static ISkillProvider? SkillProvider { get; set; }
`]:[]],o=[...r.map(e=>e.slot),...i.map(e=>e.slot),...t.context.skillProvider?[`SkillProvider`]:[]];if(a.length){let e=`    public static Func<PostToolUseHookInput, HookInvocation, Task<PostToolUseHookOutput?>>? PostToolHook { get; set; }
`;n=H(n,e,e+a.join(``));let s=`        if (settings.Storage == "virtual" && SessionFilesystemFactory is null)
`;n=H(n,s,o.map(e=>`        if (${e} is null)\n            problems.Add("- Implement and register ${e} in Host.cs.");\n`).join(``)+s);let c=e=>`\n            ?? throw new NotImplementedException("Selected ${e} is not implemented.");\n`,l=[...r.length?[`        config.Hooks ??= new SessionHooks();
`]:[],...r.map(e=>`        config.Hooks.${e.property} = ${e.slot}${c(`${e.name} hook`)}`),...i.map(e=>`        config.${e.property} = ${e.slot}${c(`${e.name} request handler`)}`),...t.context.skillProvider?[`        config.SkillProvider = SkillProvider${c(`skill provider`)}`]:[]],u=`        if (settings.Storage == "virtual")
            config.CreateSessionFsProvider`;n=H(n,u,l.join(``)+u)}return ke(t)&&(n=H(n,`            if (tool.SkipPermission)
                problems.Add($"- Tool {tool.Name} must not skip the host permission policy.");
`,``),n=H(n,`                    SkipPermission = false
`,`                    SkipPermission = definition.SkipPermission
`)),Ae(t)&&(n=H(n,`                    IsTerminal = definition.IsTerminal,
`,`                    IsTerminal = definition.IsTerminal,
                    Defer = definition.Defer switch
                    {
                        null => null,
                        "auto" => CopilotToolDefer.Auto,
                        "never" => CopilotToolDefer.Never,
                        _ => throw new InvalidOperationException($"Unknown defer mode for tool {definition.Name}.")
                    },
`)),n}function $e(e){let t=`    <EmbeddedResource Include="config/tools.json" LogicalName="Harness.tools.json" />
`;return U(e)?H(rt,t,t+`    <EmbeddedResource Include="config/response-schema.json" LogicalName="Harness.response-schema.json" />
`):rt}function et(e,t){if(t.model.provider!==`copilot`||t.identity!==`s2s-installation`)return e.replace(/[ \t]*\/\/ __S2S_RUNTIME_ENV_START__\n[\s\S]*?[ \t]*\/\/ __S2S_RUNTIME_ENV_END__\n?/g,``).replaceAll(/^\s*\/\/ __[A-Z_]+_(?:START|END)__\n/gm,``);let n=t.target.runtime===`managed`?`            var token = Host.RequiredEnvironment("COPILOT_GITHUB_TOKEN");
            var environment = System.Environment.GetEnvironmentVariables()
                .Cast<DictionaryEntry>()
                .ToDictionary(
                    entry => (string)entry.Key,
                    entry => entry.Value?.ToString() ?? "");
            environment["COPILOT_GITHUB_TOKEN"] = token;
            options.Environment = environment;
`:t.target.runtime===`inprocess`?`            Host.RequiredEnvironment("COPILOT_GITHUB_TOKEN");
`:``,r=t.target.runtime===`external`?`            if (settings.Identity != "s2s-installation")
                problems.Add("- Unknown Copilot identity selection.");
`:`            if (settings.Identity == "s2s-installation")
                Check(() => RequiredEnvironment("COPILOT_GITHUB_TOKEN"));
            else
                problems.Add("- Unknown Copilot identity selection.");
`,i=e.replace(/[ \t]*\/\/ __S2S_RUNTIME_ENV_START__\n[\s\S]*?[ \t]*\/\/ __S2S_RUNTIME_ENV_END__\n?/g,n).replace(/[ \t]*\/\/ __GITHUB_TOKEN_PROVIDER_START__\n[\s\S]*?[ \t]*\/\/ __GITHUB_TOKEN_PROVIDER_END__\n?/g,``).replace(/[ \t]*\/\/ __COPILOT_IDENTITY_PREFLIGHT_START__\n[\s\S]*?[ \t]*\/\/ __COPILOT_IDENTITY_PREFLIGHT_END__\n?/g,r).replace(/[ \t]*\/\/ __COPILOT_IDENTITY_BINDING_START__\n[\s\S]*?[ \t]*\/\/ __COPILOT_IDENTITY_BINDING_END__\n?/g,``);return e.includes(`__GITHUB_TOKEN_PROVIDER_START__`)?i.replace(`using System.Globalization;
`,``):i}function tt(e){let t=[];e.target.runtime!==`managed`&&e.target.cliPath!==``&&t.push({id:`csharp-cli-path`,title:`CLI path is a managed-process setting`,detail:`Clear cliPath. ForInProcess uses the host's COPILOT_CLI_PATH environment variable; an existing service owns its executable.`,fields:[`target.cliPath`,`target.runtime`],sources:[`sdk-inprocess-guide`,`sdk-existing-runtime`]}),e.target.runtime!==`external`&&e.session.idleTimeoutSeconds>2147483647&&t.push({id:`csharp-idle-timeout`,title:`Idle timeout exceeds the .NET SDK integer range`,detail:`CopilotClientOptions.SessionIdleTimeoutSeconds is an Int32. Choose at most 2147483647 seconds rather than truncating the selected value.`,fields:[`session.idleTimeoutSeconds`],sources:[`sdk-idle-option`]});for(let[n,r]of e.mcpServers.entries())for(let[e,i]of r.tools.entries())i.wireName!==`${r.name}-${i.name}`&&t.push({id:`csharp-mcp-name-${n}-${e}`,title:`MCP wire names cannot be aliased`,detail:`The SDK exposes ${r.name}-${i.name}, not ${i.wireName}. Change the planned wire name and any agent/root references.`,fields:[`mcpServers.${n}.tools.${e}.wireName`],sources:[`sdk-mcp`,`sdk-filter-names`]});return t}var nt={language:`csharp`,label:`C# / .NET`,check:tt,generate(e){let t=tt(e);if(t.length)throw Error(t.map(e=>e.detail).join(`
`));let n=e.target.runtime===`external`?d(e.target):void 0,r=b(e,`Host.cs`);return r.push({id:`csharp-sdk-source`,title:`Provision the pinned SDK source`,detail:`Run bash setup-sdk.sh --run with Git and network access. It creates .sdk-source/copilot-sdk at ${Ke} and refuses to reset, overwrite, or delete existing user content. The app uses a ProjectReference, not NuGet 0.0.0-dev.`,file:`setup-sdk.sh`,kind:`runtime`}),e.model.provider===`copilot`&&e.identity===`host-token`&&r.push({id:`csharp-token-expiry`,environmentVariable:`GITHUB_TOKEN_EXPIRES_AT`,title:`Set GITHUB_TOKEN_EXPIRES_AT`,detail:`Supply the token's actual expiration as UNIX seconds alongside GITHUB_TOKEN. Every acquisition computes a fresh positive remaining lifetime from that fixed expiration; expired values are rejected.`,file:`Host.cs`,kind:`environment`}),n?r.push({id:`csharp-connection-token`,environmentVariable:`COPILOT_CONNECTION_TOKEN`,title:`Set COPILOT_CONNECTION_TOKEN on the client and server`,detail:`Provide the same non-empty connection secret to both processes. Keep it outside JSON and the server URL; it is separate from GitHub identity.`,file:`Host.cs`,kind:`environment`}):r.push({id:`csharp-runtime-entrypoint`,environmentVariable:`COPILOT_CLI_PATH`,title:`Provision the compatible runtime entrypoint`,detail:`Set COPILOT_CLI_PATH, or the selected managed cliPath. Runtime downloads are disabled in this source-reference project so --check/build cannot silently acquire or start a runtime. Native hosting requires the matching native package.`,file:`Host.cs`,kind:`runtime`}),r.push(...Me(e,`Host.cs`,r,{hook:e=>`Host.${Ye[e].slot}`,handler:e=>`Host.${Xe[e].slot}`,skillProvider:`ISkillProvider as Host.SkillProvider`})),{files:[{path:`HarnessAgent.csproj`,language:`xml`,content:$e(e)},{path:`Program.cs`,language:`csharp`,content:et(Ze(at,e),e)},{path:`Host.cs`,language:`csharp`,content:et(Qe(ot,e),e)},{path:`setup-sdk.sh`,language:`text`,content:it},{path:`.sdk-source/.gitignore`,language:`text`,content:`# Copyright (c) Microsoft Corporation. All rights reserved.
*
!.gitignore
`},{path:`config/session.json`,language:`json`,content:qe(y(e))},{path:`config/tools.json`,language:`json`,content:Ne(e)},...U(e)?[{path:`config/response-schema.json`,language:`json`,content:U(e)??``}]:[],{path:`config/host.json`,language:`json`,content:qe({runtime:e.target.runtime,serverAddress:n?.address??``,cliPath:e.target.cliPath,clientMode:e.clientMode,identity:e.identity,credential:e.model.credential,credentialEnv:e.model.credentialEnv,permissionMode:e.policy.permissionMode,storage:e.session.storage,baseDirectory:e.session.baseDirectory,idleTimeoutSeconds:e.session.idleTimeoutSeconds,userInput:e.tools.ask_user.action===`keep`,observer:e.events.observer,preToolHook:e.policy.preToolHook,postToolHook:e.policy.postToolHook,...Oe(e)})}],commands:{install:[`bash setup-sdk.sh --run`,`dotnet restore HarnessAgent.csproj`],check:`dotnet run --project HarnessAgent.csproj -- --check`,run:`dotnet run --project HarnessAgent.csproj -- "Describe the task you want the agent to perform."`,...n?{startRuntime:[`test -n "$COPILOT_CONNECTION_TOKEN" &&`,...e.identity===`s2s-installation`?[`test -n "$COPILOT_GITHUB_TOKEN" &&`]:[],...e.session.storage===`local`?[`COPILOT_HOME=${Je(e.session.baseDirectory)}`]:[],`copilot-runtime --headless --no-auto-update --port ${n.port}`,...e.identity===`s2s-installation`?[`--no-auto-login`]:[],...e.session.idleTimeoutSeconds>0?[`--session-idle-timeout ${e.session.idleTimeoutSeconds}`]:[]].join(` `)}:{}},requirements:r,notes:[`Requires .NET SDK 10 and Git. The SDK is source-pinned at ${Ke} in .sdk-source/copilot-sdk and referenced through dotnet/src/GitHub.Copilot.SDK.csproj. The snapshot's 0.0.0-dev version is not a nuget.org dependency. Source provisioning needs access to github/copilot-sdk; normal NuGet restore supplies its declared dependencies.`,`setup-sdk.sh is preview-only without --run. It verifies and reuses only a clean checkout at the exact SHA; a different revision, modified checkout, symlink, or non-repository destination is refused. It never resets, cleans, or deletes files. An interrupted initial provisioning is left for explicit review rather than overwritten on the next run.`,`HarnessAgent.csproj targets net10.0, explicitly opts into experimental GHCP001 APIs, excludes SDK checkout sources from the app's compile glob, and disables automatic runtime downloads on the ProjectReference. The generated app requires an explicitly provisioned compatible runtime; the visualizer itself has no SDK/runtime dependency.`,`config/session.json contains SDK data only. Its prompt section keys and type-discriminated MCP configurations deserialize with the SDK's converters. Tools and host callbacks are bound separately before creation; all configuration files are embedded, so rebuild after editing them.`,`Each custom HostTool exposes the original JSON schema, not a reflected wrapper schema. CopilotTool.DefineTool supplies the SDK's exact override/terminal metadata, which the wrapper forwards unchanged. Register handlers in Host.ToolHandlers and validate authority and arguments before executing them. ${ke(e)?`SkipPermission is forwarded only for custom tools the plan marks; selected defer modes are forwarded.`:Ae(e)?`SkipPermission is never enabled; selected defer modes are forwarded.`:`SkipPermission is never enabled.`}`,e.policy.permissionMode===`host`?`Register PermissionPolicy, selected pre/post hooks, and SessionFilesystemFactory in Host.cs. Both --check and normal startup fail on missing host integrations; invocation paths throw rather than returning successful placeholders.`:`The generated host explicitly binds PermissionHandler.ApproveAll. It approves ordinary requests once; managed policy, content exclusion, downstream authorization, tool validity, and sandbox enablement still apply, while enabled sandbox bypass can also be approved.`,e.model.provider===`copilot`&&e.identity===`s2s-installation`?e.target.runtime===`external`?`GitHub App S2S identity is configured on the separately operated runtime with COPILOT_GITHUB_TOKEN and --no-auto-login. The connecting .NET client neither reads nor injects that token and does not install a per-session token callback.`:e.target.runtime===`inprocess`?`GitHub App S2S identity requires COPILOT_GITHUB_TOKEN in the host environment before ForInProcess loads the runtime. UseLoggedInUser is false and no per-session token callback is generated.`:`GitHub App S2S identity copies the trusted host's COPILOT_GITHUB_TOKEN into CopilotClientOptions.Environment for the managed child. UseLoggedInUser is false and no per-session token callback is generated.`:`Host-token identity uses the per-session GitHubTokenProvider with GITHUB_TOKEN and GITHUB_TOKEN_EXPIRES_AT (actual absolute UNIX seconds). Every acquisition recomputes remaining lifetime and rejects expiry. BYOK API keys use the selected credentialEnv; bearer callbacks read MODEL_BEARER_TOKEN on every request. Replace these environment adapters with scoped identity acquisition and caching where needed.`,`For existing runtimes, the client never sets client-level GitHubToken or UseLoggedInUser. Server identity, process startup, base directory, idle policy, and shutdown remain server-owned. Apply the selected local base directory/nonzero idle timeout with the server command; zero keeps the runtime default. Session-scoped callbacks are still attached normally. The sample command is for loopback development; secure remote routing or a tunnel separately. A connection token does not add TLS or tenant authorization.`,`ForInProcess() uses COPILOT_CLI_PATH and a compatible copilot_runtime.dll, libcopilot_runtime.dylib, libcopilot_runtime.so, or runtime.node package. Native libraries are process-global and experimental; do not replace a loaded version. No client-level environment, working-directory, or telemetry override is emitted.`,`Virtual storage requires a SessionFsProvider subclass overriding ReadFileAsync, WriteFileAsync, AppendFileAsync, ExistsAsync, StatAsync, MakeDirectoryAsync, ReadDirectoryAsync, ReadDirectoryWithTypesAsync, RemoveAsync, and RenameAsync, then a session-scoped factory registration. POSIX logical paths use the selected workspace (or /) and baseDirectory (or /session-state). SQLite is not advertised; implement ISessionFsSqliteProvider/ISessionFsSqliteTransactionProvider before opting into SQL.`,`Local preflight never constructs a client, connects, loads a native runtime, or calls a model. Source provisioning and NuGet/build work are separate setup steps. The observer emits event types only; assistant content is printed only as the final application result. Idle completion without an assistant message is explicitly reported.`,`Working-directory, skills, plugins, discovery, file-hook, and Git controls address the runtime host's filesystem. A subprocess and a session filesystem provider are not general filesystem, network, or tenant sandboxes.`,...je(e,`csharp`)],sources:[e.target.runtime===`managed`?`sdk-managed-runtime`:e.target.runtime===`external`?`sdk-existing-runtime`:`sdk-inprocess-guide`,`sdk-tools`,`sdk-permissions`,`sdk-hooks`,`sdk-auth`,`sdk-providers`,`sdk-storage-binding`,`sdk-session-config`]}}},rt=`<!-- Copyright (c) Microsoft Corporation. All rights reserved. -->
<Project Sdk="Microsoft.NET.Sdk">
  <PropertyGroup>
    <OutputType>Exe</OutputType>
    <TargetFramework>net10.0</TargetFramework>
    <ImplicitUsings>enable</ImplicitUsings>
    <Nullable>enable</Nullable>
    <NoWarn>$(NoWarn);GHCP001</NoWarn>
    <CopilotSkipCliDownload>true</CopilotSkipCliDownload>
    <DefaultItemExcludes>$(DefaultItemExcludes);.sdk-source/**</DefaultItemExcludes>
  </PropertyGroup>
  <ItemGroup>
    <Compile Remove=".sdk-source/**" />
    <ProjectReference Include=".sdk-source/copilot-sdk/dotnet/src/GitHub.Copilot.SDK.csproj"
                      AdditionalProperties="CopilotSkipCliDownload=true" />
    <EmbeddedResource Include="config/session.json" LogicalName="Harness.session.json" />
    <EmbeddedResource Include="config/host.json" LogicalName="Harness.host.json" />
    <EmbeddedResource Include="config/tools.json" LogicalName="Harness.tools.json" />
  </ItemGroup>
  <Target Name="RequirePinnedSdk" BeforeTargets="PrepareForBuild"
          Condition="!Exists('.sdk-source/copilot-sdk/dotnet/src/GitHub.Copilot.SDK.csproj')">
    <Error Text="Run bash setup-sdk.sh --run to provision the pinned SDK source." />
  </Target>
</Project>
`,it=`#!/usr/bin/env bash
# Copyright (c) Microsoft Corporation. All rights reserved.
set -euo pipefail

usage() {
    cat <<'HELP'
Usage: bash setup-sdk.sh [--run | --help]

Without --run, verify an existing pinned checkout or preview provisioning.
--run creates a NEW .sdk-source/copilot-sdk checkout at the fixed SDK SHA.
Existing files, modified checkouts, and different revisions are never overwritten.
Requires Git and network access to https://github.com/github/copilot-sdk.
This script does not start the runtime or call a model.
HELP
}

run=false
if [ "$#" -gt 1 ]; then usage >&2; exit 2; fi
if [ "$#" -eq 1 ]; then
    case "$1" in
        --run) run=true ;;
        --help|-h) usage; exit 0 ;;
        *) usage >&2; exit 2 ;;
    esac
fi
root=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd -P)
parent="$root/.sdk-source"
destination="$parent/copilot-sdk"
revision="${Ke}"

fail() { printf '%s\\n' "$1" >&2; exit 1; }
command -v git >/dev/null || fail "Git is required."
if [ -L "$parent" ] || [ -L "$destination" ]; then
    fail "Refusing a symlinked SDK source destination."
fi
if [ -e "$destination" ]; then
    [ -d "$destination/.git" ] || fail "Existing SDK destination is not a standalone Git checkout; leaving it untouched."
    repositoryRoot=$(git -C "$destination" rev-parse --show-toplevel)
    repositoryRoot=$(CDPATH= cd -- "$repositoryRoot" && pwd -P)
    [ "$repositoryRoot" = "$destination" ] ||
        fail "SDK destination is not its own repository; leaving it untouched."
    [ "$(git -C "$destination" rev-parse HEAD)" = "$revision" ] ||
        fail "Existing SDK checkout has a different revision; leaving it untouched."
    [ -z "$(git -C "$destination" status --porcelain --untracked-files=normal)" ] ||
        fail "Existing SDK checkout contains changes; leaving it untouched."
    printf 'Verified pinned SDK at %s\\n' "$destination"
    exit 0
fi
if [ "$run" != true ]; then
    printf 'Would provision SDK %s at %s. Pass --run to proceed.\\n' "$revision" "$destination"
    exit 0
fi
mkdir -p "$parent"
mkdir "$destination"
git -C "$destination" init --quiet
git -C "$destination" remote add origin https://github.com/github/copilot-sdk.git
git -C "$destination" fetch --quiet --depth 1 origin "$revision"
git -C "$destination" checkout --quiet --detach "$revision"
[ "$(git -C "$destination" rev-parse HEAD)" = "$revision" ] ||
    fail "SDK revision verification failed; no files were removed."
printf 'Provisioned pinned SDK at %s\\n' "$destination"
`,at=String.raw`// Copyright (c) Microsoft Corporation. All rights reserved.
using System.Collections;
using System.Text.Json;
using System.Text.Json.Serialization;
using GitHub.Copilot;
using GitHub.Copilot.Rpc;

namespace Harness;

internal sealed class HostSettings
{
    public string Runtime { get; init; } = "";
    public string ServerAddress { get; init; } = "";
    public string CliPath { get; init; } = "";
    public string ClientMode { get; init; } = "";
    public string Identity { get; init; } = "";
    public string Credential { get; init; } = "";
    public string CredentialEnv { get; init; } = "";
    public string PermissionMode { get; init; } = "";
    public string Storage { get; init; } = "";
    public string BaseDirectory { get; init; } = "";
    public long IdleTimeoutSeconds { get; init; }
    public bool UserInput { get; init; }
    public bool Observer { get; init; }
    public bool PreToolHook { get; init; }
    public bool PostToolHook { get; init; }
}

internal sealed class ToolDefinition
{
    public required string Name { get; init; }
    public required string Description { get; init; }
    public required JsonElement Parameters { get; init; }
    public bool OverridesBuiltInTool { get; init; }
    public bool IsTerminal { get; init; }
    public bool SkipPermission { get; init; }
}

internal static class Program
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web)
    {
        UnmappedMemberHandling = JsonUnmappedMemberHandling.Disallow,
        AllowOutOfOrderMetadataProperties = true
    };

    private static T ReadConfiguration<T>(string name)
    {
        using var stream = typeof(Program).Assembly.GetManifestResourceStream("Harness." + name)
            ?? throw new InvalidOperationException("Missing embedded config: " + name);
        return JsonSerializer.Deserialize<T>(stream, JsonOptions)
            ?? throw new InvalidOperationException("Empty config: " + name);
    }

    private static CopilotClientOptions ClientOptions(HostSettings settings, SessionConfig config)
    {
        var options = new CopilotClientOptions
        {
            Mode = settings.ClientMode switch
            {
                "empty" => CopilotClientMode.Empty,
                "copilot-cli" => CopilotClientMode.CopilotCli,
                _ => throw new InvalidOperationException("Unknown client mode.")
            },
            Connection = settings.Runtime switch
            {
                "managed" => RuntimeConnection.ForStdio(Host.RuntimeEntrypoint(settings)),
                "external" => RuntimeConnection.ForUri(
                    settings.ServerAddress, Host.RequiredEnvironment("COPILOT_CONNECTION_TOKEN")),
                "inprocess" => RuntimeConnection.ForInProcess(),
                _ => throw new InvalidOperationException("Unknown runtime selection.")
            }
        };
        if (settings.Runtime != "external")
        {
            options.UseLoggedInUser = config.Provider is null && settings.Identity == "developer";
            // __S2S_RUNTIME_ENV_START__
            if (config.Provider is null && settings.Identity == "s2s-installation")
            {
                var token = Host.RequiredEnvironment("COPILOT_GITHUB_TOKEN");
                if (settings.Runtime == "managed")
                {
                    var environment = System.Environment.GetEnvironmentVariables()
                        .Cast<DictionaryEntry>()
                        .ToDictionary(
                            entry => (string)entry.Key,
                            entry => entry.Value?.ToString() ?? "");
                    environment["COPILOT_GITHUB_TOKEN"] = token;
                    options.Environment = environment;
                }
            }
            // __S2S_RUNTIME_ENV_END__
            options.SessionIdleTimeoutSeconds = checked((int)settings.IdleTimeoutSeconds);
            if (settings.Storage == "local")
                options.BaseDirectory = settings.BaseDirectory;
        }
        if (settings.Storage == "virtual")
        {
            options.SessionFs = new SessionFsConfig
            {
                InitialWorkingDirectory = string.IsNullOrEmpty(config.WorkingDirectory)
                    ? "/" : config.WorkingDirectory,
                SessionStatePath = string.IsNullOrEmpty(settings.BaseDirectory)
                    ? "/session-state" : settings.BaseDirectory,
                Conventions = SessionFsSetProviderConventions.Posix
            };
        }
        return options;
    }

    public static async Task<int> Main(string[] args)
    {
        try
        {
            if (args.Length == 1 && args[0] is "--help" or "-h")
            {
                Console.WriteLine("Usage: dotnet run --project HarnessAgent.csproj -- [--check | \"Your prompt\"]");
                return 0;
            }
            var check = args.Length == 1 && args[0] == "--check";
            if (args.Contains("--check") && !check)
                throw new ArgumentException("--check must be used alone; it never sends a prompt.");
            var settings = ReadConfiguration<HostSettings>("host.json");
            var config = ReadConfiguration<SessionConfig>("session.json");
            var tools = ReadConfiguration<ToolDefinition[]>("tools.json");
            var problems = Host.Preflight(settings, config, tools);
            if (problems.Count != 0)
                throw new InvalidOperationException("Preflight failed:\n" + string.Join("\n", problems));
            if (check)
            {
                Console.WriteLine("Local preflight passed. No runtime was started and no model was called.");
                return 0;
            }
            var prompt = string.Join(" ", args);
            if (string.IsNullOrWhiteSpace(prompt))
                throw new ArgumentException("Provide a user prompt, or use --check for local preflight.");

            using var cancellation = new CancellationTokenSource();
            ConsoleCancelEventHandler cancel = (_, evt) =>
            {
                evt.Cancel = true;
                cancellation.Cancel();
            };
            Console.CancelKeyPress += cancel;
            try
            {
                Host.Bind(settings, config, tools, cancellation.Token);
                await using var client = new CopilotClient(ClientOptions(settings, config));
                await client.StartAsync(cancellation.Token);
                await using var session = await client.CreateSessionAsync(config, cancellation.Token);
                AssistantMessageEvent? response;
                try
                {
                    response = await session.SendAndWaitAsync(
                        new MessageOptions { Prompt = prompt },
                        TimeSpan.FromMinutes(5), cancellation.Token);
                }
                catch (Exception error) when (error is OperationCanceledException or TimeoutException)
                {
                    using var abortTimeout = new CancellationTokenSource(TimeSpan.FromSeconds(10));
                    try
                    {
                        await session.AbortAsync(abortTimeout.Token);
                    }
                    catch (Exception abortError)
                    {
                        throw new AggregateException("Turn cancellation and abort failed.", error, abortError);
                    }
                    throw;
                }
                if (response is null)
                {
                    Console.Error.WriteLine(
                        "Turn reached idle without an assistant message; a terminal tool may have completed it.");
                    return 0;
                }
                Console.WriteLine(response.Data.Content);
                return 0;
            }
            finally
            {
                Console.CancelKeyPress -= cancel;
            }
        }
        catch (Exception error)
        {
            Console.Error.WriteLine(error.Message);
            return 1;
        }
    }
}
`,ot=String.raw`// Copyright (c) Microsoft Corporation. All rights reserved.
using System.Globalization;
using System.Runtime.InteropServices;
using System.Text.Json;
using GitHub.Copilot;
using GitHub.Copilot.Rpc;
using Microsoft.Extensions.AI;

namespace Harness;

internal static class Host
{
    // Register real implementations before starting the client. Preflight rejects missing bindings.
    public static readonly Dictionary<string, Func<AIFunctionArguments, CancellationToken, ValueTask<object?>>>
        ToolHandlers = new(StringComparer.Ordinal);
    public static Func<PermissionRequest, PermissionInvocation, Task<PermissionDecision>>? PermissionPolicy { get; set; }
    public static Func<PreToolUseHookInput, HookInvocation, Task<PreToolUseHookOutput?>>? PreToolHook { get; set; }
    public static Func<PostToolUseHookInput, HookInvocation, Task<PostToolUseHookOutput?>>? PostToolHook { get; set; }
    public static Func<CopilotSession, SessionFsProvider>? SessionFilesystemFactory { get; set; }
    public static string? ProviderEndpoint { get; set; }
    private static readonly SemaphoreSlim ConsoleGate = new(1, 1);

    private static string RequiredProviderEndpoint()
    {
        var value = ProviderEndpoint?.Trim();
        if (string.IsNullOrEmpty(value))
            throw new NotImplementedException("Provide the provider endpoint string in Host.cs ProviderEndpoint.");
        return value;
    }

    public static string RequiredEnvironment(string name)
    {
        var value = Environment.GetEnvironmentVariable(name);
        if (string.IsNullOrWhiteSpace(value))
            throw new InvalidOperationException($"Set {name} in the process environment.");
        return value;
    }

    // __GITHUB_TOKEN_PROVIDER_START__
    private static GitHubTokenProviderResult ReadGitHubToken()
    {
        var token = RequiredEnvironment("GITHUB_TOKEN");
        var raw = RequiredEnvironment("GITHUB_TOKEN_EXPIRES_AT");
        if (!long.TryParse(raw, NumberStyles.Integer, CultureInfo.InvariantCulture, out var expiresAt))
            throw new InvalidOperationException(
                "GITHUB_TOKEN_EXPIRES_AT must be an integer UNIX timestamp in seconds.");
        var now = DateTimeOffset.UtcNow.ToUnixTimeSeconds();
        if (expiresAt <= now)
            throw new InvalidOperationException(
                "GITHUB_TOKEN has expired; replace both token and its actual expiration.");
        return GitHubTokenProviderResult.FromToken(new GitHubToken
        {
            AccessToken = token,
            ExpiresIn = expiresAt - now
        });
    }

    private static Task<GitHubTokenProviderResult> AcquireGitHubToken(GitHubTokenProviderArgs _)
        => Task.FromResult(ReadGitHubToken());
    // __GITHUB_TOKEN_PROVIDER_END__

    private static Task<string> AcquireBearerToken(ProviderTokenArgs _)
        // Replace with scoped managed-identity acquisition and caching for production.
        => Task.FromResult(RequiredEnvironment("MODEL_BEARER_TOKEN"));

    private static async Task<UserInputResponse> ReadConsole(
        UserInputRequest request, CancellationToken cancellationToken)
    {
        await ConsoleGate.WaitAsync(cancellationToken);
        try
        {
            var freeform = request.AllowFreeform != false;
            if ((request.Choices?.Count ?? 0) == 0 && !freeform)
                throw new InvalidOperationException("Agent supplied neither choices nor freeform input.");
            Console.Error.WriteLine(request.Question);
            foreach (var choice in request.Choices ?? Array.Empty<string>())
                Console.Error.WriteLine(" - " + choice);
            while (true)
            {
                Console.Error.Write("> ");
                var answer = await Console.In.ReadLineAsync(cancellationToken)
                    ?? throw new EndOfStreamException("Console input closed.");
                var isChoice = request.Choices?.Contains(answer, StringComparer.Ordinal) == true;
                if (isChoice || freeform)
                    return new UserInputResponse { Answer = answer, WasFreeform = !isChoice };
                Console.Error.WriteLine("Enter an exact offered choice.");
            }
        }
        finally
        {
            ConsoleGate.Release();
        }
    }

    private static string FindExecutable(string path)
    {
        if (File.Exists(path))
            return Path.GetFullPath(path);
        if (!Path.IsPathRooted(path) && !path.Contains('/') && !path.Contains('\\'))
        {
            var extensions = OperatingSystem.IsWindows()
                ? (Environment.GetEnvironmentVariable("PATHEXT") ?? ".EXE;.CMD;.BAT").Split(';')
                : new[] { "" };
            foreach (var directory in (Environment.GetEnvironmentVariable("PATH") ?? "").Split(Path.PathSeparator))
            {
                if (string.IsNullOrEmpty(directory)) continue;
                foreach (var extension in extensions.Prepend(""))
                {
                    var candidate = Path.Combine(directory, path + extension);
                    if (File.Exists(candidate))
                        return Path.GetFullPath(candidate);
                }
            }
        }
        throw new FileNotFoundException("Runtime executable was not found. Provision the selected runtime.");
    }

    public static string RuntimeEntrypoint(HostSettings settings)
    {
        var path = settings.Runtime == "inprocess" || string.IsNullOrWhiteSpace(settings.CliPath)
            ? RequiredEnvironment("COPILOT_CLI_PATH") : settings.CliPath;
        path = settings.Runtime == "inprocess" ? Path.GetFullPath(path) : FindExecutable(path);
        if (!File.Exists(path))
            throw new FileNotFoundException("Runtime entrypoint must be an existing regular file.");
        if (settings.Runtime == "managed")
        {
            if (path.EndsWith(".js", StringComparison.OrdinalIgnoreCase))
                _ = FindExecutable("node");
            return path;
        }
        var (library, platform) = OperatingSystem.IsWindows()
            ? ("copilot_runtime.dll", "win32")
            : OperatingSystem.IsMacOS()
                ? ("libcopilot_runtime.dylib", "darwin")
                : OperatingSystem.IsLinux()
                    ? ("libcopilot_runtime.so", "linux")
                    : throw new PlatformNotSupportedException("Unsupported native runtime operating system.");
        var arch = RuntimeInformation.ProcessArchitecture switch
        {
            Architecture.X64 => "x64",
            Architecture.Arm64 => "arm64",
            _ => throw new PlatformNotSupportedException("Native hosting needs a matching x64 or arm64 bundle.")
        };
        var directory = Path.GetDirectoryName(path)!;
        var candidates = new List<string>
        {
            Path.Combine(directory, library),
            Path.Combine(directory, "runtime.node"),
            Path.Combine(directory, "prebuilds", platform + "-" + arch, "runtime.node")
        };
        if (platform == "linux")
            candidates.Add(Path.Combine(directory, "prebuilds", "linuxmusl-" + arch, "runtime.node"));
        if (!candidates.Any(candidate => File.Exists(candidate) && new FileInfo(candidate).Length > 0))
            throw new FileNotFoundException(
                "Native library is missing beside COPILOT_CLI_PATH; provision the matching OS/architecture/libc package.");
        return path;
    }

    public static List<string> Preflight(HostSettings settings, SessionConfig config, ToolDefinition[] tools)
    {
        var problems = new List<string>();
        void Check(Action action)
        {
            try { action(); }
            catch (Exception error) { problems.Add("- " + error.Message); }
        }
        if (settings.ClientMode is not ("empty" or "copilot-cli"))
            problems.Add("- Unknown client mode.");
        if (settings.Storage is not ("local" or "virtual"))
            problems.Add("- Unknown storage selection.");
        if (settings.PermissionMode == "host" && PermissionPolicy is null)
            problems.Add("- Implement and register PermissionPolicy in Host.cs.");
        else if (settings.PermissionMode is not ("host" or "allow-all"))
            problems.Add("- Unknown permission mode.");
        if (settings.Storage == "local" && string.IsNullOrWhiteSpace(settings.BaseDirectory))
            problems.Add("- Local storage requires baseDirectory.");
        if (settings.IdleTimeoutSeconds < 0
            || (settings.Runtime != "external" && settings.IdleTimeoutSeconds > int.MaxValue))
            problems.Add("- Client idleTimeoutSeconds must fit a nonnegative Int32; external server values must be nonnegative.");
        if (settings.Runtime != "managed" && settings.CliPath.Length != 0)
            problems.Add("- cliPath is only valid with a managed child.");
        switch (settings.Runtime)
        {
            case "external":
                if (!Uri.TryCreate("tcp://" + settings.ServerAddress, UriKind.Absolute, out var endpoint)
                    || endpoint.Host.Length == 0 || endpoint.Port is < 1 or > 65535
                    || endpoint.UserInfo.Length != 0 || endpoint.Query.Length != 0
                    || endpoint.Fragment.Length != 0 || endpoint.AbsolutePath is not ("" or "/"))
                    problems.Add("- External serverAddress must be a canonical host:port.");
                Check(() => RequiredEnvironment("COPILOT_CONNECTION_TOKEN"));
                break;
            case "managed":
            case "inprocess":
                Check(() => RuntimeEntrypoint(settings));
                break;
            default:
                problems.Add("- Unknown runtime selection.");
                break;
        }
        if (string.IsNullOrWhiteSpace(config.Model))
            Check(() => config.Model = RequiredEnvironment("COPILOT_MODEL").Trim());
        if (config.Provider is not null && string.IsNullOrWhiteSpace(config.Provider.BaseUrl))
            Check(() => RequiredProviderEndpoint());
        if (config.Provider is null)
        {
            // __COPILOT_IDENTITY_PREFLIGHT_START__
            if (settings.Identity == "host-token")
                Check(() => ReadGitHubToken());
            else if (settings.Identity != "developer")
                problems.Add("- Unknown Copilot identity selection.");
            // __COPILOT_IDENTITY_PREFLIGHT_END__
        }
        else if (settings.Credential == "api-key")
            Check(() => RequiredEnvironment(settings.CredentialEnv));
        else if (settings.Credential == "bearer-callback")
            Check(() => RequiredEnvironment("MODEL_BEARER_TOKEN"));
        else
            problems.Add("- Unknown BYOK credential selection.");
        foreach (var tool in tools)
        {
            if (!ToolHandlers.ContainsKey(tool.Name))
                problems.Add($"- Implement and register ToolHandlers[\"{tool.Name}\"] in Host.cs.");
            if (tool.Parameters.ValueKind != JsonValueKind.Object
                || !tool.Parameters.TryGetProperty("type", out var type)
                || type.ValueKind != JsonValueKind.String || type.GetString() != "object")
                problems.Add($"- Tool {tool.Name} requires its original object JSON schema.");
            if (tool.SkipPermission)
                problems.Add($"- Tool {tool.Name} must not skip the host permission policy.");
        }
        if (settings.PreToolHook && PreToolHook is null)
            problems.Add("- Implement and register PreToolHook in Host.cs.");
        if (settings.PostToolHook && PostToolHook is null)
            problems.Add("- Implement and register PostToolHook in Host.cs.");
        if (settings.Storage == "virtual" && SessionFilesystemFactory is null)
            problems.Add("- Implement and register SessionFilesystemFactory in Host.cs.");
        return problems;
    }

    public static void Bind(
        HostSettings settings, SessionConfig config, ToolDefinition[] tools, CancellationToken cancellationToken)
    {
        config.OnPermissionRequest = settings.PermissionMode == "host"
            ? PermissionPolicy ?? throw new NotImplementedException("Selected host permission policy is not implemented.")
            : PermissionHandler.ApproveAll;
        if (settings.UserInput)
            config.OnUserInputRequest = (request, _) => ReadConsole(request, cancellationToken);
        if (settings.Observer)
            config.OnEvent = evt => Console.Error.WriteLine("event=" + evt.Type);
        // __COPILOT_IDENTITY_BINDING_START__
        if (config.Provider is null && settings.Identity == "host-token")
            config.GitHubTokenProvider = AcquireGitHubToken;
        // __COPILOT_IDENTITY_BINDING_END__
        if (config.Provider is not null)
        {
            if (string.IsNullOrWhiteSpace(config.Provider.BaseUrl))
                config.Provider.BaseUrl = RequiredProviderEndpoint();
            if (settings.Credential == "bearer-callback")
                config.Provider.BearerTokenProvider = AcquireBearerToken;
            else
                config.Provider.ApiKey = RequiredEnvironment(settings.CredentialEnv);
        }
        config.Tools = tools.Select(tool => (AIFunctionDeclaration)new HostTool(tool)).ToList();
        if (settings.PreToolHook || settings.PostToolHook)
        {
            config.Hooks = new SessionHooks();
            if (settings.PreToolHook)
                config.Hooks.OnPreToolUse = (input, invocation) => PreToolHook is { } handler
                    ? handler(input, invocation)
                    : throw new NotImplementedException("Selected pre-tool hook is not implemented.");
            if (settings.PostToolHook)
                config.Hooks.OnPostToolUse = (input, invocation) => PostToolHook is { } handler
                    ? handler(input, invocation)
                    : throw new NotImplementedException("Selected post-tool hook is not implemented.");
        }
        if (settings.Storage == "virtual")
            config.CreateSessionFsProvider = session => SessionFilesystemFactory is { } factory
                ? factory(session)
                : throw new NotImplementedException("Selected session filesystem provider is not implemented.");
    }

    private sealed class HostTool : AIFunction
    {
        private readonly AIFunction metadata;
        private readonly JsonElement schema;

        public HostTool(ToolDefinition definition)
        {
            schema = definition.Parameters.Clone();
            metadata = CopilotTool.DefineTool(
                (Func<object?>)(() => throw new NotImplementedException("Metadata-only tool delegate must not execute.")),
                toolOptions: new CopilotToolOptions
                {
                    OverridesBuiltInTool = definition.OverridesBuiltInTool,
                    IsTerminal = definition.IsTerminal,
                    SkipPermission = false
                },
                factoryOptions: new AIFunctionFactoryOptions
                {
                    Name = definition.Name,
                    Description = definition.Description
                });
        }

        public override string Name => metadata.Name;
        public override string Description => metadata.Description;
        public override JsonElement JsonSchema => schema;
        public override IReadOnlyDictionary<string, object?> AdditionalProperties => metadata.AdditionalProperties;

        protected override ValueTask<object?> InvokeCoreAsync(
            AIFunctionArguments arguments, CancellationToken cancellationToken)
        {
            if (!ToolHandlers.TryGetValue(Name, out var handler))
                throw new NotImplementedException($"Host tool {Name} is not implemented.");
            return handler(arguments, cancellationToken);
        }
    }
}
`,st=z;function W(e){return[e.target.runtime===`managed`?`sdk-managed-runtime`:e.target.runtime===`external`?`sdk-existing-runtime`:`sdk-inprocess-guide`]}function ct(e,t){let n=[],r=W(e);if(e.target.cliPath.trim()&&e.target.runtime!==`managed`&&n.push({id:`${t}-managed-cli-path-only`,title:`An executable override is only supported for managed children`,detail:`Clear target.cliPath. For in-process hosting, provision a matching runtime package through the host's COPILOT_CLI_PATH before startup; for an existing service, configure its executable on the server host.`,fields:[`target.cliPath`,`target.runtime`],sources:r}),e.target.runtime===`external`)try{d(e.target)}catch{n.push({id:`${t}-invalid-runtime-endpoint`,title:`The existing runtime needs a valid TCP endpoint`,detail:`Use host:port or tcp://host:port, without credentials, query parameters, or a path.`,fields:[`target.serverUrl`],sources:r})}for(let i of e.mcpServers)for(let e of i.tools)e.wireName!==`${i.name}-${e.name}`&&n.push({id:`${t}-mcp-name-${i.name}-${e.name}`,title:`Correct the runtime name of ${i.name}/${e.name}`,detail:`This SDK exposes the tool as ${i.name}-${e.name}. Change its wire name and any agent/root references to that name; the SDK does not provide an arbitrary MCP tool renaming layer.`,fields:[`mcpServers`,`agents`,`rootExcludedTools`],sources:r});return n}function lt(e){let t=e.target.runtime===`external`?d(e.target):{host:``,port:0,address:``};return{client:{runtime:e.target.runtime,mode:e.clientMode,cliPath:e.target.cliPath,...t,baseDirectory:e.session.baseDirectory,idleTimeoutSeconds:e.session.idleTimeoutSeconds},storage:e.session.storage,identity:e.identity,credential:e.model.credential,credentialEnv:e.model.credentialEnv,permissionMode:e.policy.permissionMode,observer:e.events.observer,preToolHook:e.policy.preToolHook,postToolHook:e.policy.postToolHook,session:y(e),tools:w(e),...e.policy.hooks.length?{hooks:e.policy.hooks}:{},...e.policy.handlers.length?{handlers:e.policy.handlers}:{},...e.context.skillProvider?{skillProvider:!0}:{},...e.model.allowedModels.length?{allowedModels:e.model.allowedModels}:{},...e.events.logLevel==="default"?{}:{logLevel:e.events.logLevel},...e.output.responseSchema.trim()?{responseSchema:JSON.parse(e.output.responseSchema)}:{}}}function ut(e){let t=new Set;e.policy.hooks.length&&t.add(`lifecycle-hooks`);for(let n of e.policy.hooks)t.add(`hook-${n}`);e.policy.handlers.length&&t.add(`handlers`);for(let n of e.policy.handlers)t.add(`handler-${n}`);return e.context.skillProvider&&t.add(`skill-provider`),t}function dt(e,t){return e.replace(/^[ \t]*\/\/ <opt:([\w-]+)>\n([\s\S]*?)^[ \t]*\/\/ <\/opt:\1>\n/gm,(e,n,r)=>t.has(n)?r:``)}function ft(e,t){let n=b(e,t),r=(e,r)=>{let i=`env-${e}`;n.some(e=>e.id===i)||n.push({id:i,title:`Set ${e}`,detail:r,file:t,kind:`environment`,environmentVariable:e})};e.identity===`host-token`&&e.model.provider===`copilot`?(r(`GITHUB_TOKEN`,`Supply the host's GitHub access token for the selected Copilot authentication route.`),r(`GITHUB_TOKEN_EXPIRES_AT`,`Supply the token's real expiry as a UNIX timestamp in seconds. Each acquisition subtracts the current time and rejects nonpositive remaining lifetime; the adapter never invents or resets a TTL. Replace the host provider to integrate an actual refreshing token broker.`)):e.model.provider===`copilot`&&e.identity===`developer`&&n.push({id:`developer-auth`,title:`Provision developer authentication on the runtime host`,detail:`The bootstrap permits the runtime's logged-in-user authentication; --check cannot verify that login without contacting the runtime. Empty mode disables the system keychain, so credentials must be available in the selected runtime state location.`,file:t,kind:`review`}),e.target.runtime===`external`&&(r(`COPILOT_CONNECTION_TOKEN`,`Use the same nonempty connection token in the application and the separately operated runtime. It is never written into configuration data.`),n.push({id:`env-COPILOT_RUNTIME_EXECUTABLE`,environmentVariable:`COPILOT_RUNTIME_EXECUTABLE`,title:`Set COPILOT_RUNTIME_EXECUTABLE on the server host`,detail:`Only the separate server launch recipe needs this variable. Point it at the compatible executable runtime wrapper with its adjacent runtime.node/assets; the application does not need access to that server-local file.`,file:`start-runtime.sh`,kind:`environment`}),n.push({id:`server-launch`,title:`Apply the selected server-owned settings`,detail:`Run start-runtime.sh --run on the runtime host, with COPILOT_RUNTIME_EXECUTABLE pointing at the compatible runtime wrapper. The script applies the planned state directory, idle timeout, and login policy. These cannot be changed by connecting a client to an already-running service. Secure remote binding and tenant authorization separately.`,file:`start-runtime.sh`,kind:`runtime`})),e.model.provider!==`copilot`&&e.model.credential===`bearer-callback`&&n.push({id:`bearer-provider`,title:`Integrate bearer credential rotation`,detail:`The host callback reads MODEL_BEARER_TOKEN before each provider request. Supply the raw token without a Bearer prefix. An environment variable is not a refreshing credential broker; replace this exact callback for live credential rotation.`,file:t,kind:`review`});let i=(e,r,i)=>{n.some(t=>t.id===e)||n.push({id:e,title:r,detail:i,file:t,kind:`host-code`})};for(let t of e.policy.hooks)i(`hook-${t}`,`Implement and register the ${t} hook`,`Preflight fails until the generated failing callback is replaced and marked implemented. A selected hook is not satisfied by a no-op.`);for(let t of e.policy.handlers)i(`handler-${t}`,`Implement and register the ${t} handler`,`Preflight fails until the generated failing handler is replaced and marked implemented. It must return a real decision, not an automatic approval.`);return e.context.skillProvider&&i(`skill-provider`,`Implement and register the skill provider`,`Experimental. Preflight fails until the generated failing SkillProvider lists and reads your real skills and is marked implemented.`),n}function pt(e){return`'${e.replaceAll(`'`,`'"'"'`)}'`}function mt(e){if(e.target.runtime!==`external`)return[];let t=d(e.target);return[{path:`start-runtime.sh`,language:`text`,content:`#!/usr/bin/env bash
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
${e.identity===`s2s-installation`?`  COPILOT_GITHUB_TOKEN       Fresh GitHub App installation token; runtime host only.
`:``}\
This script sets the planned server state/login/idle policy. It does not set up
TLS, public binding, a sandbox, or tenant authorization.
HELP
}
if [[ $# -eq 0 || \${1:-} == --help ]]; then usage; exit 0; fi
if [[ $# -ne 1 || $1 != --run ]]; then usage >&2; exit 2; fi
: "\${COPILOT_RUNTIME_EXECUTABLE:?Set the compatible runtime wrapper on the server host}"
: "\${COPILOT_CONNECTION_TOKEN:?Set the shared TCP connection token on both hosts}"
${e.identity===`s2s-installation`?`: "\${COPILOT_GITHUB_TOKEN:?Set a fresh GitHub App installation token on the runtime host}"
`:``}\
if [[ ! -f $COPILOT_RUNTIME_EXECUTABLE || ! -x $COPILOT_RUNTIME_EXECUTABLE ]]; then
    printf '%s\\n' 'COPILOT_RUNTIME_EXECUTABLE must name an executable file.' >&2
    exit 1
fi
${e.session.storage===`local`?`export COPILOT_HOME=${pt(e.session.baseDirectory)}\n`:`# SessionFs paths belong to the client provider; server-global storage remains host-owned.
`}${e.clientMode===`empty`?`export COPILOT_DISABLE_KEYTAR=1
`:``}args=(--server --no-auto-update --port ${t.port})
${e.session.idleTimeoutSeconds>0?`args+=(--session-idle-timeout ${e.session.idleTimeoutSeconds})\n`:``}${e.identity===`host-token`||e.identity===`s2s-installation`?`args+=(--no-auto-login)
`:``}exec "$COPILOT_RUNTIME_EXECUTABLE" "\${args[@]}"
`}]}var ht={preMcpToolCall:{setter:`setOnPreMcpToolCall`,type:`PreMcpToolCall`,method:`preMcpToolCall`},userPromptSubmitted:{setter:`setOnUserPromptSubmitted`,type:`UserPromptSubmitted`,method:`userPromptSubmitted`},userPromptTransformed:{setter:`setOnUserPromptTransformed`,type:`UserPromptTransformed`,method:`userPromptTransformed`},sessionStart:{setter:`setOnSessionStart`,type:`SessionStart`,method:`sessionStart`},sessionEnd:{setter:`setOnSessionEnd`,type:`SessionEnd`,method:`sessionEnd`},agentStop:{setter:`setOnAgentStop`,type:`AgentStop`,method:`agentStop`},subagentStart:{setter:`setOnSubagentStart`,type:`SubagentStart`,method:`subagentStart`},subagentStop:{setter:`setOnSubagentStop`,type:`SubagentStop`,method:`subagentStop`}},gt={elicitation:{setter:`setOnElicitationRequest`,result:`ElicitationResult`,parameters:`ElicitationContext _context`},exitPlanMode:{setter:`setOnExitPlanMode`,result:`ExitPlanModeResult`,parameters:`ExitPlanModeRequest _request, ExitPlanModeInvocation _context`},autoModeSwitch:{setter:`setOnAutoModeSwitch`,result:`AutoModeSwitchResponse`,parameters:`AutoModeSwitchRequest _request, AutoModeSwitchInvocation _context`},mcpAuth:{setter:`setOnMcpAuthRequest`,result:`McpAuthResult`,parameters:`McpAuthRequest _request, McpAuthInvocation _context`}};function _t(){return`        // <opt:lifecycle-hooks>
        var lifecycle = config.getHooks() == null ? new SessionHooks() : config.getHooks();
        var selectedHooks = data.has("hooks") ? strings(data, "hooks") : List.<String>of();
        // </opt:lifecycle-hooks>
${Object.entries(ht).map(([e,t])=>`        // <opt:hook-${e}>\n        if (selectedHooks.contains("${e}")) lifecycle.${t.setter}(host::${t.method});\n        // </opt:hook-${e}>\n`).join(``)}        // <opt:lifecycle-hooks>
        config.setHooks(lifecycle);
        // </opt:lifecycle-hooks>
`}function vt(){return`        // <opt:handlers>
        var selectedHandlers = data.has("handlers") ? strings(data, "handlers") : List.<String>of();
        // </opt:handlers>
${Object.entries(gt).map(([e,t])=>`        // <opt:handler-${e}>\n        if (selectedHandlers.contains("${e}")) config.${t.setter}(host::${e});\n        // </opt:handler-${e}>\n`).join(``)}`}function yt(){return Object.entries(ht).map(([e,t])=>`    // <opt:hook-${e}>
    CompletableFuture<${t.type}HookOutput> ${t.method}(${t.type}HookInput _input, HookInvocation _context) {
        return CompletableFuture.failedFuture(new UnsupportedOperationException("HOST TODO: implement the ${e} hook"));
    }

    // </opt:hook-${e}>
`).join(``)}function bt(){return Object.entries(gt).map(([e,t])=>`    // <opt:handler-${e}>
    CompletableFuture<${t.result}> ${e}(${t.parameters}) {
        return CompletableFuture.failedFuture(new UnsupportedOperationException("HOST TODO: implement the ${e} handler"));
    }

    // </opt:handler-${e}>
`).join(``)}var xt=String.raw`// Copyright (c) Microsoft Corporation. All rights reserved.
package harness;

import com.github.copilot.AllowCopilotExperimental;
import com.github.copilot.CopilotClient;
import com.github.copilot.generated.rpc.SessionModelSetAllowedModelsParams;
import com.github.copilot.rpc.MessageOptions;

@AllowCopilotExperimental
public final class Main {
    private Main() {}

    private record StopClient(CopilotClient client) implements AutoCloseable {
        @Override
        public void close() throws Exception {
            client.stop().get();
        }
    }

    public static void main(String[] args) throws Exception {
        boolean check = args.length == 1 && "--check".equals(args[0]);
        if (!check && (args.length == 0 || "--check".equals(args[0]))) {
            throw new IllegalArgumentException("Usage: harness.Main --check | <prompt>");
        }
        Configuration configuration = Configuration.read();
        try (HostExtensions host = new HostExtensions(configuration)) {
            var issues = host.preflight();
            if (!issues.isEmpty()) {
                throw new IllegalStateException("Preflight failed:\n - " + String.join("\n - ", issues));
            }
            if (check) {
                System.out.println("Preflight passed. No runtime was started and no model was contacted.");
                return;
            }
            try (var client = new CopilotClient(configuration.clientOptions());
                    var _shutdown = new StopClient(client)) {
                client.start().get();
                try (var session = client.createSession(configuration.sessionConfig(host)).get()) {
                    var allowedModels = configuration.allowedModels();
                    if (!allowedModels.isEmpty()) {
                        // Java SessionConfig has no allowlist field; apply it before the first turn.
                        session.getRpc().model.setAllowedModels(
                            new SessionModelSetAllowedModelsParams(null, allowedModels)).get();
                    }
                    var options = new MessageOptions().setPrompt(String.join(" ", args));
                    var responseSchema = configuration.responseSchema();
                    if (responseSchema != null) options.setResponseSchema(responseSchema);
                    var message = session.sendAndWait(options, 120_000L).get();
                    if (message == null) {
                        System.out.println("Turn completed without an assistant message.");
                    } else if (message.getData() == null || message.getData().content() == null) {
                        throw new IllegalStateException("The final assistant event has no text content");
                    } else {
                        System.out.println(message.getData().content());
                    }
                }
            }
        }
    }
}
`,St=String.raw`// Copyright (c) Microsoft Corporation. All rights reserved.
package harness;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.github.copilot.AllowCopilotExperimental;
import com.github.copilot.SystemMessageMode;
import com.github.copilot.generated.rpc.DiagnosticLogLevel;
import com.github.copilot.generated.rpc.DiagnosticSourcesConfiguration;
import com.github.copilot.generated.rpc.DiagnosticsConfiguration;
import com.github.copilot.generated.rpc.McpDiagnosticSourceConfiguration;
import com.github.copilot.rpc.*;
import java.io.IOException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;

@AllowCopilotExperimental
final class Configuration {
    private static final ObjectMapper MAPPER = new ObjectMapper();
    final JsonNode data;
    final JsonNode client;
    final JsonNode session;

    private Configuration(JsonNode data) {
        this.data = data;
        this.client = required(data, "client");
        this.session = required(data, "session");
        fields(data, Set.of("client", "session", "tools", "storage", "identity", "credential",
            "credentialEnv", "permissionMode", "observer", "preToolHook", "postToolHook", "cliPathRuntime",
            "hooks", "handlers", "skillProvider", "allowedModels", "logLevel", "responseSchema"));
        fields(client, Set.of("runtime", "mode", "cliPath", "host", "port", "address",
            "baseDirectory", "idleTimeoutSeconds"));
        fields(session, Set.of("model", "reasoningEffort", "contextTier", "systemMessage",
            "availableTools", "excludedTools", "workingDirectory", "enableConfigDiscovery",
            "enableSkills", "enableFileHooks", "enableHostGitOperations", "skillDirectories",
            "pluginDirectories", "mcpServers", "customAgents", "agent", "defaultAgent",
            "infiniteSessions", "largeOutput", "streaming", "provider",
            "agentDirectories", "hookDirectories", "instructionDirectories", "additionalDirectories",
            "includedBuiltinSkills", "skipCustomInstructions", "enableOnDemandInstructionDiscovery",
            "refreshCustomInstructions", "organizationCustomInstructions", "enableManagedSettings",
            "enforceManagedModelDefaults", "managedSettings", "capi", "reasoningSummary",
            "imageGeneration", "toolSearch", "askUserVariant", "excludedBuiltinAgents", "name",
            "interactiveUser", "diagnostics", "enableSessionStore", "enableFileChangeTracking",
            "includeSubAgentStreamingEvents"));
        if (!"local".equals(text(data, "storage"))) {
            throw new IllegalArgumentException("Java SessionFs is unsupported; regenerate for local storage or Rust");
        }
        if (!Set.of("host-token", "developer", "s2s-installation").contains(text(data, "identity"))
                || !Set.of("api-key", "bearer-callback").contains(text(data, "credential"))
                || !Set.of("empty", "copilot-cli").contains(text(client, "mode"))
                || !Set.of("managed", "external", "inprocess").contains(text(client, "runtime"))) {
            throw new IllegalArgumentException("Unknown identity, credential, client mode, or runtime selection");
        }
        long idle = integer(client, "idleTimeoutSeconds");
        if (idle < 0 || idle > Integer.MAX_VALUE || text(client, "baseDirectory").isBlank()) {
            throw new IllegalArgumentException("Provide a state directory and an idle timeout between 0 and 2147483647");
        }
        if (!"managed".equals(text(client, "runtime")) && !text(client, "cliPath").isBlank()) {
            throw new IllegalArgumentException("cliPath is only supported for managed children");
        }
    }

    static Configuration read() throws IOException {
        try (var stream = Configuration.class.getResourceAsStream("/bootstrap-config.json")) {
            if (stream == null) throw new IOException("Missing bootstrap-config.json resource");
            return new Configuration(new ObjectMapper().readTree(stream));
        }
    }

    CopilotClientOptions clientOptions() {
        RuntimeConnection connection = switch (text(client, "runtime")) {
            case "managed" -> text(client, "cliPath").isBlank()
                ? RuntimeConnection.forStdio()
                : RuntimeConnection.forStdio(text(client, "cliPath"));
            case "external" -> RuntimeConnection.forUri(text(client, "address"))
                .setConnectionToken(HostExtensions.requiredEnv("COPILOT_CONNECTION_TOKEN"));
            case "inprocess" -> RuntimeConnection.forInProcess();
            default -> throw new IllegalArgumentException("Unknown runtime selection");
        };
        var options = new CopilotClientOptions()
            .setConnection(connection)
            .setMode(switch (text(client, "mode")) {
                case "empty" -> CopilotClientMode.EMPTY;
                case "copilot-cli" -> CopilotClientMode.COPILOT_CLI;
                default -> throw new IllegalArgumentException("Unknown client mode");
            });
        if (!"external".equals(text(client, "runtime"))) {
            options.setCopilotHome(text(client, "baseDirectory"))
                .setSessionIdleTimeoutSeconds(Math.toIntExact(integer(client, "idleTimeoutSeconds")))
                .setUseLoggedInUser(!session.has("provider") && "developer".equals(text(data, "identity")));
            // The SDK passes the log level to the runtime it starts; an existing server owns its own.
            if (data.has("logLevel")) options.setLogLevel(text(data, "logLevel"));
            // __S2S_RUNTIME_ENV_START__
            if (!session.has("provider") && "s2s-installation".equals(text(data, "identity"))) {
                String token = HostExtensions.requiredEnv("COPILOT_GITHUB_TOKEN");
                if ("managed".equals(text(client, "runtime"))) {
                    var environment = new HashMap<>(System.getenv());
                    environment.put("COPILOT_GITHUB_TOKEN", token);
                    options.setEnvironment(environment);
                }
            }
            // __S2S_RUNTIME_ENV_END__
        }
        return options;
    }

    List<String> allowedModels() {
        return data.has("allowedModels") ? strings(data, "allowedModels") : List.of();
    }

    Map<String, Object> responseSchema() {
        return data.has("responseSchema")
            ? MAPPER.convertValue(object(data, "responseSchema"), new TypeReference<Map<String, Object>>() {})
            : null;
    }

    private void extendedSession(SessionConfig config) {
        if (session.has("name")) config.setName(text(session, "name"));
        if (session.has("reasoningSummary")) config.setReasoningSummary(text(session, "reasoningSummary"));
        if (session.has("capi")) {
            JsonNode capi = object(session, "capi");
            fields(capi, Set.of("autoTier"));
            config.setCapi(new CapiSessionOptions().setAutoTier(AutoTier.fromValue(text(capi, "autoTier"))));
        }
        if (session.has("askUserVariant")) {
            config.setAskUserVariant(AskUserVariant.fromValue(text(session, "askUserVariant")));
        }
        if (session.has("excludedBuiltinAgents")) {
            config.setExcludedBuiltInAgents(strings(session, "excludedBuiltinAgents"));
        }
        if (session.has("includedBuiltinSkills")) {
            config.setIncludedBuiltinSkills(strings(session, "includedBuiltinSkills"));
        }
        if (session.has("agentDirectories")) config.setAgentDirectories(strings(session, "agentDirectories"));
        if (session.has("hookDirectories")) config.setHookDirectories(strings(session, "hookDirectories"));
        if (session.has("instructionDirectories")) {
            config.setInstructionDirectories(strings(session, "instructionDirectories"));
        }
        if (session.has("additionalDirectories")) {
            config.setAdditionalDirectories(strings(session, "additionalDirectories"));
        }
        if (session.has("skipCustomInstructions")) {
            config.setSkipCustomInstructions(flag(session, "skipCustomInstructions"));
        }
        if (session.has("enableOnDemandInstructionDiscovery")) {
            config.setEnableOnDemandInstructionDiscovery(flag(session, "enableOnDemandInstructionDiscovery"));
        }
        if (session.has("refreshCustomInstructions")) {
            config.setRefreshCustomInstructions(flag(session, "refreshCustomInstructions"));
        }
        if (session.has("organizationCustomInstructions")) {
            config.setOrganizationCustomInstructions(text(session, "organizationCustomInstructions"));
        }
        if (session.has("enableManagedSettings")) config.setEnableManagedSettings(flag(session, "enableManagedSettings"));
        if (session.has("enforceManagedModelDefaults")) {
            config.setEnforceManagedModelDefaults(flag(session, "enforceManagedModelDefaults"));
        }
        if (session.has("managedSettings")) {
            JsonNode managed = object(session, "managedSettings");
            fields(managed, Set.of("permissions"));
            JsonNode rules = object(managed, "permissions");
            fields(rules, Set.of("disableBypassPermissionsMode", "disableAssistedPermissionsMode",
                "deny", "ask", "allow", "limitTo"));
            var permissions = new ManagedSettingsPermissions();
            if (rules.has("disableBypassPermissionsMode")) {
                permissions.setDisableBypassPermissionsMode(text(rules, "disableBypassPermissionsMode"));
            }
            if (rules.has("disableAssistedPermissionsMode")) {
                permissions.setDisableAssistedPermissionsMode(flag(rules, "disableAssistedPermissionsMode"));
            }
            if (rules.has("deny")) permissions.setDeny(strings(rules, "deny"));
            if (rules.has("ask")) permissions.setAsk(strings(rules, "ask"));
            if (rules.has("allow")) permissions.setAllow(strings(rules, "allow"));
            if (rules.has("limitTo")) permissions.setLimitTo(strings(rules, "limitTo"));
            config.setManagedSettings(new ManagedSettings().setPermissions(permissions));
        }
        if (session.has("imageGeneration")) {
            JsonNode image = object(session, "imageGeneration");
            fields(image, Set.of("enabled"));
            config.setImageGeneration(new ImageGenerationConfig().setEnabled(flag(image, "enabled")));
        }
        if (session.has("toolSearch")) {
            JsonNode search = object(session, "toolSearch");
            fields(search, Set.of("enabled", "deferThreshold"));
            var toolSearch = new ToolSearchConfig();
            if (search.has("enabled")) toolSearch.setEnabled(flag(search, "enabled"));
            if (search.has("deferThreshold")) {
                toolSearch.setDeferThreshold(Math.toIntExact(integer(search, "deferThreshold")));
            }
            config.setToolSearch(toolSearch);
        }
        if (session.has("interactiveUser")) config.setInteractiveUser(flag(session, "interactiveUser"));
        if (session.has("diagnostics")) {
            JsonNode diagnostics = object(session, "diagnostics");
            fields(diagnostics, Set.of("sources"));
            JsonNode sources = object(diagnostics, "sources");
            fields(sources, Set.of("mcp"));
            JsonNode mcp = object(sources, "mcp");
            fields(mcp, Set.of("level"));
            config.setDiagnostics(new DiagnosticsConfiguration(new DiagnosticSourcesConfiguration(
                new McpDiagnosticSourceConfiguration(DiagnosticLogLevel.fromValue(text(mcp, "level"))))));
        }
        if (session.has("enableSessionStore")) config.setEnableSessionStore(flag(session, "enableSessionStore"));
        if (session.has("enableFileChangeTracking")) {
            config.setEnableFileChangeTracking(flag(session, "enableFileChangeTracking"));
        }
        if (session.has("includeSubAgentStreamingEvents")) {
            config.setIncludeSubAgentStreamingEvents(flag(session, "includeSubAgentStreamingEvents"));
        }
    }

    SessionConfig sessionConfig(HostExtensions host) {
        var config = new SessionConfig();
        config.setModel(session.has("model")
            ? text(session, "model") : HostExtensions.requiredEnv("COPILOT_MODEL"));
        if (session.has("reasoningEffort")) config.setReasoningEffort(text(session, "reasoningEffort"));
        if (session.has("contextTier")) config.setContextTier(text(session, "contextTier"));

        if (session.has("systemMessage")) {
            JsonNode prompt = object(session, "systemMessage");
            fields(prompt, Set.of("mode", "content", "sections"));
            var systemMessage = new SystemMessageConfig()
                .setMode(SystemMessageMode.valueOf(text(prompt, "mode").toUpperCase(Locale.ROOT)))
                .setContent(text(prompt, "content"));
            if (prompt.has("sections")) {
                Map<String, SectionOverride> sections = new LinkedHashMap<>();
                object(prompt, "sections").fields().forEachRemaining(entry -> {
                    var value = entry.getValue();
                    fields(value, Set.of("action", "content"));
                    var section = new SectionOverride().setAction(
                        SectionOverrideAction.valueOf(text(value, "action").toUpperCase(Locale.ROOT)));
                    if (value.has("content")) section.setContent(text(value, "content"));
                    sections.put(entry.getKey(), section);
                });
                systemMessage.setSections(sections);
            }
            config.setSystemMessage(systemMessage);
        }
        if (session.has("availableTools")) config.setAvailableTools(strings(session, "availableTools"));
        config.setExcludedTools(strings(session, "excludedTools"));
        if (session.has("workingDirectory")) config.setWorkingDirectory(text(session, "workingDirectory"));
        config.setEnableConfigDiscovery(flag(session, "enableConfigDiscovery"));
        config.setEnableSkills(flag(session, "enableSkills"));
        config.setEnableFileHooks(flag(session, "enableFileHooks"));
        config.setEnableHostGitOperations(flag(session, "enableHostGitOperations"));
        config.setSkillDirectories(strings(session, "skillDirectories"));
        config.setPluginDirectories(strings(session, "pluginDirectories"));
        config.setStreaming(flag(session, "streaming"));
        extendedSession(config);

        JsonNode infinite = required(session, "infiniteSessions");
        fields(infinite, Set.of("enabled"));
        config.setInfiniteSessions(new InfiniteSessionConfig().setEnabled(flag(infinite, "enabled")));
        JsonNode output = required(session, "largeOutput");
        fields(output, Set.of("enabled"));
        config.setLargeOutput(new LargeToolOutputConfig().setEnabled(flag(output, "enabled")));

        Map<String, McpServerConfig> servers = new LinkedHashMap<>();
        object(session, "mcpServers").fields().forEachRemaining(entry -> {
            var value = entry.getValue();
            fields(value, Set.of("type", "url", "tools"));
            if (!"http".equals(text(value, "type"))) {
                throw new IllegalArgumentException("Regenerate the adapter for this MCP transport");
            }
            servers.put(entry.getKey(), new McpHttpServerConfig()
                .setUrl(text(value, "url")).setTools(strings(value, "tools")));
        });
        config.setMcpServers(servers);
        List<CustomAgentConfig> agents = new ArrayList<>();
        for (var agent : array(session, "customAgents")) {
            fields(agent, Set.of("name", "displayName", "description", "prompt", "model", "tools", "hooks"));
            var value = new CustomAgentConfig().setName(text(agent, "name"))
                .setDescription(text(agent, "description")).setPrompt(text(agent, "prompt"))
                .setTools(strings(agent, "tools"));
            if (agent.has("displayName")) value.setDisplayName(text(agent, "displayName"));
            if (agent.has("model")) value.setModel(text(agent, "model"));
            if (agent.has("hooks")) {
                value.setHooks(MAPPER.convertValue(object(agent, "hooks"),
                    new TypeReference<Map<String, List<Map<String, Object>>>>() {}));
            }
            agents.add(value);
        }
        config.setCustomAgents(agents);
        if (session.has("agent")) config.setAgent(text(session, "agent"));
        if (session.has("defaultAgent")) {
            var root = required(session, "defaultAgent");
            fields(root, Set.of("excludedTools"));
            config.setDefaultAgent(new DefaultAgentConfig().setExcludedTools(strings(root, "excludedTools")));
        }
        List<ToolDefinition> tools = new ArrayList<>();
        for (var tool : array(data, "tools")) {
            fields(tool, Set.of("name", "description", "parameters", "overridesBuiltInTool", "isTerminal",
                "defer", "skipPermission"));
            tools.add(new ToolDefinition(text(tool, "name"), text(tool, "description"),
                object(tool, "parameters"), host::invokeTool, flag(tool, "overridesBuiltInTool"),
                tool.has("skipPermission") && flag(tool, "skipPermission"),
                tool.has("defer") ? ToolDefer.fromValue(text(tool, "defer")) : null,
                Map.of(), flag(tool, "isTerminal")));
        }
        config.setTools(tools);
        String permissionMode = text(data, "permissionMode");
        if ("host".equals(permissionMode)) config.setOnPermissionRequest(host::permission);
        else if ("allow-all".equals(permissionMode)) config.setOnPermissionRequest(PermissionHandler.APPROVE_ALL);
        else throw new IllegalArgumentException("Unknown permission mode");
        config.setOnUserInputRequest(host::userInput);
        // __COPILOT_IDENTITY_BINDING_START__
        if (!session.has("provider") && "host-token".equals(text(data, "identity"))) config.setGitHubTokenProvider(host::githubToken);
        // __COPILOT_IDENTITY_BINDING_END__
        if (flag(data, "observer")) config.setOnEvent(host::observe);
        if (flag(data, "preToolHook") || flag(data, "postToolHook")) {
            var hooks = new SessionHooks();
            if (flag(data, "preToolHook")) hooks.setOnPreToolUse(host::preToolUse);
            if (flag(data, "postToolHook")) hooks.setOnPostToolUse(host::postToolUse);
            config.setHooks(hooks);
        }
${_t()}${vt()}        // <opt:skill-provider>
        if (data.has("skillProvider") && flag(data, "skillProvider")) config.setSkillProvider(host.skillProvider());
        // </opt:skill-provider>
        if (session.has("provider")) {
            var providerData = required(session, "provider");
            fields(providerData, Set.of("type", "baseUrl", "wireApi", "modelProvider", "wireModel",
                "maxPromptTokens", "maxOutputTokens"));
            var provider = new ProviderConfig().setType(text(providerData, "type"))
                .setBaseUrl(text(providerData, "baseUrl").isBlank()
                    ? host.providerEndpoint() : text(providerData, "baseUrl"));
            if (providerData.has("wireApi")) provider.setWireApi(text(providerData, "wireApi"));
            if (providerData.has("modelProvider")) provider.setModelProvider(text(providerData, "modelProvider"));
            if (providerData.has("wireModel")) provider.setWireModel(text(providerData, "wireModel"));
            if (providerData.has("maxPromptTokens")) {
                provider.setMaxPromptTokens(Math.toIntExact(integer(providerData, "maxPromptTokens")));
            }
            if (providerData.has("maxOutputTokens")) {
                provider.setMaxOutputTokens(Math.toIntExact(integer(providerData, "maxOutputTokens")));
            }
            switch (text(data, "credential")) {
                case "api-key" -> provider.setApiKey(HostExtensions.requiredEnv(text(data, "credentialEnv")));
                case "bearer-callback" -> provider.setBearerTokenProvider(host::bearerToken);
                default -> throw new IllegalArgumentException("Unknown provider credential strategy");
            }
            config.setProvider(provider);
        }
        return config;
    }

    static JsonNode required(JsonNode object, String name) {
        if (object == null || !object.isObject() || !object.hasNonNull(name)) {
            throw new IllegalArgumentException("Missing configuration property: " + name);
        }
        return object.get(name);
    }

    static String text(JsonNode object, String name) {
        var value = required(object, name);
        if (!value.isTextual()) throw new IllegalArgumentException(name + " must be text");
        return value.textValue();
    }

    static JsonNode object(JsonNode parent, String name) {
        var value = required(parent, name);
        if (!value.isObject()) throw new IllegalArgumentException(name + " must be an object");
        return value;
    }

    static boolean flag(JsonNode object, String name) {
        var value = required(object, name);
        if (!value.isBoolean()) throw new IllegalArgumentException(name + " must be Boolean");
        return value.booleanValue();
    }

    static long integer(JsonNode object, String name) {
        var value = required(object, name);
        if (!value.isIntegralNumber() || !value.canConvertToLong()) {
            throw new IllegalArgumentException(name + " must be an integer");
        }
        return value.longValue();
    }

    static JsonNode array(JsonNode object, String name) {
        var value = required(object, name);
        if (!value.isArray()) throw new IllegalArgumentException(name + " must be an array");
        return value;
    }

    static List<String> strings(JsonNode object, String name) {
        List<String> values = new ArrayList<>();
        for (var value : array(object, name)) {
            if (!value.isTextual()) throw new IllegalArgumentException(name + " must contain text");
            values.add(value.textValue());
        }
        return values;
    }

    private static void fields(JsonNode object, Set<String> allowed) {
        if (object == null || !object.isObject()) throw new IllegalArgumentException("Expected a configuration object");
        object.fieldNames().forEachRemaining(name -> {
            if (!allowed.contains(name)) {
                throw new IllegalArgumentException("Unmapped configuration property: " + name);
            }
        });
    }
}
`,Ct=String.raw`// Copyright (c) Microsoft Corporation. All rights reserved.
package harness;

import static harness.Configuration.*;
import com.github.copilot.AllowCopilotExperimental;
// <opt:skill-provider>
import com.github.copilot.SkillProvider;
import com.github.copilot.SkillProviderDescriptor;
// </opt:skill-provider>
import com.github.copilot.generated.SessionEvent;
import com.github.copilot.rpc.*;
import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.concurrent.Callable;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.CompletionException;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

@AllowCopilotExperimental
final class HostExtensions implements AutoCloseable {
    private final Configuration configuration;
    private final BufferedReader input = new BufferedReader(new InputStreamReader(System.in, StandardCharsets.UTF_8));
    private final ExecutorService console = Executors.newSingleThreadExecutor(task -> {
        var thread = new Thread(task, "harness-console");
        thread.setDaemon(true);
        return thread;
    });

    HostExtensions(Configuration configuration) {
        this.configuration = configuration;
    }

    // Mark an integration ready only after replacing its failing implementation below.
    private Set<String> implementedTools() { return Set.of(); }
    private boolean permissionPolicyImplemented() { return false; }
    private boolean preToolHookImplemented() { return false; }
    private boolean postToolHookImplemented() { return false; }
    // <opt:lifecycle-hooks>
    private Set<String> implementedHooks() { return Set.of(); }
    // </opt:lifecycle-hooks>
    // <opt:handlers>
    private Set<String> implementedHandlers() { return Set.of(); }
    // </opt:handlers>
    // <opt:skill-provider>
    private boolean skillProviderImplemented() { return false; }
    // </opt:skill-provider>

    private static final String PROVIDER_ENDPOINT = "";

    String providerEndpoint() {
        if (PROVIDER_ENDPOINT.isBlank()) {
            throw new IllegalStateException("Provide the provider endpoint string in HostExtensions.java PROVIDER_ENDPOINT.");
        }
        return PROVIDER_ENDPOINT.strip();
    }

    List<String> preflight() {
        List<String> issues = new ArrayList<>();
        var data = configuration.data;
        var client = configuration.client;
        var session = configuration.session;
        if (!session.has("model")) capture(issues, () -> requiredEnv("COPILOT_MODEL"));
        // __COPILOT_IDENTITY_PREFLIGHT_START__
        if (!session.has("provider") && "host-token".equals(text(data, "identity"))) capture(issues, HostExtensions::tokenFromEnvironment);
        // __COPILOT_IDENTITY_PREFLIGHT_END__
        // __S2S_LOCAL_PREFLIGHT_START__
        if (!session.has("provider") && "s2s-installation".equals(text(data, "identity"))) {
            capture(issues, () -> requiredEnv("COPILOT_GITHUB_TOKEN"));
        }
        // __S2S_LOCAL_PREFLIGHT_END__
        if (session.has("provider")) {
            capture(issues, () -> "api-key".equals(text(data, "credential"))
                ? requiredEnv(text(data, "credentialEnv")) : rawBearerToken());
        }
        if ("external".equals(text(client, "runtime"))) {
            capture(issues, () -> requiredEnv("COPILOT_CONNECTION_TOKEN"));
            System.err.println("Preflight is local only: apply start-runtime.sh on the server host before connecting.");
        } else {
            if (session.has("workingDirectory")) directory(issues, text(session, "workingDirectory"), "workspace");
            for (String path : strings(session, "skillDirectories")) directory(issues, path, "skill directory");
            for (String path : strings(session, "pluginDirectories")) directory(issues, path, "plugin directory");
            if ("managed".equals(text(client, "runtime")) && !text(client, "cliPath").isBlank()) {
                Path executable = Path.of(text(client, "cliPath"));
                boolean javascript = executable.toString().toLowerCase(Locale.ROOT).endsWith(".js");
                if (!Files.isRegularFile(executable) || (!javascript && !Files.isExecutable(executable))) {
                    issues.add("Managed cliPath must name an executable wrapper or JavaScript entrypoint on this runtime host");
                }
            }
        }
        if (flag(data, "cliPathRuntime")) {
            // The pinned SDK source cannot build its native classifier artifacts, so the runtime is host-provisioned.
            String configured = System.getenv("COPILOT_CLI_PATH");
            if (configured == null || configured.isBlank()) {
                issues.add("Set COPILOT_CLI_PATH to a compatible runtime package executable on this host");
            } else {
                Path executable = Path.of(configured).toAbsolutePath().normalize();
                if (!Files.isRegularFile(executable)) {
                    issues.add("COPILOT_CLI_PATH must name an existing runtime package executable");
                } else if ("inprocess".equals(text(client, "runtime"))
                        && !Files.isRegularFile(executable.resolveSibling("runtime.node"))
                        && !Files.isDirectory(executable.resolveSibling("prebuilds"))) {
                    issues.add("COPILOT_CLI_PATH needs an adjacent runtime.node or prebuilds/<platform>/runtime.node");
                }
            }
        }
        for (var tool : array(data, "tools")) {
            String name = text(tool, "name");
            if (!implementedTools().contains(name)) issues.add("HOST TODO: implement tool " + name + " in HostExtensions.invokeTool");
        }
        if ("host".equals(text(data, "permissionMode")) && !permissionPolicyImplemented()) {
            issues.add("HOST TODO: implement HostExtensions.permission");
        }
        if (flag(data, "preToolHook") && !preToolHookImplemented()) {
            issues.add("HOST TODO: implement HostExtensions.preToolUse");
        }
        if (flag(data, "postToolHook") && !postToolHookImplemented()) {
            issues.add("HOST TODO: implement HostExtensions.postToolUse");
        }
        // <opt:lifecycle-hooks>
        for (String hook : data.has("hooks") ? strings(data, "hooks") : List.<String>of()) {
            if (!implementedHooks().contains(hook)) {
                issues.add("HOST TODO: implement and register the " + hook + " hook in HostExtensions");
            }
        }
        // </opt:lifecycle-hooks>
        // <opt:handlers>
        for (String handler : data.has("handlers") ? strings(data, "handlers") : List.<String>of()) {
            if (!implementedHandlers().contains(handler)) {
                issues.add("HOST TODO: implement and register the " + handler + " handler in HostExtensions");
            }
        }
        // </opt:handlers>
        // <opt:skill-provider>
        if (data.has("skillProvider") && flag(data, "skillProvider") && !skillProviderImplemented()) {
            issues.add("HOST TODO: implement and register HostExtensions.skillProvider");
        }
        // </opt:skill-provider>
        capture(issues, () -> configuration.sessionConfig(this));
        return issues;
    }

    CompletableFuture<PermissionRequestResult> permission(PermissionRequest _request, PermissionInvocation _context) {
        return CompletableFuture.failedFuture(
            new UnsupportedOperationException("HOST TODO: implement the selected host permission policy"));
    }

    CompletableFuture<Object> invokeTool(ToolInvocation invocation) {
        return CompletableFuture.failedFuture(new UnsupportedOperationException(
            "HOST TODO: implement and authorize tool " + invocation.getToolName()));
    }

    CompletableFuture<PreToolUseHookOutput> preToolUse(PreToolUseHookInput _input, HookInvocation _context) {
        return CompletableFuture.failedFuture(new UnsupportedOperationException("HOST TODO: implement pre-tool policy"));
    }

    CompletableFuture<PostToolUseHookOutput> postToolUse(PostToolUseHookInput _input, HookInvocation _context) {
        return CompletableFuture.failedFuture(new UnsupportedOperationException("HOST TODO: implement post-tool inspection/redaction"));
    }

${yt()}${bt()}    // <opt:skill-provider>
    SkillProvider skillProvider() {
        return new SkillProvider() {
            @Override
            public CompletableFuture<List<SkillProviderDescriptor>> listSkills() {
                return CompletableFuture.failedFuture(new UnsupportedOperationException("HOST TODO: list the host's skills"));
            }

            @Override
            public CompletableFuture<String> readSkill(String name) {
                return CompletableFuture.failedFuture(new UnsupportedOperationException("HOST TODO: read skill " + name));
            }
        };
    }

    // </opt:skill-provider>
    void observe(SessionEvent event) {
        System.err.println("[event] " + event.getClass().getSimpleName());
    }

    // __GITHUB_TOKEN_PROVIDER_START__
    CompletableFuture<GitHubTokenProviderResult> githubToken(GitHubTokenProviderArgs _args) {
        return attempt(HostExtensions::tokenFromEnvironment);
    }

    private static GitHubTokenProviderResult tokenFromEnvironment() {
        String token = requiredEnv("GITHUB_TOKEN");
        final long expiresAt;
        try {
            expiresAt = Long.parseLong(requiredEnv("GITHUB_TOKEN_EXPIRES_AT"));
        } catch (NumberFormatException error) {
            throw new IllegalStateException("GITHUB_TOKEN_EXPIRES_AT must be a UNIX timestamp in seconds");
        }
        long remaining = Math.subtractExact(expiresAt, Instant.now().getEpochSecond());
        if (remaining <= 0) throw new IllegalStateException("GITHUB_TOKEN is expired; acquire a new token and its real expiry");
        return GitHubTokenProviderResult.token(token, remaining);
    }
    // __GITHUB_TOKEN_PROVIDER_END__

    CompletableFuture<String> bearerToken(ProviderTokenArgs _args) {
        return attempt(HostExtensions::rawBearerToken);
    }

    private static String rawBearerToken() {
        String token = requiredEnv("MODEL_BEARER_TOKEN");
        if (token.regionMatches(true, 0, "Bearer ", 0, 7)) {
            throw new IllegalStateException("MODEL_BEARER_TOKEN must not include a Bearer prefix");
        }
        return token;
    }

    CompletableFuture<UserInputResponse> userInput(UserInputRequest request, UserInputInvocation _context) {
        return CompletableFuture.supplyAsync(() -> {
            try {
                var choices = request.getChoices() == null ? List.<String>of() : request.getChoices();
                boolean allowFreeform = request.getAllowFreeform().orElse(true);
                if (choices.isEmpty() && !allowFreeform) {
                    throw new IOException("The runtime requested input without choices or permission for freeform input");
                }
                System.err.println(request.getQuestion());
                for (int i = 0; i < choices.size(); i++) System.err.println((i + 1) + ". " + choices.get(i));
                while (true) {
                    System.err.print("> ");
                    System.err.flush();
                    String answer = input.readLine();
                    if (answer == null) throw new IOException("Console input ended before an answer was provided");
                    for (int i = 0; i < choices.size(); i++) {
                        if (answer.equals(choices.get(i)) || answer.strip().equals(Integer.toString(i + 1))) {
                            return new UserInputResponse().setAnswer(choices.get(i)).setWasFreeform(false);
                        }
                    }
                    if (allowFreeform) return new UserInputResponse().setAnswer(answer).setWasFreeform(true);
                    System.err.println("Choose one of the offered answers; freeform input is disabled.");
                }
            } catch (IOException error) {
                throw new CompletionException(error);
            }
        }, console);
    }

    static String requiredEnv(String name) {
        String value = System.getenv(name);
        if (value == null || value.isBlank()) throw new IllegalStateException("Set " + name + " in the process environment");
        return value;
    }

    private static <T> CompletableFuture<T> attempt(Callable<T> operation) {
        try {
            return CompletableFuture.completedFuture(operation.call());
        } catch (Exception error) {
            return CompletableFuture.failedFuture(error);
        }
    }

    private static void capture(List<String> issues, Callable<?> operation) {
        try {
            operation.call();
        } catch (Exception error) {
            issues.add(error.getMessage() == null ? error.getClass().getSimpleName() : error.getMessage());
        }
    }

    private static void directory(List<String> issues, String value, String label) {
        if (!Files.isDirectory(Path.of(value))) issues.add("Provide the selected " + label + " on the runtime host: " + value);
    }

    @Override
    public void close() {
        console.shutdownNow();
    }
}
`,wt=`1.0.15-preview.1-SNAPSHOT`;function Tt(e,t){return`#!/usr/bin/env bash
# Copyright (c) Microsoft Corporation. All rights reserved.
set -euo pipefail
usage() {
    cat <<'HELP'
Usage: bash setup-sdk.sh [--run | --help]
Without --run, only print this help.
Requires: Git, Maven, JDK 25 or later, and Node.js.
This recipe installs the pinned SDK's ${wt} artifacts into your local
Maven repository. It never resets, cleans, or deletes an existing checkout.
Native classifier artifacts are never built: the pinned source's native profiles
cannot run because their fetch script imports repository scripts that this
revision no longer contains.
${t?`At run time, set COPILOT_CLI_PATH to a compatible runtime package executable
(with adjacent runtime.node or prebuilds/<platform>/runtime.node) on the host.`:`No runtime package is required for this selected connection recipe.`}
HELP
}
if [[ $# -eq 0 || \${1:-} == --help ]]; then usage; exit 0; fi
if [[ $# -ne 1 || $1 != --run ]]; then usage >&2; exit 2; fi
for tool in git mvn java node; do
    if ! command -v "$tool" >/dev/null 2>&1; then
        printf 'Missing prerequisite: %s\\n' "$tool" >&2
        exit 1
    fi
done
java_version=$(java -XshowSettings:properties -version 2>&1)
java_feature=$(printf '%s\\n' "$java_version" | awk '/java.specification.version =/ { print $3; exit }')
if [[ ! $java_feature =~ ^[0-9]+$ || $java_feature -lt 25 ]]; then
    printf '%s\\n' 'Building the pinned Java SDK requires JDK 25 or later; set JAVA_HOME/PATH accordingly.' >&2
    exit 1
fi
native_args=(-Dcopilot.native.skip.download=true)
root=$(cd -- "$(dirname -- "$0")" && pwd -P)
source_parent="$root/.sdk-source"
sdk_dir="$source_parent/copilot-sdk"
revision=${e}
if [[ -L $source_parent || -L $sdk_dir ]]; then
    printf '%s\\n' 'Refusing a symlinked SDK source directory; choose a separate bootstrap directory.' >&2
    exit 1
fi
if [[ -e $sdk_dir ]]; then
    if [[ ! -d "$sdk_dir/.git" ]]; then
        printf '%s\\n' 'Existing .sdk-source/copilot-sdk is not a standalone Git checkout; it was left untouched.' >&2
        exit 1
    fi
    actual=$(git -C "$sdk_dir" rev-parse HEAD)
    changes=$(git -C "$sdk_dir" status --porcelain --untracked-files=normal)
    if [[ $actual != "$revision" || -n $changes ]]; then
        printf '%s\\n' 'Existing SDK checkout is dirty or at a different revision; it was left untouched.' >&2
        printf '%s\\n' 'Move your existing work to a separately chosen location before provisioning this bootstrap.' >&2
        exit 1
    fi
else
    mkdir -p "$source_parent"
    git clone --filter=blob:none --no-checkout https://github.com/github/copilot-sdk.git "$sdk_dir"
    git -C "$sdk_dir" fetch --depth=1 origin "$revision"
    git -C "$sdk_dir" switch --detach "$revision"
fi
if [[ $(git -C "$sdk_dir" rev-parse HEAD) != "$revision" ]]; then
    printf '%s\\n' 'The SDK checkout does not match the required revision.' >&2
    exit 1
fi
mvn --batch-mode -f "$sdk_dir/java/pom.xml" install \\
    -DskipTests -Dskip.test.harness=true "\${native_args[@]}"
printf '%s\\n' 'Installed the pinned SDK source artifacts. Build the application with mvn package.'
`}function Et(e,t){let n=dt(e,ut(t));if(t.model.provider!==`copilot`||t.identity!==`s2s-installation`)return n.replace(/[ \t]*\/\/ __S2S_RUNTIME_ENV_START__\n[\s\S]*?[ \t]*\/\/ __S2S_RUNTIME_ENV_END__\n?/g,``).replace(/[ \t]*\/\/ __S2S_LOCAL_PREFLIGHT_START__\n[\s\S]*?[ \t]*\/\/ __S2S_LOCAL_PREFLIGHT_END__\n?/g,``).replaceAll(/^\s*\/\/ __[A-Z_]+_(?:START|END)__\n/gm,``);let r=t.target.runtime===`managed`?`            String token = HostExtensions.requiredEnv("COPILOT_GITHUB_TOKEN");
            var environment = new HashMap<>(System.getenv());
            environment.put("COPILOT_GITHUB_TOKEN", token);
            options.setEnvironment(environment);
`:t.target.runtime===`inprocess`?`            HostExtensions.requiredEnv("COPILOT_GITHUB_TOKEN");
`:``;return n.replace(/[ \t]*\/\/ __S2S_RUNTIME_ENV_START__\n[\s\S]*?[ \t]*\/\/ __S2S_RUNTIME_ENV_END__\n?/g,r).replace(/[ \t]*\/\/ __S2S_LOCAL_PREFLIGHT_START__\n([\s\S]*?)[ \t]*\/\/ __S2S_LOCAL_PREFLIGHT_END__\n?/g,t.target.runtime===`external`?``:`$1`).replace(/[ \t]*\/\/ __GITHUB_TOKEN_PROVIDER_START__\n[\s\S]*?[ \t]*\/\/ __GITHUB_TOKEN_PROVIDER_END__\n?/g,``).replace(/[ \t]*\/\/ __COPILOT_IDENTITY_(?:PREFLIGHT|BINDING)_START__\n[\s\S]*?[ \t]*\/\/ __COPILOT_IDENTITY_(?:PREFLIGHT|BINDING)_END__\n?/g,``)}function Dt(e){let t=ct(e,`java`);e.session.storage===`virtual`&&t.push({id:`java-session-fs`,title:`Java does not expose the SessionFs host integration`,detail:`Select local session storage or Rust, or implement and verify a Java SDK SessionFs configuration/provider/callback bridge first. Raw generated RPC types alone do not implement virtual persistence.`,fields:[`session.storage`],sources:[`sdk-inprocess-guide`]}),e.session.idleTimeoutSeconds>2147483647&&t.push({id:`java-idle-timeout-range`,title:`Java's idle timeout must fit a signed 32-bit integer`,detail:`Choose an idle timeout between 0 and 2147483647 seconds. The Java SDK setter takes int; truncating a larger value would change the plan.`,fields:[`session.idleTimeoutSeconds`],sources:W(e)});for(let n of e.policy.hooks.filter(e=>!ht[e]))t.push({id:`java-hook-${n}`,title:`Java SessionHooks has no ${n} callback`,detail:`Remove the ${n} hook or choose another language. The pinned Java SDK SessionHooks exposes no setter for it, and silently dropping a selected hook would change the plan.`,fields:[`policy.hooks`],sources:W(e)});return t}function Ot(e){return`<?xml version="1.0" encoding="UTF-8"?>
<!-- Copyright (c) Microsoft Corporation. All rights reserved. -->
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 https://maven.apache.org/xsd/maven-4.0.0.xsd">
  <modelVersion>4.0.0</modelVersion>
  <groupId>example.harness</groupId>
  <artifactId>${v(e)}</artifactId>
  <version>1.0.0</version>
  <properties>
    <project.build.sourceEncoding>UTF-8</project.build.sourceEncoding>
    <maven.compiler.release>17</maven.compiler.release>
    <copilot.version>${wt}</copilot.version>
  </properties>
  <dependencies>
    <dependency>
      <groupId>com.github</groupId><artifactId>copilot-sdk-java</artifactId>
      <version>\${copilot.version}</version>
    </dependency>
${e.target.runtime===`inprocess`?`    <dependency>
      <groupId>net.java.dev.jna</groupId><artifactId>jna</artifactId><version>5.19.1</version>
    </dependency>
`:``}  </dependencies>
  <build>
    <plugins>
      <plugin>
        <groupId>org.apache.maven.plugins</groupId><artifactId>maven-compiler-plugin</artifactId>
        <version>3.14.1</version>
        <configuration>
          <compilerArgs><arg>-Acopilot.experimental.allowed=true</arg></compilerArgs>
        </configuration>
      </plugin>
      <plugin>
        <groupId>org.codehaus.mojo</groupId><artifactId>exec-maven-plugin</artifactId>
        <version>3.5.0</version>
        <configuration>
          <mainClass>harness.Main</mainClass>
        </configuration>
      </plugin>
    </plugins>
  </build>
</project>
`}var kt={language:`java`,label:`Java`,check:Dt,generate(e){let t=Dt(e);if(t.length)throw Error(t.map(e=>e.detail).join(`
`));let n=e.target.runtime===`inprocess`||e.target.runtime===`managed`&&!e.target.cliPath.trim(),r=ft(e,`src/main/java/harness/HostExtensions.java`);return r.push({id:`java-source-sdk`,title:`Build the pinned SDK source with Maven and JDK 25`,detail:`Install JDK 25, Maven, Git, and Node.js, then run setup-sdk.sh --run. It checks out ${st} into .sdk-source/copilot-sdk and installs matching ${wt} artifacts in your local Maven repository. It refuses to reset, replace, or build over a dirty/different existing checkout. The generated application targets Java 17 bytecode.`,file:`setup-sdk.sh`,kind:`runtime`}),n&&r.push({id:`env-COPILOT_CLI_PATH`,environmentVariable:`COPILOT_CLI_PATH`,title:`Set COPILOT_CLI_PATH to a provisioned runtime package`,detail:`The pinned SDK source cannot build its bundled native classifier artifacts: copilot-native/scripts/fetch-native.mjs imports repository-root scripts that ${st} no longer contains, so every native-* Maven profile fails. Install a compatible Copilot runtime package (CLI ${B}) on this host and point COPILOT_CLI_PATH at its executable${e.target.runtime===`inprocess`?`, with an adjacent runtime.node or prebuilds/<platform>/runtime.node`:``}. ${e.target.runtime===`managed`?`Alternatively set target.cliPath in the plan. `:``}Preflight checks the path.`,file:`src/main/java/harness/HostExtensions.java`,kind:`environment`}),{files:[{path:`pom.xml`,content:Ot(e),language:`xml`},{path:`setup-sdk.sh`,content:Tt(st,n),language:`text`},{path:`.sdk-source/.gitignore`,content:`# Copyright (c) Microsoft Corporation. All rights reserved.
*
!.gitignore
`,language:`text`},{path:`src/main/resources/bootstrap-config.json`,content:JSON.stringify({...lt(e),cliPathRuntime:n},null,2)+`
`,language:`json`},{path:`src/main/java/harness/Main.java`,content:Et(xt,e),language:`java`},{path:`src/main/java/harness/Configuration.java`,content:Et(St,e),language:`java`},{path:`src/main/java/harness/HostExtensions.java`,content:Et(Ct,e),language:`java`},...mt(e)],commands:{install:[`bash setup-sdk.sh --run`,`mvn -q package`],check:`mvn -q compile exec:java -Dexec.args="--check"`,run:`mvn -q compile exec:java -Dexec.args="Describe your task here"`,...e.target.runtime===`external`?{startRuntime:`bash start-runtime.sh --run`}:{}},requirements:r,notes:[`This project deliberately uses locally built ${wt} SDK artifacts (the pinned java/pom.xml revision), not a Maven Central release. setup-sdk.sh pins and checks the SDK commit before installing.`,`Bundled native runtime classifier JARs are not buildable from the pinned SDK source (its native Maven profiles run a fetch script whose imported repository scripts were removed), so managed children without target.cliPath and in-process hosting load a host-provisioned runtime package from COPILOT_CLI_PATH.`,...e.model.allowedModels.length?[`The Java SessionConfig has no allowedModels field. Main.java applies the allowlist with the experimental session.getRpc().model.setAllowedModels immediately after createSession and before the first message; a failure closes the session and stops the client.`]:[],...e.events.logLevel!=="default"&&e.target.runtime===`external`?[`The client log level is a launch option for runtimes the SDK starts; it is not sent to an existing server. Configure the server's --log-level in start-runtime.sh on the runtime host.`]:[],`bootstrap-config.json is mapped field-by-field into Java SDK setters. It is not deserialized into SessionConfig: Jackson ignores several of that class's Boolean properties. Edit Configuration.java when adding a new configuration field.`,e.model.provider===`copilot`&&e.identity===`s2s-installation`?e.target.runtime===`external`?`GitHub App S2S identity is configured by start-runtime.sh on the separately operated runtime host. The Java client does not receive or inject COPILOT_GITHUB_TOKEN and does not install a GitHub token provider.`:e.target.runtime===`inprocess`?`GitHub App S2S identity requires COPILOT_GITHUB_TOKEN before the in-process runtime loads. Logged-in-user fallback is false and no GitHub token provider is generated.`:`GitHub App S2S identity copies COPILOT_GITHUB_TOKEN into the managed child environment through CopilotClientOptions.setEnvironment. Logged-in-user fallback is false and no GitHub token provider is generated.`:`GITHUB_TOKEN_EXPIRES_AT is a real UNIX expiry, not a duration. The planner's GitHub identity selection configures Copilot authentication; BYOK uses its selected provider credential route. Downstream services still need host-owned authorization.`,e.policy.permissionMode===`host`?`Host permission handling is a required HostExtensions.java integration and fails preflight until implemented. Tool overrides retain their names, schemas, and terminal flags; selected host tools/hooks follow the same fail-before-start pattern.`:`The configuration explicitly binds PermissionHandler.APPROVE_ALL. It approves ordinary requests once; managed policy, content exclusion, downstream authorization, tool validity, and sandbox enablement still apply, while enabled sandbox bypass can also be approved.`,`Console input is serialized on a daemon host thread; EOF, forbidden freeform answers, and unavailable input fail explicitly. Observers print event class names only, never prompts, arguments, tool results, or credentials. Streaming still reaches the SDK when selected.`,`Session close detaches before client shutdown. Explicit stop errors are retained as suppressed errors when a primary operation failed. A completed turn without an assistant message is reported explicitly, including terminal-tool turns.`,`For in-process hosting, set process-global settings before application startup. COPILOT_CLI_PATH must select a compatible package with adjacent runtime.node or prebuilds/<classifier>/runtime.node; it is not a bare-library argument. No mode or permission filter provides OS-level sandboxing.`,`Paths are interpreted on the future runtime host. For external services, start-runtime.sh applies server-owned COPILOT_HOME, idle timeout, and login policy there; --check does not probe or reconfigure the server.`],sources:W(e)}}},At={preMcpToolCall:{method:`on_pre_mcp_tool_call`,type:`PreMcpToolCall`},userPromptSubmitted:{method:`on_user_prompt_submitted`,type:`UserPromptSubmitted`},userPromptTransformed:{method:`on_user_prompt_transformed`,type:`UserPromptTransformed`},sessionStart:{method:`on_session_start`,type:`SessionStart`},sessionEnd:{method:`on_session_end`,type:`SessionEnd`},errorOccurred:{method:`on_error_occurred`,type:`ErrorOccurred`},agentStop:{method:`on_agent_stop`,type:`AgentStop`},subagentStart:{method:`on_subagent_start`,type:`SubagentStart`},subagentStop:{method:`on_subagent_stop`,type:`SubagentStop`}};function jt(){return Object.entries(At).map(([e,t])=>{let n=`github_copilot_sdk::hooks::${t.type}Output`,r=e===`userPromptSubmitted`?`let mut output = ${n}::default();
        output.decision = Some("block".into());
        output.reason = Some("Unimplemented host prompt policy".into());
        Some(output)`:`None`;return`    // <opt:hook-${e}>

    async fn ${t.method}(&self, _input: github_copilot_sdk::hooks::${t.type}Input, _context: HookContext) -> Option<${n}> {
        if !self.selected("${e}") { return None; }
        self.host.fail("HOST TODO: implement the selected ${e} hook".into());
        ${r}
    }
    // </opt:hook-${e}>
`}).join(``)}var Mt={elicitation:{signature:`impl github_copilot_sdk::handler::ElicitationHandler for Host {
    async fn handle(
        &self,
        _session_id: SessionId,
        _request_id: RequestId,
        _request: github_copilot_sdk::ElicitationRequest,
    ) -> github_copilot_sdk::ElicitationResult {`,result:`github_copilot_sdk::ElicitationResult { action: "cancel".into(), content: None }`},exitPlanMode:{signature:`impl github_copilot_sdk::handler::ExitPlanModeHandler for Host {
    async fn handle(
        &self,
        _session_id: SessionId,
        _data: github_copilot_sdk::ExitPlanModeData,
    ) -> github_copilot_sdk::handler::ExitPlanModeResult {`,result:`github_copilot_sdk::handler::ExitPlanModeResult {
            approved: false,
            selected_action: None,
            feedback: Some("Unimplemented host plan approval".into()),
        }`},autoModeSwitch:{signature:`impl github_copilot_sdk::handler::AutoModeSwitchHandler for Host {
    async fn handle(
        &self,
        _session_id: SessionId,
        _error_code: Option<String>,
        _retry_after_seconds: Option<f64>,
    ) -> github_copilot_sdk::handler::AutoModeSwitchResponse {`,result:`github_copilot_sdk::handler::AutoModeSwitchResponse::No`},mcpAuth:{signature:`impl github_copilot_sdk::handler::McpAuthHandler for Host {
    async fn handle(
        &self,
        _session_id: SessionId,
        _request_id: RequestId,
        _request: github_copilot_sdk::handler::McpAuthRequest,
    ) -> github_copilot_sdk::handler::McpAuthResult {`,result:`github_copilot_sdk::handler::McpAuthResult::Cancelled`}};function Nt(){return Object.entries(Mt).map(([e,t])=>`// <opt:handler-${e}>

#[async_trait]
${t.signature}
        self.fail("HOST TODO: implement the selected ${e} handler".into());
        ${t.result}
    }
}
// </opt:handler-${e}>
`).join(``)}var Pt=String.raw`// Copyright (c) Microsoft Corporation. All rights reserved.
use std::io::{self, BufRead, Write};
use std::sync::mpsc;
use std::thread;
// __GITHUB_TOKEN_PROVIDER_START__
use std::time::{SystemTime, UNIX_EPOCH};
// __GITHUB_TOKEN_PROVIDER_END__

use anyhow::{Context, Result, anyhow, bail};
use async_trait::async_trait;
use github_copilot_sdk::handler::{
    PermissionHandler, PermissionResult, UserInputHandler, UserInputResponse,
};
use github_copilot_sdk::hooks::{
    HookContext, PostToolUseInput, PostToolUseOutput, PreToolUseInput, PreToolUseOutput,
    SessionHooks,
};
use github_copilot_sdk::tool::ToolHandler;
use github_copilot_sdk::{
    BearerTokenError, BearerTokenProvider, Error as SdkError, ErrorKind, PermissionRequestData,
    ProviderTokenArgs, RequestId, SessionId, ToolInvocation, ToolResult,
};
// __GITHUB_TOKEN_PROVIDER_START__
use github_copilot_sdk::{
    GitHubToken, GitHubTokenProvider, GitHubTokenProviderArgs, GitHubTokenProviderResult,
};
// __GITHUB_TOKEN_PROVIDER_END__
use tokio::sync::{oneshot, watch};

// Mark an integration ready only after replacing its failing implementation.
pub(crate) fn implemented_tools() -> &'static [&'static str] { &[] }
pub(crate) const PERMISSION_POLICY_IMPLEMENTED: bool = false;
pub(crate) const PRE_TOOL_IMPLEMENTED: bool = false;
pub(crate) const POST_TOOL_IMPLEMENTED: bool = false;
pub(crate) fn implemented_hooks() -> &'static [&'static str] { &[] }
pub(crate) fn implemented_handlers() -> &'static [&'static str] { &[] }
pub(crate) const SKILL_PROVIDER_IMPLEMENTED: bool = false;
pub(crate) const SESSION_FS_IMPLEMENTED: bool = false;
pub(crate) const PROVIDER_ENDPOINT: &str = "";

pub(crate) struct HostPermissionHandler {
    host: Host,
}

#[async_trait]
impl PermissionHandler for HostPermissionHandler {
    async fn handle(
        &self,
        _session_id: SessionId,
        _request_id: RequestId,
        _data: PermissionRequestData,
    ) -> PermissionResult {
        self.host.fail("HOST TODO: implement the selected host permission policy".into());
        PermissionResult::user_not_available()
    }
}

pub(crate) fn provider_endpoint() -> Result<String> {
    let value = PROVIDER_ENDPOINT.trim();
    if value.is_empty() {
        bail!("Provide the provider endpoint string in src/host.rs PROVIDER_ENDPOINT.");
    }
    Ok(value.to_owned())
}

pub(crate) fn required_env(name: &str) -> Result<String> {
    let value = std::env::var(name).map_err(|_| anyhow!("Set {name} in the process environment"))?;
    if value.trim().is_empty() { bail!("Set a nonempty {name} in the process environment"); }
    Ok(value)
}

// __GITHUB_TOKEN_PROVIDER_START__
pub(crate) fn github_environment_token() -> Result<GitHubTokenProviderResult> {
    let token = required_env("GITHUB_TOKEN")?;
    let expires_at: i64 = required_env("GITHUB_TOKEN_EXPIRES_AT")?
        .parse().context("GITHUB_TOKEN_EXPIRES_AT must be a UNIX timestamp in seconds")?;
    let now: i64 = SystemTime::now().duration_since(UNIX_EPOCH)
        .context("The system clock is before the UNIX epoch")?
        .as_secs().try_into().context("The system clock is out of range")?;
    let remaining = expires_at.checked_sub(now).context("The token expiry is out of range")?;
    if remaining <= 0 { bail!("GITHUB_TOKEN is expired; obtain a new token and its actual expiry"); }
    Ok(GitHubTokenProviderResult::Token(GitHubToken::new(token, remaining)))
}

pub(crate) struct GitHubEnvironmentProvider;

#[async_trait]
impl GitHubTokenProvider for GitHubEnvironmentProvider {
    async fn get_token(&self, _args: GitHubTokenProviderArgs) -> std::result::Result<GitHubTokenProviderResult, SdkError> {
        github_environment_token().map_err(|error| SdkError::with_message(ErrorKind::InvalidConfig, error.to_string()))
    }
}
// __GITHUB_TOKEN_PROVIDER_END__

pub(crate) fn raw_bearer_token() -> Result<String> {
    let token = required_env("MODEL_BEARER_TOKEN")?;
    if token.get(..7).is_some_and(|prefix| prefix.eq_ignore_ascii_case("Bearer ")) {
        bail!("MODEL_BEARER_TOKEN must not include a Bearer prefix");
    }
    Ok(token)
}

pub(crate) struct ModelBearerProvider;

#[async_trait]
impl BearerTokenProvider for ModelBearerProvider {
    async fn get_token(&self, _args: ProviderTokenArgs) -> std::result::Result<String, BearerTokenError> {
        raw_bearer_token().map_err(|error| BearerTokenError::message(error.to_string()))
    }
}

struct ConsoleRequest {
    question: String,
    choices: Vec<String>,
    allow_freeform: bool,
    reply: oneshot::Sender<io::Result<UserInputResponse>>,
}

#[derive(Clone)]
pub(crate) struct Host {
    console: mpsc::Sender<ConsoleRequest>,
    failures: watch::Sender<Option<String>>,
}

impl Host {
    pub(crate) fn permission_handler(&self) -> HostPermissionHandler {
        HostPermissionHandler { host: self.clone() }
    }

    pub(crate) fn new() -> Result<Self> {
        let (console, requests) = mpsc::channel::<ConsoleRequest>();
        // Stdin cannot be cancelled portably. This serialized thread lives until process exit
        // rather than pinning Tokio's blocking pool and preventing runtime shutdown.
        let _console_thread = thread::Builder::new().name("harness-console".into()).spawn(move || {
            let stdin = io::stdin();
            let mut input = stdin.lock();
            for request in requests {
                let response = read_console(&mut input, &request);
                // A cancelled agent turn may have dropped its answer receiver.
                let _ = request.reply.send(response);
            }
        }).context("Could not start the console input thread")?;
        let (failures, _) = watch::channel(None);
        Ok(Self { console, failures })
    }

    pub(crate) fn fail(&self, message: String) {
        self.failures.send_if_modified(|failure| {
            if failure.is_some() {
                false
            } else {
                *failure = Some(message);
                true
            }
        });
    }

    pub(crate) fn ensure_healthy(&self) -> Result<()> {
        if let Some(message) = self.failures.borrow().as_ref() { bail!("{message}"); }
        Ok(())
    }

    pub(crate) async fn failure(&self) -> anyhow::Error {
        let mut failures = self.failures.subscribe();
        loop {
            let failure = failures.borrow_and_update().clone();
            if let Some(message) = failure { return anyhow!(message); }
            if let Err(error) = failures.changed().await {
                return anyhow!("The host failure channel closed: {error}");
            }
        }
    }

    pub(crate) fn hooks(&self, pre: bool, post: bool, _lifecycle: &[String]) -> HostHooks {
        HostHooks {
            host: self.clone(),
            pre,
            post,
            // <opt:lifecycle-hooks>
            lifecycle: _lifecycle.to_vec(),
            // </opt:lifecycle-hooks>
        }
    }
    // <opt:skill-provider>

    pub(crate) fn skill_provider(&self) -> HostSkillProvider {
        HostSkillProvider { host: self.clone() }
    }
    // </opt:skill-provider>
}

fn read_console(input: &mut impl BufRead, request: &ConsoleRequest) -> io::Result<UserInputResponse> {
    if request.choices.is_empty() && !request.allow_freeform {
        return Err(io::Error::new(io::ErrorKind::InvalidInput,
            "The runtime requested input without choices or permission for freeform input"));
    }
    {
        let mut output = io::stderr().lock();
        writeln!(output, "{}", request.question)?;
        for (index, choice) in request.choices.iter().enumerate() {
            writeln!(output, "{}. {choice}", index + 1)?;
        }
    }
    loop {
        {
            let mut output = io::stderr().lock();
            write!(output, "> ")?;
            output.flush()?;
        }
        let mut answer = String::new();
        if input.read_line(&mut answer)? == 0 {
            return Err(io::Error::new(io::ErrorKind::UnexpectedEof,
                "Console input ended before an answer was provided"));
        }
        let answer = answer.trim_end_matches(['\r', '\n']).to_owned();
        for (index, choice) in request.choices.iter().enumerate() {
            if &answer == choice || answer.trim() == (index + 1).to_string() {
                return Ok(UserInputResponse { answer: choice.clone(), was_freeform: false });
            }
        }
        if request.allow_freeform {
            return Ok(UserInputResponse { answer, was_freeform: true });
        }
        writeln!(io::stderr().lock(), "Choose one of the offered answers; freeform input is disabled.")?;
    }
}

#[async_trait]
impl UserInputHandler for Host {
    async fn handle(
        &self,
        _session_id: SessionId,
        question: String,
        choices: Option<Vec<String>>,
        allow_freeform: Option<bool>,
    ) -> Option<UserInputResponse> {
        let (reply, response) = oneshot::channel();
        let request = ConsoleRequest {
            question,
            choices: choices.unwrap_or_default(),
            allow_freeform: allow_freeform.unwrap_or(true),
            reply,
        };
        if self.console.send(request).is_err() {
            self.fail("The console input worker is unavailable".into());
            return None;
        }
        match response.await {
            Ok(Ok(answer)) => Some(answer),
            Ok(Err(error)) => {
                self.fail(format!("Console input failed: {error}"));
                None
            }
            Err(error) => {
                self.fail(format!("The console answer channel closed: {error}"));
                None
            }
        }
    }
}

pub(crate) struct HostTool {
    name: String,
    host: Host,
}

impl HostTool {
    pub(crate) fn new(name: String, host: Host) -> Self { Self { name, host } }
}

#[async_trait]
impl ToolHandler for HostTool {
    async fn call(&self, _invocation: ToolInvocation) -> std::result::Result<ToolResult, SdkError> {
        let message = format!("HOST TODO: implement and authorize tool {}", self.name);
        self.host.fail(message.clone());
        Err(SdkError::with_message(ErrorKind::InvalidConfig, message))
    }
}

pub(crate) struct HostHooks {
    host: Host,
    pre: bool,
    post: bool,
    // <opt:lifecycle-hooks>
    lifecycle: Vec<String>,
    // </opt:lifecycle-hooks>
}
// <opt:lifecycle-hooks>

impl HostHooks {
    fn selected(&self, hook: &str) -> bool {
        self.lifecycle.iter().any(|name| name == hook)
    }
}
// </opt:lifecycle-hooks>

#[async_trait]
impl SessionHooks for HostHooks {
    async fn on_pre_tool_use(&self, _input: PreToolUseInput, _context: HookContext) -> Option<PreToolUseOutput> {
        if !self.pre { return None; }
        self.host.fail("HOST TODO: implement the selected pre-tool policy".into());
        let mut output = PreToolUseOutput::default();
        output.permission_decision = Some("deny".into());
        output.permission_decision_reason = Some("Unimplemented host policy".into());
        Some(output)
    }

    async fn on_post_tool_use(&self, _input: PostToolUseInput, _context: HookContext) -> Option<PostToolUseOutput> {
        if !self.post { return None; }
        // This SDK callback has no Result return; its failure must reach the main abort path.
        self.host.fail("HOST TODO: implement the selected post-tool inspection/redaction".into());
        None
    }
${jt()}}
${Nt()}// <opt:skill-provider>

pub(crate) struct HostSkillProvider {
    host: Host,
}

#[async_trait]
impl github_copilot_sdk::SkillProvider for HostSkillProvider {
    async fn list_skills(&self) -> std::result::Result<Vec<github_copilot_sdk::SkillProviderDescriptor>, SdkError> {
        let message = "HOST TODO: list the host's skills".to_owned();
        self.host.fail(message.clone());
        Err(SdkError::with_message(ErrorKind::InvalidConfig, message))
    }

    async fn read_skill(&self, name: &str) -> std::result::Result<Option<String>, SdkError> {
        let message = format!("HOST TODO: read skill {name}");
        self.host.fail(message.clone());
        Err(SdkError::with_message(ErrorKind::InvalidConfig, message))
    }
}
// </opt:skill-provider>
`,Ft=String.raw`// Copyright (c) Microsoft Corporation. All rights reserved.
use async_trait::async_trait;
use github_copilot_sdk::session_fs::{DirEntry, FileInfo, FsError, FsErrorKind, SessionFsProvider};

// Implement persistence and concurrency semantics before marking SESSION_FS_IMPLEMENTED in host.rs.
// Return real ENOENT/UNKNOWN errors. Add SQLite capabilities and its provider together if needed.
pub(crate) struct HostSessionFs;

fn unimplemented_operation(operation: &str) -> FsError {
    FsError::with_message(FsErrorKind::Other, format!("HOST TODO: implement SessionFs {operation}"))
}

#[async_trait]
impl SessionFsProvider for HostSessionFs {
    async fn read_file(&self, _path: &str) -> Result<String, FsError> {
        Err(unimplemented_operation("read_file"))
    }
    async fn write_file(&self, _path: &str, _content: &str, _mode: Option<i64>) -> Result<(), FsError> {
        Err(unimplemented_operation("write_file"))
    }
    async fn append_file(&self, _path: &str, _content: &str, _mode: Option<i64>) -> Result<(), FsError> {
        Err(unimplemented_operation("append_file"))
    }
    async fn exists(&self, _path: &str) -> Result<bool, FsError> {
        Err(unimplemented_operation("exists"))
    }
    async fn stat(&self, _path: &str) -> Result<FileInfo, FsError> {
        Err(unimplemented_operation("stat"))
    }
    async fn mkdir(&self, _path: &str, _recursive: bool, _mode: Option<i64>) -> Result<(), FsError> {
        Err(unimplemented_operation("mkdir"))
    }
    async fn readdir(&self, _path: &str) -> Result<Vec<String>, FsError> {
        Err(unimplemented_operation("readdir"))
    }
    async fn readdir_with_types(&self, _path: &str) -> Result<Vec<DirEntry>, FsError> {
        Err(unimplemented_operation("readdir_with_types"))
    }
    async fn rm(&self, _path: &str, _recursive: bool, _force: bool) -> Result<(), FsError> {
        Err(unimplemented_operation("rm"))
    }
    async fn rename(&self, _source: &str, _destination: &str) -> Result<(), FsError> {
        Err(unimplemented_operation("rename"))
    }
}
`,It=String.raw`// Copyright (c) Microsoft Corporation. All rights reserved.
mod config;
mod host;
mod session_fs;

use std::time::Duration;

use anyhow::{Context, Result, anyhow, bail};
use github_copilot_sdk::subscription::RecvErrorKind;
use github_copilot_sdk::{Client, EventSubscription, MessageOptions, SessionEvent};
use tokio::sync::oneshot;
use tokio::task::JoinHandle;

use crate::config::Configuration;
use crate::host::Host;

enum Completion {
    Message(String),
    NoMessage,
}

fn completion(event: Option<SessionEvent>) -> Result<Completion> {
    let Some(event) = event else {
        return Ok(Completion::NoMessage);
    };
    let text = event.data.get("content").and_then(|value| value.as_str())
        .context("The final assistant event has no text content")?;
    Ok(Completion::Message(text.to_owned()))
}

fn with_cleanup<T>(primary: Result<T>, cleanup: Result<()>, stage: &str) -> Result<T> {
    match (primary, cleanup) {
        (Ok(value), Ok(())) => Ok(value),
        (Err(error), Ok(())) => Err(error),
        (Ok(_), Err(error)) => Err(error.context(format!("Cleanup failed: {stage}"))),
        (Err(primary), Err(cleanup)) => {
            Err(primary.context(format!("Cleanup also failed ({stage}): {cleanup:#}")))
        }
    }
}

struct Observer {
    stop: oneshot::Sender<()>,
    task: JoinHandle<Result<()>>,
}

impl Observer {
    fn start(mut events: EventSubscription, host: Host) -> Self {
        let (stop, mut cancelled) = oneshot::channel();
        let task = tokio::spawn(async move {
            loop {
                tokio::select! {
                    _ = &mut cancelled => return Ok(()),
                    event = events.recv() => match event {
                        Ok(event) => eprintln!("[event] {}", event.event_type),
                        Err(error) if matches!(error.kind(), RecvErrorKind::Closed) => return Ok(()),
                        Err(error) => {
                            host.fail(format!("Event observer failed: {error}"));
                            return Err(error.into());
                        }
                    }
                }
            }
        });
        Self { stop, task }
    }

    async fn finish(self) -> Result<()> {
        // A stopped task may have closed the signal receiver; its joined result is authoritative.
        let _ = self.stop.send(());
        self.task.await.context("The event observer task failed")?
    }
}

async fn run_session(client: &Client, configuration: &Configuration, host: &Host, prompt: String) -> Result<Completion> {
    let mut message = MessageOptions::new(prompt).with_wait_timeout(Duration::from_secs(120));
    if let Some(schema) = &configuration.response_schema {
        message = message.with_response_schema(schema.clone());
    }
    let prepared = client.prepare_session(configuration.session_config(host)?)?;
    let observer = if configuration.observer {
        Some(Observer::start(prepared.subscribe(), host.clone()))
    } else {
        None
    };
    let started = tokio::select! {
        biased;
        error = host.failure() => Err(error),
        signal = tokio::signal::ctrl_c() => match signal {
            Ok(()) => Err(anyhow!("Interrupted while starting the session")),
            Err(error) => Err(error.into()),
        },
        result = prepared.start() => result.map_err(anyhow::Error::from),
    };
    let primary = match started {
        Err(error) => Err(error),
        Ok(session) => {
            let primary = tokio::select! {
                biased;
                error = host.failure() => Err(error),
                signal = tokio::signal::ctrl_c() => match signal {
                    Ok(()) => Err(anyhow!("Interrupted")),
                    Err(error) => Err(error.into()),
                },
                response = session.send_and_wait(message) => response.map_err(anyhow::Error::from).and_then(completion),
            };
            let primary = with_cleanup(primary, host.ensure_healthy(), "host callback");
            let primary = if primary.is_err() {
                with_cleanup(primary, session.abort().await.map_err(anyhow::Error::from), "abort")
            } else {
                primary
            };
            with_cleanup(primary, session.disconnect().await.map_err(anyhow::Error::from), "session detach")
        }
    };
    match observer {
        Some(observer) => with_cleanup(primary, observer.finish().await, "event observer"),
        None => primary,
    }
}

#[tokio::main]
async fn main() -> Result<()> {
    let args: Vec<String> = std::env::args().skip(1).collect();
    let check = args.len() == 1 && args[0] == "--check";
    if !check && (args.is_empty() || args.first().is_some_and(|arg| arg == "--check")) {
        bail!("Usage: agent-starter --check | <prompt>");
    }
    let configuration = Configuration::read()?;
    let issues = configuration.preflight();
    if !issues.is_empty() {
        bail!("Preflight failed:\n - {}", issues.join("\n - "));
    }
    if check {
        println!("Preflight passed. No runtime was started and no model was contacted.");
        return Ok(());
    }

    let host = Host::new()?;
    let client = Client::start(configuration.client_options()?).await?;
    let primary = run_session(&client, &configuration, &host, args.join(" ")).await;
    let stopped = client.stop().await.map_err(|error| anyhow!("Runtime shutdown failed: {error:?}"));
    match with_cleanup(primary, stopped, "client shutdown")? {
        Completion::Message(text) => println!("{text}"),
        Completion::NoMessage => println!("Turn completed without an assistant message."),
    }
    Ok(())
}
`,Lt=String.raw`// Copyright (c) Microsoft Corporation. All rights reserved.
use std::collections::HashMap;
use std::path::PathBuf;
use std::sync::Arc;

use anyhow::{Context, Result, anyhow, bail};
use github_copilot_sdk::session_events::ReasoningSummary;
use github_copilot_sdk::session_fs::{SessionFsConfig, SessionFsConventions};
use github_copilot_sdk::{
    AskUserVariant, AutoTier, CapiSessionOptions, ClientMode, ClientOptions, CliProgram,
    CustomAgentConfig, DefaultAgentConfig, DeferMode, DiagnosticLogLevel,
    DiagnosticSourcesConfiguration, DiagnosticsConfiguration, ImageGenerationConfig,
    InfiniteSessionConfig, LargeToolOutputConfig, LogLevel, ManagedSettings,
    ManagedSettingsPermissions, McpDiagnosticSourceConfiguration, McpHttpServerConfig,
    McpServerConfig, ProviderConfig, SectionOverride, SessionConfig, SystemMessageConfig, Tool,
    ToolSearchConfig, Transport,
};
use indexmap::IndexMap;
use serde::Deserialize;
use serde_json::Value;

use crate::host::{
    self, Host, HostTool, ModelBearerProvider, required_env,
};
// __GITHUB_TOKEN_PROVIDER_START__
use crate::host::GitHubEnvironmentProvider;
// __GITHUB_TOKEN_PROVIDER_END__
use crate::session_fs::HostSessionFs;

#[derive(Deserialize)]
#[serde(rename_all = "kebab-case")]
enum Identity { HostToken, Developer, S2sInstallation }

#[derive(Deserialize)]
#[serde(rename_all = "kebab-case")]
enum Credential { ApiKey, BearerCallback }

#[derive(Deserialize)]
#[serde(rename_all = "lowercase")]
enum Runtime { Managed, External, Inprocess }

#[derive(Deserialize)]
#[serde(rename_all = "kebab-case")]
enum Mode { Empty, CopilotCli }

#[derive(Deserialize)]
#[serde(rename_all = "lowercase")]
enum Storage { Local, Virtual }

#[derive(Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
struct ClientData {
    runtime: Runtime,
    mode: Mode,
    cli_path: String,
    host: String,
    port: u16,
    address: String,
    base_directory: String,
    idle_timeout_seconds: u64,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
struct PromptData {
    mode: String,
    content: String,
    sections: Option<HashMap<String, SectionData>>,
}

#[derive(Deserialize)]
#[serde(deny_unknown_fields)]
struct SectionData {
    action: String,
    content: Option<String>,
}

#[derive(Deserialize)]
#[serde(deny_unknown_fields)]
struct McpData {
    #[serde(rename = "type")]
    transport: String,
    url: String,
    tools: Vec<String>,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
struct AgentData {
    name: String,
    display_name: Option<String>,
    description: String,
    prompt: String,
    model: Option<String>,
    tools: Vec<String>,
    hooks: Option<IndexMap<String, Vec<IndexMap<String, Value>>>>,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
struct RootAgentData { excluded_tools: Vec<String> }

#[derive(Deserialize)]
#[serde(deny_unknown_fields)]
struct Toggle { enabled: bool }

#[derive(Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
struct ManagedData { permissions: ManagedPermissionsData }

#[derive(Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
struct ManagedPermissionsData {
    disable_bypass_permissions_mode: Option<String>,
    disable_assisted_permissions_mode: Option<bool>,
    deny: Option<Vec<String>>,
    ask: Option<Vec<String>>,
    allow: Option<Vec<String>>,
    limit_to: Option<Vec<String>>,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
struct CapiData { auto_tier: String }

#[derive(Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
struct ToolSearchData {
    enabled: Option<bool>,
    defer_threshold: Option<u32>,
}

#[derive(Deserialize)]
#[serde(deny_unknown_fields)]
struct DiagnosticsData { sources: DiagnosticSourcesData }

#[derive(Deserialize)]
#[serde(deny_unknown_fields)]
struct DiagnosticSourcesData { mcp: DiagnosticLevelData }

#[derive(Deserialize)]
#[serde(deny_unknown_fields)]
struct DiagnosticLevelData { level: String }

#[derive(Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
struct ProviderData {
    #[serde(rename = "type")]
    provider_type: String,
    base_url: String,
    wire_api: Option<String>,
    model_provider: Option<String>,
    wire_model: Option<String>,
    max_prompt_tokens: Option<i64>,
    max_output_tokens: Option<i64>,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
struct ToolData {
    name: String,
    description: String,
    parameters: IndexMap<String, Value>,
    overrides_built_in_tool: bool,
    is_terminal: bool,
    defer: Option<String>,
    #[serde(default)]
    skip_permission: bool,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
struct SessionData {
    model: Option<String>,
    reasoning_effort: Option<String>,
    context_tier: Option<String>,
    system_message: Option<PromptData>,
    available_tools: Option<Vec<String>>,
    excluded_tools: Vec<String>,
    working_directory: Option<PathBuf>,
    enable_config_discovery: bool,
    enable_skills: bool,
    enable_file_hooks: bool,
    enable_host_git_operations: bool,
    skill_directories: Vec<PathBuf>,
    plugin_directories: Vec<PathBuf>,
    mcp_servers: IndexMap<String, McpData>,
    custom_agents: Vec<AgentData>,
    agent: Option<String>,
    default_agent: Option<RootAgentData>,
    infinite_sessions: Toggle,
    large_output: Toggle,
    streaming: bool,
    provider: Option<ProviderData>,
    agent_directories: Option<Vec<PathBuf>>,
    hook_directories: Option<Vec<PathBuf>>,
    instruction_directories: Option<Vec<PathBuf>>,
    additional_directories: Option<Vec<PathBuf>>,
    included_builtin_skills: Option<Vec<String>>,
    skip_custom_instructions: Option<bool>,
    enable_on_demand_instruction_discovery: Option<bool>,
    refresh_custom_instructions: Option<bool>,
    organization_custom_instructions: Option<String>,
    enable_managed_settings: Option<bool>,
    enforce_managed_model_defaults: Option<bool>,
    managed_settings: Option<ManagedData>,
    capi: Option<CapiData>,
    reasoning_summary: Option<String>,
    image_generation: Option<Toggle>,
    tool_search: Option<ToolSearchData>,
    ask_user_variant: Option<String>,
    excluded_builtin_agents: Option<Vec<String>>,
    name: Option<String>,
    interactive_user: Option<bool>,
    diagnostics: Option<DiagnosticsData>,
    enable_session_store: Option<bool>,
    enable_file_change_tracking: Option<bool>,
    include_sub_agent_streaming_events: Option<bool>,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub(crate) struct Configuration {
    client: ClientData,
    storage: Storage,
    identity: Identity,
    credential: Credential,
    credential_env: String,
    permission_mode: PermissionMode,
    pub(crate) observer: bool,
    pre_tool_hook: bool,
    post_tool_hook: bool,
    session: SessionData,
    tools: Vec<ToolData>,
    #[serde(default)]
    hooks: Vec<String>,
    #[serde(default)]
    handlers: Vec<String>,
    #[serde(default)]
    skill_provider: bool,
    allowed_models: Option<Vec<String>>,
    log_level: Option<String>,
    pub(crate) response_schema: Option<Value>,
}

#[derive(Clone, Copy, Deserialize)]
#[serde(rename_all = "kebab-case")]
enum PermissionMode {
    Host,
    AllowAll,
}

impl Configuration {
    pub(crate) fn read() -> Result<Self> {
        serde_json::from_str(include_str!("../bootstrap-config.json"))
            .context("Invalid bootstrap-config.json; unmapped fields are rejected")
    }

    pub(crate) fn preflight(&self) -> Vec<String> {
        let mut issues = Vec::new();
        if self.session.model.is_none() {
            if let Err(error) = required_env("COPILOT_MODEL") { issues.push(error.to_string()); }
        }
        // __COPILOT_IDENTITY_PREFLIGHT_START__
        if self.session.provider.is_none() && matches!(self.identity, Identity::HostToken) {
            if let Err(error) = host::github_environment_token() { issues.push(error.to_string()); }
        }
        // __COPILOT_IDENTITY_PREFLIGHT_END__
        // __S2S_LOCAL_PREFLIGHT_START__
        if self.session.provider.is_none() && matches!(self.identity, Identity::S2sInstallation) {
            if let Err(error) = required_env("COPILOT_GITHUB_TOKEN") { issues.push(error.to_string()); }
        }
        // __S2S_LOCAL_PREFLIGHT_END__
        if let Some(provider) = &self.session.provider {
            if provider.base_url.trim().is_empty() {
                if let Err(error) = host::provider_endpoint() { issues.push(error.to_string()); }
            }
            let result = match self.credential {
                Credential::ApiKey => required_env(&self.credential_env),
                Credential::BearerCallback => host::raw_bearer_token(),
            };
            if let Err(error) = result { issues.push(error.to_string()); }
        }
        if matches!(self.client.runtime, Runtime::External) {
            if let Err(error) = required_env("COPILOT_CONNECTION_TOKEN") { issues.push(error.to_string()); }
            if self.client.host.is_empty() || self.client.port == 0 || self.client.address.is_empty() {
                issues.push("Provide the existing runtime's TCP host and port".into());
            }
            eprintln!("Preflight is local only: apply start-runtime.sh on the server host before connecting.");
        } else {
            if matches!(self.storage, Storage::Local) {
                for (path, label) in self.session.working_directory.iter().map(|path| (path, "workspace"))
                    .chain(self.session.skill_directories.iter().map(|path| (path, "skill directory")))
                    .chain(self.session.plugin_directories.iter().map(|path| (path, "plugin directory")))
                {
                    if !path.is_dir() {
                        issues.push(format!("Provide the selected {label} on the runtime host: {}", path.display()));
                    }
                }
            }
            if matches!(self.client.runtime, Runtime::Managed) && !self.client.cli_path.trim().is_empty()
                && !PathBuf::from(&self.client.cli_path).is_file()
            {
                issues.push("Managed cliPath must name a compatible runtime wrapper on this host".into());
            }
        }
        if !matches!(self.client.runtime, Runtime::Managed) && !self.client.cli_path.trim().is_empty() {
            issues.push("cliPath is only supported by the managed transport".into());
        }
        if self.client.base_directory.trim().is_empty() {
            issues.push("Provide the selected local or virtual session state directory".into());
        }
        for tool in &self.tools {
            if !host::implemented_tools().contains(&tool.name.as_str()) {
                issues.push(format!("HOST TODO: implement tool {} in src/host.rs", tool.name));
            }
            if matches!(self.permission_mode, PermissionMode::Host) && !host::PERMISSION_POLICY_IMPLEMENTED {
                issues.push("HOST TODO: implement the permission policy in src/host.rs".into());
            }
        }
        if self.pre_tool_hook && !host::PRE_TOOL_IMPLEMENTED {
            issues.push("HOST TODO: implement the pre-tool policy hook in src/host.rs".into());
        }
        if self.post_tool_hook && !host::POST_TOOL_IMPLEMENTED {
            issues.push("HOST TODO: implement the post-tool inspection/redaction hook in src/host.rs".into());
        }
        for hook in &self.hooks {
            if !host::implemented_hooks().contains(&hook.as_str()) {
                issues.push(format!("HOST TODO: implement and register the {hook} hook in src/host.rs"));
            }
        }
        for handler in &self.handlers {
            if !host::implemented_handlers().contains(&handler.as_str()) {
                issues.push(format!("HOST TODO: implement and register the {handler} handler in src/host.rs"));
            }
        }
        if self.skill_provider && !host::SKILL_PROVIDER_IMPLEMENTED {
            issues.push("HOST TODO: implement and register the skill provider in src/host.rs".into());
        }
        if matches!(self.storage, Storage::Virtual) && !host::SESSION_FS_IMPLEMENTED {
            issues.push("HOST TODO: implement the POSIX SessionFs provider in src/session_fs.rs".into());
        }
        issues
    }

    pub(crate) fn client_options(&self) -> Result<ClientOptions> {
        let mut options = ClientOptions::new();
        options.mode = match self.client.mode { Mode::Empty => ClientMode::Empty, Mode::CopilotCli => ClientMode::CopilotCli };
        if !matches!(self.client.runtime, Runtime::External) {
            options.use_logged_in_user = Some(self.session.provider.is_none() && matches!(self.identity, Identity::Developer));
            options.session_idle_timeout_seconds = Some(self.client.idle_timeout_seconds);
            // The SDK passes --log-level to runtimes it starts; an existing server owns its own.
            if let Some(level) = &self.log_level {
                options.log_level = Some(match level.as_str() {
                    "none" => LogLevel::None,
                    "error" => LogLevel::Error,
                    "warning" => LogLevel::Warning,
                    "info" => LogLevel::Info,
                    "debug" => LogLevel::Debug,
                    "all" => LogLevel::All,
                    other => bail!("Unknown client log level: {other}"),
                });
            }
            // __S2S_RUNTIME_ENV_START__
            if self.session.provider.is_none() && matches!(self.identity, Identity::S2sInstallation) {
                let token = required_env("COPILOT_GITHUB_TOKEN")?;
                if matches!(self.client.runtime, Runtime::Managed) {
                    options = options.with_env([("COPILOT_GITHUB_TOKEN", token)]);
                }
            }
            // __S2S_RUNTIME_ENV_END__
        }
        options.transport = match self.client.runtime {
            Runtime::Managed => {
                if !self.client.cli_path.trim().is_empty() {
                    options.program = CliProgram::Path(PathBuf::from(&self.client.cli_path));
                }
                Transport::Stdio
            }
            Runtime::External => Transport::External {
                host: self.client.host.clone(),
                port: self.client.port,
                connection_token: Some(required_env("COPILOT_CONNECTION_TOKEN")?),
            },
            Runtime::Inprocess => Transport::InProcess,
        };
        match self.storage {
            Storage::Local => {
                if !matches!(self.client.runtime, Runtime::External) {
                    options.base_directory = Some(PathBuf::from(&self.client.base_directory));
                }
            }
            Storage::Virtual => {
                let initial_cwd = match &self.session.working_directory {
                    Some(path) => path.to_str().context("Virtual workspace path must be UTF-8")?.to_owned(),
                    None => "/".to_owned(),
                };
                options.session_fs = Some(SessionFsConfig::new(
                    initial_cwd, self.client.base_directory.clone(), SessionFsConventions::Posix,
                ));
            }
        }
        Ok(options)
    }

    fn extended_session(&self, config: &mut SessionConfig) -> Result<()> {
        let data = &self.session;
        config.name = data.name.clone();
        if let Some(summary) = &data.reasoning_summary {
            config.reasoning_summary = Some(match summary.as_str() {
                "none" => ReasoningSummary::None,
                "concise" => ReasoningSummary::Concise,
                "detailed" => ReasoningSummary::Detailed,
                other => bail!("Unknown reasoning summary: {other}"),
            });
        }
        if let Some(capi) = &data.capi {
            let tier = match capi.auto_tier.as_str() {
                "efficiency" => AutoTier::Efficiency,
                "balance" => AutoTier::Balance,
                "intelligence" => AutoTier::Intelligence,
                "fast" => AutoTier::Fast,
                other => bail!("Unknown Auto routing tier: {other}"),
            };
            config.capi = Some(CapiSessionOptions::new().with_auto_tier(tier));
        }
        if let Some(variant) = &data.ask_user_variant {
            config.ask_user_variant = Some(match variant.as_str() {
                "legacy" => AskUserVariant::Legacy,
                "elicitation" => AskUserVariant::Elicitation,
                other => bail!("Unknown ask_user variant: {other}"),
            });
        }
        config.excluded_builtin_agents = data.excluded_builtin_agents.clone();
        config.included_builtin_skills = data.included_builtin_skills.clone();
        config.agent_directories = data.agent_directories.clone();
        config.hook_directories = data.hook_directories.clone();
        config.instruction_directories = data.instruction_directories.clone();
        config.additional_directories = data.additional_directories.clone();
        config.skip_custom_instructions = data.skip_custom_instructions;
        config.enable_on_demand_instruction_discovery = data.enable_on_demand_instruction_discovery;
        config.refresh_custom_instructions = data.refresh_custom_instructions;
        config.organization_custom_instructions = data.organization_custom_instructions.clone();
        config.enable_managed_settings = data.enable_managed_settings;
        config.enforce_managed_model_defaults = data.enforce_managed_model_defaults;
        if let Some(managed) = &data.managed_settings {
            let rules = &managed.permissions;
            let mut permissions = ManagedSettingsPermissions::default();
            permissions.disable_bypass_permissions_mode = rules.disable_bypass_permissions_mode.clone();
            permissions.disable_assisted_permissions_mode = rules.disable_assisted_permissions_mode;
            permissions.deny = rules.deny.clone();
            permissions.ask = rules.ask.clone();
            permissions.allow = rules.allow.clone();
            permissions.limit_to = rules.limit_to.clone();
            config.managed_settings = Some(ManagedSettings::default().with_permissions(permissions));
        }
        if let Some(image) = &data.image_generation {
            config.image_generation = Some(ImageGenerationConfig::new().with_enabled(image.enabled));
        }
        if let Some(search) = &data.tool_search {
            let mut value = ToolSearchConfig::new();
            value.enabled = search.enabled;
            value.defer_threshold = search.defer_threshold;
            config.tool_search = Some(value);
        }
        config.interactive_user = data.interactive_user;
        if let Some(diagnostics) = &data.diagnostics {
            let mut mcp = McpDiagnosticSourceConfiguration::default();
            mcp.level = match diagnostics.sources.mcp.level.as_str() {
                "off" => DiagnosticLogLevel::Off,
                "error" => DiagnosticLogLevel::Error,
                "warning" => DiagnosticLogLevel::Warning,
                "info" => DiagnosticLogLevel::Info,
                "debug" => DiagnosticLogLevel::Debug,
                "trace" => DiagnosticLogLevel::Trace,
                other => bail!("Unknown diagnostic level: {other}"),
            };
            let mut sources = DiagnosticSourcesConfiguration::default();
            sources.mcp = Some(mcp);
            let mut value = DiagnosticsConfiguration::default();
            value.sources = sources;
            config.diagnostics = Some(value);
        }
        config.enable_session_store = data.enable_session_store;
        config.enable_file_change_tracking = data.enable_file_change_tracking;
        config.include_sub_agent_streaming_events = data.include_sub_agent_streaming_events;
        Ok(())
    }

    pub(crate) fn session_config(&self, host: &Host) -> Result<SessionConfig> {
        let data = &self.session;
        let mut config = match self.permission_mode {
            PermissionMode::Host => SessionConfig::default()
                .with_permission_handler(Arc::new(host.permission_handler())),
            PermissionMode::AllowAll => SessionConfig::default().approve_all_permissions(),
        };
        config.model = Some(match &data.model {
            Some(model) => model.clone(),
            None => required_env("COPILOT_MODEL")?,
        });
        config.reasoning_effort = data.reasoning_effort.clone();
        config.context_tier = data.context_tier.clone();
        if let Some(message) = &data.system_message {
            let mut prompt = SystemMessageConfig::new()
                .with_mode(message.mode.clone())
                .with_content(message.content.clone());
            if let Some(sections) = &message.sections {
                let mut overrides = HashMap::new();
                for (name, section) in sections {
                    let mut value = SectionOverride::default();
                    value.action = Some(section.action.clone());
                    value.content = section.content.clone();
                    overrides.insert(name.clone(), value);
                }
                prompt = prompt.with_sections(overrides);
            }
            config.system_message = Some(prompt);
        }
        config.available_tools = data.available_tools.clone();
        config.excluded_tools = Some(data.excluded_tools.clone());
        config.working_directory = data.working_directory.clone();
        config.enable_config_discovery = Some(data.enable_config_discovery);
        config.enable_skills = Some(data.enable_skills);
        config.enable_file_hooks = Some(data.enable_file_hooks);
        config.enable_host_git_operations = Some(data.enable_host_git_operations);
        config.skill_directories = Some(data.skill_directories.clone());
        config.plugin_directories = Some(data.plugin_directories.clone());
        config.streaming = Some(data.streaming);
        let mut infinite = InfiniteSessionConfig::default();
        infinite.enabled = Some(data.infinite_sessions.enabled);
        config.infinite_sessions = Some(infinite);
        let mut output = LargeToolOutputConfig::default();
        output.enabled = Some(data.large_output.enabled);
        config.large_output = Some(output);
        self.extended_session(&mut config)?;
        if let Some(models) = &self.allowed_models {
            config = config.with_allowed_models(models.clone());
        }

        let mut servers = IndexMap::new();
        for (name, server) in &data.mcp_servers {
            if server.transport != "http" { bail!("Regenerate the adapter for this MCP transport"); }
            let mut http = McpHttpServerConfig::default();
            http.url = server.url.clone();
            http.tools = Some(server.tools.clone());
            servers.insert(name.clone(), McpServerConfig::Http(http));
        }
        config.mcp_servers = Some(servers);
        let mut agents = Vec::new();
        for agent in &data.custom_agents {
            let mut value = CustomAgentConfig::default();
            value.name = agent.name.clone();
            value.display_name = agent.display_name.clone();
            value.description = Some(agent.description.clone());
            value.prompt = agent.prompt.clone();
            value.model = agent.model.clone();
            value.tools = Some(agent.tools.clone());
            value.hooks = agent.hooks.clone();
            agents.push(value);
        }
        config.custom_agents = Some(agents);
        config.agent = data.agent.clone();
        if let Some(root) = &data.default_agent {
            let mut value = DefaultAgentConfig::default();
            value.excluded_tools = Some(root.excluded_tools.clone());
            config.default_agent = Some(value);
        }
        let mut tools = Vec::new();
        for tool in &self.tools {
            let mut value = Tool::new(tool.name.clone())
                .with_description(tool.description.clone())
                .with_parameters(serde_json::to_value(&tool.parameters)?)
                .with_overrides_built_in_tool(tool.overrides_built_in_tool)
                .with_skip_permission(tool.skip_permission)
                .with_is_terminal(tool.is_terminal);
            if let Some(defer) = &tool.defer {
                value = value.with_defer(match defer.as_str() {
                    "auto" => DeferMode::Auto,
                    "never" => DeferMode::Never,
                    other => bail!("Unknown tool defer mode: {other}"),
                });
            }
            tools.push(value.with_handler(Arc::new(HostTool::new(tool.name.clone(), host.clone()))));
        }
        config.tools = Some(tools);
        config = config.with_user_input_handler(Arc::new(host.clone()));
        // __COPILOT_IDENTITY_BINDING_START__
        if self.session.provider.is_none() && matches!(self.identity, Identity::HostToken) {
            config = config.with_github_token_provider(Arc::new(GitHubEnvironmentProvider));
        }
        // __COPILOT_IDENTITY_BINDING_END__
        if self.pre_tool_hook || self.post_tool_hook || !self.hooks.is_empty() {
            config = config.with_hooks(Arc::new(host.hooks(self.pre_tool_hook, self.post_tool_hook, &self.hooks)));
        }
        // <opt:handler-elicitation>
        if self.handlers.iter().any(|handler| handler == "elicitation") {
            config = config.with_elicitation_handler(Arc::new(host.clone()));
        }
        // </opt:handler-elicitation>
        // <opt:handler-exitPlanMode>
        if self.handlers.iter().any(|handler| handler == "exitPlanMode") {
            config = config.with_exit_plan_mode_handler(Arc::new(host.clone()));
        }
        // </opt:handler-exitPlanMode>
        // <opt:handler-autoModeSwitch>
        if self.handlers.iter().any(|handler| handler == "autoModeSwitch") {
            config = config.with_auto_mode_switch_handler(Arc::new(host.clone()));
        }
        // </opt:handler-autoModeSwitch>
        // <opt:handler-mcpAuth>
        if self.handlers.iter().any(|handler| handler == "mcpAuth") {
            config = config.with_mcp_auth_handler(Arc::new(host.clone()));
        }
        // </opt:handler-mcpAuth>
        // <opt:skill-provider>
        if self.skill_provider {
            config = config.with_skill_provider(Arc::new(host.skill_provider()));
        }
        // </opt:skill-provider>
        if matches!(self.storage, Storage::Virtual) {
            config = config.with_session_fs_provider(Arc::new(HostSessionFs));
        }
        if let Some(data) = &data.provider {
            let mut provider = ProviderConfig::default();
            provider.provider_type = Some(data.provider_type.clone());
            provider.base_url = if data.base_url.trim().is_empty() {
                host::provider_endpoint()?
            } else {
                data.base_url.clone()
            };
            provider.wire_api = data.wire_api.clone();
            provider.model_provider = data.model_provider.clone();
            provider.wire_model = data.wire_model.clone();
            provider.max_prompt_tokens = data.max_prompt_tokens;
            provider.max_output_tokens = data.max_output_tokens;
            match self.credential {
                Credential::ApiKey => provider.api_key = Some(required_env(&self.credential_env)?),
                Credential::BearerCallback => {
                    provider = provider.with_bearer_token_provider(Arc::new(ModelBearerProvider));
                }
            }
            config.provider = Some(provider);
        }
        if config.model.as_ref().is_none_or(|model| model.trim().is_empty()) {
            return Err(anyhow!("Select a model or set COPILOT_MODEL"));
        }
        Ok(config)
    }
}
`;function Rt(e,t){let n=dt(e,ut(t));if(t.model.provider!==`copilot`||t.identity!==`s2s-installation`)return n.replace(/[ \t]*\/\/ __S2S_RUNTIME_ENV_START__\n[\s\S]*?[ \t]*\/\/ __S2S_RUNTIME_ENV_END__\n?/g,``).replace(/[ \t]*\/\/ __S2S_LOCAL_PREFLIGHT_START__\n[\s\S]*?[ \t]*\/\/ __S2S_LOCAL_PREFLIGHT_END__\n?/g,``).replaceAll(/^\s*\/\/ __[A-Z_]+_(?:START|END)__\n/gm,``);let r=t.target.runtime===`managed`?`            let token = required_env("COPILOT_GITHUB_TOKEN")?;
            options = options.with_env([("COPILOT_GITHUB_TOKEN", token)]);
`:t.target.runtime===`inprocess`?`            required_env("COPILOT_GITHUB_TOKEN")?;
`:``;return n.replace(/[ \t]*\/\/ __S2S_RUNTIME_ENV_START__\n[\s\S]*?[ \t]*\/\/ __S2S_RUNTIME_ENV_END__\n?/g,r).replace(/[ \t]*\/\/ __S2S_LOCAL_PREFLIGHT_START__\n([\s\S]*?)[ \t]*\/\/ __S2S_LOCAL_PREFLIGHT_END__\n?/g,t.target.runtime===`external`?``:`$1`).replace(/[ \t]*\/\/ __GITHUB_TOKEN_PROVIDER_START__\n[\s\S]*?[ \t]*\/\/ __GITHUB_TOKEN_PROVIDER_END__\n?/g,``).replace(/[ \t]*\/\/ __COPILOT_IDENTITY_(?:PREFLIGHT|BINDING)_START__\n[\s\S]*?[ \t]*\/\/ __COPILOT_IDENTITY_(?:PREFLIGHT|BINDING)_END__\n?/g,``)}function zt(e){let t=ct(e,`rust`);return e.session.storage===`virtual`&&!e.session.baseDirectory.trim()&&t.push({id:`rust-session-fs-state-path`,title:`Give the virtual filesystem an explicit state path`,detail:`Set session.baseDirectory to the state path inside your SessionFs provider. The SDK requires a nonempty session_state_path; this must not silently fall back to host-local storage.`,fields:[`session.baseDirectory`],sources:W(e)}),e.session.storage===`virtual`&&[e.session.baseDirectory,e.context.workspace].some(e=>/^[A-Za-z]:|\\/.test(e))&&t.push({id:`rust-session-fs-conventions`,title:`The generated virtual filesystem uses POSIX path conventions`,detail:`Use POSIX logical workspace/state paths, or extend this adapter and the host provider to select SessionFsConventions::Windows. Windows-shaped paths cannot be passed faithfully to the POSIX provider recipe.`,fields:[`session.baseDirectory`,`context.workspace`],sources:W(e)}),t}var Bt={language:`rust`,label:`Rust`,check:zt,generate(e){let t=zt(e);if(t.length)throw Error(t.map(e=>e.detail).join(`
`));let n=e.target.runtime===`external`||e.target.runtime===`managed`&&!!e.target.cliPath.trim(),r=e.target.runtime===`inprocess`?`, features = ["bundled-in-process"]`:n?`, features = ["runtime"]`:``,i=ft(e,`src/host.rs`);return i.push({id:`rust-source-toolchain`,title:`Provide Rust 1.94.0 and access to the pinned SDK Git source`,detail:`rust-toolchain.toml pins 1.94.0. Cargo uses github/copilot-sdk at ${st}, not an assumed crates.io release. Source builds may download the compatible runtime bundle; review target-platform availability and capture Cargo.lock for reproducible deployment.`,file:`Cargo.toml`,kind:`runtime`}),e.session.storage===`virtual`&&i.push({id:`rust-session-fs-contract`,title:`Implement every required SessionFs operation`,detail:`Implement src/session_fs.rs and mark SESSION_FS_IMPLEMENTED only after verifying read/write/append/exists/stat/mkdir/readdir/readdir_with_types/rm/rename, concurrent calls, persistence and error semantics. Paths are POSIX logical paths; an empty workspace uses the virtual root /. No SQLite capability is advertised: add SessionFsSqliteProvider, transactions and capabilities together if your workload requires them.`,file:`src/session_fs.rs`,kind:`host-code`}),{files:[{path:`Cargo.toml`,language:`toml`,content:`# Copyright (c) Microsoft Corporation. All rights reserved.
[package]
name = "${v(e)}"
version = "0.1.0"
edition = "2024"
rust-version = "1.94.0"
publish = false

[dependencies]
github-copilot-sdk = { git = "https://github.com/github/copilot-sdk.git", rev = "${st}"${n?`, default-features = false`:``}${r} }
anyhow = "1"
async-trait = "0.1"
indexmap = { version = "2", features = ["serde"] }
serde = { version = "1", features = ["derive"] }
serde_json = "1"
tokio = { version = "1", features = ["macros", "rt-multi-thread", "sync", "signal", "time"] }
`},{path:`rust-toolchain.toml`,content:`# Copyright (c) Microsoft Corporation. All rights reserved.
[toolchain]
channel = "1.94.0"
profile = "minimal"
components = ["rustfmt"]
`,language:`toml`},...n?[{path:`.cargo/config.toml`,content:`# Copyright (c) Microsoft Corporation. All rights reserved.
[env]
COPILOT_SKIP_CLI_DOWNLOAD = { value = "1", force = true }
`,language:`toml`}]:[],{path:`bootstrap-config.json`,content:JSON.stringify(lt(e),null,2)+`
`,language:`json`},{path:`src/main.rs`,content:Rt(It,e),language:`rust`},{path:`src/config.rs`,content:Rt(Lt,e),language:`rust`},{path:`src/host.rs`,content:Rt(Pt,e),language:`rust`},{path:`src/session_fs.rs`,content:Rt(Ft,e),language:`rust`},...mt(e)],commands:{install:[`cargo build`],check:`cargo run -- --check`,run:`cargo run -- "Describe your task here"`,...e.target.runtime===`external`?{startRuntime:`bash start-runtime.sh --run`}:{}},requirements:i,notes:[`The Rust SDK source manifest is 0.0.0-dev; this project pins the inspected Git revision instead of inventing an exact published crate version. Rust 1.92 is too old. No Java installation or global toolchain changes are performed by the visualizer.`,`A strict host-owned DTO reads bootstrap-config.json, then src/config.rs explicitly assigns every selected field to SDK builders/default-constructed types. SessionConfig itself is not deserializable and many SDK structs are non-exhaustive.`,...n?[`The SDK dependency uses default-features = false with features = ["runtime"]: without the runtime feature, Client::start rejects every transport (including Transport::External) as InvalidConfig, and bundled-cli would embed a runtime this connection does not use.`]:[],...e.events.logLevel!=="default"&&e.target.runtime===`external`?[`The client log level is a launch option for runtimes the SDK starts; it is not sent to an existing server. Configure the server's --log-level in start-runtime.sh on the runtime host.`]:[],e.policy.permissionMode===`host`?`The source JSON is embedded with include_str!; rebuild after editing it. Host permission handling, custom tools, hooks, and SessionFs fail preflight until their real integrations are implemented.`:`The source JSON is embedded with include_str!; rebuild after editing it. SessionConfig::approve_all_permissions() approves ordinary requests once; managed policy, content exclusion, downstream authorization, tool validity, and sandbox enablement remain authoritative, while enabled sandbox bypass can also be approved.`,e.model.provider===`copilot`&&e.identity===`s2s-installation`?e.target.runtime===`external`?`GitHub App S2S identity is configured by start-runtime.sh on the separately operated runtime host. The Rust client does not receive or inject COPILOT_GITHUB_TOKEN and does not install a GitHub token provider.`:e.target.runtime===`inprocess`?`GitHub App S2S identity requires COPILOT_GITHUB_TOKEN before the in-process runtime loads. Logged-in-user fallback is false and no GitHub token provider is generated.`:`GitHub App S2S identity copies COPILOT_GITHUB_TOKEN into the managed child environment with ClientOptions::with_env. Logged-in-user fallback is false and no GitHub token provider is generated.`:`GITHUB_TOKEN_EXPIRES_AT is an absolute UNIX timestamp. Every Copilot token-provider call recomputes its remaining lifetime. BYOK uses the selected provider credential route; downstream services need separate host-owned authorization.`,`When observation is selected, the client prepares the session and starts draining its subscription before startup. Logs contain event types only; lag or unexpected observer failure aborts the workload rather than silently losing observations.`,`Console input is serialized on a process-lifetime standard thread, not a Tokio blocking-pool task that can prevent shutdown while waiting for stdin. EOF or input errors signal the main task's abort path. Prompt/choice display is user interaction, not event logging.`,`The main task handles Ctrl-C and host callback failures, aborts a failed turn, detaches the session, joins the event observer, then stops the client. Cleanup failures are added to the primary error chain. No-message completion is reported explicitly; terminal tools need not produce a final assistant message.`,`The POSIX SessionFs interface is host code, not an OS sandbox or complete virtualization of shell/git/network effects. Its default functions deliberately fail, and it declares no SQLite capability.`,`For in-process hosting, bundled-in-process is enabled and no process-only ClientOptions are set. COPILOT_CLI_PATH must select a matching package before startup; the loader finds the platform-native library, adjacent runtime.node, or prebuilds/<platform-arch>/runtime.node.`,`External server settings are applied by start-runtime.sh on the server host, not by mutating an existing server through the client. Paths refer to that future host; --check neither starts nor contacts it.`],sources:W(e)}}},Vt=String.raw`# Copyright (c) Microsoft Corporation. All rights reserved.
"""Application-owned integrations. Importing this module never imports the SDK."""
import asyncio
import inspect
import json
import math
import os
import sys
import time

# Register real handlers here: name -> callable(ToolInvocation) -> ToolResult/awaitable.
TOOL_HANDLERS = {}
PERMISSION_HANDLER = None
PRE_TOOL_HOOK = None
POST_TOOL_HOOK = None
# Selected lifecycle hooks, keyed by SessionHooks name (for example "on_subagent_start"):
# name -> callable(hook_input, invocation) -> output/None/awaitable.
LIFECYCLE_HOOKS = {}
# Selected host request handlers, keyed by create_session keyword (for example
# "on_elicitation_request"). Elicitation receives one context; the others receive (request, invocation).
HOST_HANDLERS = {}
# Experimental: a real copilot.SkillProvider (list_skills/read_skill) backed by your skill store.
SKILL_PROVIDER = None
SESSION_FS_FACTORY = None
PROVIDER_ENDPOINT = None
# Plan names -> SDK registration names at the pinned snapshot.
HOOK_NAMES = __HOOK_NAMES__
HANDLER_NAMES = __HANDLER_NAMES__
_console_lock = asyncio.Lock()


def required_environment(name):
    value = os.environ.get(name)
    if not value or not value.strip():
        raise ValueError(f"Set {name} in the process environment; no secret is stored in the plan.")
    return value


def provider_endpoint():
    if not isinstance(PROVIDER_ENDPOINT, str) or not PROVIDER_ENDPOINT.strip():
        raise NotImplementedError("Provide the provider endpoint string in host.py PROVIDER_ENDPOINT.")
    return PROVIDER_ENDPOINT.strip()


# __GITHUB_TOKEN_PROVIDER_START__
def github_remaining_lifetime():
    try:
        expires_at = float(required_environment("GITHUB_TOKEN_EXPIRES_AT"))
    except ValueError as error:
        raise ValueError("GITHUB_TOKEN_EXPIRES_AT must be an absolute UNIX expiry in seconds.") from error
    if not math.isfinite(expires_at):
        raise ValueError("GITHUB_TOKEN_EXPIRES_AT must be finite.")
    remaining = math.floor(expires_at - time.time())
    if remaining <= 0:
        raise ValueError(
            "GITHUB_TOKEN_EXPIRES_AT must be the token's real future expiry. "
            "Refresh credentials in host.py; do not reset or invent the expiry."
        )
    return remaining


async def github_token_provider(args):
    """Starter only: production should acquire credentials for args['host']/['session_id']."""
    token = required_environment("GITHUB_TOKEN")
    return {"kind": "token", "accessToken": token, "expiresIn": github_remaining_lifetime()}
# __GITHUB_TOKEN_PROVIDER_END__


async def bearer_token_provider(args):
    """Starter only: replace with provider/session-scoped acquisition and caching."""
    return required_environment("MODEL_BEARER_TOKEN")


async def on_permission_request(request, invocation):
    """Dispatch to application-owned permission policy when host mode is selected."""
    if not callable(PERMISSION_HANDLER):
        raise NotImplementedError("Implement PERMISSION_HANDLER in host.py.")
    result = PERMISSION_HANDLER(request, invocation)
    return await result if inspect.isawaitable(result) else result


async def console_user_input(request, invocation):
    if not sys.stdin.isatty():
        raise RuntimeError("Console user input requires a TTY. Implement a host UI in host.py.")
    async with _console_lock:
        choices = request.get("choices", [])
        print(request["question"])
        for index, choice in enumerate(choices, 1):
            print(f"{index}. {choice}")
        answer = await asyncio.to_thread(input, "> ")
        if answer not in choices and answer.isdecimal():
            index = int(answer) - 1
            if 0 <= index < len(choices):
                answer = choices[index]
        was_freeform = answer not in choices
        if was_freeform and request.get("allowFreeform", True) is False:
            raise ValueError("Choose one of the offered answers; freeform input is disabled.")
        return {"answer": answer, "wasFreeform": was_freeform}


def metadata_observer(event):
    """Log envelope metadata, never prompt text, tool arguments, or credentials."""
    metadata = {"event": type(event.data).__name__}
    event_id = getattr(event, "id", None)
    if isinstance(event_id, str):
        metadata["id"] = event_id
    timestamp = getattr(event, "timestamp", None)
    if timestamp is not None:
        metadata["timestamp"] = str(timestamp)
    print(json.dumps(metadata, ensure_ascii=True), file=sys.stderr)


def make_tool_handler(name):
    async def execute(invocation):
        handler = TOOL_HANDLERS.get(name)
        if not callable(handler):
            raise NotImplementedError(f"Implement TOOL_HANDLERS[{name!r}] in host.py.")
        result = handler(invocation)
        if inspect.isawaitable(result):
            result = await result
        from copilot.tools import ToolResult
        if not isinstance(result, ToolResult):
            raise TypeError(f"{name} must return copilot.tools.ToolResult, not an arbitrary dictionary.")
        if result.result_type not in {"success", "failure", "rejected", "denied", "timeout"}:
            raise ValueError(f"{name} returned an unsupported result_type.")
        return result
    return execute


async def on_pre_tool_use(data, invocation):
    if not callable(PRE_TOOL_HOOK):
        raise NotImplementedError("Implement PRE_TOOL_HOOK in host.py; a selected hook is not a no-op.")
    result = PRE_TOOL_HOOK(data, invocation)
    return await result if inspect.isawaitable(result) else result


async def on_post_tool_use(data, invocation):
    if not callable(POST_TOOL_HOOK):
        raise NotImplementedError("Implement POST_TOOL_HOOK in host.py; a selected hook is not a no-op.")
    result = POST_TOOL_HOOK(data, invocation)
    return await result if inspect.isawaitable(result) else result


def selected_hooks(plan):
    return [HOOK_NAMES[name] for name in plan["policy"]["hooks"]]


def selected_handlers(plan):
    return [HANDLER_NAMES[name] for name in plan["policy"]["handlers"]]


def make_lifecycle_hook(name):
    async def dispatch(data, invocation):
        hook = LIFECYCLE_HOOKS.get(name)
        if not callable(hook):
            raise NotImplementedError(f"Implement LIFECYCLE_HOOKS[{name!r}] in host.py; a selected hook is not a no-op.")
        result = hook(data, invocation)
        return await result if inspect.isawaitable(result) else result
    return dispatch


def make_host_handler(name):
    async def dispatch(*args):
        handler = HOST_HANDLERS.get(name)
        if not callable(handler):
            raise NotImplementedError(f"Implement HOST_HANDLERS[{name!r}] in host.py.")
        result = handler(*args)
        return await result if inspect.isawaitable(result) else result
    return dispatch


def skill_provider_shape_ok():
    return SKILL_PROVIDER is not None and all(
        callable(getattr(SKILL_PROVIDER, method, None)) for method in ("list_skills", "read_skill")
    )


def skill_provider():
    """Return the application's real SkillProvider; never a placeholder catalog."""
    from copilot import SkillProvider
    if not skill_provider_shape_ok() or not isinstance(SKILL_PROVIDER, SkillProvider):
        raise NotImplementedError("Implement SKILL_PROVIDER in host.py with a real copilot.SkillProvider.")
    return SKILL_PROVIDER


def create_session_fs_handler(session):
    """Return a real synchronous factory result, not an awaitable or no-op store."""
    if not callable(SESSION_FS_FACTORY):
        raise NotImplementedError("Implement SESSION_FS_FACTORY in host.py.")
    from copilot.session_fs_provider import SessionFsProvider
    provider = SESSION_FS_FACTORY(session)
    if not isinstance(provider, SessionFsProvider):
        raise TypeError("SESSION_FS_FACTORY must return a SessionFsProvider subclass.")
    return provider


def environment_blockers(plan):
    names = []
    if not plan["model"]["id"].strip():
        names.append("COPILOT_MODEL")
    if plan["model"]["provider"] == "copilot":
        if plan["identity"] == "host-token":
            names.append("GITHUB_TOKEN")
        # __S2S_LOCAL_PREFLIGHT_START__
        elif plan["identity"] == "s2s-installation":
            names.append("COPILOT_GITHUB_TOKEN")
        # __S2S_LOCAL_PREFLIGHT_END__
    else:
        names.append(
            plan["model"]["credentialEnv"]
            if plan["model"]["credential"] == "api-key"
            else "MODEL_BEARER_TOKEN"
        )
    blockers = []
    for name in names:
        try:
            required_environment(name)
        except ValueError as error:
            blockers.append(str(error))
    # __GITHUB_TOKEN_PROVIDER_START__
    if plan["model"]["provider"] == "copilot" and plan["identity"] == "host-token":
        try:
            github_remaining_lifetime()
        except ValueError as error:
            blockers.append(str(error))
    # __GITHUB_TOKEN_PROVIDER_END__
    return blockers


def integration_blockers(plan, tools):
    blockers = [
        f"Implement TOOL_HANDLERS[{tool['name']!r}] in host.py."
        for tool in tools if not callable(TOOL_HANDLERS.get(tool["name"]))
    ]
    if plan["policy"]["permissionMode"] == "host" and not callable(PERMISSION_HANDLER):
        blockers.append("Implement PERMISSION_HANDLER in host.py.")
    if plan["policy"]["preToolHook"] and not callable(PRE_TOOL_HOOK):
        blockers.append("Implement PRE_TOOL_HOOK in host.py.")
    if plan["policy"]["postToolHook"] and not callable(POST_TOOL_HOOK):
        blockers.append("Implement POST_TOOL_HOOK in host.py.")
    for name in selected_hooks(plan):
        if not callable(LIFECYCLE_HOOKS.get(name)):
            blockers.append(f"Implement and register LIFECYCLE_HOOKS[{name!r}] in host.py.")
    for name in selected_handlers(plan):
        if not callable(HOST_HANDLERS.get(name)):
            blockers.append(f"Implement and register HOST_HANDLERS[{name!r}] in host.py.")
    if plan["context"]["skillProvider"] and not skill_provider_shape_ok():
        blockers.append("Implement and register SKILL_PROVIDER in host.py (a real SkillProvider).")
    if plan["session"]["storage"] == "virtual" and not callable(SESSION_FS_FACTORY):
        blockers.append("Implement SESSION_FS_FACTORY in host.py.")
    if plan["model"]["provider"] != "copilot" and not plan["model"]["endpoint"].strip():
        try:
            provider_endpoint()
        except NotImplementedError as error:
            blockers.append(str(error))
    return blockers
`,Ht=String.raw`# Copyright (c) Microsoft Corporation. All rights reserved.
"""Generated Python CLI. --check is stdlib-only and never starts a runtime/model."""
import argparse
import asyncio
import importlib.metadata
import json
import math
import os
from pathlib import Path
import sys
from urllib.parse import urlsplit
from urllib.request import url2pathname

import host

ROOT = Path(__file__).resolve().parent
SDK_COMMIT = "__SDK_COMMIT__"
RUNTIME_VERSION = "__RUNTIME_VERSION__"
SESSION_FIELDS = frozenset(__SESSION_FIELDS__)
TOOL_FIELDS = frozenset(__TOOL_FIELDS__)


def exact_fields(value, allowed, label, required=()):
    if not isinstance(value, dict):
        raise ValueError(f"{label} must be an object.")
    unknown = set(value) - set(allowed)
    missing = set(required) - set(value)
    if unknown or missing:
        raise ValueError(f"{label}: unknown fields {sorted(unknown)}, missing fields {sorted(missing)}.")


def read_json(path):
    with path.open(encoding="utf-8") as stream:
        return json.load(stream)


def validate_plan(plan):
    groups = {
        "target": {"language", "runtime", "serverUrl", "cliPath"},
        "prompt": {"mode", "content", "sections"},
        "context": {
            "workspace", "discovery", "skills", "fileHooks", "hostGit", "skillDirectories", "pluginDirectories",
            "agentDirectories", "hookDirectories", "instructionDirectories", "additionalDirectories",
            "skillProvider", "includedBuiltinSkills", "customInstructions", "onDemandInstructions",
            "refreshCustomInstructions", "organizationInstructions",
        },
        "policy": {"permissionMode", "preToolHook", "postToolHook", "hooks", "handlers", "managed"},
        "model": {
            "id", "provider", "endpoint", "wireApi", "credential", "credentialEnv", "reasoningEffort", "contextTier",
            "autoTier", "reasoningSummary", "allowedModels", "modelProvider", "wireModel", "maxPromptTokens",
            "maxOutputTokens",
        },
        "capabilities": {"imageGeneration", "toolSearch", "toolSearchDeferThreshold", "askUserVariant"},
        "session": {
            "storage", "baseDirectory", "idleTimeoutSeconds", "infinite", "largeOutput", "name", "interactiveUser",
            "diagnostics", "sessionStore", "fileChangeTracking", "allowTranscriptRecovery", "continuePendingWork",
        },
        "events": {"streaming", "observer", "subAgentStreaming", "logLevel"},
        "output": {"responseSchema"},
    }
    fields = {
        "schemaVersion", "toolCatalogRevision", "target", "name", "preset", "clientMode", "inventory", "prompt",
        "tools", "customTools", "mcpServers", "agents", "selectedAgent", "rootExcludedTools", "excludedBuiltinAgents",
        "context", "policy", "model", "capabilities", "identity", "session", "events", "output", "evaluation",
    }
    exact_fields(plan, fields, "plan", fields)
    if plan["schemaVersion"] != 3 or plan["target"]["language"] != "python":
        raise ValueError("This project requires a version 3 Python harness plan.")
    for name, keys in groups.items():
        exact_fields(plan[name], keys, f"plan.{name}", keys)
    managed = {"load", "enforceModelDefaults", "deny", "ask", "allow", "limitTo", "disableBypassPermissionsMode", "disableAssistedPermissionsMode"}
    exact_fields(plan["policy"]["managed"], managed, "plan.policy.managed", managed)
    if not set(plan["policy"]["hooks"]) <= set(host.HOOK_NAMES) or len(set(plan["policy"]["hooks"])) != len(plan["policy"]["hooks"]):
        raise ValueError("Unsupported or repeated lifecycle hook selection.")
    if not set(plan["policy"]["handlers"]) <= set(host.HANDLER_NAMES) or len(set(plan["policy"]["handlers"])) != len(plan["policy"]["handlers"]):
        raise ValueError("Unsupported or repeated host handler selection.")
    if plan["events"]["logLevel"] not in {"default", "none", "error", "warning", "info", "debug", "all"}:
        raise ValueError("Unsupported client log level.")
    allowed_models = plan["model"]["allowedModels"]
    if not isinstance(allowed_models, list) or not all(isinstance(item, str) and item for item in allowed_models):
        raise ValueError("plan.model.allowedModels must be a list of exact model IDs.")
    if not isinstance(plan["output"]["responseSchema"], str):
        raise ValueError("plan.output.responseSchema must be JSON Schema text.")
    if plan["target"]["runtime"] not in {"managed", "external", "inprocess"}:
        raise ValueError("Unsupported runtime selection; regenerate the bootstrap.")
    if plan["clientMode"] not in {"empty", "copilot-cli"}:
        raise ValueError("Unsupported client mode.")
    if plan["inventory"] not in {"explicit", "coding-defaults"}:
        raise ValueError("Unsupported tool inventory.")
    if plan["policy"]["permissionMode"] not in {"host", "allow-all"}:
        raise ValueError("Unsupported permission mode.")
    if plan["clientMode"] == "empty" and plan["inventory"] != "explicit":
        raise ValueError("Empty mode requires an explicit tool inventory.")
    if plan["session"]["storage"] not in {"local", "virtual"}:
        raise ValueError("Unsupported storage selection.")
    if plan["session"]["storage"] == "local" and not plan["session"]["baseDirectory"].strip():
        raise ValueError("Local storage requires an explicit baseDirectory.")
    for group, names in {
        "context": ("discovery", "skills", "fileHooks", "hostGit", "skillProvider", "onDemandInstructions", "refreshCustomInstructions"),
        "policy": ("preToolHook", "postToolHook"),
        "capabilities": ("imageGeneration",),
        "session": ("infinite", "largeOutput", "interactiveUser", "sessionStore", "fileChangeTracking", "allowTranscriptRecovery", "continuePendingWork"),
        "events": ("streaming", "observer", "subAgentStreaming"),
    }.items():
        for name in names:
            if type(plan[group][name]) is not bool:
                raise ValueError(f"plan.{group}.{name} must be a boolean.")
    idle_timeout = plan["session"]["idleTimeoutSeconds"]
    if type(idle_timeout) is not int or idle_timeout < 0:
        raise ValueError("idleTimeoutSeconds must be a non-negative integer.")
    if plan["identity"] not in {"host-token", "developer", "s2s-installation"}:
        raise ValueError("Unsupported identity selection.")
    if plan["model"]["provider"] not in {"copilot", "openai", "azure", "anthropic"}:
        raise ValueError("Unsupported model provider.")
    if plan["model"]["credential"] not in {"api-key", "bearer-callback"}:
        raise ValueError("Unsupported provider credential selection.")
    builtins = frozenset(__BUILTIN_NAMES__)
    exact_fields(plan["tools"], builtins, "plan.tools", builtins)
    for name, value in plan["tools"].items():
        exact_fields(value, {"action", "description", "parameters"}, f"plan.tools.{name}", {"action", "description", "parameters"})
        if value["action"] not in {"keep", "override", "remove"}:
            raise ValueError(f"Unknown action for {name}.")
    for name, keys in {
        "customTools": {"id", "name", "description", "parameters", "terminal", "defer", "skipPermission"},
        "mcpServers": {"id", "name", "url", "tools"},
        "agents": {"id", "name", "displayName", "description", "prompt", "model", "tools", "hooks"},
    }.items():
        for value in plan[name]:
            exact_fields(value, keys, f"plan.{name}", keys)
    for server in plan["mcpServers"]:
        for tool in server["tools"]:
            exact_fields(tool, {"name", "wireName"}, "MCP tool", {"name", "wireName"})
    for section in plan["prompt"]["sections"]:
        exact_fields(section, {"name", "action", "content"}, "prompt section", {"name", "action", "content"})


def load_configuration():
    data = read_json(ROOT / "python-bootstrap.json")
    expected = {"schemaVersion", "sdkCommit", "runtimeVersion", "plan", "externalAddress", "session", "tools"}
    exact_fields(data, expected, "python-bootstrap.json", expected)
    if data["schemaVersion"] != 1 or data["sdkCommit"] != SDK_COMMIT or data["runtimeVersion"] != RUNTIME_VERSION:
        raise ValueError("Unexpected bootstrap/SDK/runtime snapshot; regenerate this project.")
    plan = read_json(ROOT / "harness-plan.json")
    validate_plan(plan)
    # Preserve the original file; compare and execute only active transport/provider settings.
    plan = json.loads(json.dumps(plan))
    if plan["target"]["runtime"] != "managed":
        plan["target"]["cliPath"] = ""
    if plan["model"]["provider"] == "copilot":
        plan["model"]["endpoint"] = ""
    if data["plan"] != plan:
        raise ValueError("harness-plan.json and python-bootstrap.json disagree. Regenerate after changing the plan.")
    session = data["session"]
    optional = {
        "model", "reasoning_effort", "context_tier", "system_message", "available_tools", "working_directory", "agent", "default_agent", "provider",
        "agent_directories", "hook_directories", "instruction_directories", "additional_directories",
        "included_builtin_skills", "skip_custom_instructions", "enable_on_demand_instruction_discovery",
        "refresh_custom_instructions", "organization_custom_instructions", "enable_managed_settings",
        "enforce_managed_model_defaults", "managed_settings", "capi", "reasoning_summary", "image_generation",
        "tool_search", "ask_user_variant", "excluded_builtin_agents", "name", "interactive_user", "diagnostics",
        "enable_session_store", "enable_file_change_tracking", "include_sub_agent_streaming_events",
    }
    required = set(SESSION_FIELDS) - optional
    for field, selected in {
        "model": bool(plan["model"]["id"].strip()),
        "reasoning_effort": plan["model"]["reasoningEffort"] != "default",
        "context_tier": plan["model"]["contextTier"] != "default",
        "system_message": plan["prompt"]["mode"] != "default",
        "working_directory": bool(plan["context"]["workspace"].strip()),
        "agent": bool(plan["selectedAgent"]),
        "default_agent": bool(plan["rootExcludedTools"]),
        "provider": plan["model"]["provider"] != "copilot",
    }.items():
        if selected:
            required.add(field)
    exact_fields(session, SESSION_FIELDS, "session", required)
    for field in (
        "enable_config_discovery", "enable_skills", "enable_file_hooks",
        "enable_host_git_operations", "streaming",
    ):
        if type(session[field]) is not bool:
            raise ValueError(f"session.{field} must be a boolean.")
    if plan["inventory"] == "explicit" and "available_tools" not in session:
        raise ValueError("The explicit available_tools selection is missing.")
    for field in ("available_tools", "excluded_tools"):
        if field in session and (not isinstance(session[field], list) or "*" in session[field]):
            raise ValueError(f"{field} must be a list of exact or source-qualified names, not bare '*'.")
    message = session.get("system_message", {})
    if "system_message" in session:
        exact_fields(message, {"mode", "content", "sections"}, "system_message", {"mode", "content"})
        if message["mode"] not in {"append", "replace", "customize"}:
            raise ValueError("Unsupported prompt mode.")
        if message["mode"] != "customize" and "sections" in message:
            raise ValueError("Only customize mode accepts prompt sections.")
    sections = {
        "preamble", "identity", "tone", "tool_efficiency", "environment_context",
        "code_change_rules", "guidelines", "safety", "tool_instructions",
        "custom_instructions", "runtime_instructions", "last_instructions",
    }
    for name, section in message.get("sections", {}).items():
        if name not in sections:
            raise ValueError(f"Unsupported prompt section: {name}")
        exact_fields(section, {"action", "content"}, f"section {name}", {"action"})
        if section["action"] not in {"replace", "append", "prepend", "remove", "preserve"}:
            raise ValueError(f"Unsupported action for section {name}.")
    for name, server in session["mcp_servers"].items():
        exact_fields(server, {"type", "url", "tools"}, f"mcp_servers.{name}", {"type", "url", "tools"})
    for agent in session["custom_agents"]:
        exact_fields(agent, {"name", "display_name", "description", "prompt", "model", "tools", "hooks"}, "custom agent", {"name", "description", "prompt", "tools"})
    if "default_agent" in session:
        exact_fields(session["default_agent"], {"excluded_tools"}, "default_agent", {"excluded_tools"})
    for key in ("infinite_sessions", "large_output"):
        exact_fields(session[key], {"enabled"}, key, {"enabled"})
        if type(session[key]["enabled"]) is not bool:
            raise ValueError(f"{key}.enabled must be a boolean.")
    if "provider" in session:
        exact_fields(
            session["provider"],
            {"type", "base_url", "wire_api", "model_provider", "wire_model", "max_prompt_tokens", "max_output_tokens"},
            "provider",
            {"type", "base_url"},
        )
    if "managed_settings" in session:
        exact_fields(session["managed_settings"], {"permissions"}, "managed_settings", {"permissions"})
        exact_fields(
            session["managed_settings"]["permissions"],
            {"disable_bypass_permissions_mode", "disable_assisted_permissions_mode", "deny", "ask", "allow", "limit_to"},
            "managed_settings.permissions",
        )
    if "capi" in session:
        exact_fields(session["capi"], {"auto_tier"}, "capi", {"auto_tier"})
    if "image_generation" in session:
        exact_fields(session["image_generation"], {"enabled"}, "image_generation", {"enabled"})
    if "tool_search" in session:
        exact_fields(session["tool_search"], {"enabled", "defer_threshold"}, "tool_search")
    if "diagnostics" in session:
        exact_fields(session["diagnostics"], {"sources"}, "diagnostics", {"sources"})
        exact_fields(session["diagnostics"]["sources"], {"mcp"}, "diagnostics.sources", {"mcp"})
        exact_fields(session["diagnostics"]["sources"]["mcp"], {"level"}, "diagnostics.sources.mcp", {"level"})
    optional_tool_fields = {"defer", "skip_permission"}
    for tool in data["tools"]:
        exact_fields(tool, TOOL_FIELDS, "tool", TOOL_FIELDS - optional_tool_fields)
        if not isinstance(tool["parameters"], dict) or tool["parameters"].get("type") != "object":
            raise ValueError(f"Tool {tool['name']} needs an object JSON Schema.")
    if plan["target"]["runtime"] == "external":
        url = urlsplit("tcp://" + data["externalAddress"])
        if not url.hostname or not url.port or url.username or url.password or url.path or url.query or url.fragment:
            raise ValueError("Invalid canonical external runtime address.")
    elif data["externalAddress"] is not None:
        raise ValueError("An external address was supplied for a local runtime.")
    return data


def project_path(value):
    path = Path(value).expanduser()
    return path.resolve() if path.is_absolute() else (ROOT / path).resolve()


def runtime_directory(kind):
    return ROOT / ".sdk-source" / f"runtime-{RUNTIME_VERSION}-{kind}"


def runtime_entrypoint(plan):
    explicit = plan["target"]["cliPath"].strip() or os.environ.get("COPILOT_CLI_PATH", "")
    if explicit:
        return project_path(explicit)
    marker = runtime_directory(plan["target"]["runtime"]) / "runtime-path.json"
    if not marker.is_file():
        raise ValueError("No local runtime was provisioned. Run bash setup-sdk.sh --run or set COPILOT_CLI_PATH.")
    record = read_json(marker)
    exact_fields(record, {"sdkCommit", "runtimeVersion", "path"}, "runtime path record", {"sdkCommit", "runtimeVersion", "path"})
    if record["sdkCommit"] != SDK_COMMIT or record["runtimeVersion"] != RUNTIME_VERSION:
        raise ValueError("The provisioned runtime record belongs to another snapshot.")
    path = Path(record["path"]).resolve()
    if not path.is_relative_to(marker.parent.resolve()):
        raise ValueError("The provisioned runtime path escaped its project-owned cache.")
    return path


def native_libraries(entrypoint):
    # File inspection only: never dlopen a library during preflight.
    parent = entrypoint.parent
    names = ("runtime.node", "libruntime_native.so", "libruntime_native.dylib", "runtime_native.dll")
    candidates = [parent / name for name in names]
    candidates.extend(parent.glob("prebuilds/*/runtime.node"))
    return [path for path in candidates if path.is_file() and path.stat().st_size]


def preflight(data):
    plan = data["plan"]
    problems = []
    if sys.version_info < (3, 11):
        problems.append("Python 3.11 or newer is required.")
    try:
        distribution = importlib.metadata.distribution("github-copilot-sdk")
        direct_url = distribution.read_text("direct_url.json")
        if not direct_url:
            problems.append("Install this project's source-pinned SDK with bash setup-sdk.sh --run.")
        else:
            location = urlsplit(json.loads(direct_url).get("url", ""))
            installed_from = (
                Path(url2pathname(("//" + location.netloc if location.netloc else "") + location.path)).resolve()
                if location.scheme == "file" else None
            )
            expected_source = (ROOT / ".sdk-source" / "copilot-sdk" / "python").resolve()
            if installed_from != expected_source:
                problems.append("The installed SDK is not from this project's pinned checkout; run setup-sdk.sh.")
    except importlib.metadata.PackageNotFoundError:
        problems.append("The Python SDK is not installed. Run bash setup-sdk.sh --run.")
    head = ROOT / ".sdk-source" / "copilot-sdk" / ".git" / "HEAD"
    if not head.is_file() or head.read_text(encoding="utf-8").strip() != SDK_COMMIT:
        problems.append("The SDK checkout must remain detached at the exported commit. setup-sdk.sh will not reset existing files.")
    problems.extend(host.environment_blockers(plan))
    problems.extend(host.integration_blockers(plan, data["tools"]))
    if plan["target"]["runtime"] != "external":
        try:
            path = runtime_entrypoint(plan)
            if not path.is_file():
                problems.append(f"Runtime entrypoint does not exist: {path}")
            elif not path.stat().st_size:
                problems.append(f"Runtime entrypoint is empty: {path}")
            elif os.name != "nt" and not os.access(path, os.X_OK):
                problems.append(f"Runtime entrypoint is not executable: {path}")
            if plan["target"]["runtime"] == "inprocess" and not native_libraries(path):
                problems.append("No adjacent native runtime library was found. Provision with --in-process or supply a compatible bundle.")
        except (ValueError, OSError) as error:
            problems.append(str(error))
    return problems


def session_options(data):
    plan = data["plan"]
    # Copy JSON data before binding executable host callbacks; never mutate the saved plan.
    options = json.loads(json.dumps(data["session"]))
    if "model" not in options:
        options["model"] = host.required_environment("COPILOT_MODEL")
    if "provider" in options and not options["provider"]["base_url"].strip():
        options["provider"]["base_url"] = host.provider_endpoint()
    from copilot.tools import Tool
    options["tools"] = [
        Tool(**definition, handler=host.make_tool_handler(definition["name"]))
        for definition in data["tools"]
    ]
    if plan["policy"]["permissionMode"] == "host":
        options["on_permission_request"] = host.on_permission_request
    else:
        from copilot import PermissionHandler
        options["on_permission_request"] = PermissionHandler.approve_all
    if plan["tools"]["ask_user"]["action"] == "keep":
        options["on_user_input_request"] = host.console_user_input
    hooks = {}
    if plan["policy"]["preToolHook"]:
        hooks["on_pre_tool_use"] = host.on_pre_tool_use
    if plan["policy"]["postToolHook"]:
        hooks["on_post_tool_use"] = host.on_post_tool_use
    for name in host.selected_hooks(plan):
        hooks[name] = host.make_lifecycle_hook(name)
    if hooks:
        options["hooks"] = hooks
    for name in host.selected_handlers(plan):
        options[name] = host.make_host_handler(name)
    if plan["context"]["skillProvider"]:
        options["skill_provider"] = host.skill_provider()
    if "managed_settings" in options:
        from copilot import ManagedSettings, ManagedSettingsPermissions
        options["managed_settings"] = ManagedSettings(
            permissions=ManagedSettingsPermissions(**options["managed_settings"]["permissions"])
        )
    if "diagnostics" in options:
        from copilot.generated.rpc import DiagnosticsConfiguration
        options["diagnostics"] = DiagnosticsConfiguration.from_dict(options["diagnostics"])
    if plan["events"]["observer"]:
        options["on_event"] = host.metadata_observer
    if plan["session"]["storage"] == "virtual":
        options["create_session_fs_handler"] = host.create_session_fs_handler
    if plan["model"]["provider"] == "copilot":
        # __GITHUB_TOKEN_PROVIDER_START__
        if plan["identity"] == "host-token":
            options["github_token_provider"] = host.github_token_provider
        # __GITHUB_TOKEN_PROVIDER_END__
        pass
    elif plan["model"]["credential"] == "api-key":
        options["provider"]["api_key"] = host.required_environment(plan["model"]["credentialEnv"])
    else:
        options["provider"]["bearer_token_provider"] = host.bearer_token_provider
    return options


async def run_agent(data, prompt, timeout):
    from copilot import CopilotClient, RuntimeConnection
    from copilot.session_events import AssistantMessageData
    plan = data["plan"]
    kind = plan["target"]["runtime"]
    client_options = {"mode": plan["clientMode"]}
    if kind == "external":
        connection = RuntimeConnection.for_uri(
            data["externalAddress"],
            connection_token=os.environ.get("COPILOT_CONNECTION_TOKEN"),
        )
    else:
        path = runtime_entrypoint(plan)
        if kind == "managed":
            connection = RuntimeConnection.for_stdio(path=str(path))
            # __S2S_MANAGED_ENV_START__
            if plan["model"]["provider"] == "copilot" and plan["identity"] == "s2s-installation":
                client_options["env"] = {
                    **os.environ,
                    "COPILOT_GITHUB_TOKEN": host.required_environment("COPILOT_GITHUB_TOKEN"),
                }
            # __S2S_MANAGED_ENV_END__
        else:
            os.environ["COPILOT_CLI_PATH"] = str(path)
            # __S2S_INPROCESS_ENV_START__
            if plan["model"]["provider"] == "copilot" and plan["identity"] == "s2s-installation":
                host.required_environment("COPILOT_GITHUB_TOKEN")
            # __S2S_INPROCESS_ENV_END__
            connection = RuntimeConnection.for_inprocess()
        client_options["session_idle_timeout_seconds"] = plan["session"]["idleTimeoutSeconds"]
        if plan["events"]["logLevel"] != "default":
            # Ignored for RuntimeConnection.for_uri, so only locally hosted runtimes receive it.
            client_options["log_level"] = plan["events"]["logLevel"]
        client_options["use_logged_in_user"] = (
            plan["model"]["provider"] == "copilot" and plan["identity"] == "developer"
        )
        if plan["session"]["storage"] == "local":
            client_options["base_directory"] = str(project_path(plan["session"]["baseDirectory"]))
    if plan["session"]["storage"] == "virtual":
        client_options["session_fs"] = {
            "initial_working_directory": plan["context"]["workspace"] or "/workspace",
            "session_state_path": "/session-state",
            "conventions": "posix",
            "capabilities": {"sqlite": False},
        }
    client = None
    session = None
    primary = None
    try:
        client = CopilotClient(connection=connection, **client_options)
        await client.start()
        session = await client.create_session(**session_options(data))
        if plan["model"]["allowedModels"]:
            from copilot.generated.rpc import ModelSetAllowedModelsRequest
            await session.rpc.model.set_allowed_models(
                ModelSetAllowedModelsRequest(allowed_models=list(plan["model"]["allowedModels"]))
            )
        send_options = {}
        if plan["output"]["responseSchema"].strip():
            send_options["response_schema"] = json.loads(plan["output"]["responseSchema"])
        response = await session.send_and_wait(prompt, timeout=timeout, **send_options)
        if response is None:
            print("[complete] Runtime is idle; no final assistant message was emitted. Terminal-tool completion is supported.")
        elif isinstance(response.data, AssistantMessageData):
            print(response.data.content)
        else:
            raise TypeError("send_and_wait returned an unexpected final event type.")
    except BaseException as error:
        primary = error
        raise
    finally:
        failures = []
        operations = []
        if session is not None:
            if primary is not None:
                operations.append(("abort", session.abort))
            operations.append(("disconnect", session.disconnect))
        if client is not None:
            operations.append(("stop", client.stop))
        for label, operation in operations:
            try:
                await operation()
            except BaseException as error:
                error.add_note(f"During Python bootstrap cleanup: {label}")
                failures.append(error)
        if failures:
            if primary is not None:
                for error in failures:
                    primary.add_note(f"Cleanup also failed: {type(error).__name__}: {error}")
            else:
                raise BaseExceptionGroup("Python bootstrap cleanup failed", failures)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--check", action="store_true", help="Local preflight only; never starts a runtime or model.")
    parser.add_argument("--prompt", default="Say hello and explain your scope.")
    parser.add_argument("--timeout", type=float, default=60.0, help="Wait timeout in seconds.")
    args = parser.parse_args()
    if not math.isfinite(args.timeout) or args.timeout <= 0:
        parser.error("--timeout must be a positive finite number of seconds.")
    try:
        data = load_configuration()
        problems = preflight(data)
    except (ValueError, TypeError, KeyError, OSError) as error:
        print(f"Preflight failed: {error}", file=sys.stderr)
        return 1
    if problems:
        print("Preflight blockers:", file=sys.stderr)
        for problem in problems:
            print(f"- {problem}", file=sys.stderr)
        return 1
    if args.check:
        print("Preflight passed: local checks only; no SDK client, runtime, or model was started.")
        if data["plan"]["target"]["runtime"] == "external":
            print("External server reachability, credentials, state directory, and idle policy were not queried.")
        return 0
    os.chdir(ROOT)
    asyncio.run(run_agent(data, args.prompt, args.timeout))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
`,Ut=String.raw`# Copyright (c) Microsoft Corporation. All rights reserved.
"""Explicit setup only. Downloads a runtime artifact, never starts it."""
import argparse
import json
import os
from pathlib import Path
import subprocess
import sys
import tempfile

ROOT = Path(__file__).resolve().parent
SDK_COMMIT = "__SDK_COMMIT__"
RUNTIME_VERSION = "__RUNTIME_VERSION__"


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--run", action="store_true", help="Opt in to runtime artifact download.")
    args = parser.parse_args()
    if not args.run:
        parser.print_help()
        return 0
    with (ROOT / "python-bootstrap.json").open(encoding="utf-8") as stream:
        data = json.load(stream)
    if data["sdkCommit"] != SDK_COMMIT or data["runtimeVersion"] != RUNTIME_VERSION:
        raise ValueError("Unexpected source/runtime pin; regenerate the project.")
    target = data["plan"]["target"]
    kind = target["runtime"]
    if kind == "external":
        print("External runtime: operate the separately configured server; no local runtime is downloaded.")
        return 0
    if kind not in {"managed", "inprocess"}:
        raise ValueError("Unknown runtime kind.")
    if target["cliPath"].strip() or os.environ.get("COPILOT_CLI_PATH"):
        print("An explicit runtime path is configured. Run --check to inspect it without starting it.")
        return 0
    parent = ROOT / ".sdk-source"
    cache = parent / f"runtime-{RUNTIME_VERSION}-{kind}"
    marker = cache / "runtime-path.json"
    owner = cache / "bootstrap-owner.json"
    ownership = {"sdkCommit": SDK_COMMIT, "runtimeVersion": RUNTIME_VERSION, "kind": kind}
    if parent.is_symlink() or cache.is_symlink() or marker.is_symlink() or owner.is_symlink():
        raise ValueError("Refusing to provision through a symlink.")
    if cache.exists():
        if not owner.is_file():
            raise ValueError(f"Refusing to write into unowned runtime files in {cache}. Inspect them manually.")
        with owner.open(encoding="utf-8") as stream:
            if json.load(stream) != ownership:
                raise ValueError("Existing runtime cache belongs to another bootstrap.")
    else:
        cache.mkdir(parents=True, exist_ok=False)
        with owner.open("x", encoding="utf-8") as stream:
            json.dump(ownership, stream, indent=2)
            stream.write("\n")
    if marker.exists():
        with marker.open(encoding="utf-8") as stream:
            record = json.load(stream)
        path = Path(record["path"]).resolve()
        if record["sdkCommit"] != SDK_COMMIT or record["runtimeVersion"] != RUNTIME_VERSION:
            raise ValueError("Existing runtime files belong to another snapshot.")
        if not path.is_relative_to(cache.resolve()) or not path.is_file() or not path.with_name("runtime.node").is_file():
            raise ValueError("Existing runtime cache is incomplete; refusing to replace it.")
        print(f"Keeping the existing verified-version runtime cache: {cache}")
        return 0
    # A failed download is left intact; a later opt-in setup uses a new directory.
    attempt = Path(tempfile.mkdtemp(prefix="download-", dir=cache))
    environment = dict(os.environ)
    environment["COPILOT_CLI_EXTRACT_DIR"] = str(attempt)
    command = [sys.executable, "-m", "copilot", "download-runtime", "--version", RUNTIME_VERSION]
    if kind == "inprocess":
        command.append("--in-process")
    result = subprocess.run(command, env=environment, check=True, text=True, stdout=subprocess.PIPE)
    print(result.stdout, end="")
    prefix = "Runtime cached at: "
    reported = [line[len(prefix):] for line in result.stdout.splitlines() if line.startswith(prefix)]
    if len(reported) != 1:
        raise ValueError("The pinned SDK did not report exactly one runtime entrypoint.")
    path = Path(reported[0]).resolve()
    if not path.is_relative_to(cache.resolve()) or not path.is_file() or not path.with_name("runtime.node").is_file():
        raise ValueError("Runtime provisioning did not produce the expected executable/native-library pair.")
    with marker.open("x", encoding="utf-8") as stream:
        json.dump({"sdkCommit": SDK_COMMIT, "runtimeVersion": RUNTIME_VERSION, "path": str(path)}, stream, indent=2)
        stream.write("\n")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
`,Wt=String.raw`#!/usr/bin/env bash
# Copyright (c) Microsoft Corporation. All rights reserved.
set -euo pipefail

usage() {
    printf '%s\n' \
        'Usage: bash setup-sdk.sh [--run] [--python python3.11]' \
        'Default: preview only. --run fetches the exact SDK and installs a project-owned venv.' \
        'Requires Git, Bash, Python 3.11+, and package/release download access.' \
        'COPILOT_CLI_PATH may provide an existing compatible local runtime.' \
        'No existing checkout is reset or deleted. An unowned/existing venv is rejected.'
}

RUN=0
PYTHON=python3
while [ "$#" -gt 0 ]; do
    case "$1" in
        --run) RUN=1; shift ;;
        --python)
            if [ "$#" -lt 2 ]; then usage >&2; exit 2; fi
            PYTHON="$2"; shift 2 ;;
        --help|-h) usage; exit 0 ;;
        *) usage >&2; exit 2 ;;
    esac
done
if [ "$RUN" != 1 ]; then usage; exit 0; fi

ROOT=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
SDK_PARENT="$ROOT/.sdk-source"
CHECKOUT="$SDK_PARENT/copilot-sdk"
VENV="$ROOT/.venv"
MARKER="$VENV/.copilot-python-bootstrap"
SDK_COMMIT=__SDK_COMMIT__
"$PYTHON" -c 'import sys; sys.version_info >= (3, 11) or sys.exit("Python 3.11+ is required")'
command -v git >/dev/null

if [ -L "$SDK_PARENT" ] || [ -L "$CHECKOUT" ] || [ -L "$VENV" ] || [ -L "$MARKER" ]; then
    printf '%s\n' 'Refusing to use symlinked SDK/virtual-environment paths.' >&2
    exit 1
fi
if [ -e "$VENV" ] && { [ ! -f "$MARKER" ] || [ "$(cat "$MARKER")" != "$SDK_COMMIT" ]; }; then
    printf '%s\n' 'The existing .venv is not owned by this bootstrap. It will not be overwritten.' >&2
    exit 1
fi
if [ -e "$CHECKOUT" ]; then
    if [ ! -d "$CHECKOUT/.git" ] || [ -L "$CHECKOUT/.git" ] || [ "$(cat "$CHECKOUT/.git/HEAD")" != "$SDK_COMMIT" ] || [ "$(git -C "$CHECKOUT" rev-parse HEAD)" != "$SDK_COMMIT" ]; then
        printf '%s\n' 'Existing SDK checkout is not detached at the expected commit. Refusing to reset or overwrite it.' >&2
        exit 1
    fi
    if [ -n "$(git -C "$CHECKOUT" status --porcelain --untracked-files=normal)" ]; then
        printf '%s\n' 'Existing SDK checkout has changes. Inspect it manually; setup will not discard them.' >&2
        exit 1
    fi
else
    mkdir -p -- "$SDK_PARENT"
    git init --quiet "$CHECKOUT"
    git -C "$CHECKOUT" remote add origin https://github.com/github/copilot-sdk.git
    git -C "$CHECKOUT" fetch --no-tags --depth=1 origin "$SDK_COMMIT"
    git -C "$CHECKOUT" checkout --detach "$SDK_COMMIT"
fi
if [ ! -e "$VENV" ]; then
    "$PYTHON" -m venv "$VENV"
    printf '%s\n' "$SDK_COMMIT" > "$MARKER"
fi
if [ -x "$VENV/bin/python" ]; then
    VENV_PYTHON="$VENV/bin/python"
elif [ -x "$VENV/Scripts/python.exe" ]; then
    VENV_PYTHON="$VENV/Scripts/python.exe"
else
    printf '%s\n' 'The project virtual environment has no Python executable; refusing to recreate it.' >&2
    exit 1
fi
cd -- "$ROOT"
"$VENV_PYTHON" -m pip install -r requirements.txt
"$VENV_PYTHON" provision_runtime.py --run
printf '%s\n' 'Setup complete. Set required environment values, implement host.py integrations, then run bash run-agent.sh --check.'
`,Gt=String.raw`#!/usr/bin/env bash
# Copyright (c) Microsoft Corporation. All rights reserved.
set -euo pipefail
ROOT=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
if [ -x "$ROOT/.venv/bin/python" ]; then
    PYTHON="$ROOT/.venv/bin/python"
elif [ -x "$ROOT/.venv/Scripts/python.exe" ]; then
    PYTHON="$ROOT/.venv/Scripts/python.exe"
else
    printf '%s\n' 'Run bash setup-sdk.sh --run first, or use Python 3.11+ directly for a dependency-free preflight.' >&2
    exit 1
fi
cd -- "$ROOT"
exec "$PYTHON" agent.py "$@"
`,Kt=z,qt=B,Jt=`host.py`,Yt={model:`model`,reasoningEffort:`reasoning_effort`,contextTier:`context_tier`,systemMessage:`system_message`,availableTools:`available_tools`,excludedTools:`excluded_tools`,workingDirectory:`working_directory`,enableConfigDiscovery:`enable_config_discovery`,enableSkills:`enable_skills`,enableFileHooks:`enable_file_hooks`,enableHostGitOperations:`enable_host_git_operations`,skillDirectories:`skill_directories`,pluginDirectories:`plugin_directories`,mcpServers:`mcp_servers`,customAgents:`custom_agents`,agent:`agent`,defaultAgent:`default_agent`,infiniteSessions:`infinite_sessions`,largeOutput:`large_output`,streaming:`streaming`,provider:`provider`,agentDirectories:`agent_directories`,hookDirectories:`hook_directories`,instructionDirectories:`instruction_directories`,additionalDirectories:`additional_directories`,includedBuiltinSkills:`included_builtin_skills`,skipCustomInstructions:`skip_custom_instructions`,enableOnDemandInstructionDiscovery:`enable_on_demand_instruction_discovery`,refreshCustomInstructions:`refresh_custom_instructions`,organizationCustomInstructions:`organization_custom_instructions`,enableManagedSettings:`enable_managed_settings`,enforceManagedModelDefaults:`enforce_managed_model_defaults`,managedSettings:`managed_settings`,capi:`capi`,reasoningSummary:`reasoning_summary`,imageGeneration:`image_generation`,toolSearch:`tool_search`,askUserVariant:`ask_user_variant`,excludedBuiltinAgents:`excluded_builtin_agents`,name:`name`,interactiveUser:`interactive_user`,diagnostics:`diagnostics`,enableSessionStore:`enable_session_store`,enableFileChangeTracking:`enable_file_change_tracking`,includeSubAgentStreamingEvents:`include_sub_agent_streaming_events`},Xt={name:`name`,description:`description`,parameters:`parameters`,overridesBuiltInTool:`overrides_built_in_tool`,isTerminal:`is_terminal`,defer:`defer`,skipPermission:`skip_permission`},Zt={preMcpToolCall:`on_pre_mcp_tool_call`,userPromptSubmitted:`on_user_prompt_submitted`,userPromptTransformed:`on_user_prompt_transformed`,sessionStart:`on_session_start`,sessionEnd:`on_session_end`,errorOccurred:`on_error_occurred`,agentStop:`on_agent_stop`,subagentStart:`on_subagent_start`,subagentStop:`on_subagent_stop`},Qt={elicitation:`on_elicitation_request`,exitPlanMode:`on_exit_plan_mode_request`,autoModeSwitch:`on_auto_mode_switch_request`,mcpAuth:`on_mcp_auth_request`};function $t(e){return typeof e==`object`&&!!e&&!Array.isArray(e)}function G(e,t,n){if(!$t(e))throw Error(`${n} must be an object.`);return Object.fromEntries(Object.entries(e).map(([e,r])=>{let i=Object.hasOwn(t,e)?t[e]:void 0;if(!i)throw Error(`Python bootstrap cannot represent ${n}.${e}.`);return[i,r]}))}function en(e){let t=y(e),n=G(t,Yt,`session`);return n.mcp_servers=Object.fromEntries(Object.entries(t.mcpServers).map(([e,t])=>[e,G(t,{type:`type`,url:`url`,tools:`tools`},`mcpServers.${e}`)])),n.custom_agents=t.customAgents.map(e=>G(e,{name:`name`,displayName:`display_name`,description:`description`,prompt:`prompt`,model:`model`,tools:`tools`,hooks:`hooks`},`customAgents.${e.name}`)),t.defaultAgent&&(n.default_agent=G(t.defaultAgent,{excludedTools:`excluded_tools`},`defaultAgent`)),t.provider&&(n.provider=G(t.provider,{type:`type`,baseUrl:`base_url`,wireApi:`wire_api`,modelProvider:`model_provider`,wireModel:`wire_model`,maxPromptTokens:`max_prompt_tokens`,maxOutputTokens:`max_output_tokens`},`provider`)),n.infinite_sessions=G(t.infiniteSessions,{enabled:`enabled`},`infiniteSessions`),n.large_output=G(t.largeOutput,{enabled:`enabled`},`largeOutput`),t.managedSettings&&(n.managed_settings={permissions:G(t.managedSettings.permissions,{disableBypassPermissionsMode:`disable_bypass_permissions_mode`,disableAssistedPermissionsMode:`disable_assisted_permissions_mode`,deny:`deny`,ask:`ask`,allow:`allow`,limitTo:`limit_to`},`managedSettings.permissions`)}),t.capi&&(n.capi=G(t.capi,{autoTier:`auto_tier`},`capi`)),t.imageGeneration&&(n.image_generation=G(t.imageGeneration,{enabled:`enabled`},`imageGeneration`)),t.toolSearch&&(n.tool_search=G(t.toolSearch,{enabled:`enabled`,deferThreshold:`defer_threshold`},`toolSearch`)),n}function tn(e){let t=[];if(e.model.provider===`copilot`&&e.model.endpoint.trim()&&t.push({id:`python-copilot-endpoint`,title:`The selected Copilot endpoint cannot be passed through this Python API`,detail:`The pinned Python create_session API has no high-level Copilot endpoint override. Clear the endpoint for Copilot authentication, or select a supported BYOK provider; this exporter will not silently discard it.`,fields:[`model.provider`,`model.endpoint`],sources:[`sdk-providers`,`sdk-session-config`]}),e.target.runtime===`external`)try{d(e.target)}catch{t.push({id:`python-runtime-address`,title:`Provide a valid external runtime address`,detail:`The Python URI connection needs the canonical host:port from a valid bootstrap target.`,fields:[`target.serverUrl`],sources:[`sdk-existing-runtime`]})}return t}function nn(e){return`'${e.replaceAll(`'`,`'\\''`)}'`}function rn(e,n){let r=n.model.provider===`copilot`&&n.identity===`s2s-installation`?e.replace(/[ \t]*# __GITHUB_TOKEN_PROVIDER_START__\n[\s\S]*?[ \t]*# __GITHUB_TOKEN_PROVIDER_END__\n?/g,``):e.replace(/^[ \t]*# __GITHUB_TOKEN_PROVIDER_START__\n/gm,``).replace(/^[ \t]*# __GITHUB_TOKEN_PROVIDER_END__\n/gm,``);for(let e of[`MANAGED`,`INPROCESS`]){let t=n.model.provider===`copilot`&&n.identity===`s2s-installation`&&n.target.runtime===e.toLowerCase(),i=RegExp(`[ \\t]*# __S2S_${e}_ENV_START__\\n([\\s\\S]*?)[ \\t]*# __S2S_${e}_ENV_END__\\n?`,`g`);r=r.replace(i,t?`$1`:``)}return r=r.replace(/[ \t]*# __S2S_LOCAL_PREFLIGHT_START__\n([\s\S]*?)[ \t]*# __S2S_LOCAL_PREFLIGHT_END__\n?/g,n.model.provider===`copilot`&&n.identity===`s2s-installation`&&n.target.runtime!==`external`?`$1`:``),r.replaceAll(`__SDK_COMMIT__`,Kt).replaceAll(`__RUNTIME_VERSION__`,qt).replaceAll(`__SESSION_FIELDS__`,JSON.stringify(Object.values(Yt))).replaceAll(`__TOOL_FIELDS__`,JSON.stringify(Object.values(Xt))).replaceAll(`__BUILTIN_NAMES__`,JSON.stringify(t)).replaceAll(`__HOOK_NAMES__`,JSON.stringify(Zt)).replaceAll(`__HANDLER_NAMES__`,JSON.stringify(Qt))}var an={typescript:Ee,python:{language:`python`,label:`Python`,check:tn,generate(e){let t=tn(e);if(t.length)throw Error(t.map(e=>e.detail).join(`
`));let n=e.target.runtime===`external`?d(e.target):null,r=b(e,Jt);e.model.provider===`copilot`&&e.identity===`host-token`&&r.push({id:`env-GITHUB_TOKEN_EXPIRES_AT`,environmentVariable:`GITHUB_TOKEN_EXPIRES_AT`,title:`Set GITHUB_TOKEN_EXPIRES_AT`,detail:`Set the token's actual absolute UNIX expiry in seconds. host.py recalculates positive remaining lifetime on every callback and rejects expired credentials. Production token acquisition/refresh belongs in host.py.`,file:Jt,kind:`environment`}),n&&r.push({id:`python-connection-token`,title:`Provide the existing service's connection token when required`,detail:`Set COPILOT_CONNECTION_TOKEN to the runtime service's transport credential; it is separate from GitHub identity.`,file:Jt,kind:`runtime`,environmentVariable:`COPILOT_CONNECTION_TOKEN`}),r.push({id:`python-sdk-source`,title:`Install the exact Python SDK source snapshot`,detail:`Run bash setup-sdk.sh --run with Python 3.11+ and Git. It fetches ${Kt} into .sdk-source/copilot-sdk and installs that checkout into a project-owned virtual environment. It never resets or deletes an existing checkout.`,file:`setup-sdk.sh`,kind:`runtime`});let i=[`sdk-overview`,`sdk-session-config`,`sdk-tools`,`sdk-prompts`,`sdk-hooks`,`sdk-permissions`,`sdk-auth`,`sdk-providers`,`sdk-storage-binding`,`sdk-storage-capabilities`,`sdk-result-envelope`,e.target.runtime===`inprocess`?`sdk-inprocess-guide`:e.target.runtime===`external`?`sdk-existing-runtime`:`sdk-managed-runtime`],a=n?[...e.identity===`s2s-installation`?[`test -n "$COPILOT_GITHUB_TOKEN" &&`]:[],...e.session.storage===`local`?[`env`,`--`,`COPILOT_HOME=${nn(e.session.baseDirectory)}`]:[],nn(e.target.cliPath.trim()||`copilot`),`--headless`,...e.identity===`s2s-installation`?[`--no-auto-login`]:[],`--port`,String(n.port),...e.session.idleTimeoutSeconds?[`--session-idle-timeout`,String(e.session.idleTimeoutSeconds)]:[]].join(` `):void 0;return{files:[{path:`requirements.txt`,content:`# Copyright (c) Microsoft Corporation. All rights reserved.
# Installed by setup-sdk.sh after verifying the exact SDK commit.
./.sdk-source/copilot-sdk/python
`,language:`text`},{path:`python-bootstrap.json`,content:JSON.stringify({schemaVersion:1,sdkCommit:Kt,runtimeVersion:qt,plan:e,externalAddress:n?.address??null,session:en(e),tools:w(e).map(e=>G(e,Xt,`tool`))},null,2)+`
`,language:`json`},{path:`agent.py`,content:rn(Ht,e),language:`python`},{path:Jt,content:rn(Vt,e),language:`python`},{path:`provision_runtime.py`,content:rn(Ut,e),language:`python`},{path:`setup-sdk.sh`,content:rn(Wt,e),language:`text`},{path:`run-agent.sh`,content:rn(Gt,e),language:`text`},{path:`.sdk-source/.gitignore`,content:`# Copyright (c) Microsoft Corporation. All rights reserved.
*
!.gitignore
`,language:`text`}],commands:{install:[`bash setup-sdk.sh --run`],check:`bash run-agent.sh --check`,run:`bash run-agent.sh --prompt "Say hello and explain your scope."`,...a?{startRuntime:a}:{}},requirements:r,notes:[`Requires Python 3.11+ and Git; the setup/run wrappers use Bash (Git Bash on Windows). Choose another interpreter with bash setup-sdk.sh --run --python python3.11. The visualizer itself never fetches or imports the SDK.`,`The Python manifest at ${Kt} is 0.0.0.dev0, not a verified PyPI release. requirements.txt installs the verified source checkout instead of an unresolvable development-version pin.`,e.target.runtime===`external`?`Source installs have CLI_VERSION=None. Setup installs the Python SDK only for an external target; provision and configure the server separately. No local runtime is downloaded.`:`Source installs have CLI_VERSION=None. When no explicit local cliPath or COPILOT_CLI_PATH is provided, setup invokes python -m copilot download-runtime --version ${qt}${e.target.runtime===`inprocess`?` --in-process`:``}. Provisioning is explicit setup work, never part of --check.`,`--check uses only local files, package metadata, environment values, and host integration registrations. It never imports the SDK, constructs a client, downloads a runtime, or sends a model request. It can also be run before installation with python3 agent.py --check.`,`Native preflight inspects file presence, not binary compatibility. A real start is still required to establish ABI/platform compatibility; the explicit setup download selects the host's runtime artifact and verifies its release checksum.`,`python-bootstrap.json contains explicit Python aliases and the active plan projection. It must agree with harness-plan.json after ignoring retained settings for inactive transports/providers; regenerate after changing active planner decisions. JSON Schema properties and prompt text are not case-converted.`,e.policy.permissionMode===`host`?`Extend host.py: register PERMISSION_HANDLER and tool handlers in TOOL_HANDLERS, then assign selected PRE_TOOL_HOOK/POST_TOOL_HOOK/SESSION_FS_FACTORY integrations. Preflight rejects every missing selected integration; no success-shaped stub is supplied.`:`This project explicitly binds PermissionHandler.approve_all. It approves ordinary permission requests once; managed policy, content exclusion, downstream authorization, invalid tools, and sandbox enablement remain authoritative, while enabled sandbox bypass can also be approved. Other selected host integrations still fail preflight until implemented.`,e.model.provider===`copilot`&&e.identity===`s2s-installation`?e.target.runtime===`external`?`GitHub App S2S identity is configured only on the separately operated runtime. This Python client does not read or inject COPILOT_GITHUB_TOKEN and does not register a session token callback.`:e.target.runtime===`inprocess`?`GitHub App S2S identity requires COPILOT_GITHUB_TOKEN in the host environment before the in-process runtime loads. The client disables logged-in-user fallback and does not register a session token callback.`:`GitHub App S2S identity reads COPILOT_GITHUB_TOKEN from the trusted host environment and injects it into the managed child runtime. The client disables logged-in-user fallback and does not register a session token callback.`:`GitHub host-token mode reads GITHUB_TOKEN and GITHUB_TOKEN_EXPIRES_AT (absolute UNIX seconds). BYOK API keys use the plan's credentialEnv; bearer callbacks read MODEL_BEARER_TOKEN. These single-process environment adapters are starters, not production refresh or tenant identity services.`,`The console input handler honors choices and allowFreeform and returns answer/wasFreeform. Hook payloads also retain SDK camelCase keys even though Python registration names use snake_case.`,...e.policy.hooks.length?[`Selected lifecycle hooks must be registered in host.py LIFECYCLE_HOOKS under their SessionHooks names (${e.policy.hooks.map(e=>Zt[e]).join(`, `)}); preflight rejects each missing callable. user_prompt_submitted can return {"decision": "block", "reason": ...}; subagent_stop can block with a nonempty reason or rewrite the response.`]:[],...e.policy.handlers.length?[`Selected host request handlers must be registered in host.py HOST_HANDLERS (${e.policy.handlers.map(e=>Qt[e]).join(`, `)}); preflight rejects each missing callable.`]:[],...e.context.skillProvider?[`Experimental skill provider: assign a real copilot.SkillProvider (list_skills/read_skill backed by your skill store) to host.py SKILL_PROVIDER. Calls are cancelled after 30 seconds; preflight rejects a missing provider and no placeholder catalog is supplied.`]:[],...e.model.allowedModels.length?[`The Python SDK has no allowed-models session option. Immediately after create_session, the runner applies the plan's allowlist with session.rpc.model.set_allowed_models (session.model.setAllowedModels); a rejection disconnects the session, stops the client, and fails the run.`]:[],...e.events.logLevel==="default"?[]:[e.target.runtime===`external`?`The selected runtime log level is not applied: the Python client ignores log_level when connecting to an existing runtime with RuntimeConnection.for_uri. Configure logging on the separately operated server.`:`The client passes log_level=${JSON.stringify(e.events.logLevel)} to the locally hosted runtime.`],...e.output.responseSchema.trim()?[`The run prompt is sent with send_and_wait(response_schema=...) using the plan's JSON object schema; the final assistant message content is the structured JSON text.`]:[],...e.model.autoTier==="default"?[]:[`The Auto routing tier is passed as capi={"auto_tier": ...}; it applies when the session model is auto.`],`Virtual session storage requires a real SessionFsProvider returned by create_session_fs_handler. The starter advertises no SQLite capability. Session storage is not universal host-filesystem virtualization; large-output handling and selected native tools retain their own behavior.`,`Cleanup preserves the primary failure, adds any cleanup errors as notes, and still attempts both session disconnect and client stop. Disconnect preserves durable state. An idle turn without a final assistant message prints an explicit completion notice, including the terminal-tool case.`,...n?[`Connects with RuntimeConnection.for_uri(${JSON.stringify(n.address)}). Start the separately managed server on its host using the provided command; selected local state/idle settings apply there, not to the client. Review binding, TLS/tunneling, and tenant authorization before exposing it remotely.`,`Set COPILOT_CONNECTION_TOKEN in the client environment if the external server requires a connection token. The optional server command does not configure remote exposure or credentials for you. Disconnecting this client does not shut down the shared service.`]:[`Local runtime paths are resolved relative to the generated project. An explicit target.cliPath wins over COPILOT_CLI_PATH; otherwise the source setup's recorded runtime path is used. The generated runner never relies on a development install auto-downloading a runtime.`],...e.target.runtime===`inprocess`?[`In-process hosting is experimental and uses stdlib ctypes, not a Python FFI dependency. A compatible native library must be adjacent to the selected runtime entrypoint (or in its platform prebuilds directory). The native library can outlive clients and cannot be replaced with another version in the same process.`,`RuntimeConnection.for_inprocess() accepts no path/args. The runner sets COPILOT_CLI_PATH before constructing the client; it does not pass forbidden client env/telemetry/working_directory options. A selected workspace remains a separate session option.`]:[]],sources:i}}},go:Ue,csharp:nt,java:kt,rust:Bt};function on(n){let i=e.safeParse(n);if(!i.success)return{ok:!1,blockers:i.error.issues.map(e=>({id:`field-${e.path.map(String).join(`.`)}`,title:`Correct this plan field`,detail:e.message,fields:[e.path.map(String).join(`.`)],sources:[]}))};let a=i.data,o=an[a.target.language],s={...a,target:{...a.target,cliPath:a.target.runtime===`managed`?a.target.cliPath:``},model:{...a.model,endpoint:a.model.provider===`copilot`?``:a.model.endpoint}},c=[...t.flatMap(e=>a.tools[e].action!==`override`||r[e].overrideable?[]:[{id:`unverified-override-${e}`,title:`The host override path for ${e} is not verified`,detail:e===`catalog_search`?`The runtime explicitly reserves catalog_search. Keep or remove its exposure; do not register a replacement.`:`The full catalog has no verified external override route for this descriptor. Keep/remove it or add a separate custom tool. The existing selection is retained, not silently rewritten.`,fields:[`tools.${e}.action`],sources:[`override-advertised`,`runtime-tools`]}]),...o.check(s)];if(c.length)return{ok:!1,blockers:c};let l=o.generate(s),u=[...new Map(l.requirements.map(e=>[e.id,e])).values()],d={...l,requirements:u,name:v(a),language:o.language,languageLabel:o.label};d.files=[...l.files,..._(a,d)];let f=new Set;for(let e of d.files){if(f.has(e.path))throw Error(`Duplicate generated file: ${e.path}`);f.add(e.path)}for(let e of d.requirements)if(!f.has(e.file))throw Error(`Missing host integration file: ${e.file}`);return{ok:!0,project:d,blockers:[]}}var K=Uint8Array,q=Uint16Array,sn=Int32Array,cn=new K([0,0,0,0,0,0,0,0,1,1,1,1,2,2,2,2,3,3,3,3,4,4,4,4,5,5,5,5,0,0,0,0]),ln=new K([0,0,0,0,1,1,2,2,3,3,4,4,5,5,6,6,7,7,8,8,9,9,10,10,11,11,12,12,13,13,0,0]),un=new K([16,17,18,0,8,7,9,6,10,5,11,4,12,3,13,2,14,1,15]),dn=function(e,t){for(var n=new q(31),r=0;r<31;++r)n[r]=t+=1<<e[r-1];for(var i=new sn(n[30]),r=1;r<30;++r)for(var a=n[r];a<n[r+1];++a)i[a]=a-n[r]<<5|r;return{b:n,r:i}},fn=dn(cn,2),pn=fn.b,mn=fn.r;pn[28]=258,mn[258]=28;var hn=dn(ln,0);hn.b;for(var gn=hn.r,_n=new q(32768),J=0;J<32768;++J){var Y=(J&43690)>>1|(J&21845)<<1;Y=(Y&52428)>>2|(Y&13107)<<2,Y=(Y&61680)>>4|(Y&3855)<<4,_n[J]=((Y&65280)>>8|(Y&255)<<8)>>1}for(var vn=(function(e,t,n){for(var r=e.length,i=0,a=new q(t);i<r;++i)e[i]&&++a[e[i]-1];var o=new q(t);for(i=1;i<t;++i)o[i]=o[i-1]+a[i-1]<<1;var s;if(n){s=new q(1<<t);var c=15-t;for(i=0;i<r;++i)if(e[i])for(var l=i<<4|e[i],u=t-e[i],d=o[e[i]-1]++<<u,f=d|(1<<u)-1;d<=f;++d)s[_n[d]>>c]=l}else for(s=new q(r),i=0;i<r;++i)e[i]&&(s[i]=_n[o[e[i]-1]++]>>15-e[i]);return s}),X=new K(288),J=0;J<144;++J)X[J]=8;for(var J=144;J<256;++J)X[J]=9;for(var J=256;J<280;++J)X[J]=7;for(var J=280;J<288;++J)X[J]=8;for(var yn=new K(32),J=0;J<32;++J)yn[J]=5;var bn=vn(X,9,0),xn=vn(yn,5,0),Sn=function(e){return(e+7)/8|0},Cn=function(e,t,n){return(t==null||t<0)&&(t=0),(n==null||n>e.length)&&(n=e.length),new K(e.subarray(t,n))},wn=[`unexpected EOF`,`invalid block type`,`invalid length/literal`,`invalid distance`,`stream finished`,`no stream handler`,,`no callback`,`invalid UTF-8 data`,`extra field too long`,`date not in range 1980-2099`,`filename too long`,`stream finishing`,`invalid zip data`],Tn=function(e,t,n){var r=Error(t||wn[e]);if(r.code=e,Error.captureStackTrace&&Error.captureStackTrace(r,Tn),!n)throw r;return r},Z=function(e,t,n){n<<=t&7;var r=t/8|0;e[r]|=n,e[r+1]|=n>>8},En=function(e,t,n){n<<=t&7;var r=t/8|0;e[r]|=n,e[r+1]|=n>>8,e[r+2]|=n>>16},Dn=function(e,t){for(var n=[],r=0;r<e.length;++r)e[r]&&n.push({s:r,f:e[r]});var i=n.length,a=n.slice();if(!i)return{t:Pn,l:0};if(i==1){var o=new K(n[0].s+1);return o[n[0].s]=1,{t:o,l:1}}n.sort(function(e,t){return e.f-t.f}),n.push({s:-1,f:25001});var s=n[0],c=n[1],l=0,u=1,d=2;for(n[0]={s:-1,f:s.f+c.f,l:s,r:c};u!=i-1;)s=n[n[l].f<n[d].f?l++:d++],c=n[l!=u&&n[l].f<n[d].f?l++:d++],n[u++]={s:-1,f:s.f+c.f,l:s,r:c};for(var f=a[0].s,r=1;r<i;++r)a[r].s>f&&(f=a[r].s);var p=new q(f+1),m=On(n[u-1],p,0);if(m>t){var r=0,h=0,g=m-t,_=1<<g;for(a.sort(function(e,t){return p[t.s]-p[e.s]||e.f-t.f});r<i;++r){var v=a[r].s;if(p[v]>t)h+=_-(1<<m-p[v]),p[v]=t;else break}for(h>>=g;h>0;){var y=a[r].s;p[y]<t?h-=1<<t-p[y]++-1:++r}for(;r>=0&&h;--r){var b=a[r].s;p[b]==t&&(--p[b],++h)}m=t}return{t:new K(p),l:m}},On=function(e,t,n){return e.s==-1?Math.max(On(e.l,t,n+1),On(e.r,t,n+1)):t[e.s]=n},kn=function(e){for(var t=e.length;t&&!e[--t];);for(var n=new q(++t),r=0,i=e[0],a=1,o=function(e){n[r++]=e},s=1;s<=t;++s)if(e[s]==i&&s!=t)++a;else{if(!i&&a>2){for(;a>138;a-=138)o(32754);a>2&&(o(a>10?a-11<<5|28690:a-3<<5|12305),a=0)}else if(a>3){for(o(i),--a;a>6;a-=6)o(8304);a>2&&(o(a-3<<5|8208),a=0)}for(;a--;)o(i);a=1,i=e[s]}return{c:n.subarray(0,r),n:t}},An=function(e,t){for(var n=0,r=0;r<t.length;++r)n+=e[r]*t[r];return n},jn=function(e,t,n){var r=n.length,i=Sn(t+2);e[i]=r&255,e[i+1]=r>>8,e[i+2]=e[i]^255,e[i+3]=e[i+1]^255;for(var a=0;a<r;++a)e[i+a+4]=n[a];return(i+4+r)*8},Mn=function(e,t,n,r,i,a,o,s,c,l,u){Z(t,u++,n),++i[256];for(var d=Dn(i,15),f=d.t,p=d.l,m=Dn(a,15),h=m.t,g=m.l,_=kn(f),v=_.c,y=_.n,b=kn(h),x=b.c,S=b.n,C=new q(19),w=0;w<v.length;++w)++C[v[w]&31];for(var w=0;w<x.length;++w)++C[x[w]&31];for(var T=Dn(C,7),E=T.t,ee=T.l,D=19;D>4&&!E[un[D-1]];--D);var O=l+5<<3,k=An(i,X)+An(a,yn)+o,A=An(i,f)+An(a,h)+o+14+3*D+An(C,E)+2*C[16]+3*C[17]+7*C[18];if(c>=0&&O<=k&&O<=A)return jn(t,u,e.subarray(c,c+l));var j,M,N,P;if(Z(t,u,1+(A<k)),u+=2,A<k){j=vn(f,p,0),M=f,N=vn(h,g,0),P=h;var te=vn(E,ee,0);Z(t,u,y-257),Z(t,u+5,S-1),Z(t,u+10,D-4),u+=14;for(var w=0;w<D;++w)Z(t,u+3*w,E[un[w]]);u+=3*D;for(var F=[v,x],ne=0;ne<2;++ne)for(var re=F[ne],w=0;w<re.length;++w){var I=re[w]&31;Z(t,u,te[I]),u+=E[I],I>15&&(Z(t,u,re[w]>>5&127),u+=re[w]>>12)}}else j=bn,M=X,N=xn,P=yn;for(var w=0;w<s;++w){var L=r[w];if(L>255){var I=L>>18&31;En(t,u,j[I+257]),u+=M[I+257],I>7&&(Z(t,u,L>>23&31),u+=cn[I]);var R=L&31;En(t,u,N[R]),u+=P[R],R>3&&(En(t,u,L>>5&8191),u+=ln[R])}else En(t,u,j[L]),u+=M[L]}return En(t,u,j[256]),u+M[256]},Nn=new sn([65540,131080,131088,131104,262176,1048704,1048832,2114560,2117632]),Pn=new K(0),Fn=function(e,t,n,r,i,a){var o=a.z||e.length,s=new K(r+o+5*(1+Math.ceil(o/7e3))+i),c=s.subarray(r,s.length-i),l=a.l,u=(a.r||0)&7;if(t){u&&(c[0]=a.r>>3);for(var d=Nn[t-1],f=d>>13,p=d&8191,m=(1<<n)-1,h=a.p||new q(32768),g=a.h||new q(m+1),_=Math.ceil(n/3),v=2*_,y=function(t){return(e[t]^e[t+1]<<_^e[t+2]<<v)&m},b=new sn(25e3),x=new q(288),S=new q(32),C=0,w=0,T=a.i||0,E=0,ee=a.w||0,D=0;T+2<o;++T){var O=y(T),k=T&32767,A=g[O];if(h[k]=A,g[O]=k,ee<=T){var j=o-T;if((C>7e3||E>24576)&&(j>423||!l)){u=Mn(e,c,0,b,x,S,w,E,D,T-D,u),E=C=w=0,D=T;for(var M=0;M<286;++M)x[M]=0;for(var M=0;M<30;++M)S[M]=0}var N=2,P=0,te=p,F=k-A&32767;if(j>2&&O==y(T-F))for(var ne=Math.min(f,j)-1,re=Math.min(32767,T),I=Math.min(258,j);F<=re&&--te&&k!=A;){if(e[T+N]==e[T+N-F]){for(var L=0;L<I&&e[T+L]==e[T+L-F];++L);if(L>N){if(N=L,P=F,L>ne)break;for(var R=Math.min(F,L-2),ie=0,M=0;M<R;++M){var ae=T-F+M&32767,oe=ae-h[ae]&32767;oe>ie&&(ie=oe,A=ae)}}}k=A,A=h[k],F+=k-A&32767}if(P){b[E++]=268435456|mn[N]<<18|gn[P];var se=mn[N]&31,z=gn[P]&31;w+=cn[se]+ln[z],++x[257+se],++S[z],ee=T+N,++C}else b[E++]=e[T],++x[e[T]]}}for(T=Math.max(T,ee);T<o;++T)b[E++]=e[T],++x[e[T]];u=Mn(e,c,l,b,x,S,w,E,D,T-D,u),l||(a.r=u&7|c[u/8|0]<<3,u-=7,a.h=g,a.p=h,a.i=T,a.w=ee)}else{for(var T=a.w||0;T<o+l;T+=65535){var B=T+65535;B>=o&&(c[u/8|0]=l,B=o),u=jn(c,u+1,e.subarray(T,B))}a.i=o}return Cn(s,0,r+Sn(u)+i)},In=(function(){for(var e=new Int32Array(256),t=0;t<256;++t){for(var n=t,r=9;--r;)n=(n&1&&-306674912)^n>>>1;e[t]=n}return e})(),Ln=function(){var e=-1;return{p:function(t){for(var n=e,r=0;r<t.length;++r)n=In[n&255^t[r]]^n>>>8;e=n},d:function(){return~e}}},Rn=function(e,t,n,r,i){if(!i&&(i={l:1},t.dictionary)){var a=t.dictionary.subarray(-32768),o=new K(a.length+e.length);o.set(a),o.set(e,a.length),e=o,i.w=a.length}return Fn(e,t.level==null?6:t.level,t.mem==null?i.l?Math.ceil(Math.max(8,Math.min(13,Math.log(e.length)))*1.5):20:12+t.mem,n,r,i)},zn=function(e,t){var n={};for(var r in e)n[r]=e[r];for(var r in t)n[r]=t[r];return n},Q=function(e,t,n){for(;n;++t)e[t]=n,n>>>=8};function Bn(e,t){return Rn(e,t||{},0,0)}var Vn=function(e,t,n,r){for(var i in e){var a=e[i],o=t+i,s=r;Array.isArray(a)&&(s=zn(r,a[1]),a=a[0]),ArrayBuffer.isView(a)?n[o]=[a,s]:(n[o+=`/`]=[new K(0),s],Vn(a,o,n,r))}},Hn=typeof TextEncoder<`u`&&new TextEncoder,Un=typeof TextDecoder<`u`&&new TextDecoder;try{Un.decode(Pn,{stream:!0})}catch{}function Wn(e,t){if(t){for(var n=new K(e.length),r=0;r<e.length;++r)n[r]=e.charCodeAt(r);return n}if(Hn)return Hn.encode(e);for(var i=e.length,a=new K(e.length+(e.length>>1)),o=0,s=function(e){a[o++]=e},r=0;r<i;++r){if(o+5>a.length){var c=new K(o+8+(i-r<<1));c.set(a),a=c}var l=e.charCodeAt(r);l<128||t?s(l):l<2048?(s(192|l>>6),s(128|l&63)):l>55295&&l<57344?(l=65536+(l&1047552)|e.charCodeAt(++r)&1023,s(240|l>>18),s(128|l>>12&63),s(128|l>>6&63),s(128|l&63)):(s(224|l>>12),s(128|l>>6&63),s(128|l&63))}return Cn(a,0,o)}var Gn=function(e){var t=0;if(e)for(var n in e){var r=e[n].length;r>65535&&Tn(9),t+=r+4}return t},Kn=function(e,t,n,r,i,a,o,s){var c=r.length,l=n.extra,u=s&&s.length,d=Gn(l);Q(e,t,o==null?67324752:33639248),t+=4,o!=null&&(e[t++]=20,e[t++]=n.os),e[t]=20,t+=2,e[t++]=n.flag<<1|(a<0&&8),e[t++]=i&&8,e[t++]=n.compression&255,e[t++]=n.compression>>8;var f=new Date(n.mtime==null?Date.now():n.mtime),p=f.getFullYear()-1980;if((p<0||p>119)&&Tn(10),Q(e,t,p<<25|f.getMonth()+1<<21|f.getDate()<<16|f.getHours()<<11|f.getMinutes()<<5|f.getSeconds()>>1),t+=4,a!=-1&&(Q(e,t,n.crc),Q(e,t+4,a<0?-a-2:a),Q(e,t+8,n.size)),Q(e,t+12,c),Q(e,t+14,d),t+=16,o!=null&&(Q(e,t,u),Q(e,t+6,n.attrs),Q(e,t+10,o),t+=14),e.set(r,t),t+=c,d)for(var m in l){var h=l[m],g=h.length;Q(e,t,+m),Q(e,t+2,g),e.set(h,t+4),t+=4+g}return u&&(e.set(s,t),t+=u),t},qn=function(e,t,n,r,i){Q(e,t,101010256),Q(e,t+8,n),Q(e,t+10,n),Q(e,t+12,r),Q(e,t+16,i)};function Jn(e,t){t||={};var n={},r=[];Vn(e,``,n,t);var i=0,a=0;for(var o in n){var s=n[o],c=s[0],l=s[1],u=l.level==0?0:8,d=Wn(o),f=d.length,p=l.comment,m=p&&Wn(p),h=m&&m.length,g=Gn(l.extra);f>65535&&Tn(11);var _=u?Bn(c,l):c,v=_.length,y=Ln();y.p(c),r.push(zn(l,{size:c.length,crc:y.d(),c:_,f:d,m,u:f!=o.length||m&&p.length!=h,o:i,compression:u})),i+=30+f+g+v,a+=76+2*(f+g)+(h||0)+v}for(var b=new K(a+22),x=i,S=a-i,C=0;C<r.length;++C){var d=r[C];Kn(b,d.o,d,d.f,d.u,d.c.length);var w=30+d.f.length+Gn(d.extra);b.set(d.c,d.o+w),Kn(b,i,d,d.f,d.u,d.c.length,d.o,d.m),i+=16+w+(d.m?d.m.length:0)}return qn(b,i,r.length,S,x),b}function Yn(e){let t={};for(let n of e.files){if(!n.path||n.path.startsWith(`/`)||n.path.includes(`\\`)||n.path.split(`/`).some(e=>e===`..`||e===`.`))throw Error(`Unsafe bootstrap file path: ${n.path}`);let r=`${e.name}/${n.path}`;if(Object.hasOwn(t,r))throw Error(`Duplicate bootstrap path: ${n.path}`);t[r]=Wn(n.content)}return new Uint8Array(Jn(t,{level:6}))}var $=n();function Xn(e){let t=[];for(let n of e){let e=n.path.split(`/`),r=t;for(let[t,i]of e.entries()){let a=e.slice(0,t+1).join(`/`);if(t===e.length-1)r.push({kind:`file`,name:i,path:n.path});else{let e=r.find(e=>e.kind===`directory`&&e.path===a);e||(e={kind:`directory`,name:i,path:a,children:[]},r.push(e)),e.kind===`directory`&&(r=e.children)}}}return t}function Zn({files:e,selected:t,onSelect:n}){return(0,$.jsxs)(`nav`,{className:`hb-project-files`,"aria-label":`Bootstrap project files`,children:[(0,$.jsx)(`p`,{className:`hb-small-label`,children:`Project files`}),(0,$.jsx)(Qn,{nodes:Xn(e),selected:t,onSelect:n})]})}function Qn({nodes:e,selected:t,onSelect:n}){return(0,$.jsx)(`ul`,{className:`hb-file-tree`,children:e.map(e=>(0,$.jsx)(`li`,{children:e.kind===`directory`?(0,$.jsxs)(`details`,{open:!0,children:[(0,$.jsxs)(`summary`,{children:[(0,$.jsx)(ye,{size:14,"aria-hidden":`true`}),(0,$.jsx)(`span`,{children:e.name})]}),(0,$.jsx)(Qn,{nodes:e.children,selected:t,onSelect:n})]}):(0,$.jsxs)(`button`,{className:`hb-file-tree-button${e.path===t?` hb-file-tree-selected`:``}`,"aria-current":e.path===t?`true`:void 0,"aria-label":`Preview ${e.path}`,title:e.path,onClick:()=>n(e.path),children:[(0,$.jsx)(M,{size:14,"aria-hidden":`true`}),(0,$.jsx)(`span`,{children:e.name})]})},e.path))})}function $n({text:e,label:t}){let[n,r]=(0,V.useState)(null),i=n?.text===e?n:null;async function a(){r(null);try{if(!navigator.clipboard?.writeText)throw Error(`Clipboard access is unavailable in this browser.`);await navigator.clipboard.writeText(e),r({text:e,error:null})}catch(t){r({text:e,error:t instanceof Error?t.message:String(t)})}}return(0,$.jsxs)(`div`,{className:`hb-copy-control`,children:[(0,$.jsxs)(u,{size:`small`,disabled:!e,"aria-label":`Copy ${t}`,onClick:()=>{a()},children:[i&&!i.error?(0,$.jsx)(ce,{size:14,"aria-hidden":`true`}):(0,$.jsx)(x,{size:14,"aria-hidden":`true`}),i&&!i.error?`Copied`:`Copy`]}),i?.error&&(0,$.jsxs)(`p`,{role:`alert`,className:`hb-field-error`,children:[`Could not copy: `,i.error,` Select and copy the readable text instead.`]}),i&&!i.error&&(0,$.jsxs)(`span`,{className:`hb-sr-only`,role:`status`,children:[`Copied `,t,`.`]})]})}var er={environment:O,"host-code":P,runtime:D,review:j},tr={environment:`Environment`,"host-code":`Host code`,runtime:`Runtime`,review:`Review`};function nr(e){return e.find(e=>/(^|\/)readme(?:\.[^/]+)?$/i.test(e.path))??e[0]}function rr(e){return e.map(e=>e.replace(/\b[a-f0-9]{40}\b/gi,`the pinned SDK revision`))}function ir({project:e}){let[t,n]=(0,V.useState)(`files`),[r,i]=(0,V.useState)(()=>nr(e.files)?.path??``),[a,o]=(0,V.useState)(null),s=(0,V.useRef)(null),c=(0,V.useRef)(null),l=(0,V.useId)(),d=(0,V.useId)(),p=(0,V.useId)(),[h,g]=(0,V.useState)(!1),_=e.files.find(e=>e.path===r)??nr(e.files),v=a?.project===e?a:null,y=rr(e.notes);function b(e){i(e),n(`files`),window.requestAnimationFrame(()=>s.current?.focus())}function x(){n(`requirements`),window.requestAnimationFrame(()=>c.current?.focus())}function S(){o(null);try{let t=Yn(e);E(new Blob([t],{type:`application/zip`}),`${e.name}.zip`),o({project:e,error:!1,message:`ZIP download requested: ${e.name}.zip`})}catch(t){o({project:e,error:!0,message:`Could not export the bootstrap ZIP: ${t instanceof Error?t.message:String(t)}`})}}return(0,$.jsxs)(`section`,{className:`hb-panel hb-project-panel`,"aria-labelledby":d,children:[(0,$.jsxs)(`div`,{className:`hb-panel-heading hb-disclosure-heading`,children:[(0,$.jsxs)(`button`,{type:`button`,className:`hb-disclosure-toggle`,"aria-expanded":h,"aria-controls":p,onClick:()=>g(e=>!e),children:[(0,$.jsx)(ue,{size:16,"aria-hidden":`true`}),(0,$.jsx)(F,{size:18,"aria-hidden":`true`,className:`hb-disclosure-icon`}),(0,$.jsxs)(`div`,{children:[(0,$.jsxs)(`h3`,{id:d,children:[e.languageLabel,` project`]}),(0,$.jsxs)(`p`,{children:[e.files.length,` files · `,e.requirements.length,` host requirements`]})]})]}),(0,$.jsxs)(u,{variant:`primary`,disabled:!_,onClick:S,children:[(0,$.jsx)(ne,{size:15,"aria-hidden":`true`}),`Download ZIP`]})]}),v&&(0,$.jsx)(`div`,{className:`hb-export-feedback${v.error?` hb-export-feedback-error`:``}`,role:v.error?`alert`:`status`,children:v.message}),(0,$.jsxs)(`div`,{id:p,className:`hb-disclosure-body`,hidden:!h,children:[_&&(0,$.jsx)(m,{title:`Scaffold files, not a finished integration`,tone:`accent`,children:`Host integrations can contain explicit failing TODOs. Supply environment values and implement the required handlers before running a workload; do not replace them with success-shaped no-ops.`}),(0,$.jsxs)(`div`,{className:`hb-project-summary`,children:[(0,$.jsxs)(`span`,{children:[(0,$.jsx)(F,{size:16,"aria-hidden":`true`}),(0,$.jsx)(`code`,{children:e.name})]}),(0,$.jsxs)(f,{children:[e.files.length,` files`]}),(0,$.jsxs)(f,{children:[e.requirements.length,` host requirements`]})]}),_?(0,$.jsxs)(me,{value:t,onValueChange:e=>{(e===`files`||e===`commands`||e===`requirements`)&&n(e)},children:[(0,$.jsxs)(pe,{className:`hb-tabs-list hb-project-tabs`,"aria-label":`Bootstrap project views`,children:[(0,$.jsxs)(fe,{className:`hb-tab`,value:`files`,children:[(0,$.jsx)(M,{size:15,"aria-hidden":`true`}),`Project files`]}),(0,$.jsxs)(fe,{className:`hb-tab`,value:`commands`,children:[(0,$.jsx)(k,{size:15,"aria-hidden":`true`}),`Install & run`]}),(0,$.jsxs)(fe,{className:`hb-tab`,value:`requirements`,children:[(0,$.jsx)(xe,{size:15,"aria-hidden":`true`}),`Host integration`]})]}),(0,$.jsxs)(he,{className:`hb-tab-content`,value:`files`,children:[(0,$.jsxs)(`div`,{className:`hb-file-workbench`,children:[(0,$.jsx)(Zn,{files:e.files,selected:_.path,onSelect:b}),(0,$.jsxs)(`section`,{className:`hb-project-file`,"aria-label":`Selected bootstrap file`,children:[(0,$.jsxs)(`div`,{className:`hb-project-file-toolbar`,children:[(0,$.jsxs)(`div`,{children:[(0,$.jsx)(`h4`,{ref:s,tabIndex:-1,children:_.path}),(0,$.jsx)(f,{children:_.language})]}),(0,$.jsx)($n,{text:_.content,label:_.path})]}),(0,$.jsxs)(`label`,{htmlFor:l,className:`hb-sr-only`,children:[`Contents of `,_.path]}),(0,$.jsx)(`textarea`,{id:l,className:`hb-project-file-preview${_.language===`markdown`?` hb-project-readme`:``}`,value:_.content,readOnly:!0,spellCheck:!1,wrap:_.language===`markdown`?`soft`:`off`})]})]}),(0,$.jsx)(`p`,{className:`hb-field-hint`,children:`These are the exact files included in the ZIP. The preview never evaluates or executes their contents.`})]}),(0,$.jsx)(he,{className:`hb-tab-content`,value:`commands`,children:(0,$.jsx)(ar,{commands:e.commands,onHostIntegration:x})}),(0,$.jsxs)(he,{ref:c,className:`hb-tab-content`,value:`requirements`,children:[(0,$.jsx)(m,{title:`Required integration checklist`,children:`These are implementation obligations, not completed checks. Follow each requirement to the generated file it describes. Environment entries are names only; the browser never requests their secret values.`}),(0,$.jsx)(`ul`,{className:`hb-requirement-list`,children:e.requirements.map(t=>(0,$.jsx)(sr,{requirement:t,hasFile:e.files.some(e=>e.path===t.file),onSelectFile:b},t.id))}),e.requirements.length===0&&(0,$.jsx)(`p`,{className:`hb-muted-copy`,children:`No additional requirements were returned by this adapter. Review the README and preflight; this is not a claim of production readiness.`})]})]}):(0,$.jsx)(m,{title:`The adapter returned no project files`,tone:`error`,children:`A complete bootstrap cannot be exported until the language adapter supplies its files.`}),(0,$.jsxs)(`details`,{className:`hb-project-notes`,children:[(0,$.jsxs)(`summary`,{children:[(0,$.jsx)(se,{size:16,"aria-hidden":`true`}),`Version & native packaging notes`]}),(0,$.jsxs)(`div`,{className:`hb-editor-stack`,children:[(0,$.jsx)(`ul`,{className:`hb-project-note-list`,children:y.map((e,t)=>(0,$.jsx)(`li`,{children:e},t))}),(0,$.jsx)(`p`,{className:`hb-field-hint`,children:`Use the adapter's dependency and native-package notes for version compatibility.`})]})]})]})]})}function ar({commands:e,onHostIntegration:t}){return(0,$.jsxs)(`div`,{className:`hb-editor-stack`,children:[(0,$.jsx)(m,{title:`Run these in your host, not in this app`,children:`Download and extract the ZIP, then work from its project directory. Installation downloads dependencies; the final run can make real model requests and execute effects permitted by your host policy. All commands below are display-and-copy only.`}),(0,$.jsx)(or,{title:`1. Install dependencies`,description:`Use the selected language's package tooling in the extracted project.`,command:e.install.join(`
`),label:`dependency installation commands`}),(0,$.jsxs)(`div`,{className:`hb-host-integration-step`,children:[(0,$.jsxs)(`div`,{children:[(0,$.jsx)(`h4`,{children:`2. Supply environment values and host implementations`}),(0,$.jsx)(`p`,{children:`The environment reference is not automatically loaded. Complete the explicit host TODOs before the local preflight and workload.`})]}),(0,$.jsxs)(u,{size:`small`,onClick:t,children:[`Review host integration`,(0,$.jsx)(g,{size:14,"aria-hidden":`true`})]})]}),(0,$.jsx)(or,{title:`3. Check the bootstrap locally`,description:`Preflight is not an agent turn. Resolve missing environment, packaging, and host integration messages first.`,command:e.check,label:`local preflight command`}),e.startRuntime&&(0,$.jsx)(or,{title:`4. Start the separately operated runtime`,description:`Run this on the server host, separately from the application. Secure non-loopback exposure and keep service lifecycle ownership explicit.`,command:e.startRuntime,label:`runtime service start command`}),(0,$.jsx)(or,{title:`${e.startRuntime?`5`:`4`}. Run an agent turn`,description:`Only after host integration and preflight. This command can make model calls; copying it does not run it.`,command:e.run,label:`agent run command`})]})}function or({title:e,description:t,command:n,label:r}){return(0,$.jsxs)(`section`,{className:`hb-command-card`,children:[(0,$.jsxs)(`div`,{className:`hb-command-heading`,children:[(0,$.jsxs)(`div`,{children:[(0,$.jsx)(`h4`,{children:e}),(0,$.jsx)(`p`,{children:t})]}),(0,$.jsx)($n,{text:n,label:r})]}),n?(0,$.jsx)(`pre`,{className:`hb-command-code`,tabIndex:0,"aria-label":r,children:(0,$.jsx)(`code`,{children:n})}):(0,$.jsxs)(m,{tone:`error`,title:`Command unavailable`,children:[`The adapter did not provide `,r,`. Review this adapter before using the project.`]})]})}function sr({requirement:e,hasFile:t,onSelectFile:n}){let r=er[e.kind];return(0,$.jsxs)(`li`,{className:`hb-requirement`,children:[(0,$.jsx)(`span`,{className:`hb-requirement-icon`,children:(0,$.jsx)(r,{size:18,"aria-hidden":`true`})}),(0,$.jsxs)(`div`,{children:[(0,$.jsx)(f,{children:tr[e.kind]}),(0,$.jsx)(`h4`,{children:e.title}),(0,$.jsx)(`p`,{children:e.detail}),(0,$.jsxs)(u,{variant:`ghost`,size:`small`,disabled:!t,onClick:()=>n(e.file),children:[`Open `,(0,$.jsx)(`code`,{children:e.file}),(0,$.jsx)(g,{size:13,"aria-hidden":`true`})]}),!t&&(0,$.jsxs)(`p`,{className:`hb-field-error`,children:[`The adapter references a file that is not present: `,e.file,`.`]})]})]})}var cr={managed:k,external:_e,inprocess:I};function lr({plan:e,edit:t,issues:n,onEvidence:r,onNavigate:o,blocked:l}){let u=(0,V.useId)(),d=(0,V.useMemo)(()=>{if(l)return{state:`recovery`};try{return{state:`result`,result:on(e)}}catch(e){return{state:`error`,message:e instanceof Error?e.message:String(e)}}},[e,l]),h=p.find(t=>t.id===e.target.runtime);return(0,$.jsxs)(`div`,{className:`hb-editor-stack hb-bootstrap-editor`,children:[(0,$.jsx)(i,{title:`Choose the SDK language`,description:`Language and runtime deployment are independent of your behavior profile. Unsupported combinations are reported below, never silently rewritten.`,action:(0,$.jsxs)(f,{children:[a.length,` SDKs`]}),children:(0,$.jsx)(`div`,{className:`hb-language-picker`,children:(0,$.jsx)(s,{label:`Bootstrap language`,help:(0,$.jsx)(R,{help:de.language,value:e.target.language}),value:e.target.language,options:a.map(e=>({value:e.id,label:e.label})),onValueChange:e=>t(t=>{t.target.language=e}),error:le(n,`target.language`)})})}),(0,$.jsxs)(i,{title:`Where should the runtime live?`,action:(0,$.jsx)(R,{help:de.runtime,value:e.target.runtime}),description:`Choose a process boundary, transport, and lifecycle owner. None of these choices creates a sandbox.`,children:[(0,$.jsxs)(`fieldset`,{className:`hb-runtime-options`,children:[(0,$.jsx)(`legend`,{children:`Runtime placement`}),(0,$.jsx)(`div`,{className:`hb-runtime-option-grid`,children:p.map(n=>{let r=cr[n.id];return(0,$.jsxs)(`label`,{className:`hb-runtime-option`,children:[(0,$.jsx)(`input`,{type:`radio`,className:`hb-sr-only`,name:u,value:n.id,checked:e.target.runtime===n.id,"aria-label":n.title,onChange:()=>t(e=>{e.target.runtime=n.id})}),(0,$.jsxs)(`span`,{className:`hb-runtime-option-body`,children:[(0,$.jsxs)(`span`,{className:`hb-runtime-option-top`,children:[(0,$.jsx)(r,{size:22,"aria-hidden":`true`}),(0,$.jsx)(f,{children:n.tag})]}),(0,$.jsx)(`strong`,{children:n.title}),(0,$.jsx)(ae,{runtime:n.id}),(0,$.jsx)(`span`,{className:`hb-runtime-option-description`,children:n.description}),(0,$.jsx)(`span`,{className:`hb-runtime-option-setup`,children:n.setupPath}),(0,$.jsx)(`span`,{className:`hb-runtime-option-channel`,children:n.channel})]})]},n.id)})})]}),h&&(0,$.jsx)(m,{title:e.target.runtime===`inprocess`?`Native packaging is an explicit dependency`:`Ownership matters`,children:h.note}),e.target.runtime===`managed`&&(0,$.jsx)(c,{label:`Managed runtime executable (optional)`,help:(0,$.jsx)(R,{help:de.runtimePath}),value:e.target.cliPath,monospace:!0,maxLength:1e3,placeholder:`Use the SDK's default runtime distribution`,onValueChange:e=>t(t=>{t.target.cliPath=e}),error:le(n,`target.cliPath`),hint:`cliPath overrides the SDK-owned child executable only. This is a future-host path; the browser never reads or starts it.`}),e.target.runtime===`external`&&(0,$.jsx)(c,{label:`Existing runtime endpoint`,help:(0,$.jsx)(R,{help:de.runtimeEndpoint}),value:e.target.serverUrl,monospace:!0,maxLength:1500,autoComplete:`off`,spellCheck:!1,placeholder:`127.0.0.1:4321`,onValueChange:e=>t(t=>{t.target.serverUrl=e}),error:le(n,`target.serverUrl`),hint:`Use host:port or tcp://host:port, without credentials. This is a runtime TCP service, not a model or MCP endpoint.`}),e.target.runtime===`inprocess`&&(0,$.jsxs)(`p`,{className:`hb-field-hint`,children:[`Supply the matching native bundle and the language's native opt-in in the host. Where supported, `,(0,$.jsx)(`code`,{children:`COPILOT_CLI_PATH`}),` participates in native discovery before the first client. There is no per-client `,(0,$.jsx)(`code`,{children:`nativePath`}),` option in this planner.`]}),e.target.runtime!==`managed`&&e.target.cliPath.trim()||e.target.runtime!==`external`&&e.target.serverUrl.trim()?(0,$.jsxs)(`div`,{className:`hb-inactive-target`,role:`note`,children:[(0,$.jsx)(`strong`,{children:`Inactive settings are retained, not applied.`}),e.target.runtime!==`managed`&&e.target.cliPath.trim()&&(0,$.jsxs)(`p`,{children:[`The managed-child `,(0,$.jsx)(`code`,{children:`cliPath`}),` is kept for switching back. It does not select this`,` `,e.target.runtime===`inprocess`?`native library`:`external service`,`.`]}),e.target.runtime!==`external`&&e.target.serverUrl.trim()&&(0,$.jsx)(`p`,{children:`The existing-service endpoint is kept for external mode; no TCP connection is made in this selection.`})]}):null,(0,$.jsxs)(`div`,{className:`hb-setup-docs`,role:`note`,children:[(0,$.jsx)(`p`,{className:`hb-small-label`,children:`Matching SDK setup guides`}),(0,$.jsx)(`ul`,{className:`hb-setup-docs-links`,children:te(`bootstrap`)?.links.map(e=>(0,$.jsxs)(`li`,{children:[(0,$.jsxs)(`a`,{href:e.url,target:`_blank`,rel:`noopener noreferrer`,children:[e.label,(0,$.jsx)(re,{size:12,"aria-hidden":`true`}),(0,$.jsx)(`span`,{className:`hb-sr-only`,children:` (opens SDK docs in a new tab)`})]}),(0,$.jsxs)(`span`,{children:[` — `,e.note]})]},e.url))})]})]}),d.state===`recovery`&&(0,$.jsx)(m,{title:`Recover the saved draft first`,tone:`error`,children:`Use the explicit recovery or import controls above before generating a project. No project is generated from the recovery preview.`}),d.state===`error`&&(0,$.jsxs)(m,{title:`Bootstrap generation failed`,tone:`error`,children:[(0,$.jsx)(`p`,{className:`hb-preserve-lines`,children:d.message}),(0,$.jsx)(`p`,{children:`No substitute project was produced. Your configuration is unchanged; this adapter error must be resolved before exporting a bootstrap.`})]}),d.state===`result`&&(d.result.ok?(0,$.jsx)(ir,{project:d.result.project},`${e.target.language}-${e.target.runtime}`):(0,$.jsxs)(i,{title:`Resolve these choices before scaffolding`,description:`No incomplete project is exported and no plan settings are dropped to make generation succeed.`,action:(0,$.jsxs)(f,{children:[d.result.blockers.length,` blockers`]}),children:[d.result.blockers.length===0&&(0,$.jsx)(m,{tone:`error`,title:`No bootstrap project was returned`,children:`The adapter returned neither a project nor an explanation. Generation must be corrected before a ZIP can be exported.`}),(0,$.jsx)(`div`,{className:`hb-bootstrap-blockers`,children:d.result.blockers.map((i,a)=>(0,$.jsx)(ur,{blocker:i,plan:e,edit:t,issues:n,onEvidence:r,onNavigate:o},`${i.id}-${a}`))})]})),(0,$.jsxs)(`div`,{className:`hb-bootstrap-local-note`,children:[(0,$.jsx)(F,{size:16,"aria-hidden":`true`}),(0,$.jsx)(`p`,{children:`Generation and ZIP creation stay in this browser. Installing and running the exported project are explicit actions in your own host.`})]})]})}function ur({blocker:e,plan:t,edit:n,onEvidence:r,onNavigate:i}){let a=t.target.language===`java`&&t.session.storage===`virtual`&&e.fields.includes(`session.storage`);return(0,$.jsxs)(`article`,{className:`hb-bootstrap-blocker`,children:[(0,$.jsxs)(`div`,{className:`hb-bootstrap-blocker-heading`,children:[(0,$.jsx)(ie,{size:18,"aria-hidden":`true`}),(0,$.jsx)(`h4`,{children:e.title})]}),(0,$.jsx)(`p`,{children:e.detail}),(0,$.jsxs)(`div`,{className:`hb-blocker-actions`,children:[Array.from(new Set(e.fields)).map(e=>(0,$.jsxs)(u,{size:`small`,onClick:()=>i(oe(e)),children:[`Edit `,(0,$.jsx)(`code`,{children:e}),(0,$.jsx)(L,{size:13,"aria-hidden":`true`})]},e)),e.sources.length>0&&(0,$.jsxs)(u,{variant:`ghost`,size:`small`,onClick:()=>r({kind:`topic`,title:e.title,detail:e.detail,sources:e.sources}),children:[(0,$.jsx)(se,{size:14,"aria-hidden":`true`}),`Review details`]})]}),a&&(0,$.jsxs)(`div`,{className:`hb-explicit-remediation`,children:[(0,$.jsxs)(`p`,{children:[(0,$.jsx)(`strong`,{children:`Explicit alternative:`}),` use a local session state directory in the future host. This changes storage semantics; it does not implement a virtual provider.`]}),(0,$.jsxs)(u,{size:`small`,onClick:()=>n(e=>{e.session.storage=`local`,e.session.baseDirectory.trim()||(e.session.baseDirectory=N(e.preset).session.baseDirectory)}),children:[`Use local session storage`,(0,$.jsx)(L,{size:13,"aria-hidden":`true`})]})]})]})}export{lr as BootstrapEditor};