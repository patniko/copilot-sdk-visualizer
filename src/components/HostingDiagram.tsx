// Copyright (c) Microsoft Corporation. All rights reserved.
import { useId } from "react";
import type { CSSProperties } from "react";
import type { LucideIcon } from "lucide-react";
import {
    AppWindow,
    Boxes,
    Cloud,
    Container,
    Cpu,
    Database,
    FolderGit2,
    GitBranch,
    Globe,
    KeyRound,
    Laptop,
    Layers,
    LockKeyhole,
    MonitorSmartphone,
    MousePointer2,
    Network,
    ScanLine,
    ScrollText,
    ShieldCheck,
    Terminal,
    Users,
    Workflow,
} from "lucide-react";
import { rungNodes } from "../content/hosting";
import type { HostingRung } from "../content/hosting";
import {
    connectionLabelBounds,
    connectionPoints,
    DIAGRAM_WIDTH,
    hostingDiagrams,
} from "../content/hosting-diagrams";
import type { DiagramBounds, DiagramIcon } from "../content/hosting-diagrams";
import { CopilotMark } from "./CopilotMark";

const nodeIcons: Record<Exclude<DiagramIcon, "copilot">, LucideIcon> = {
    app: AppWindow,
    runtime: Cpu,
    tools: Terminal,
    remote: MonitorSmartphone,
    credential: KeyRound,
    storage: Database,
    workspace: FolderGit2,
    gateway: ShieldCheck,
    control: Workflow,
    worker: Boxes,
    repository: GitBranch,
    policy: ShieldCheck,
    users: Users,
    sandbox: Container,
    models: Network,
    mcp: ScanLine,
    audit: ScrollText,
};

const boundaryIcons = {
    machine: Laptop,
    cloud: Cloud,
    container: Container,
    private: LockKeyhole,
    public: Globe,
    platform: Layers,
    runtime: Cpu,
};

function nodeStyle([x, y, width, height]: DiagramBounds, diagramHeight: number): CSSProperties {
    return {
        left: `${(x / DIAGRAM_WIDTH) * 100}%`,
        top: `${(y / diagramHeight) * 100}%`,
        width: `${(width / DIAGRAM_WIDTH) * 100}%`,
        height: `${(height / diagramHeight) * 100}%`,
    };
}

export function HostingNodeIcon({ icon }: { icon: DiagramIcon }) {
    if (icon === "copilot") return <CopilotMark size={30} />;
    const Icon = nodeIcons[icon];
    return <Icon size={24} strokeWidth={1.6} aria-hidden="true" />;
}

export function HostingDiagram({
    rung,
    selectedNode,
    onSelectNode,
}: {
    rung: HostingRung;
    selectedNode: string;
    onSelectNode: (id: string) => void;
}) {
    const id = useId();
    const layout = hostingDiagrams[rung.id];
    const content = new Map(rungNodes(rung).map((node) => [node.id, node]));
    const connections = layout.connections.map((edge) => ({
        ...edge,
        active: edge.from[0] === selectedNode || edge.to[0] === selectedNode,
    }));
    const connected = new Set(
        connections.filter((edge) => edge.active).flatMap((edge) => [edge.from[0], edge.to[0]]),
    );

    return (
        <div className="hg-diagram" role="group" aria-label={`${rung.title} architecture`}>
            <div className="hg-map-toolbar">
                <span className="hg-map-instruction">
                    <MousePointer2 size={14} aria-hidden="true" />
                    Select a component to explore
                </span>
                <div className="hg-map-legend" aria-label="Connection legend">
                    <span>
                        <i className="hg-legend-flow" />
                        Requests &amp; tools
                    </span>
                    <span>
                        <i className="hg-legend-support" />
                        Control &amp; state
                    </span>
                </div>
            </div>
            <p className="hg-scroll-hint" id={`${id}-scroll-hint`}>
                Scroll across to explore the architecture.
            </p>
            <div
                className="hg-map-viewport"
                role="region"
                aria-label={`${rung.title} diagram canvas`}
                aria-describedby={`${id}-scroll-hint`}
                tabIndex={0}
            >
                <div className="hg-map" style={{ aspectRatio: `${DIAGRAM_WIDTH} / ${layout.height}` }}>
                    <svg
                        className="hg-map-drawing"
                        viewBox={`0 0 ${DIAGRAM_WIDTH} ${layout.height}`}
                        aria-hidden="true"
                    >
                        <defs>
                            {(["flow", "support", "active"] as const).map((kind) => (
                                <marker
                                    key={kind}
                                    id={`${id}-arrow-${kind}`}
                                    viewBox="0 0 10 10"
                                    refX="9"
                                    refY="5"
                                    markerWidth="9"
                                    markerHeight="9"
                                    markerUnits="userSpaceOnUse"
                                    orient="auto-start-reverse"
                                >
                                    <path
                                        className={`hg-arrowhead hg-arrowhead-${kind}`}
                                        d="M 2 1 L 8 5 L 2 9"
                                    />
                                </marker>
                            ))}
                        </defs>
                        {layout.boundaries.map((boundary) => {
                            const [x, y, width, height] = boundary.bounds;
                            const Icon = boundaryIcons[boundary.icon];
                            return (
                                <g
                                    key={boundary.id}
                                    className="hg-boundary"
                                    data-tone={boundary.tone}
                                    data-nested={boundary.nested}
                                >
                                    <rect x={x} y={y} width={width} height={height} rx="14" />
                                    <Icon x={x + 16} y={y + 16} width={16} height={16} strokeWidth={1.6} />
                                    <text className="hg-boundary-label" x={x + 40} y={y + 28}>
                                        {boundary.label}
                                    </text>
                                    {boundary.caption && (
                                        <text className="hg-boundary-caption" x={x + 16} y={y + 49}>
                                            {boundary.caption}
                                        </text>
                                    )}
                                </g>
                            );
                        })}
                        {connections.map((edge) => {
                            const points = connectionPoints(layout, edge);
                            const path = points
                                .map(([x, y], index) => `${index ? "L" : "M"} ${x} ${y}`)
                                .join(" ");
                            const marker = `url(#${id}-arrow-${edge.active ? "active" : edge.kind})`;
                            return (
                                <g
                                    key={`${edge.from[0]}-${edge.to[0]}`}
                                    className="hg-connection"
                                    data-kind={edge.kind}
                                    data-active={edge.active}
                                    data-from={edge.from[0]}
                                    data-to={edge.to[0]}
                                >
                                    <path className="hg-wire-casing" d={path} />
                                    <path
                                        className="hg-wire"
                                        d={path}
                                        markerEnd={marker}
                                        markerStart={edge.bidirectional ? marker : undefined}
                                    />
                                </g>
                            );
                        })}
                        {connections.map((edge) => {
                            const [x, y, width, height] = connectionLabelBounds(edge);
                            const [labelX, labelY] = edge.labelAt;
                            return (
                                <g
                                    key={`${edge.from[0]}-${edge.to[0]}`}
                                    className="hg-connection-label"
                                    data-active={edge.active}
                                >
                                    <rect
                                        className="hg-wire-label-bg"
                                        x={x}
                                        y={y}
                                        width={width}
                                        height={height}
                                        rx="5"
                                    />
                                    <text
                                        className="hg-wire-label"
                                        x={labelX}
                                        y={labelY}
                                        dominantBaseline="central"
                                        textAnchor="middle"
                                    >
                                        {edge.label}
                                    </text>
                                </g>
                            );
                        })}
                    </svg>
                    {layout.nodes.map((node) => (
                        <button
                            key={node.id}
                            type="button"
                            className="hg-node"
                            style={nodeStyle(node.bounds, layout.height)}
                            data-node-id={node.id}
                            data-icon={node.icon}
                            data-compact={node.bounds[2] < 180}
                            data-replicated={node.replicated}
                            data-connected={connected.has(node.id)}
                            aria-label={content.get(node.id)!.name}
                            aria-pressed={selectedNode === node.id}
                            aria-controls="hosting-node-detail"
                            onClick={() => onSelectNode(node.id)}
                        >
                            <span className="hg-node-icon">
                                <HostingNodeIcon icon={node.icon} />
                            </span>
                            <span className="hg-node-copy">
                                <strong>{node.label}</strong>
                                <small>{node.caption}</small>
                            </span>
                            <span className="hg-node-port" aria-hidden="true" />
                        </button>
                    ))}
                </div>
            </div>
            <ul className="hb-sr-only" aria-label="Architecture connections">
                {layout.connections.map((edge) => (
                    <li key={`${edge.from[0]}-${edge.to[0]}`}>
                        {content.get(edge.from[0])!.name}{" "}
                        {edge.bidirectional ? "exchanges with" : "connects to"}{" "}
                        {content.get(edge.to[0])!.name}: {edge.label}.
                    </li>
                ))}
            </ul>
        </div>
    );
}
