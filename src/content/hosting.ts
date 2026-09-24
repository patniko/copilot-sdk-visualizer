// Copyright (c) Microsoft Corporation. All rights reserved.
import type { HarnessPlan } from "../domain/plan";
import type { RuntimeKind } from "../domain/target";

/**
 * Educational content for the "Host & deploy" page: four hosting options, each with a reference
 * architecture whose components explain their role. Claims are grounded in the SDK setup guides
 * (bundled CLI, backend services, multi-tenancy, scaling, cloud sessions); isolation beyond a
 * process boundary is host-owned, not a runtime feature.
 */

export type HostingRungId = "personal" | "container" | "cloud" | "production";

/** Who owns or controls a zone; drives the zone's visual treatment. */
export type ZoneTone = "yours" | "boxed" | "github" | "public" | "private" | "exits" | "trust";

export interface ArchitectureNode {
    id: string;
    name: string;
    role: string;
    purpose: string;
    watchOut: string;
    seams: string[];
}

export interface ArchitectureZone {
    id: string;
    label: string;
    tone: ZoneTone;
    nodes: ArchitectureNode[];
}

export interface HostingRung {
    id: HostingRungId;
    step: number;
    title: string;
    tagline: string;
    summary: string;
    /** Zones left to right, connected by the request path. */
    zones: ArchitectureZone[];
    /** Optional services every zone relies on, drawn as a band underneath. */
    band?: ArchitectureZone;
}

export const hostingRungs: HostingRung[] = [
    {
        id: "personal",
        step: 1,
        title: "Personal assistant",
        tagline: "On your machine, with your Copilot subscription",
        summary:
            "The SDK starts the bundled runtime as a child process and uses your own Copilot login. Everything runs as you.",
        zones: [
            {
                id: "machine",
                label: "Your machine · your OS user",
                tone: "yours",
                nodes: [
                    {
                        id: "app",
                        name: "Your app + SDK",
                        role: "CopilotClient in your process",
                        purpose:
                            "Your script, CLI, or desktop app creates the client and sessions. With no connection option, the SDK finds and starts the bundled runtime for you.",
                        watchOut:
                            "Wrapping this in a web server and sharing the URL puts your personal subscription and credentials to work for other people.",
                        seams: ["new CopilotClient()", "createSession()", "enableRemoteSessions"],
                    },
                    {
                        id: "runtime",
                        name: "Copilot runtime",
                        role: "Bundled CLI child process over stdio",
                        purpose:
                            "Runs the session and the model/tool loop. The SDK owns its lifecycle: it starts with your app and stops when your app exits.",
                        watchOut:
                            "A process boundary is not a sandbox. The runtime has the same OS permissions you do.",
                        seams: ["RuntimeConnection.forStdio", "Bundled CLI"],
                    },
                    {
                        id: "local",
                        name: "Your files, shell & credentials",
                        role: "Everything your account can reach",
                        purpose:
                            "Built-in coding tools work directly against your working directory and shell. That is what makes a personal assistant useful.",
                        watchOut:
                            "The default copilot-cli mode exposes these tools. Review permission requests instead of approving everything.",
                        seams: ["workingDirectory", "onPermissionRequest", "availableTools"],
                    },
                ],
            },
            {
                id: "github",
                label: "GitHub",
                tone: "github",
                nodes: [
                    {
                        id: "copilot",
                        name: "GitHub Copilot",
                        role: "Models billed to your subscription",
                        purpose:
                            "Model calls are authenticated with your signed-in Copilot account and count against your own entitlement and quotas.",
                        watchOut:
                            "Every request is attributed to you, including requests a shared user triggers.",
                        seams: ["Developer login", "useLoggedInUser"],
                    },
                    {
                        id: "remote",
                        name: "Remote sessions",
                        role: "Optional: continue on web and mobile",
                        purpose:
                            "Turn on remote sessions to view and steer the same local session from GitHub on the web or on your phone.",
                        watchOut:
                            "Remote control is still you, acting on your machine. Your organization's policy must allow it.",
                        seams: ["enableRemoteSessions"],
                    },
                ],
            },
        ],
    },
    {
        id: "container",
        step: 2,
        title: "Local container",
        tagline: "The same runtime, boxed in Docker on your machine",
        summary:
            "Run the runtime headless inside a container and connect over TCP on loopback. You now own its lifecycle, what it can see, and where it can go.",
        zones: [
            {
                id: "machine",
                label: "Your machine",
                tone: "yours",
                nodes: [
                    {
                        id: "app",
                        name: "Your app + SDK",
                        role: "Connects to 127.0.0.1:4321",
                        purpose:
                            'The SDK connects to an already-running runtime instead of starting one. Use mode: "empty" so only the tools you declare exist.',
                        watchOut:
                            "There is no built-in authentication between the SDK and the runtime. Anything that can reach the port can drive it.",
                        seams: ['RuntimeConnection.forUri("127.0.0.1:4321")', 'mode: "empty"'],
                    },
                    {
                        id: "secret",
                        name: "Secret source",
                        role: "Token injected at docker run",
                        purpose:
                            "The GitHub token comes from your shell or a secret store when the container starts, so the image and the plan stay credential-free.",
                        watchOut: "Tokens baked into an image or a Dockerfile ship with every copy of it.",
                        seams: ["-e COPILOT_GITHUB_TOKEN", "Secret manager"],
                    },
                ],
            },
            {
                id: "container",
                label: "Docker container",
                tone: "boxed",
                nodes: [
                    {
                        id: "runtime",
                        name: "Headless runtime",
                        role: "Port 4321, published on loopback only",
                        purpose:
                            "The CLI runs as a JSON-RPC server. Publish it on 127.0.0.1 so only your machine can reach it, and drop Linux capabilities you don't need.",
                        watchOut:
                            "Many examples use -p 4321:4321, which listens on every network interface, including Wi-Fi.",
                        seams: [
                            "--headless --port 4321",
                            "-p 127.0.0.1:4321:4321",
                            "--cap-drop ALL",
                            "--session-idle-timeout",
                        ],
                    },
                    {
                        id: "workspace",
                        name: "Mounted workspace",
                        role: "Only the folder you choose",
                        purpose:
                            "The container sees only what you mount, which is the main isolation win over running on your machine directly.",
                        watchOut: "Mounting your home directory or the Docker socket undoes the isolation.",
                        seams: ["-v ./repo:/work", "Read-only mounts"],
                    },
                    {
                        id: "state",
                        name: "Session-state volume",
                        role: "Wipeable, outside the image",
                        purpose:
                            "Session history is stored as files. Keeping it on a named volume lets you resume sessions and delete them cleanly.",
                        watchOut: "Without a volume, restarting the container loses every session.",
                        seams: ["/root/.copilot/session-state", "docker volume rm"],
                    },
                ],
            },
            {
                id: "outbound",
                label: "Outbound",
                tone: "exits",
                nodes: [
                    {
                        id: "egress",
                        name: "Egress allowlist",
                        role: "Recommended: proxy or network rule",
                        purpose:
                            "Limit outbound traffic to GitHub and the services your tools need. This is how you practice production's network rules locally.",
                        watchOut:
                            "Default Docker networking allows any outbound traffic. A container limits files, not exfiltration.",
                        seams: ["HTTPS_PROXY", "Docker network rules"],
                    },
                    {
                        id: "copilot",
                        name: "GitHub Copilot",
                        role: "Authenticated with the injected token",
                        purpose:
                            "Model calls use the token passed into the container. Usage is attributed to whoever owns that token.",
                        watchOut: "A personal token here still means everything runs as you.",
                        seams: ["COPILOT_GITHUB_TOKEN", "BYOK provider"],
                    },
                ],
            },
        ],
    },
    {
        id: "cloud",
        step: 3,
        title: "Managed cloud session",
        tagline: "GitHub runs the compute; your app drives the session",
        summary:
            "Create a session that runs on GitHub-hosted compute next to a repository. You don't operate machines, but each user's entitlement and your org's policies still apply.",
        zones: [
            {
                id: "app",
                label: "Your app",
                tone: "yours",
                nodes: [
                    {
                        id: "app",
                        name: "Your app + SDK",
                        role: "createSession({ cloud })",
                        purpose:
                            "Your app asks for a cloud session scoped to a repository, then streams events and sends prompts like any other session.",
                        watchOut:
                            "Wait for session.start from the copilot-agent worker before sending, or the first prompt can be dropped.",
                        seams: ["cloud: { repository }", "session.start", "onPermissionRequest"],
                    },
                    {
                        id: "identity",
                        name: "User identity",
                        role: "The user's token or Copilot login",
                        purpose:
                            "The session runs under the signed-in user's GitHub identity and their Copilot cloud-agent entitlement.",
                        watchOut:
                            "It doesn't replace a service identity for your own product. Users without the entitlement can't start sessions.",
                        seams: ["gitHubToken", "useLoggedInUser"],
                    },
                ],
            },
            {
                id: "github",
                label: "GitHub-managed",
                tone: "github",
                nodes: [
                    {
                        id: "mission-control",
                        name: "Mission Control",
                        role: "Creates and brokers the session",
                        purpose:
                            "Provisions a worker, applies policy, and relays events between your app and the worker.",
                        watchOut:
                            '"Managed" moves the operations, not the accountability. What the agent may do is still your decision.',
                        seams: ["Cloud sessions API"],
                    },
                    {
                        id: "worker",
                        name: "Hosted worker",
                        role: "copilot-agent runs the loop",
                        purpose:
                            "A GitHub-hosted environment runs the runtime and its tools. GitHub operates the compute isolation.",
                        watchOut:
                            "Host-bound tools and callbacks may behave differently on a remote worker. Check before relying on them.",
                        seams: ["copilot-agent", "Remote tools"],
                    },
                ],
            },
            {
                id: "context",
                label: "Work context",
                tone: "trust",
                nodes: [
                    {
                        id: "repo",
                        name: "Repository",
                        role: "The code the session works on",
                        purpose:
                            "The worker is set up around a GitHub repository and branch, so this fits repository-centered tasks best.",
                        watchOut:
                            "It isn't a general-purpose backend for arbitrary, non-repository workloads.",
                        seams: ["owner / name / branch"],
                    },
                    {
                        id: "policy",
                        name: "Org policies",
                        role: "Entitlements and remote-control rules",
                        purpose:
                            "Your organization decides who can use the cloud agent and whether sessions can be viewed and controlled remotely.",
                        watchOut:
                            "Sessions fail when policy blocks them, so surface that clearly in your app.",
                        seams: ["Copilot policies", "Cloud-agent entitlement"],
                    },
                ],
            },
        ],
    },
    {
        id: "production",
        step: 4,
        title: "Your production service",
        tagline: "Many users, your infrastructure, explicit boundaries",
        summary:
            "Your backend authenticates users and decides what each session may do. Runtimes sit on a private network with no ambient credentials, and every route out goes through a gateway you control.",
        zones: [
            {
                id: "edge",
                label: "Public edge",
                tone: "public",
                nodes: [
                    {
                        id: "clients",
                        name: "Clients",
                        role: "Web, desktop, mobile, other services",
                        purpose:
                            "Present the experience and hold the user's session with your app. Clients never talk to the runtime directly.",
                        watchOut:
                            "The common mistake is letting a client reach the runtime port directly, skipping your authentication and authorization.",
                        seams: ["Your UI", "Your sign-in flow"],
                    },
                    {
                        id: "gateway",
                        name: "API gateway / WAF",
                        role: "The only public way in",
                        purpose:
                            "Terminate TLS, authenticate the caller, and apply rate limits, request size limits, and abuse protection before anything reaches agent code.",
                        watchOut:
                            "Unauthenticated or abusive traffic reaches the backend that spends inference budget on its behalf.",
                        seams: ["Your gateway / ingress controller"],
                    },
                ],
            },
            {
                id: "app",
                label: "Application tier",
                tone: "private",
                nodes: [
                    {
                        id: "backend",
                        name: "Agent backend",
                        role: "Your code, where the SDK lives",
                        purpose:
                            "Work out the tenant and principal from trusted tokens, compose the harness for this session, pick a runtime, and own session IDs. This is where the SDK client runs.",
                        watchOut:
                            "Tenant identity ends up being inferred from prompt text, and one user's session can inherit another's tools.",
                        seams: ['mode: "empty"', "availableTools", "sessionId", "RuntimeConnection.forUri"],
                    },
                    {
                        id: "policy",
                        name: "Policy & approvals",
                        role: "Host-controlled decision points",
                        purpose:
                            "Approve, deny, or escalate each effect. Enforce budgets and ask a human when the risk justifies it.",
                        watchOut:
                            "Permission callbacks quietly approve everything, and a runaway loop drains your quota.",
                        seams: ["onPermissionRequest", "onPreToolUse / post-tool hooks", "Session limits"],
                    },
                ],
            },
            {
                id: "runtime",
                label: "Runtime tier · no public ingress",
                tone: "private",
                nodes: [
                    {
                        id: "runtime",
                        name: "Runtime pool",
                        role: "Headless runtimes on a private network",
                        purpose:
                            "Run the session and model/tool loop with no ambient credentials and no public ingress. Use one runtime per tenant when you need hard isolation, or a shared runtime with logical isolation for internal tools.",
                        watchOut:
                            "There's no authentication between the SDK and the runtime, so an exposed port means anyone can drive sessions with its credentials.",
                        seams: ["copilot --headless", "--session-idle-timeout", "baseDirectory / sessionFs"],
                    },
                    {
                        id: "sandbox",
                        name: "Tool sandbox",
                        role: "Containers or microVMs for risky tools",
                        purpose:
                            "Run shell, code execution, and file writes in disposable environments with read-only context projected in and no network by default.",
                        watchOut:
                            "A prompt-injected tool call runs with the backend's own filesystem and network access.",
                        seams: ["Custom tool handlers", "Your container / microVM platform"],
                    },
                ],
            },
            {
                id: "exits",
                label: "Controlled exits",
                tone: "exits",
                nodes: [
                    {
                        id: "inference",
                        name: "Inference gateway",
                        role: "The only route to models",
                        purpose:
                            "Hold the model credentials, apply quotas and content safety, log usage, and pin region for data residency.",
                        watchOut:
                            "Model keys end up in runtime environments, and you can't see or cap spend per tenant.",
                        seams: ["provider.baseUrl", "provider.bearerTokenProvider", "gitHubTokenProvider"],
                    },
                    {
                        id: "mcp",
                        name: "MCP & API gateway",
                        role: "Allowlisted capability providers",
                        purpose:
                            "Expose only reviewed MCP servers and APIs, and authenticate to them on the user's behalf so the agent never holds downstream tokens.",
                        watchOut:
                            "Any MCP server the agent is told about becomes reachable, each holding its own long-lived secret.",
                        seams: ["mcpServers", "Your API gateway"],
                    },
                    {
                        id: "egress",
                        name: "Egress proxy",
                        role: "Deny-by-default for everything else",
                        purpose:
                            "Only allowlisted destinations are reachable. It blocks exfiltration and logs every attempt to leave.",
                        watchOut: "A single injected instruction can send data to any URL on the internet.",
                        seams: ["Network policy", "Forward proxy"],
                    },
                ],
            },
        ],
        band: {
            id: "trust",
            label: "Trust services used by every tier",
            tone: "trust",
            nodes: [
                {
                    id: "secrets",
                    name: "Credential broker",
                    role: "Key vault and workload identity",
                    purpose:
                        "Issue short-lived, per-session credentials and attach them at the gateways, so they never enter the agent's context, images, or plans.",
                    watchOut:
                        "Static secrets live in environment variables that any tool call can read and leak.",
                    seams: ["gitHubTokenProvider", "GitHub App installation tokens", "Managed identity"],
                },
                {
                    id: "state",
                    name: "Session store",
                    role: "Durable, isolated state",
                    purpose:
                        "Persist session event logs per tenant with encryption and retention, so any runtime can resume a session.",
                    watchOut:
                        "Sessions are lost when a container restarts, or leak between tenants on a shared disk.",
                    seams: ["sessionFs", "Persistent volumes / shared storage", "Your locking"],
                },
                {
                    id: "audit",
                    name: "Audit & telemetry",
                    role: "Who did what, and a kill switch",
                    purpose:
                        "Record user and agent actions separately, trace every tool call, alert on anomalies, and let operators stop a session.",
                    watchOut:
                        "Nobody can reconstruct what an agent did, or stop it in the middle of an incident.",
                    seams: ["Session events", "Hooks", "Your OpenTelemetry pipeline"],
                },
            ],
        },
    },
];

export function hostingRung(id: HostingRungId): HostingRung {
    const rung = hostingRungs.find((entry) => entry.id === id);
    if (!rung) throw new RangeError(`Unknown hosting option: ${id}`);
    return rung;
}

export function rungNodes(rung: HostingRung): ArchitectureNode[] {
    return [...rung.zones, ...(rung.band ? [rung.band] : [])].flatMap((zone) => zone.nodes);
}

const LOOPBACK = new Set(["127.0.0.1", "localhost", "::1", "[::1]"]);

function endpointHost(serverUrl: string): string | null {
    try {
        return new URL(serverUrl.includes("://") ? serverUrl : `tcp://${serverUrl}`).hostname;
    } catch {
        return null;
    }
}

/** The ladder step closest to the draft's runtime placement. Cloud sessions are never inferred. */
export function planHostingRung(plan: Pick<HarnessPlan, "target">): {
    id: HostingRungId;
    reason: string;
} {
    const runtime: RuntimeKind = plan.target.runtime;
    if (runtime !== "external") {
        return {
            id: "personal",
            reason:
                runtime === "inprocess"
                    ? "Your plan loads the runtime into the application process on the machine that runs it."
                    : "Your plan lets the SDK start a child runtime on the machine that runs your app.",
        };
    }
    const host = endpointHost(plan.target.serverUrl);
    if (host && LOOPBACK.has(host)) {
        return {
            id: "container",
            reason: `Your plan connects to a runtime service on this machine (${plan.target.serverUrl}).`,
        };
    }
    return {
        id: "production",
        reason: `Your plan connects to a runtime service at ${plan.target.serverUrl || "another host"}.`,
    };
}
