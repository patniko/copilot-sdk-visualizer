<!-- Copyright (c) Microsoft Corporation. All rights reserved. -->

# Copilot Harness Builder

A standalone, local-first web application for designing a harness on the GitHub Copilot runtime.

This repository is independent of the runtime and language SDK repositories. It does not start agents, call model services, or execute tools. It helps an engineer understand configuration decisions and produces plans and SDK integration sketches.

## Local development

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

## Boundaries

- Harness presets choose defaults, not different runtime engines or capability tiers.
- An SDK client mode is not a runtime interaction mode.
- A configuration export cannot serialize host callbacks or supply tenant authorization.
- Source-backed capability information is pinned to the recorded SDK/runtime revisions, not a guarantee about every published SDK version.
- Future hosting can serve the static `dist/` output; deployment and remote repository creation are intentionally out of scope for local development.
