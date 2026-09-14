<!-- Copyright (c) Microsoft Corporation. All rights reserved. -->

# Copilot Harness Builder

A standalone, local-first web application for designing a harness on the GitHub Copilot runtime.

This repository is independent of the runtime and language SDK repositories. It does not start agents, call model services, or execute tools. It helps an engineer understand configuration decisions and produces plans and SDK integration sketches.

## What the builder does

- Start from empty, minimal, or coding-oriented presets, then change actual configuration decisions.
- Keep, replace, or remove primary built-in tools; declare custom tools and explicit HTTP MCP integrations.
- Compose prompt sections, context sources, custom agents, provider choices, policy hooks, session storage, and evaluation criteria.
- See the resulting execution ownership, required host bindings, and scenario-specific limitations.
- Save one draft in browser storage, undo/redo edits, and import/export the versioned planner format.
- Export TypeScript integration sketches with explicit host callbacks and guarded credential references.
- Explore a materialized catalog of 52 SDK controls, six scenario gaps, and commit-pinned evidence.

The built-in picker is a curated primary set. In coding-default inventory mode, unlisted tools can remain inherited. The reference catalog documents additional SDK controls that are not yet editable in this first builder.

## Local development

Use Node.js 22.12 or newer and pnpm 11.19 (pinned in `package.json`).

```bash
pnpm install
pnpm dev
```

Vite binds to `127.0.0.1` only. The app is not deployed and this repository has no remote by default.

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
| `src/components/`            | Accessible workbench editors, source inspection, and export UI.                     |

The draft store writes only validated plans. Invalid edits retain the last valid saved version. A corrupt or unsupported saved draft is not silently overwritten; recovery requires an explicit replacement or import. Drafts are local to the browser origin; concurrent tabs use last-save-wins storage rather than a collaborative synchronization protocol.

## Exports and host code

Plan JSON is this application's planner format, **not** serialized SDK `SessionConfig`. It includes design intent and evaluation notes as well as configuration.

The TypeScript export defines `createHarness(host)`. The host must supply real permission handlers, tool implementations, credential callbacks, model choices, event observers, and a session filesystem provider where selected. The caller must stop the returned client when finished. No no-op permission or storage implementation is generated.

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
