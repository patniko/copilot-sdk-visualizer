<!-- Copyright (c) Microsoft Corporation. All rights reserved. -->

# Copilot Harness Builder

A standalone, local-first web application for designing a harness on the GitHub Copilot runtime.

This repository is independent of the runtime and language SDK repositories. It does not start agents, call model services, or execute tools. It helps an engineer understand configuration decisions and produces plans and SDK integration sketches.

For the motivation, original design feedback, architectural intent, and a continuation checklist, read [Project context and intent](docs/project-context.md).

## The layers: engine, harness, SDK, host

One shared runtime engine can power many agents. A **harness** is the configuration on top of it. This tool helps you compose that harness and hand your host a project that runs it.

| Layer                     | Responsibility                                                                           | Who owns it     |
| ------------------------- | ---------------------------------------------------------------------------------------- | --------------- |
| **Runtime engine**        | Session lifecycle, the model/tool loop, context processing, provider adaptation, events. | Shared — reused |
| **Harness configuration** | Prompt, tool inventory and implementations, context, agents, methods, evaluation.        | You compose     |
| **SDK / integration**     | A language-native client that carries config, binds host callbacks, delivers events.     | You wire        |
| **Application / host**    | Product UX, identity, tenant authorization, deployment isolation, effectful services.    | You own         |

Selecting a capability here is not the same as enabling every prerequisite or granting authority. Runtime capability, model, platform, and experiment gates still determine actual availability.

## Build a harness in seven steps

1. Understand the four layers above — you keep the engine and compose the harness.
2. Start from the **Empty**, **Minimal**, or **Copilot** profile, then change actual configuration.
3. See what each choice exposes, replaces, requires, and cannot guarantee.
4. Open **Build & run** and choose runtime placement and SDK language.
5. Resolve any compatibility blockers, then download the complete bootstrap ZIP.
6. Install the SDK dependencies, implement the host extension points, and run local preflight.
7. Run an agent turn in your own host — the only step that makes real model requests.

The builder itself never runs that agent. Each step maps to an official SDK guide; see [Map to the GitHub Copilot SDK docs](#map-to-the-github-copilot-sdk-docs).

## Quickstart (run the builder locally)

Use Node.js 22.12 or newer and pnpm 11.19 (pinned in `package.json`).

```bash
pnpm install
pnpm dev
```

Vite binds to `127.0.0.1` only. Open the **Overview** tab and read the "Start here" guide, then follow the seven steps. For the full command set (format, lint, test, browser, and contract checks), see [Local development](#local-development).

## What the builder does

- Start from empty, minimal, or coding-oriented presets, then change actual configuration decisions.
- Keep, replace, or remove primary built-in tools; declare custom tools and explicit HTTP MCP integrations.
- Compose prompt sections, context sources, custom agents, provider choices, policy hooks, session storage, and evaluation criteria.
- See the resulting execution ownership, required host bindings, and scenario-specific limitations.
- Save one draft in browser storage, undo/redo edits, and import/export the versioned planner format.
- Choose an SDK-managed child process, an existing TCP runtime service, or experimental in-process hosting.
- Generate language-specific bootstrap projects with dependency setup, an entrypoint, host extension points, local preflight, and run instructions.
- Keep the TypeScript integration sketch and reversible planner JSON available as smaller exports.
- Explore a materialized SDK control catalog, six scenario gaps, built-in prompt references, and commit-pinned evidence.

The reference catalog documents additional SDK controls that are not all editable in the builder.

## Map to the GitHub Copilot SDK docs

The builder is a planning aid; the [`github/copilot-sdk` docs](https://github.com/github/copilot-sdk/tree/main/docs) are where you implement. The **Learn / reference → Map to SDK docs** tab cross-links every builder step to its guide. Highlights:

| Builder step      | Read in the SDK docs                                                                                                                                                                                                                                                                                 |
| ----------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Overview / start  | [Getting started](https://github.com/github/copilot-sdk/blob/main/docs/getting-started.md), [The agent loop](https://github.com/github/copilot-sdk/blob/main/docs/features/agent-loop.md)                                                                                                            |
| Tools             | [MCP servers](https://github.com/github/copilot-sdk/blob/main/docs/features/mcp.md), [Plugin directories](https://github.com/github/copilot-sdk/blob/main/docs/features/plugin-directories.md)                                                                                                       |
| Context & packs   | [Skills](https://github.com/github/copilot-sdk/blob/main/docs/features/skills.md), [Image input](https://github.com/github/copilot-sdk/blob/main/docs/features/image-input.md)                                                                                                                       |
| Agents            | [Custom agents](https://github.com/github/copilot-sdk/blob/main/docs/features/custom-agents.md), [Fleet mode](https://github.com/github/copilot-sdk/blob/main/docs/features/fleet-mode.md)                                                                                                           |
| Models & identity | [Authentication](https://github.com/github/copilot-sdk/blob/main/docs/auth/README.md), [Usage & billing](https://github.com/github/copilot-sdk/blob/main/docs/features/usage-and-billing.md)                                                                                                         |
| Policy & state    | [Hooks](https://github.com/github/copilot-sdk/blob/main/docs/features/hooks.md), [Session limits](https://github.com/github/copilot-sdk/blob/main/docs/features/session-limits.md), [Session persistence](https://github.com/github/copilot-sdk/blob/main/docs/features/session-persistence.md)      |
| Build & run       | [Choosing a setup path](https://github.com/github/copilot-sdk/blob/main/docs/setup/choosing-a-setup-path.md), [Bundled CLI](https://github.com/github/copilot-sdk/blob/main/docs/setup/bundled-cli.md), [Multi-tenancy](https://github.com/github/copilot-sdk/blob/main/docs/setup/multi-tenancy.md) |

These links track the SDK's living documentation. The in-app **reference catalog** stays commit-pinned to the recorded snapshot; the docs map is a separate reading aid.

## From configuration to a running agent

1. Configure behavior, tools, context, policies, identity, and session state.
2. Open **Build & run** and choose the runtime placement and SDK language.
3. Resolve any compatibility blockers. Unsupported selections are not silently dropped—for example, the inspected Java SDK does not expose a virtual SessionFs provider.
4. Download the complete ZIP and start with its `README.md`, not an isolated code fragment.
5. Install the SDK dependencies and provide the listed environment values and host integrations.
6. Run the generated local preflight command. It checks prerequisites without starting a runtime or model.
7. Run an agent turn explicitly in your own host. That action can make real model requests and execute effects allowed by the host policy.

Runtime placement mirrors the SDK setup paths: a **managed child process** is the docs' default bundled/local CLI path, an **existing runtime service** is the backend-services path (apply the multi-tenancy guidance for concurrent users), and **in-process** hosting is experimental in every SDK.

The inspected SDK source is newer than a verified package-release mapping. Bootstrap setup therefore uses an exact SDK source revision rather than pretending development versions are installable from public package registries. Source setup is an explicit action in the generated project; the visualizer never fetches or executes that SDK.

An in-process runtime shares the application's address space, environment, and loaded native-library lifetime. A managed child gives a separate process boundary, not a sandbox. For an existing service, its operator—not the SDK client—owns server startup settings, authentication, networking, and shutdown.

## Complete built-in tool visibility

`src/content/tool-catalog.json` records **59 built-in descriptors** and **33 selection aliases** from the pinned runtime source. It includes registry factories, lookup-only/specialized descriptors, both shell families, leaf registrations, and fixed extension-management definitions. Dynamic MCP and third-party extension tools are separate.

Default status is deliberately qualified: six entries are enabled in the stated online/local/root/split-editing reference profile, 33 depend on capabilities/models/modes/policy, eight belong to platform-specific shell families, and 12 are internal or specialized. The reference is not a claim that every running CLI has only six tools, or that every compiled tool is on.

Keeping a tool in inherited coding mode means leaving the runtime's selection policy intact. It does not force every catalog member on. The UI distinguishes reference defaults, the current plan's choices, and override routes verified by this snapshot. `catalog_search` is explicitly reserved; unverified override choices are preserved as plan data but are not emitted as runnable bootstrap code.

Older nine-tool drafts migrate without broadening their effective inventory: new entries are removed for explicit inventories, or left to runtime defaults for inherited inventories. Existing choices are retained. The payload records the catalog revision so a malformed current catalog is not silently repaired.

## Built-in prompt references

The prompt editor includes twelve repository-backed section references. Literal defaults, fragments, model-dependent regions, and assembled groups are labeled separately; this is not a dump of a live session prompt.

Runtime-provided regions have readable labels and an explanation catalog covering their meaning, source, example, and conditions. The earlier braced reference labels are **not SDK macros** to paste into a prompt. Section previews preserve user-authored text and do not pretend to resolve runtime inputs or group/model-specific assembly.

To intentionally refresh the materialized prompt reference from a checkout, run:

```bash
node script/capture-prompt-reference.mjs /path/to/copilot-agent-runtime
```

Normal app use does not read that checkout.

## Local development

The [Quickstart](#quickstart-run-the-builder-locally) covers install and dev. The full check set:

```bash
pnpm format
pnpm lint
pnpm test
pnpm build
```

Browser checks build and serve the production assets on an ephemeral loopback port. They use an installed Google Chrome by default; `PLAYWRIGHT_CHANNEL` can select another installed Playwright browser channel.

```bash
pnpm test:browser
```

An optional check type-checks generated sketches against a separately supplied SDK source checkout. That checkout is **not** needed to build, run, or use this application:

```bash
COPILOT_SDK_SOURCE=/path/to/copilot-sdk/nodejs/src/index.ts pnpm test:contract
```

## Architecture

| Area                         | Responsibility                                                                      |
| ---------------------------- | ----------------------------------------------------------------------------------- |
| `src/domain/plan.ts`         | Versioned plan schema, bounded input validation, and stable tool/agent definitions. |
| `src/domain/presets.ts`      | Starting compositions, reversible scenario changes, and baseline differences.       |
| `src/domain/analysis.ts`     | Deterministic decisions and host requirements, not readiness/security scores.       |
| `src/domain/export.ts`       | Lossless plan export and source-backed SDK integration sketches.                    |
| `src/domain/store.ts`        | Event-driven draft persistence and bounded undo/redo history.                       |
| `src/hooks/useHarness.ts`    | React subscription to the draft store.                                              |
| `src/content/reference.json` | Independent, materialized research snapshot; no sibling-repository reads.           |
| `src/content/sdk-docs.ts`    | Cross-reference from each builder step to the living SDK documentation.             |
| `src/components/`            | Accessible workbench editors, source inspection, and export UI.                     |

The draft store writes only validated plans. Payload version 2 adds runtime/language targets; version 1 drafts migrate with their behavior preserved and TypeScript/managed-process defaults. The storage key stays stable. Invalid edits retain the last valid saved version. A corrupt or unsupported saved draft is not silently overwritten; recovery requires an explicit replacement or import. Drafts are local to the browser origin; concurrent tabs use last-save-wins storage rather than a collaborative synchronization protocol.

## Exports and host code

Plan JSON is this application's planner format, **not** serialized SDK `SessionConfig`. It includes design intent and evaluation notes as well as configuration.

The TypeScript export defines `createHarness(host)`. The host must supply real permission handlers, tool implementations, credential callbacks, model choices, event observers, and a session filesystem provider where selected. The caller must stop the returned client when finished. No no-op permission or storage implementation is generated.

Bootstrap projects add the runnable entrypoint, dependency manifest/setup, host module, configuration data, environment-name reference, and exact next steps. A generated scaffold is not a completed production integration: default policies deny effects, and selected custom tools, hooks, or virtual storage can remain explicit failing integration points until implemented.

Only environment-variable names and callback references are used for provider credentials. Do not put secrets in prompts, names, endpoint URLs, or imported plans: browser draft storage is not an encrypted secret vault.

## Evidence and maturity

The initial research snapshot is dated **September 13, 2026**, pinned to:

- Runtime: `efebfd34dfa68830b11f49302fd88d12950df2e4`
- SDK: `f45c46fd1812f8bed5b4cbc250f47177c83068f0`

“In source” does not mean shipped in every SDK version. The minimal preset is a proposed composition. The current SDK client default remains `copilot-cli`; selecting `empty` alone does not erase the whole inherited prompt or eliminate all filesystem use.

## Boundaries

- Harness presets choose defaults, not different runtime engines or capability tiers.
- An SDK client mode is not a runtime interaction mode.
- A configuration export cannot serialize host callbacks or supply tenant authorization.
- Source-backed capability information is pinned to the recorded SDK/runtime revisions, not a guarantee about every published SDK version.
- Future hosting can serve the static `dist/` output; deployment and remote repository creation are intentionally out of scope for local development.
