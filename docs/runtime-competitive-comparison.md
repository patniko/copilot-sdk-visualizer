<!-- Copyright (c) Microsoft Corporation. All rights reserved. -->

# GitHub Copilot runtime vs. OpenAI Codex SDK and Anthropic Claude Agent SDK

**Status:** Point-in-time technical comparison  
**Compared:** September 16, 2026  
**Audience:** Product, engineering, and platform teams evaluating an agent runtime

## Executive summary

The three systems share the same basic proposition: embed a production coding-agent loop instead of rebuilding model calls, tool dispatch, context management, sessions, and event streaming yourself.

The main difference is product shape:

- **GitHub Copilot SDK/runtime** is the broadest **application platform** of the three. It exposes one shared runtime through six language SDKs, supports multiple runtime placements, can use GitHub Copilot or bring-your-own-model credentials, and gives the host explicit seams for tools, policy, identity, storage, events, plugins, skills, and agents.
- **OpenAI Codex** offers the broadest **local-to-managed execution continuum**. Its TypeScript SDK wraps the local Codex CLI, its Python SDK controls the local app-server, and the separate public-beta Agents API runs an OpenAI-managed Codex harness with hosted, self-hosted, or no execution environment. Codex also has especially strong sandboxing, network controls, and Git-oriented coding workflows.
- **Anthropic Claude Agent SDK** is the most direct **Claude Code-as-a-library experience**. It offers a polished Python and TypeScript API over Claude Code's agent loop, tools, permissions, hooks, subagents, sessions, skills, plugins, and MCP integrations. Its permission model and Bash sandbox are more mature and better documented than ours today.

**Bottom line:** We are better positioned when a team wants one agent runtime embedded across a heterogeneous product stack, multiple model/provider paths, configurable runtime placement, and strong host ownership. We are worse when the primary requirement is a turnkey coding agent with a built-in, clearly documented OS sandbox and a highly polished two-language developer experience.

## Scope and terminology

In this document, **our runtime** means the GitHub Copilot agent runtime exposed through the GitHub Copilot SDK. It does not mean this visualizer application. The visualizer is a local planning and bootstrap tool; it does not execute agents.

The comparison separates four layers that vendor messaging often combines:

| Layer                | Responsibility                                                                                      |
| -------------------- | --------------------------------------------------------------------------------------------------- |
| **Runtime engine**   | Agent loop, model/tool interaction, context processing, sessions, events, and provider adaptation   |
| **Harness**          | Instructions, tool inventory, context sources, agents, methods, policy choices, and evaluation      |
| **SDK / protocol**   | Language-native API, transport, typed configuration, callbacks, and event delivery                  |
| **Host application** | Product UX, identity, authorization, secrets, deployment isolation, storage, and effectful services |

## At-a-glance comparison

| Dimension                              | GitHub Copilot SDK/runtime                                                                                       | OpenAI Codex SDK                                                                                                                                               | Anthropic Claude Agent SDK                                                                                                         | Assessment                                                                                                    |
| -------------------------------------- | ---------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| **Core shape**                         | Shared runtime exposed by SDK clients over JSON-RPC                                                              | TypeScript wrapper around Codex CLI; Python controls the local app-server; app-server is the lower-level client protocol                                       | Python/TypeScript libraries that run the Claude Code agent loop through a bundled or selected CLI                                  | Similar engine-behind-an-SDK pattern                                                                          |
| **Primary orientation**                | General agent platform that inherits a coding-capable Copilot baseline                                           | Coding automation, CI, and custom Codex clients                                                                                                                | Claude Code capabilities embedded in applications                                                                                  | Ours is broader in platform intent; competitors are more focused                                              |
| **SDK languages**                      | TypeScript, Python, Go, .NET, Java, Rust                                                                         | TypeScript and Python                                                                                                                                          | TypeScript and Python; other languages can invoke the CLI subprocess                                                               | **Our strongest objective advantage**                                                                         |
| **Runtime placement**                  | Managed child process, external CLI service over stdio/TCP, and experimental in-process runtime                  | Local CLI subprocess; app-server over stdio, experimental WebSocket, or Unix socket; separate Agents API with hosted, self-hosted, or no execution environment | Bundled or selected Claude Code CLI; Managed Agents is a separate hosted product                                                   | Ours has the clearest single-runtime placement model; Codex has the broadest overall continuum                |
| **Model/provider choice**              | GitHub Copilot-backed models or BYOK paths for supported providers                                               | Codex/OpenAI model ecosystem and authentication                                                                                                                | Claude through Anthropic API or supported cloud-provider integrations                                                              | Ours provides the most explicit multi-provider runtime abstraction                                            |
| **Built-in tools**                     | Large Copilot CLI tool catalog plus host tools and MCP                                                           | Codex coding tools, shell/file operations, MCP, plugins, and skills                                                                                            | Claude Code tools including file, shell, web, MCP, skills, and plugins                                                             | Broadly comparable; exact inventories and gates differ                                                        |
| **Host-defined tools**                 | Typed SDK handlers; supported built-in tool overrides                                                            | MCP is the main portable extension seam; app-server also exposes rich tool/event protocol surfaces                                                             | Custom tools are implemented as in-process SDK MCP servers or external MCP servers                                                 | Ours makes host callbacks and same-name overrides especially explicit                                         |
| **MCP**                                | Local/stdio and remote HTTP/SSE configuration, subject to SDK parity                                             | STDIO and Streamable HTTP, OAuth, per-server/per-tool approval controls                                                                                        | External MCP plus convenient in-process SDK MCP servers                                                                            | Claude has the cleanest in-process custom-tool story; Codex has strong MCP auth/policy controls               |
| **Hooks and policy**                   | Host callbacks for permissions and lifecycle/tool hooks                                                          | Rich lifecycle hooks, command or MCP-tool handlers, hook trust review, sandbox and approval policy                                                             | Detailed permission evaluation order, hooks, allow/deny rules, modes, and `canUseTool`                                             | Competitors currently present a more complete and legible policy system                                       |
| **Sandboxing**                         | A child process is not a sandbox; deployment isolation remains host-owned                                        | OS-enforced local sandbox, network restrictions, approval modes, and isolated cloud containers                                                                 | OS-enforced Bash sandbox on macOS/Linux/WSL2, plus permission modes; hosted isolation is available through separate Managed Agents | **Our clearest weakness**                                                                                     |
| **Sessions and persistence**           | Create, resume, disconnect, delete, stream events, and optionally provide session storage/filesystem integration | Persistent local threads; app-server adds rich thread administration; Agents API keeps durable server-side session state                                       | Persistent conversation sessions with continue, resume, and fork; filesystem changes are separate from session history             | Codex has the richest documented thread administration; ours has stronger host storage seams                  |
| **Subagents**                          | Custom agents and experimental fleet mode for parallel work                                                      | Parallel subagent workflows and custom local agents; clients expose agent-thread activity                                                                      | Programmatic or filesystem subagents with isolated context, scoped tools, parallel execution, skills, memory, and MCP              | Claude's programmatic subagent surface is the most polished; ours is competitive but less uniform across SDKs |
| **Plugins and skills**                 | Plugins can package skills, hooks, MCP servers, and agents; runtime supports explicit plugin directories         | Skills, plugins, MCP, hooks, and project instructions                                                                                                          | Mature `.claude` conventions plus plugins packaging skills, agents, hooks, and MCP                                                 | Claude and Codex currently have stronger user-facing configuration ecosystems                                 |
| **Events and observability**           | More than 40 documented streaming event types, usage/billing signals, hooks, and OpenTelemetry guidance          | Structured turn/item events; app-server exposes detailed lifecycle and streamed deltas; enterprise audit surfaces are separate                                 | Streaming SDK messages, result/cost data, hooks, and external telemetry integrations                                               | Ours is strong at the runtime API layer; end-to-end operational tooling still depends on the host             |
| **Remote/cloud execution**             | Remote sessions and GitHub-hosted cloud sessions through Mission Control                                         | Codex cloud plus the public-beta Agents API, which runs the Codex harness as a managed service                                                                 | Claude Code cloud and separate Managed Agents product                                                                              | Codex currently presents the most explicit managed harness API                                                |
| **Open implementation/protocol**       | Public SDK and runtime source, generated protocol contracts, multiple language projections                       | Apache-licensed Codex repository and open-source app-server implementation                                                                                     | Public SDK repositories, but use is governed primarily by Anthropic commercial terms                                               | Ours and Codex are easier to inspect deeply                                                                   |
| **Cross-language feature consistency** | Broad reach, but features are not perfectly uniform across six SDKs                                              | Smaller two-language surface is easier to keep aligned; Python and TypeScript still differ in depth                                                            | Smaller two-language surface, with some Python/TypeScript API differences                                                          | Breadth is our advantage and our maintenance tax                                                              |

## Where we are better

### 1. We are a broader runtime platform, not only a coding-agent wrapper

Our architecture explicitly separates the shared runtime engine from the harness, SDK integration, and host application. That makes the system easier to apply to products that are not simply replicas of a terminal coding agent.

The host can define its own:

- prompts and operating methods;
- tool inventory and implementations;
- context and skill sources;
- custom agents;
- identity and credentials;
- permission decisions and lifecycle hooks;
- session storage and event handling;
- product UX and quality bar.

Codex and Claude can also be embedded and customized, but their SDKs are presented more directly as programmatic access to Codex or Claude Code. Our framing is stronger for platform teams building multiple differentiated agent experiences on one engine.

### 2. Six first-class language SDKs are a meaningful platform advantage

The Copilot SDK supports **TypeScript, Python, Go, .NET, Java, and Rust**. Codex and Claude currently provide first-class SDKs for **TypeScript and Python**.

This matters for:

- existing enterprise services that should not add a Node or Python sidecar;
- teams that want language-native types, packaging, lifecycle, and observability;
- platform adoption across mixed stacks;
- embedding into IDEs, desktop applications, backend services, and developer infrastructure.

The caveat is that six SDKs create a larger parity burden. A feature present in the shared protocol or one SDK must not be assumed to exist uniformly in every language.

### 3. Runtime placement is more flexible and explicit

Our SDK documents three distinct placements:

1. an SDK-managed local child process;
2. an existing runtime/CLI service over a transport such as TCP;
3. an experimental in-process runtime.

This gives platform teams clearer choices around packaging, process lifecycle, scaling, failure boundaries, and service ownership.

Codex's lower-level app-server also supports several transports and remote clients, and its separate public-beta Agents API can pair an OpenAI-managed harness with hosted or customer-managed compute. That gives OpenAI a broader overall continuum, but across distinct products and APIs. Claude's Agent SDK primarily drives the Claude Code CLI, while Anthropic's hosted Managed Agents is also a separate product rather than another placement of the same SDK runtime.

### 4. We have the strongest explicit multi-provider story

The Copilot runtime can use GitHub Copilot-backed inference or configured BYOK providers. The current public SDK documentation calls out supported provider paths including OpenAI, Microsoft Foundry, and Anthropic.

That creates a useful separation:

- the **runtime** supplies the agent loop and provider adaptation;
- the **harness** chooses behavior and capabilities;
- the **host** supplies the credential and identity boundary;
- the **model provider** can change without rebuilding the entire agent.

This does not make model behavior interchangeable. Tool use, image support, structured output, latency, cost, and output quality remain model- and provider-dependent.

### 5. Host ownership is treated as a first-class design constraint

Our model is unusually explicit about what configuration does **not** provide:

- a declared permission policy is not OS isolation;
- an available tool is not authorization to a tenant resource;
- a subprocess boundary is not a tenant sandbox;
- inference credentials do not authenticate MCP services;
- session persistence is not the same as host filesystem persistence;
- an idle event is not proof that a task succeeded.

This is a strength for serious application integration. It prevents SDK configuration from being mistaken for identity, authorization, isolation, or quality assurance.

### 6. The runtime offers a deep, composable capability surface

Our current documented surface includes:

- custom tools and supported built-in tool overrides;
- MCP servers;
- skills and plugin directories;
- custom agents and fleet orchestration;
- prompt replacement and extension;
- model/provider configuration;
- permission callbacks and hooks;
- session persistence and host-provided filesystem storage;
- steering, queueing, remote sessions, cloud sessions, and more than 40 event types;
- usage, billing, budgets, and OpenTelemetry integration.

Competitors match many individual features. Our advantage is the combination of these capabilities behind one runtime contract and six SDK projections.

## Where we are worse

### 1. We do not yet offer an equivalent built-in sandbox story

This is the largest gap.

Codex documents an OS-enforced local sandbox with filesystem modes, network-off defaults, domain controls, approval policies, and isolated cloud containers. Claude documents an OS-enforced Bash sandbox using Seatbelt on macOS and Bubblewrap on Linux/WSL2, with filesystem/network policy and strict failure options.

Our runtime exposes permission and hook seams, but the host still owns deployment isolation. A managed child process is useful for lifecycle separation, but it is **not** a sandbox. Teams that need strong isolation must add containers, VMs, OS sandboxing, or an equivalent execution boundary themselves.

### 2. Our breadth creates uneven SDK parity

Six languages are valuable, but they make it harder to deliver every emerging capability consistently. Known examples include:

- experimental features not being uniform across SDKs;
- storage or virtual-filesystem surfaces differing by language;
- fleet bindings not being equally mature everywhere;
- generated protocol types existing before a high-level ergonomic API is available.

Codex and Claude can concentrate documentation, examples, and polish on Python and TypeScript.

### 3. Our permission model is less turnkey and less legible

Claude documents a precise evaluation sequence across hooks, deny rules, ask rules, permission modes, allow rules, and the runtime callback. Codex combines sandbox modes, approval policies, permission profiles, hook trust, and network policy.

Our host-owned permission callback is flexible, but application developers must do more design work:

- define approval UX;
- handle pending requests;
- enforce tenant and resource authorization;
- decide how rules compose;
- supply isolation separately;
- verify that every effectful service performs its own checks.

That flexibility is appropriate for a platform, but it is not as turnkey.

### 4. Codex has a richer documented low-level thread-control surface

The Codex app-server documents fine-grained operations for thread listing, reading, resuming, forking, archiving, deletion, steering, interruption, compaction, item pagination, metadata, goals, and background terminals.

Our sessions/events surface is broad, but Codex currently exposes a more visibly complete client-building protocol for teams that want to reproduce or extend the Codex UI.

### 5. Claude has the cleanest programmatic subagent ergonomics

Claude's Agent SDK makes subagents easy to define directly in Python or TypeScript with:

- descriptions and prompts;
- tool restrictions;
- model selection;
- skills and memory;
- MCP server assignment;
- isolated context and parallel execution.

Our custom agents cover the same general concept, and fleet mode targets parallel orchestration, but the experience is less uniform across languages and some orchestration surfaces remain experimental.

### 6. Our default experience is more complex to explain

The Copilot runtime has a large tool inventory, conditional registrations, aliases, profile behavior, provider options, and multiple hosting modes. That is powerful, but it creates conceptual overhead:

- compiled does not mean enabled;
- enabled does not mean authorized;
- inherited inventory does not mean every tool;
- `empty` mode does not mean zero prompt, zero state, or zero filesystem use;
- shared protocol support does not guarantee SDK parity.

Codex and Claude also have complex configuration, but their product story is simpler: programmatically run the coding agent users already know.

## Where the competitors are stronger

### OpenAI Codex

Codex is strongest when the goal is to automate a Git-centric coding agent with explicit local or cloud isolation, or to consume a managed Codex harness as a service.

Notable strengths:

- strong default local security posture: workspace-limited writes and network disabled by default;
- explicit read-only, workspace-write, and full-access sandbox presets;
- detailed network proxy and domain policy;
- isolated cloud environments with setup-time secret handling;
- a public-beta Agents API that separates the managed harness from hosted, self-hosted, or absent execution environments;
- rich app-server protocol for custom clients;
- persistent, resumable threads with detailed administrative operations;
- mature Codex product surfaces across CLI, IDE, app, cloud, and CI;
- open-source Rust implementation under Apache 2.0.

Tradeoffs relative to us:

- only Python and TypeScript SDKs;
- the high-level TypeScript SDK is intentionally a wrapper around the local CLI;
- its SDK, app-server, cloud product, Agents API, and separate general-purpose Agents SDK create a more fragmented architecture choice;
- the Codex harness is more tightly shaped around OpenAI's coding workflow;
- multi-provider inference is not the central abstraction.

### Anthropic Claude Agent SDK

Claude is strongest when a Python or TypeScript team wants Claude Code's agent behavior with minimal conceptual translation.

Notable strengths:

- highly direct SDK story: the same loop, tools, and context system as Claude Code;
- detailed permission evaluation and well-documented behavioral edge cases;
- built-in Bash sandbox with filesystem and network boundaries;
- excellent programmatic custom-tool ergonomics through in-process SDK MCP servers;
- mature subagent definitions with isolated context and scoped capabilities;
- strong filesystem conventions for instructions, settings, agents, skills, and plugins;
- session continue, resume, and fork workflows;
- mature Claude Code ecosystem and documentation.

Tradeoffs relative to us:

- only Python and TypeScript SDKs;
- centered on Claude and supported Anthropic/cloud-provider access paths rather than a model-neutral runtime;
- the Agent SDK primarily manages a CLI process;
- hosted Managed Agents is a separate product with a different operational boundary;
- SDK use is governed by Anthropic's commercial terms rather than a broadly open runtime implementation.

## Strategic implications

### The position we should defend

Our differentiator should not be “we also have tools, MCP, hooks, and subagents.” All three systems have those.

The stronger position is:

> **One production agent runtime, many languages, many harnesses, multiple deployment shapes, and explicit host ownership.**

That position is credible because it is grounded in structural differences:

- six language SDKs;
- a shared generated runtime contract;
- managed-process, external-service, and experimental in-process placement;
- Copilot and BYOK inference paths;
- host-defined tools, callbacks, storage, and event handling;
- a runtime intended to support many application experiences.

### The gaps we should prioritize

1. **Provide a first-party isolation story.** A documented, supported sandbox profile—or a reference isolated runner—would close the clearest competitive gap.
2. **Make permission composition explicit.** Publish a deterministic evaluation model covering runtime gates, tool inventory, hooks, host decisions, and resource authorization.
3. **Publish a language parity matrix.** Broad language support becomes more valuable when teams can see exactly which capabilities are stable, experimental, or unavailable in each SDK.
4. **Stabilize orchestration APIs.** Make custom-agent and parallel-work behavior consistent across languages, with budgets, cancellation, and event semantics.
5. **Improve low-level session administration.** Listing, inspecting, forking, archiving, steering, cancellation, and storage behavior should be easy to discover and operate.
6. **Ship production deployment reference architectures.** Show concrete single-user, multi-tenant, isolated-worker, and remote-runtime topologies with their trust boundaries.
7. **Keep the platform story simpler than the implementation.** Offer opinionated secure presets while preserving the lower-level composability.
8. **Clarify the managed-service boundary.** Codex's Agents API makes “the vendor runs the harness” an explicit API choice; our local, remote-session, and cloud-session stories should be equally easy to distinguish.

## Decision guide

| Choose                          | When                                                                                                                                                                                 |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **GitHub Copilot SDK/runtime**  | You need several implementation languages, want to build multiple differentiated agent products, need flexible runtime placement, or value GitHub Copilot plus BYOK provider options |
| **OpenAI Codex SDK/app-server** | You want Codex specifically, need strong built-in sandbox/network controls, want deep custom-client thread APIs, or are automating Git-centric coding work                           |
| **Anthropic Claude Agent SDK**  | You want Claude Code behavior in Python or TypeScript, prioritize polished permissions/subagents/custom tools, and are comfortable with a CLI-backed Claude-specific runtime         |

## Important caveats

- This is a point-in-time comparison of fast-moving products.
- “Supported” does not mean every feature is equally mature, available in every language, or enabled by default.
- SDK permissions are not a substitute for authorization inside tools and services.
- A local process boundary is not a tenant or operating-system sandbox.
- Hosted Codex, Claude Code cloud, Anthropic Managed Agents, and GitHub cloud sessions are related product surfaces, not necessarily interchangeable deployment modes of their respective SDKs.
- Product quality depends on the full harness: prompts, models, tools, context, orchestration, evaluation, and host integration—not only the runtime feature list.

## Primary sources

### GitHub Copilot SDK/runtime

- [GitHub Copilot SDK README](https://github.com/github/copilot-sdk/blob/main/README.md)
- [SDK setup paths and architecture](https://github.com/github/copilot-sdk/blob/main/docs/setup/choosing-a-setup-path.md)
- [SDK feature index](https://github.com/github/copilot-sdk/blob/main/docs/features/README.md)
- [Pinned SDK/runtime evidence used by this repository](../src/content/reference.json)
- [Project architecture and evidence guardrails](project-context.md)

### OpenAI Codex

- [Codex SDK documentation](https://learn.chatgpt.com/docs/codex-sdk)
- [Codex TypeScript SDK README](https://github.com/openai/codex/blob/main/sdk/typescript/README.md)
- [Codex Python SDK README](https://github.com/openai/codex/blob/main/sdk/python/README.md)
- [Codex app-server protocol](https://learn.chatgpt.com/docs/app-server)
- [OpenAI agent runtime choices](https://developers.openai.com/api/docs/guides/agents)
- [Agents API architecture](https://developers.openai.com/api/docs/guides/agents-api/architecture)
- [Agent approvals and security](https://learn.chatgpt.com/docs/agent-approvals-security)
- [Model Context Protocol](https://learn.chatgpt.com/docs/extend/mcp)
- [Subagents](https://learn.chatgpt.com/docs/agent-configuration/subagents)
- [Hooks](https://learn.chatgpt.com/docs/hooks)
- [Open-source Codex repository](https://github.com/openai/codex)

### Anthropic Claude Agent SDK

- [Claude Agent SDK overview](https://code.claude.com/docs/en/agent-sdk/overview)
- [Python SDK README](https://github.com/anthropics/claude-agent-sdk-python/blob/main/README.md)
- [TypeScript SDK README](https://github.com/anthropics/claude-agent-sdk-typescript/blob/main/README.md)
- [Permissions](https://code.claude.com/docs/en/agent-sdk/permissions)
- [Sandboxing](https://code.claude.com/docs/en/sandboxing)
- [Sessions](https://code.claude.com/docs/en/agent-sdk/sessions)
- [Subagents](https://code.claude.com/docs/en/agent-sdk/subagents)
- [Hosting the Agent SDK](https://code.claude.com/docs/en/agent-sdk/hosting)
- [Secure deployment](https://code.claude.com/docs/en/agent-sdk/secure-deployment)
