<!-- Copyright (c) Microsoft Corporation. All rights reserved. -->

---

title: "From runtime to your own Copilot harness"
subtitle: "A 90-minute build workshop"
---

# From runtime to your own Copilot harness

Build a purpose-specific agent experience without rebuilding the engine.

**Today:** understand the layers → configure a harness → integrate it into an existing app

<!-- Speaker note: Set the expectation that this is an architecture and implementation workshop, not a prompt-writing session. -->

---

# The question changes

## Before

“How do I call a model?”

## Now

“What behavior, capabilities, authority, and quality bar should my application own?”

<!-- Speaker note: The model call is one step. The product is the complete loop and its boundaries. -->

---

# The journey: experience → reusable engine

1. **Copilot CLI** demonstrates a complete coding experience.
2. Its **harness** supplies coding-oriented instructions, tools, context, and interaction patterns.
3. The **runtime** provides reusable session, inference, tool-loop, context, and event machinery.
4. The **SDK** lets another host configure and operate that machinery.
5. **Your application** can compose a different harness for a different job.

**One engine can support many harnesses.**

<!-- Speaker note: Present this as a conceptual decomposition. Do not imply that every CLI behavior is a stable SDK default. -->

---

# Four layers, four responsibilities

| Layer            | Owns                                                                              |
| ---------------- | --------------------------------------------------------------------------------- |
| Runtime engine   | Sessions, model/tool loop, context processing, provider adaptation, events        |
| Harness          | Prompt, tool inventory and implementations, context, agents, methods, evaluations |
| SDK              | Language-native configuration, transport, callback binding, event delivery        |
| Host application | UX, identity, authorization, secrets, deployment, lifecycle, services             |

**The SDK carries configuration. The runtime executes it. The host retains authority.**

---

# Terms we will use precisely

- **Agent:** a configured role operating through the runtime loop.
- **Tool:** a model-visible capability plus an implementation.
- **Context:** selected information made available for the task.
- **Policy hook:** a host-controlled decision point before or after an effect.
- **MCP:** a protocol for connecting capability providers.
- **Evaluation:** evidence that the harness behaves within its intended quality and authority boundaries.

**A harness is all of these choices together—not just a prompt.**

---

# Three statements to remember

1. **Tool visibility is not authorization.**
2. **A process boundary is not a sandbox.**
3. **A generated configuration is not a completed host integration.**

<!-- Speaker note: Ask the audience to repeat these back at the end. -->

---

# Meet the runtime

**Live demo: Runtime map**

Trace one turn:

configuration → context → inference → permission → tool execution → events/session

At every step ask:

- What do we reuse?
- What does the harness choose?
- What must the host guarantee?

---

# Our workshop use case

## Tenant document assistant

Answer a user's question using only documents they are authorized to access.

- **User:** signed-in employee
- **Context:** tenant and principal
- **Effect:** read through the application's document service
- **Constraint:** never infer access from the prompt
- **Success:** cite authorized evidence; deny and observe unauthorized access

---

# Turn a use case into harness decisions

| Question                       | Configuration surface |
| ------------------------------ | --------------------- |
| How should it behave?          | Prompt                |
| What can it attempt?           | Tools and MCP         |
| What can it know?              | Context and packs     |
| Who performs specialized work? | Agents                |
| Which inference and identity?  | Models & identity     |
| Who approves effects?          | Policy                |
| What survives?                 | Session state         |
| How do we know it works?       | Events and evaluation |

---

# Start small and explicit

**Live demo: choose Minimal**

- Empty client baseline
- Explicit inventory
- Concise replacement prompt
- No ambient project workspace
- Host-owned identity and policy

Then apply **Tenant document assistant**.

<!-- Speaker note: Minimal is a workshop composition, not a shipped SDK mode named “minimal.” -->

---

# Same tool name, your implementation

## Override `view`

**Model sees:** “read a document”

**Host does:**

1. receives the requested path or identifier;
2. resolves current tenant and principal;
3. checks authorization in the real service;
4. returns only permitted content;
5. emits observable success or denial.

**The runtime does not invent your tenant boundary.**

---

# Context is an input—and a risk

For this use case:

- no project workspace;
- no ambient repository discovery;
- no file hooks or host Git operations;
- only reviewed skills/plugins, if any;
- tenant identity supplied by the host, not trusted from user text.

**More context is not automatically better context.**

---

# Pick the runtime boundary deliberately

| Placement                | Lifecycle                | Key boundary                                       |
| ------------------------ | ------------------------ | -------------------------------------------------- |
| Managed child process    | SDK starts/stops runtime | Separate process, not a sandbox                    |
| Existing runtime service | Host operates server     | Network, auth, tenancy, shutdown are host concerns |
| In-process runtime       | SDK-managed handles      | Shared process and native-library lifetime         |

**Workshop default:** managed child process for the shortest local path.

---

# Read the consequences before exporting

**Live demo: Plan inspector + Build & run**

Look for:

- required callbacks;
- tool handlers;
- credential references;
- state provider;
- runtime compatibility;
- language-specific blockers;
- decisions that remain host-owned.

**A blocker is better than a misleading scaffold.**

---

# Four outputs, four jobs

| Output                   | Use it when…                                    |
| ------------------------ | ----------------------------------------------- |
| Plan JSON                | You want reversible design intent               |
| SDK TypeScript           | You want a compact mapping reference            |
| Bootstrap ZIP            | You are starting a standalone host              |
| Copilot CLI instructions | You are integrating into an existing repository |

---

# The paste-ready handoff

**Live demo: Export → Copilot CLI**

The generated task tells Copilot to:

- inspect the current repository first;
- preserve its architecture and conventions;
- apply the chosen language/runtime/configuration;
- bind real host services and callbacks;
- avoid secrets, mocks, no-ops, and silent fallbacks;
- add focused tests and setup documentation;
- report host-owned TODOs and commands run.

---

# Open the starter application

Before pasting anything, locate:

1. composition root;
2. document service;
3. identity/tenant source;
4. authorization check;
5. configuration pattern;
6. tests;
7. shutdown lifecycle.

**We are integrating an SDK, not replacing the app.**

---

# Review Copilot's implementation plan

Ask:

- Where will client and session creation live?
- How will runtime startup failures surface?
- Where is the `view` handler bound?
- Which existing service performs authorization?
- How are SDK-owned resources stopped?
- Which tests prove denial and cleanup?

Do not proceed until the answers fit the host architecture.

---

# Review the code at the trust boundaries

## Require evidence for

- tenant/principal comes from trusted host state;
- document authorization happens in the service layer;
- permission callbacks do not silently approve;
- missing bindings fail clearly;
- credentials come from environment or callbacks;
- logs/events exclude sensitive content;
- shutdown stops SDK-owned resources.

---

# Verify more than the happy path

Run focused checks for:

1. authorized document read;
2. unauthorized document denial;
3. missing identity/configuration failure;
4. tool error propagation;
5. session/client cleanup;
6. event or evaluation signal;
7. existing application behavior.

If credentials are unavailable, finish with preflight and tests—do not weaken the boundary.

---

# The repeatable workflow

## Frame → Compose → Inspect → Integrate → Verify

- **Frame** the user, job, data, effects, and success.
- **Compose** prompt, tools, context, agents, policy, state, and evaluation.
- **Inspect** requirements, runtime placement, and limits.
- **Integrate** through the SDK into the existing host.
- **Verify** authority, failure behavior, lifecycle, and quality.

---

# Final check

Complete this sentence:

> The runtime owns **\_____**; our harness chooses **\_____**; the host must guarantee **\_____**.

**Build the harness that fits your product. Reuse the engine underneath it.**

<!-- Speaker note: Invite two or three answers, then close. -->
