// Copyright (c) Microsoft Corporation. All rights reserved.
import type { HostingRungId, ZoneTone } from "./hosting";

export type DiagramBounds = readonly [x: number, y: number, width: number, height: number];
export type DiagramPoint = readonly [x: number, y: number];
export type DiagramPort = readonly [node: string, side: "top" | "right" | "bottom" | "left", offset?: number];
export type DiagramIcon =
    | "app"
    | "runtime"
    | "tools"
    | "copilot"
    | "remote"
    | "credential"
    | "storage"
    | "workspace"
    | "gateway"
    | "control"
    | "worker"
    | "repository"
    | "policy"
    | "users"
    | "sandbox"
    | "models"
    | "mcp"
    | "audit";

export interface DiagramNode {
    id: string;
    label: string;
    caption: string;
    icon: DiagramIcon;
    boundary: string;
    bounds: DiagramBounds;
    replicated?: boolean;
}

export interface DiagramConnection {
    from: DiagramPort;
    to: DiagramPort;
    via?: DiagramPoint[];
    label: string;
    labelAt: DiagramPoint;
    kind: "flow" | "support";
    bidirectional?: boolean;
}

export interface HostingDiagramLayout {
    height: number;
    boundaries: {
        id: string;
        label: string;
        caption?: string;
        tone: ZoneTone;
        icon: "machine" | "cloud" | "container" | "private" | "public" | "platform" | "runtime";
        bounds: DiagramBounds;
        nested?: boolean;
    }[];
    nodes: DiagramNode[];
    connections: DiagramConnection[];
}

export const DIAGRAM_WIDTH = 1000;

// Coordinates keep these small, curated reference topologies intentional rather than auto-laid out.
export const hostingDiagrams: Record<HostingRungId, HostingDiagramLayout> = {
    personal: {
        height: 530,
        boundaries: [
            {
                id: "machine",
                label: "Your machine",
                caption: "One user. Your OS permissions.",
                tone: "yours",
                icon: "machine",
                bounds: [24, 32, 640, 466],
            },
            {
                id: "process",
                label: "Child process",
                tone: "boxed",
                icon: "runtime",
                bounds: [358, 116, 276, 184],
                nested: true,
            },
            {
                id: "github",
                label: "GitHub",
                caption: "Your Copilot subscription",
                tone: "github",
                icon: "cloud",
                bounds: [716, 32, 260, 466],
            },
        ],
        nodes: [
            {
                id: "app",
                label: "Your app + SDK",
                caption: "Session orchestration",
                icon: "app",
                boundary: "machine",
                bounds: [56, 170, 204, 100],
            },
            {
                id: "runtime",
                label: "Copilot runtime",
                caption: "Model + tool loop",
                icon: "runtime",
                boundary: "process",
                bounds: [386, 170, 220, 100],
            },
            {
                id: "local",
                label: "Local tools",
                caption: "Files, shell & credentials",
                icon: "tools",
                boundary: "machine",
                bounds: [386, 358, 220, 96],
            },
            {
                id: "copilot",
                label: "GitHub Copilot",
                caption: "Model inference",
                icon: "copilot",
                boundary: "github",
                bounds: [748, 170, 196, 100],
            },
            {
                id: "remote",
                label: "Remote sessions",
                caption: "Optional web / mobile",
                icon: "remote",
                boundary: "github",
                bounds: [748, 358, 196, 96],
            },
        ],
        connections: [
            {
                from: ["app", "right"],
                to: ["runtime", "left"],
                label: "stdio",
                labelAt: [323, 204],
                kind: "flow",
                bidirectional: true,
            },
            {
                from: ["runtime", "right"],
                to: ["copilot", "left"],
                label: "HTTPS",
                labelAt: [677, 204],
                kind: "flow",
            },
            {
                from: ["runtime", "bottom"],
                to: ["local", "top"],
                label: "tool calls",
                labelAt: [550, 321],
                kind: "flow",
            },
            {
                from: ["runtime", "right", 0.75],
                to: ["remote", "left"],
                via: [
                    [684, 245],
                    [684, 406],
                ],
                label: "optional relay",
                labelAt: [684, 326],
                kind: "support",
                bidirectional: true,
            },
        ],
    },
    container: {
        height: 640,
        boundaries: [
            {
                id: "machine",
                label: "Your machine",
                caption: "Loopback ingress only",
                tone: "yours",
                icon: "machine",
                bounds: [24, 32, 664, 576],
            },
            {
                id: "container",
                label: "Docker container",
                caption: "Headless CLI / port 4321",
                tone: "boxed",
                icon: "container",
                bounds: [340, 112, 304, 234],
                nested: true,
            },
            {
                id: "egress",
                label: "Controlled egress",
                caption: "Host-enforced network policy",
                tone: "exits",
                icon: "private",
                bounds: [712, 112, 264, 234],
            },
            {
                id: "github",
                label: "GitHub",
                caption: "Authenticated model requests",
                tone: "github",
                icon: "cloud",
                bounds: [712, 382, 264, 226],
            },
        ],
        nodes: [
            {
                id: "app",
                label: "Your app + SDK",
                caption: "External runtime connection",
                icon: "app",
                boundary: "machine",
                bounds: [56, 188, 200, 96],
            },
            {
                id: "runtime",
                label: "Headless runtime",
                caption: "No public listener",
                icon: "runtime",
                boundary: "container",
                bounds: [368, 188, 248, 96],
            },
            {
                id: "workspace",
                label: "Workspace",
                caption: "Scoped files",
                icon: "workspace",
                boundary: "machine",
                bounds: [312, 452, 156, 96],
            },
            {
                id: "state",
                label: "Session state",
                caption: "Durable volume",
                icon: "storage",
                boundary: "machine",
                bounds: [504, 452, 156, 96],
            },
            {
                id: "secret",
                label: "Secret source",
                caption: "Injected at startup",
                icon: "credential",
                boundary: "machine",
                bounds: [56, 452, 200, 96],
            },
            {
                id: "egress",
                label: "Egress allowlist",
                caption: "Proxy / network rules",
                icon: "gateway",
                boundary: "egress",
                bounds: [736, 188, 216, 96],
            },
            {
                id: "copilot",
                label: "GitHub Copilot",
                caption: "Token owner's entitlement",
                icon: "copilot",
                boundary: "github",
                bounds: [736, 452, 216, 96],
            },
        ],
        connections: [
            {
                from: ["app", "right"],
                to: ["runtime", "left"],
                label: "TCP :4321",
                labelAt: [312, 220],
                kind: "flow",
                bidirectional: true,
            },
            {
                from: ["runtime", "right"],
                to: ["egress", "left"],
                label: "proxy",
                labelAt: [676, 220],
                kind: "flow",
            },
            {
                from: ["egress", "right"],
                to: ["copilot", "right"],
                via: [
                    [984, 236],
                    [984, 500],
                ],
                label: "HTTPS",
                labelAt: [946, 366],
                kind: "flow",
            },
            {
                from: ["secret", "top"],
                to: ["runtime", "left", 0.75],
                via: [
                    [156, 332],
                    [316, 332],
                    [316, 260],
                ],
                label: "inject token",
                labelAt: [235, 332],
                kind: "support",
            },
            {
                from: ["runtime", "bottom", 0.25],
                to: ["workspace", "top"],
                via: [
                    [430, 384],
                    [390, 384],
                ],
                label: "mount",
                labelAt: [424, 419],
                kind: "support",
            },
            {
                from: ["runtime", "bottom", 0.75],
                to: ["state", "top"],
                via: [
                    [554, 384],
                    [582, 384],
                ],
                label: "persist",
                labelAt: [623, 419],
                kind: "support",
            },
        ],
    },
    cloud: {
        height: 590,
        boundaries: [
            {
                id: "app",
                label: "Your application",
                caption: "You own the experience",
                tone: "yours",
                icon: "machine",
                bounds: [24, 40, 256, 512],
            },
            {
                id: "github",
                label: "GitHub-managed",
                caption: "Compute, session brokering & worker lifecycle",
                tone: "github",
                icon: "cloud",
                bounds: [336, 40, 640, 512],
            },
            {
                id: "control",
                label: "Control plane",
                tone: "trust",
                icon: "platform",
                bounds: [360, 128, 272, 400],
                nested: true,
            },
            {
                id: "worker",
                label: "Hosted execution",
                tone: "boxed",
                icon: "container",
                bounds: [688, 128, 264, 400],
                nested: true,
            },
        ],
        nodes: [
            {
                id: "app",
                label: "Your app + SDK",
                caption: "Prompts & streamed events",
                icon: "app",
                boundary: "app",
                bounds: [52, 186, 200, 96],
            },
            {
                id: "identity",
                label: "User identity",
                caption: "Copilot entitlement",
                icon: "credential",
                boundary: "app",
                bounds: [52, 414, 200, 88],
            },
            {
                id: "mission-control",
                label: "Mission Control",
                caption: "Provision & broker",
                icon: "control",
                boundary: "control",
                bounds: [388, 186, 216, 96],
            },
            {
                id: "worker",
                label: "Hosted worker",
                caption: "Runtime + remote tools",
                icon: "worker",
                boundary: "worker",
                bounds: [712, 186, 216, 96],
            },
            {
                id: "repo",
                label: "Repository",
                caption: "Working copy & branch",
                icon: "repository",
                boundary: "worker",
                bounds: [712, 414, 216, 88],
            },
            {
                id: "policy",
                label: "Org policies",
                caption: "Access & remote control",
                icon: "policy",
                boundary: "control",
                bounds: [388, 414, 216, 88],
            },
        ],
        connections: [
            {
                from: ["app", "right"],
                to: ["mission-control", "left"],
                label: "session API",
                labelAt: [320, 218],
                kind: "flow",
                bidirectional: true,
            },
            {
                from: ["mission-control", "right"],
                to: ["worker", "left"],
                label: "relay",
                labelAt: [658, 218],
                kind: "flow",
                bidirectional: true,
            },
            {
                from: ["identity", "top"],
                to: ["app", "bottom"],
                label: "user token",
                labelAt: [203, 349],
                kind: "support",
            },
            {
                from: ["policy", "top"],
                to: ["mission-control", "bottom"],
                label: "org policy",
                labelAt: [547, 349],
                kind: "support",
            },
            {
                from: ["worker", "bottom"],
                to: ["repo", "top"],
                label: "checkout",
                labelAt: [866, 349],
                kind: "flow",
            },
        ],
    },
    production: {
        height: 854,
        boundaries: [
            {
                id: "edge",
                label: "Public edge",
                caption: "Untrusted callers",
                tone: "public",
                icon: "public",
                bounds: [24, 32, 188, 606],
            },
            {
                id: "private",
                label: "Private network",
                caption: "Only the backend can reach the runtime",
                tone: "private",
                icon: "private",
                bounds: [244, 32, 732, 606],
            },
            {
                id: "execution",
                label: "Isolated workloads",
                caption: "Host-enforced boundaries",
                tone: "boxed",
                icon: "container",
                bounds: [524, 264, 236, 358],
                nested: true,
            },
            {
                id: "exits",
                label: "Controlled exits",
                tone: "exits",
                icon: "private",
                bounds: [776, 104, 192, 518],
                nested: true,
            },
            {
                id: "trust",
                label: "Shared platform services",
                tone: "trust",
                icon: "platform",
                bounds: [244, 684, 732, 146],
            },
        ],
        nodes: [
            {
                id: "clients",
                label: "Clients",
                caption: "App users",
                icon: "users",
                boundary: "edge",
                bounds: [40, 152, 156, 92],
            },
            {
                id: "gateway",
                label: "API gateway",
                caption: "TLS / auth / WAF",
                icon: "gateway",
                boundary: "edge",
                bounds: [40, 338, 156, 104],
            },
            {
                id: "backend",
                label: "Agent backend",
                caption: "Your harness + SDK",
                icon: "app",
                boundary: "private",
                bounds: [284, 338, 180, 104],
            },
            {
                id: "policy",
                label: "Policy & approvals",
                caption: "Host-side decisions",
                icon: "policy",
                boundary: "private",
                bounds: [284, 152, 180, 92],
            },
            {
                id: "runtime",
                label: "Runtime pool",
                caption: "Private JSON-RPC",
                icon: "runtime",
                boundary: "execution",
                bounds: [552, 338, 184, 104],
                replicated: true,
            },
            {
                id: "sandbox",
                label: "Tool sandbox",
                caption: "Disposable execution",
                icon: "sandbox",
                boundary: "execution",
                bounds: [552, 514, 184, 88],
            },
            {
                id: "inference",
                label: "Model gateway",
                caption: "Copilot / BYOK",
                icon: "models",
                boundary: "exits",
                bounds: [796, 152, 156, 92],
            },
            {
                id: "mcp",
                label: "MCP / API gateway",
                caption: "Approved APIs",
                icon: "mcp",
                boundary: "exits",
                bounds: [796, 338, 156, 104],
            },
            {
                id: "egress",
                label: "Egress proxy",
                caption: "Allowlisted URLs",
                icon: "gateway",
                boundary: "exits",
                bounds: [796, 514, 156, 88],
            },
            {
                id: "secrets",
                label: "Credential broker",
                caption: "Short-lived identity",
                icon: "credential",
                boundary: "trust",
                bounds: [268, 730, 216, 80],
            },
            {
                id: "state",
                label: "Session store",
                caption: "Tenant-isolated state",
                icon: "storage",
                boundary: "trust",
                bounds: [500, 730, 216, 80],
            },
            {
                id: "audit",
                label: "Audit & telemetry",
                caption: "Traces & kill switch",
                icon: "audit",
                boundary: "trust",
                bounds: [732, 730, 224, 80],
            },
        ],
        connections: [
            {
                from: ["clients", "bottom"],
                to: ["gateway", "top"],
                label: "HTTPS",
                labelAt: [151, 291],
                kind: "flow",
            },
            {
                from: ["gateway", "right"],
                to: ["backend", "left"],
                label: "auth",
                labelAt: [240, 374],
                kind: "flow",
            },
            {
                from: ["policy", "bottom"],
                to: ["backend", "top"],
                label: "approve",
                labelAt: [416, 291],
                kind: "support",
            },
            {
                from: ["backend", "right"],
                to: ["runtime", "left"],
                label: "JSON-RPC",
                labelAt: [508, 374],
                kind: "flow",
                bidirectional: true,
            },
            {
                from: ["backend", "bottom", 0.75],
                to: ["sandbox", "left"],
                via: [[419, 558]],
                label: "tool call",
                labelAt: [465, 542],
                kind: "flow",
            },
            {
                from: ["runtime", "right", 0.25],
                to: ["inference", "left"],
                via: [
                    [764, 364],
                    [764, 198],
                ],
                label: "models",
                labelAt: [764, 278],
                kind: "flow",
            },
            {
                from: ["runtime", "right"],
                to: ["mcp", "left"],
                label: "tools",
                labelAt: [766, 374],
                kind: "flow",
            },
            {
                from: ["sandbox", "right"],
                to: ["egress", "left"],
                label: "HTTP",
                labelAt: [766, 542],
                kind: "flow",
            },
            {
                from: ["secrets", "left"],
                to: ["backend", "left", 0.8],
                via: [
                    [228, 770],
                    [228, 664],
                    [258, 664],
                    [258, 421.2],
                ],
                label: "credentials",
                labelAt: [228, 670],
                kind: "support",
            },
            {
                from: ["runtime", "bottom"],
                to: ["state", "top"],
                via: [
                    [644, 472],
                    [500, 472],
                    [500, 666],
                    [608, 666],
                ],
                label: "state",
                labelAt: [550, 666],
                kind: "support",
            },
            {
                from: ["backend", "bottom", 0.25],
                to: ["audit", "top"],
                via: [
                    [329, 650],
                    [844, 650],
                ],
                label: "events",
                labelAt: [747, 650],
                kind: "support",
            },
        ],
    },
};

function portPoint(layout: HostingDiagramLayout, [id, side, offset = 0.5]: DiagramPort): DiagramPoint {
    const node = layout.nodes.find((entry) => entry.id === id);
    if (!node) throw new RangeError(`Unknown architecture node: ${id}`);
    const [x, y, width, height] = node.bounds;
    switch (side) {
        case "top":
            return [x + width * offset, y];
        case "right":
            return [x + width, y + height * offset];
        case "bottom":
            return [x + width * offset, y + height];
        case "left":
            return [x, y + height * offset];
    }
}

export function connectionPoints(
    layout: HostingDiagramLayout,
    connection: DiagramConnection,
): DiagramPoint[] {
    return [portPoint(layout, connection.from), ...(connection.via ?? []), portPoint(layout, connection.to)];
}

export function connectionLabelBounds(connection: DiagramConnection): DiagramBounds {
    const [x, y] = connection.labelAt;
    const width = connection.label.length * 7.8 + 14;
    return [x - width / 2, y - 11, width, 22];
}
