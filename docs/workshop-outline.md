<!-- Copyright (c) Microsoft Corporation. All rights reserved. -->

# Workshop outline: From runtime to your own Copilot harness

**Length:** 90 minutes  
**Format:** short framing talk, guided visualizer walkthrough, then live integration in a starter repository  
**Audience:** engineers and technical product builders who can read code but do not need prior Copilot SDK experience  
**Outcome:** participants can explain the runtime/SDK/harness/host boundaries, configure a use-case-specific harness, export a paste-ready Copilot CLI task, and integrate the SDK into an existing application.

## Recommended workshop use case

Use a **tenant document assistant**: an application that answers questions only from documents the signed-in user is allowed to access. It demonstrates why a harness is more than a prompt:

- The shared runtime owns the session and model/tool loop.
- The harness replaces the built-in `view` behavior with an application-specific document reader.
- The SDK binds that tool and the permission/event callbacks.
- The host remains responsible for identity, tenant authorization, data access, lifecycle, and evaluation.

The starter repository should be intentionally small: one existing command or HTTP endpoint, an in-memory or local document service, a user/tenant identifier, and tests for authorized versus unauthorized document access. Do not begin with an empty directory; the point is to integrate into an application that already has conventions.

## Learning objectives

By the end, participants should be able to:

1. Define **runtime**, **SDK**, **harness**, **host application**, **agent**, **tool**, and **MCP** without collapsing them into “the AI.”
2. Identify which concerns are reusable runtime machinery and which remain application responsibilities.
3. Translate a use case into prompt, tools, context, model/identity, policy, state, and evaluation decisions.
4. Recognize that tool visibility is not authorization and that a process boundary is not a sandbox.
5. Use Harness Builder to produce a plan, reference code, bootstrap project, and Copilot CLI integration task.
6. Review an SDK integration for lifecycle, failure behavior, credentials, authorization, and tests.

## Before the workshop

**Facilitator**

- Run this repository locally and verify the Runtime map, tenant-document scenario, Export dialog, and Build & run flow.
- Prepare a small starter repository in the primary audience language. TypeScript is the shortest path for a live demo.
- Ensure the starter application has one real service boundary that can back the overridden `view` tool.
- Preinstall dependencies or provide a branch with dependencies cached in case network access is unreliable.
- Have a completed integration branch available as a recovery point, but do not start from it.
- Use test identities and synthetic documents. Do not use production credentials or customer data.

**Participants**

- Install GitHub Copilot CLI and authenticate.
- Install the starter repository's language/runtime prerequisites.
- Clone or open the starter repository and confirm its baseline tests pass.
- Open Harness Builder in a separate browser tab.

## Run of show

| Time      | Segment                        | Method                         | Outcome                                                                                                                      |
| --------- | ------------------------------ | ------------------------------ | ---------------------------------------------------------------------------------------------------------------------------- |
| 0:00-0:03 | Why this workshop              | Talk                           | Shift the question from “how do I call a model?” to “what experience am I deliberately building?”                            |
| 0:03-0:07 | Runtime/SDK journey            | Diagram and narrative          | Show the movement from a complete CLI experience to reusable runtime machinery exposed through language SDKs.                |
| 0:07-0:10 | Terms and ownership            | Layer diagram                  | Establish the vocabulary used for the rest of the workshop.                                                                  |
| 0:10-0:18 | Meet the runtime               | Live Runtime map               | Identify the agent loop, tools, context, inference, permissions, sessions, and events that teams do not rebuild.             |
| 0:18-0:25 | Frame the use case             | Audience prompts               | Define user, job, trusted data, allowed actions, failure behavior, and measurable success for the tenant document assistant. |
| 0:25-0:48 | Configure the harness          | Guided Harness Builder demo    | Select a baseline and configure prompt, `view` override, context, model/identity, policy, state, and evaluation.             |
| 0:48-0:58 | Read the consequences          | Plan inspector and Build & run | Review host contracts, runtime placement, language choice, blockers, and generated project structure.                        |
| 0:58-1:03 | Export the implementation task | Export dialog                  | Compare plan JSON, TypeScript reference, bootstrap ZIP, and the paste-ready Copilot CLI instructions.                        |
| 1:03-1:08 | Orient to the starter app      | Terminal/code walkthrough      | Locate the composition root, document service, authorization boundary, tests, and shutdown path.                             |
| 1:08-1:23 | Integrate with Copilot CLI     | Live implementation            | Paste the generated task, let Copilot inspect the repository, review its plan, and implement the SDK integration.            |
| 1:23-1:27 | Verify behavior                | Tests and one safe run         | Check allowed access, denied access, missing configuration, cleanup, and event visibility.                                   |
| 1:27-1:30 | Debrief                        | Recap and call to action       | Reinforce ownership boundaries and give participants a repeatable workflow for their own use cases.                          |

## Detailed facilitation guide

### 0:00-0:10 — Introduction and vocabulary

Open with: **“The runtime gives us an engine. The harness turns that engine into a specific product behavior. The SDK connects our application to it.”**

Tell the journey as a decomposition, not as a product chronology:

1. A complete coding agent such as Copilot CLI combines an experience, an opinionated harness, and runtime machinery.
2. The reusable runtime isolates the difficult session, inference, tool-loop, context, and event mechanics.
3. Language SDKs expose the integration boundary.
4. Product teams can now compose purpose-built harnesses while retaining application authority.

Use these definitions consistently:

| Term             | Workshop definition                                                                                                      | It is not                                        |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------ |
| Runtime          | Shared execution engine for sessions, inference, context processing, tool calls, and events.                             | Your product's authorization model or UX.        |
| SDK              | Language-native client and types used to configure, connect to, and observe the runtime.                                 | A second runtime or a finished agent experience. |
| Harness          | The composed behavior: prompts, tool inventory/implementations, context, agents, methods, policy hooks, and evaluations. | Merely the system prompt.                        |
| Host application | The product process and services that own UX, identity, authorization, secrets, deployment, and lifecycle.               | Automatically made safe by the SDK.              |
| Agent            | A configured role that performs work through the harness and runtime loop.                                               | An independent security principal by default.    |
| Tool             | A capability visible to the model plus an implementation that can perform an effect.                                     | Authorization simply because it is visible.      |
| MCP              | A protocol for connecting external capability providers.                                                                 | A grant of trust or tenant access.               |

### 0:10-0:25 — Runtime map and use-case framing

In the Runtime map, select the nodes in execution order: configuration → context → inference → permission → tool execution → event/session continuation. At each node ask:

- What do we reuse?
- What must the harness configure?
- What authority must stay in the host?

Then define the use case on one slide:

- **User:** an employee signed into the starter application.
- **Job:** answer a question using authorized internal documents.
- **Trusted context:** tenant and user identity supplied by the host.
- **Allowed effect:** read documents through the host's document service.
- **Denied effect:** reading arbitrary local files or another tenant's documents.
- **Success:** an answer cites an authorized document; denied access remains denied and observable.

### 0:25-0:58 — Configure and inspect

Recommended live configuration:

1. Start with **Minimal** to make each capability explicit.
2. Apply **Tenant document assistant**.
3. Rename the plan to `Tenant evidence assistant`.
4. Keep the replacement prompt concise and state the evidence/authorization rule.
5. Inspect the `view` override description and schema. Explain that the same model-facing name can use a host implementation.
6. Keep `ask_user` only if the interaction genuinely needs clarification.
7. Disable ambient project context for this non-coding use case.
8. Use host-provided identity and a real permission callback for the production-shaped path. For a tightly scoped local demo, explicitly discuss—but do not silently select—allow-all.
9. Keep event observation enabled.
10. Set evaluation to cover citation, tenant isolation, denied access, and unsupported questions.
11. In **Build & run**, choose the starter repository's language and the managed child process for the shortest local path.
12. Read every host requirement and any compatibility blocker before exporting.

### 0:58-1:23 — Export and integrate

Explain the four outputs:

| Output                   | Best use                                                               |
| ------------------------ | ---------------------------------------------------------------------- |
| Plan JSON                | Save, share, compare, or re-import design intent.                      |
| SDK TypeScript           | Inspect a compact source-level mapping of plan choices.                |
| Bootstrap ZIP            | Start a new standalone host with language-specific files and commands. |
| Copilot CLI instructions | Integrate the chosen harness into a repository that already exists.    |

Open the starter repository in Copilot CLI, paste the generated instructions, and require Copilot to inspect before editing. During implementation, pause at these review points:

- Where is client/session creation placed?
- Which code owns runtime startup and shutdown?
- Where is the `view` handler bound?
- Does the handler call the existing authorized document service?
- What happens when identity, configuration, or authorization is missing?
- Are credentials referenced only by environment-variable name?
- Which tests prove the host boundary rather than only checking happy-path text?

### 1:23-1:30 — Verification and close

Run the smallest focused checks, then one safe local interaction if credentials are available. Demonstrate:

- an authorized document can be read;
- an unauthorized document cannot be read;
- missing host configuration fails clearly;
- SDK-owned resources stop during shutdown;
- events expose enough information for debugging/evaluation without logging secrets.

Close with the repeatable workflow:

**Frame the use case → compose the harness → inspect boundaries → export into the host → verify authority and quality.**

## Facilitation guardrails

- Never equate a selected tool with permission to use the underlying service.
- Never describe a child process, virtual session filesystem, or MCP connection as tenant isolation.
- Do not let the live coding segment become an unreviewed “accept all changes” demo. Read the generated task and inspect the diff.
- If authentication blocks the live run, finish with preflight and tests; do not weaken the design to force a success-shaped demo.
- Keep the 10-minute introduction strict. The visualizer should carry most of the explanation through concrete choices.
- Use the completed branch only as a recovery mechanism. Preserve at least seven minutes for verification and debrief.

## Optional participant exercise

If the room is hands-on, ask pairs to change one axis after the main demo:

- add a custom `search_documents` tool;
- switch from a host callback to explicit local allow-all and explain the risk;
- add a reviewer agent with narrower tools;
- switch runtime placement and list the lifecycle changes;
- replace local state with a virtual session filesystem and identify the new host contract.

Each pair reports one sentence in this form: **“The runtime still owns \_**; our harness now chooses \_**; the host must still guarantee \___.”**
