// Copyright (c) Microsoft Corporation. All rights reserved.
import { useState } from "react";
import type { LucideIcon } from "lucide-react";
import { Cloud, Container, Laptop, Server } from "lucide-react";
import { hostingRung, hostingRungs, planHostingRung, rungNodes } from "../content/hosting";
import type { HostingRungId } from "../content/hosting";
import { hostingDiagrams } from "../content/hosting-diagrams";
import type { HarnessPlan } from "../domain/plan";
import { HostingDiagram, HostingNodeIcon } from "./HostingDiagram";
import { Badge } from "./ui";
import "../hosting-guide.css";

const rungIcons: Record<HostingRungId, LucideIcon> = {
    personal: Laptop,
    container: Container,
    cloud: Cloud,
    production: Server,
};

export function HostingGuide({ plan }: { plan: HarnessPlan }) {
    const match = planHostingRung(plan);
    const [selectedRung, setSelectedRung] = useState<HostingRungId>(match.id);
    const rung = hostingRung(selectedRung);
    const nodes = rungNodes(rung);
    const [selectedNodes, setSelectedNodes] = useState<Partial<Record<HostingRungId, string>>>({});
    const node = nodes.find((entry) => entry.id === selectedNodes[rung.id]) ?? nodes[0]!;
    const zoneOf = (id: string) =>
        [...rung.zones, ...(rung.band ? [rung.band] : [])].find((zone) =>
            zone.nodes.some((entry) => entry.id === id),
        );
    const diagramNode = hostingDiagrams[rung.id].nodes.find((entry) => entry.id === node.id)!;

    return (
        <div className="hb-editor-stack hg-guide">
            <div className="hg-options" role="group" aria-label="Hosting options">
                {hostingRungs.map((entry) => {
                    const Icon = rungIcons[entry.id];
                    return (
                        <button
                            key={entry.id}
                            type="button"
                            className="hg-option"
                            aria-pressed={entry.id === rung.id}
                            aria-controls="hosting-architecture"
                            onClick={() => setSelectedRung(entry.id)}
                        >
                            <span className="hg-option-top">
                                <Icon size={18} aria-hidden="true" />
                                <span className="hg-option-step">{entry.step}</span>
                                {entry.id === match.id && <Badge accent>Your plan</Badge>}
                            </span>
                            <strong>{entry.title}</strong>
                            <small>{entry.tagline}</small>
                        </button>
                    );
                })}
            </div>

            <section
                id="hosting-architecture"
                className="hg-architecture"
                aria-labelledby="hosting-arch-title"
            >
                <header className="hg-arch-header">
                    <p className="hb-kicker">Reference architecture</p>
                    <h3 id="hosting-arch-title">{rung.title}</h3>
                    <p>{rung.summary}</p>
                    {rung.id === match.id && <p className="hg-match">{match.reason}</p>}
                </header>

                <HostingDiagram
                    key={rung.id}
                    rung={rung}
                    selectedNode={node.id}
                    onSelectNode={(id) => setSelectedNodes((current) => ({ ...current, [rung.id]: id }))}
                />

                <article id="hosting-node-detail" className="hg-detail" aria-live="polite">
                    <header className="hg-detail-heading">
                        <span className="hg-detail-icon">
                            <HostingNodeIcon icon={diagramNode.icon} />
                        </span>
                        <div>
                            <p className="hb-kicker">{zoneOf(node.id)?.label}</p>
                            <h4>{node.name}</h4>
                        </div>
                    </header>
                    <div className="hg-detail-body">
                        <p>{node.purpose}</p>
                        <p className="hg-watch">
                            <strong>Watch out</strong>
                            {node.watchOut}
                        </p>
                    </div>
                    <div className="hg-seams">
                        <span>Where it shows up</span>
                        <ul className="hb-chip-list">
                            {node.seams.map((seam) => (
                                <li key={seam} className="hg-chip">
                                    {seam}
                                </li>
                            ))}
                        </ul>
                    </div>
                </article>
            </section>
        </div>
    );
}
