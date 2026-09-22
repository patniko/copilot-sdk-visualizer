<!-- Copyright (c) Microsoft Corporation. All rights reserved. -->

# Project context and intent

**Status:** Active, local-first prototype. **Context recorded:** September 13, 2026.

This document preserves the product reasoning so future work does not depend on the original conversation. Use the [README](../README.md) for commands and implementation details, and `git status` / `git log` for the latest delivery state.

## What we are trying to accomplish

Help an engineer **understand, configure, and bootstrap their own harness on the GitHub Copilot runtime**.

The project began alongside a draft post titled _From CLI SDK to Runtime: Why the Harness Is the Next Battleground_. The central argument was that the shared runtime should be useful beyond a terminal coding agent. Teams should spend their effort on their own tools, context, methods, experience, and quality bar—not repeatedly rebuild the same session and model/tool execution plumbing.

Static architecture diagrams helped establish the layers, but were not enough to teach the decisions. The visualizer is the next step: a configuration workbench where changes have visible consequences, boundaries are explained, and the user leaves with a concrete project to integrate.

The intended user journey is:

1. Understand the engine/harness/experience distinction.
2. Choose a starting behavior profile and deliberately configure it.
3. See what the choices expose, replace, require, and cannot guarantee.
4. Choose where the runtime runs and which SDK language the host uses.
5. Download a complete bootstrap project with explicit host extension points.
6. Install dependencies, implement the missing host code, run local preflight, and then run an agent in the user's own environment.

The builder itself does not run that agent.

## The mental model to preserve

| Layer                             | Responsibility                                                                                                                |
| --------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| **Runtime engine**                | Shared session lifecycle, model/tool loop, context processing, provider adaptation, execution machinery, and events.          |
| **Harness configuration**         | Prompts, tool inventory and implementations, context sources, agents, methods, and evaluation criteria.                       |
| **SDK / integration boundary**    | Language-native clients, transport, typed configuration, callback binding, and event delivery.                                |
| **Application / host experience** | Product UX, business workflow, identity, tenant/resource authorization, deployment isolation, and application-owned services. |

**One engine can support many harnesses.** The SDK is how teams configure and operate that engine; it is not another competing harness implementation.

Teams can contribute at different levels. Publishing a useful plugin improves capability distribution. Improving a format adapter expands what the runtime can consume. Marketplace inclusion, format compatibility, session enablement, and authorization are separate decisions. Cowork and MOS were supplied as collaboration examples in the original discussion, not as independently verified guarantees about every released surface.

## The three starting profiles

These are compositions and comparison points, not capability tiers or a live-session mode switch.

| Profile     | Intended meaning                                                                                                                                                                                                                                       |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Empty**   | The host deliberately owns the prompt and explicitly opts into capabilities. The builder's profile does more than merely set the SDK's `empty` client option: it replaces inherited workload guidance and declares an explicit inventory.              |
| **Minimal** | A proposed small general-purpose starter: a concise prompt and reviewed session capabilities, without a project-workspace assumption. The current illustration selects `ask_user` and `task_complete`; this is not a shipped SDK mode named `minimal`. |
| **Copilot** | An opinionated coding-oriented baseline whose defaults can be kept, filtered, or replaced. Inherited inventory means leaving runtime selection intact—not forcing every compiled tool on.                                                              |

Model/provider choice, host policy, state storage, and event handling remain configurable across the profiles. Runtime placement and language are independent deployment choices and should survive behavior-preset changes.

The current inspected SDK defaults to `copilot-cli`, not `empty`. A process without a project checkout can still need session storage or temporary files. Neither empty mode, a subprocess, nor a virtual session filesystem establishes tenant or OS isolation.

## Feedback that shaped the product

The following requests are important context for future iterations:

- **Make extension points concrete.** “Tools are extensible” is too abstract. Show keep/override/remove/add and a real example: `view` can use an explicitly registered host handler instead of the native file-reading implementation.
- **Show the runtime independently of the configurator.** The Runtime map answers “what does the engine provide me?” through a capability topology, runtime-versus-host ownership details, and an illustrative turn walkthrough. It is a read-only educational surface, not a resolved inventory or execution monitor. Keep plugins, skills, MCP, inference, authentication, and host authority distinct; link to the configurator without changing the draft.
- **Show both flexibility and limits.** Explain the current route, the remaining boundary, and a possible unblocking interface for a scenario. Do not turn a design opportunity into a roadmap promise.
- **Define the profiles through configuration differences.** A row of names is not enough. The reader needs to see prompts, capabilities, context, policy, identity, state, and quality ownership.
- **Include runtime placement.** Managed child process, existing TCP service, and native in-process hosting have different lifecycle, packaging, and failure/isolation boundaries.
- **Give a useful finish.** A TypeScript fragment left the user asking “what now?” The primary finish is a language-specific project with manifests, entrypoint, host code, configuration, environment-name reference, preflight, and run instructions.
- **Show the built-in prompt reference while editing.** Users should know what they are replacing or extending. References must distinguish literal defaults, source fragments, assembly outlines, and dynamic content.
- **Explain runtime-filled regions.** Opaque labels such as `{{sandbox_or_host_environment_limitations}}` looked like an undocumented macro language. The UI now uses readable labels and an explanation catalog. Reference labels are not SDK interpolation APIs.
- **Make educational help consistent across the editors.** A label such as “Host Git operations” is not enough. The user first requested help for Context switches, then called out its absence in Policy & state. Explain on/off behavior or choice alternatives, lifecycle scope, examples, and limits at the point of use. Distinguish SDK options from required host callbacks. Opening help must not change the setting.
- **Do not hide the tool surface behind a curated sample.** The user explicitly asked for every built-in and its default conditions. The source snapshot contains 59 descriptors and 33 selection aliases; “compiled,” “default in the reference profile,” “conditional,” and “currently selected” must not be conflated.
- **Keep this work in its own repository and commit milestones.** Normal use must not require the runtime or SDK checkout. Local hosting is the current scope; no remote repository or deployment was requested.

## Decisions and guardrails

### Local planning, not remote execution

The application runs in the browser and keeps a draft in browser storage. It does not contact models, start runtimes, invoke tools, or connect to MCP servers. ZIP generation and file import/export are local operations.

Credential inputs are references, not secret values. Environment files in generated projects list names only. Browser storage is not an encrypted vault; users should not paste secrets into prompts, URLs, or plans.

### One authoritative plan

The domain model is the source of truth for editors, analysis, persistence, and export. UI-only state must not pretend to change generated configuration.

Invalid edits retain the last valid saved draft. Unknown/corrupt saved data is not silently discarded. Version 1 plans migrate to version 2 targets with the previous documented default—managed runtime plus TypeScript. Earlier nine-tool plans gain catalog entries without broadening explicit exposure or constraining previously inherited defaults.

### Configuration is not executable host integration

A JSON declaration cannot contain a real host permission policy, token broker, tool implementation, or session-storage adapter. It can explicitly select the SDK's built-in allow-all permission helper.

Generated projects leave those requirements explicit. Missing selected integrations fail clearly; no success-shaped tool or no-op filesystem is supplied to make a demo appear complete. Permission handling defaults to a required host callback. Explicit allow-all is an opt-in that approves ordinary requests once without overriding managed policy, content exclusion, downstream authorization, tool validity, or sandbox enablement; it can approve an enabled sandbox-bypass request.

Default-deny is not a substitute for validating resource access inside the effectful service.

### Educational help is part of a setting

Use the shared [`SettingHelp`](../src/components/SettingHelp.tsx) popover through the field's `help` prop. Every configuration `ToggleField` requires that prop; add it to other fields when the choice has runtime, host, or deployment consequences. Keep help buttons outside input labels so opening an explanation cannot change the value. Simple metadata and search/filter fields do not need decorative icons.

Define explanations in [`setting-help.ts`](../src/content/setting-help.ts), with the existing Context switch entries in [`context-help.ts`](../src/content/context-help.ts). [`help-types.ts`](../src/content/help-types.ts) distinguishes switch behavior from choice/input detail sections. Include the option or planner concept, scope, example, boundary, and pinned sources. Host-callback switches must describe a required binding, not a fictitious SDK boolean.

Preserve keyboard opening, Escape/close behavior, focus restoration, and viewport-bounded scrolling on narrow screens. Browser checks must wait for navigation to transfer focus before opening help, and for close-time focus restoration before opening another popover. They also verify that reading help leaves the persisted plan unchanged.

### Evidence, not assumed SDK parity

The application consumes materialized reference data with pinned source links. It must not infer identical feature availability merely because six SDKs share protocol concepts.

Examples of boundaries already encountered:

- The inspected Java SDK lacks a public virtual SessionFs provider surface; that selection blocks Java generation rather than silently falling back to local disk.
- `tools.set` changes wire declarations, not the SDK's local handler map.
- Some plugin/native registration and policy settings are startup-scoped.
- Provider-native structured-output requests do not guarantee parsed, validated results or a universal fallback.
- In-process hosting is experimental in every SDK and requires compatible native packaging.
- Internal Rust traits are not automatically public SDK replacement APIs.

The current SDK source contains development versions ahead of a verified release mapping. Source-pinned setup is intentional; do not replace it with an invented package version or a floating release assumed to contain the same APIs.

### A complete catalog is not “everything is enabled”

The captured default reference is an online, local, top-level coding profile using split editing without added filters. Six tools meet that baseline gate; shell families are platform-specific; other tools depend on capabilities, models, experiments, policies, modes, or specialized contexts.

Show the conditions and source rationale. Do not manufacture a universal resolved default inventory. Selection aliases are not additional descriptors, and the surface that interprets an alias matters.

## Where future work belongs

| Change                                             | Start here                                                                                                                                   |
| -------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| New configuration choice, validation, or migration | [Plan schema](../src/domain/plan.ts), [presets](../src/domain/presets.ts), and domain tests                                                  |
| Runtime placement or language target               | [Target model](../src/domain/target.ts) and bootstrap adapters                                                                               |
| Generated project behavior                         | [Bootstrap registry](../src/domain/bootstrap/index.ts), language adapter/templates, common project files, and contract tests                 |
| Explanation of a configuration consequence         | [Decision analysis](../src/domain/analysis.ts) plus a source-backed reference                                                                |
| Point-of-use setting help                          | [Help definitions](../src/content/setting-help.ts), [shared popover](../src/components/SettingHelp.tsx), and educational-help browser checks |
| Built-in/default-tool facts                        | [Tool snapshot](../src/content/tool-catalog.json), [typed catalog](../src/content/builtin-tools.ts), and its capture script                  |
| Prompt reference or dynamic-region meaning         | [Prompt snapshot](../src/content/builtin-prompts.json), [input explanations](../src/content/prompt-inputs.ts), and prompt tests              |
| Workbench interaction                              | [Components](../src/components/) and production-browser checks                                                                               |
| Persistence, undo/redo, or recovery                | [Draft store](../src/domain/store.ts), storage helpers, and recovery tests                                                                   |

Keep generated project templates and host-extension notes aligned. A new input is incomplete if the UI edits it but the selected language drops it, its host binding is missing, or its lifecycle meaning is misstated.

## Practical continuation checklist

1. Read this document and the README, then inspect `git status` and recent commits. Do not assume a historical handoff means the current tree is clean.
2. Review the relevant source snapshot and actual supported API before changing a generator. Refresh facts deliberately; do not substitute memory or an older example.
3. Exercise the complete path: edit → guidance → saved plan → export → host preflight. For compatibility gaps, verify an explicit blocker and remediation rather than a partial project.
4. Preserve draft compatibility and canonical tool selection. A catalog expansion must not silently expose more tools in an explicit inventory.
5. Use the existing checks. Important cases include malformed imports, invalid in-progress fields, prompt ownership, tool overrides, external/native transport, language capability gaps, ZIP contents, and narrow-screen navigation.
6. Update the relevant explanation and source provenance, then commit a coherent milestone.

## Further work worth considering

These are candidates, not committed scope:

- Broaden real generated-project compilation/native smoke coverage across target platforms, especially Java and Rust toolchains.
- Map source snapshots to verified published SDK releases to simplify installation when matching packages are available.
- Make reference refresh and catalog completeness checks easier to maintain.
- Support multiple named local drafts and comparisons without losing the clear single-plan model.
- Improve package loading before broader hosting, and review which reference material is appropriate for the hosting audience.
- Consider a separately supplied resolved-prompt/tool-inventory inspection artifact for exact runtime diagnostics. Do not present offline reference text as if it were that live result.

The project should continue to teach the same distinction: **runtime machinery is shared; harness behavior and quality are chosen; application authority stays with the host.**
