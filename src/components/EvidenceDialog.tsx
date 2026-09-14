// Copyright (c) Microsoft Corporation. All rights reserved.
import { ArrowRight, ExternalLink } from "lucide-react";
import { getSource, reference } from "../content/reference";
import type { ReferenceGap } from "../content/reference";
import { controlCoverage, scopeLabel } from "./reference-ui";
import type { Evidence, ViewId } from "./editor";
import { Badge, Button, Modal, Notice } from "./ui";

const decisionLabels = { host: "Host requirement", review: "Review decision", gap: "Integration boundary" };
const relatedGapIds: Record<string, string[]> = {
    override: ["gap-live-plugins"],
    "virtual-storage": ["gap-storage"],
    "file-packs": ["gap-skills", "gap-live-plugins"],
    provider: ["gap-output"],
};

export function EvidenceDialog({
    evidence,
    onClose,
    onNavigate,
}: {
    evidence: Evidence;
    onClose: () => void;
    onNavigate: (view: ViewId) => void;
}) {
    const title =
        evidence.kind === "topic"
            ? evidence.title
            : evidence.kind === "control"
              ? evidence.value.name
              : evidence.value.title;
    const sources =
        evidence.kind === "topic"
            ? evidence.sources
            : evidence.kind === "control"
              ? [evidence.value.source]
              : evidence.value.sources;
    const related =
        evidence.kind === "decision"
            ? reference.gaps.filter((gap) => relatedGapIds[evidence.value.id]?.includes(gap.id))
            : [];
    const coverage = evidence.kind === "control" ? controlCoverage(evidence.value.name) : null;
    return (
        <Modal
            open
            onOpenChange={(open) => {
                if (!open) onClose();
            }}
            title={title}
            description="Source-backed guidance from the pinned SDK and runtime snapshot. Scope and lifecycle matter."
            size="drawer"
        >
            <div className="hb-evidence-stack">
                {evidence.kind === "decision" && (
                    <>
                        <Badge accent>{decisionLabels[evidence.value.kind]}</Badge>
                        <section className="hb-evidence-section">
                            <h3>What to implement or review</h3>
                            <p>{evidence.value.detail}</p>
                        </section>
                    </>
                )}
                {evidence.kind === "topic" && <p className="hb-evidence-lead">{evidence.detail}</p>}
                {evidence.kind === "control" && (
                    <>
                        <p className="hb-evidence-lead">{evidence.value.description}</p>
                        <dl className="hb-evidence-facts">
                            <div>
                                <dt>Scope</dt>
                                <dd>{evidence.value.scopes.map(scopeLabel).join(" / ")}</dd>
                            </div>
                            <div>
                                <dt>Lifecycle</dt>
                                <dd>{evidence.value.when}</dd>
                            </div>
                            <div>
                                <dt>Status</dt>
                                <dd>{evidence.value.stability}</dd>
                            </div>
                            <div>
                                <dt>Builder coverage</dt>
                                <dd>{coverage?.label}</dd>
                            </div>
                        </dl>
                        <Notice title="The catalog is broader than this editor">
                            {coverage?.view
                                ? "This builder exposes a scoped planning subset or a required host binding for this control. It does not edit every SDK option or bind executable callbacks."
                                : "This source control is reference-only in the first builder. No editable or live implementation is implied."}{" "}
                            All exported compositions describe new sessions, not live patches.
                        </Notice>
                        {coverage?.view && (
                            <Button
                                onClick={() => {
                                    if (coverage.view) onNavigate(coverage.view);
                                    onClose();
                                }}
                            >
                                Open related editor
                                <ArrowRight size={15} aria-hidden="true" />
                            </Button>
                        )}
                    </>
                )}
                {evidence.kind === "gap" && <GapDetails gap={evidence.value} />}
                {related.map((gap) => (
                    <details className="hb-related-gap" key={gap.id}>
                        <summary>Related boundary: {gap.title}</summary>
                        <GapDetails gap={gap} />
                        <SourceList ids={gap.sources} />
                    </details>
                ))}
                <section className="hb-evidence-section">
                    <h3>Evidence</h3>
                    <p className="hb-field-hint">
                        Links open the exact inspected revision. Some require GitHub organization access.
                    </p>
                    <SourceList ids={sources} />
                </section>
                <div className="hb-source-revisions">
                    <span>Snapshot {reference.asOf}</span>
                    <span>
                        SDK <code title={reference.revisions.sdk}>{reference.revisions.sdk.slice(0, 7)}</code>
                    </span>
                    <span>
                        Runtime{" "}
                        <code title={reference.revisions.runtime}>
                            {reference.revisions.runtime.slice(0, 7)}
                        </code>
                    </span>
                </div>
            </div>
        </Modal>
    );
}

function GapDetails({ gap }: { gap: ReferenceGap }) {
    return (
        <div className="hb-evidence-stack">
            <Badge accent>{gap.status}</Badge>
            <p>{gap.summary}</p>
            <section className="hb-evidence-section">
                <h3>What exists today</h3>
                <p>{gap.runtime}</p>
            </section>
            <section className="hb-evidence-section">
                <h3>The precise limit</h3>
                <p>{gap.boundary}</p>
            </section>
            <section className="hb-evidence-section">
                <h3>Integration path / opportunity</h3>
                <p>{gap.opportunity}</p>
            </section>
        </div>
    );
}

function SourceList({ ids }: { ids: string[] }) {
    return (
        <ul className="hb-source-list">
            {Array.from(new Set(ids)).map((id) => {
                const source = getSource(id);
                return (
                    <li key={id}>
                        {source.url ? (
                            <a href={source.url} target="_blank" rel="noopener noreferrer">
                                {source.label}
                                <ExternalLink size={13} aria-hidden="true" />
                                <span className="hb-sr-only"> (opens source in a new tab)</span>
                            </a>
                        ) : (
                            <strong>{source.label}</strong>
                        )}
                        <p>{source.scope}</p>
                    </li>
                );
            })}
        </ul>
    );
}
