// Copyright (c) Microsoft Corporation. All rights reserved.
import {
    Activity,
    ArrowDown,
    ArrowUpRight,
    Braces,
    ChevronRight,
    CircleDot,
    Cpu,
    Fingerprint,
    Layers3,
} from "lucide-react";
import { analyzePlan, hostContracts, toolSummary } from "../domain/analysis";
import type { Decision } from "../domain/analysis";
import type { HarnessPlan } from "../domain/plan";
import type { Evidence } from "./editor";
import { Badge, Button } from "./ui";

const providerLabels = {
    copilot: "GitHub Copilot",
    openai: "OpenAI",
    azure: "Azure OpenAI",
    anthropic: "Anthropic",
};
const decisionLabels = { host: "Host", review: "Review", gap: "Boundary" };

export function PlanInspector({
    plan,
    onEvidence,
    onExport,
    exportDisabled,
}: {
    plan: HarnessPlan;
    onEvidence: (evidence: Evidence) => void;
    onExport: () => void;
    exportDisabled: boolean;
}) {
    const summary = toolSummary(plan);
    const contracts = Array.from(new Set(hostContracts(plan)));
    const decisions = analyzePlan(plan);
    return (
        <aside className="hb-inspector" aria-labelledby="live-plan-heading" tabIndex={0}>
            <div className="hb-inspector-header">
                <div>
                    <p className="hb-kicker">Your composition</p>
                    <h2 id="live-plan-heading">Live plan</h2>
                </div>
                <span className="hb-live-indicator">
                    <CircleDot size={13} aria-hidden="true" />
                    Local preview
                </span>
            </div>
            <section
                className="hb-runtime-map"
                aria-label="Host to capabilities to shared runtime to provider and events"
            >
                <div className="hb-map-node">
                    <Fingerprint size={17} aria-hidden="true" />
                    <div>
                        <strong>Your application host</strong>
                        <span>Identity, permissions, handlers</span>
                    </div>
                </div>
                <ArrowDown className="hb-map-arrow" size={15} aria-hidden="true" />
                <div className="hb-map-node">
                    <Layers3 size={17} aria-hidden="true" />
                    <div>
                        <strong>Capabilities &amp; context</strong>
                        <span>
                            {summary.knownVisible} known local tools + {summary.mcpTools} MCP
                            {summary.inherited ? " + inherited" : ""}
                        </span>
                    </div>
                </div>
                <ArrowDown className="hb-map-arrow" size={15} aria-hidden="true" />
                <div className="hb-map-node hb-map-runtime">
                    <Cpu size={21} aria-hidden="true" />
                    <div>
                        <strong>Same Copilot runtime</strong>
                        <span>Shared execution engine</span>
                    </div>
                </div>
                <ArrowDown className="hb-map-arrow" size={15} aria-hidden="true" />
                <div className="hb-map-node">
                    <Activity size={17} aria-hidden="true" />
                    <div>
                        <strong>{providerLabels[plan.model.provider]}</strong>
                        <span>
                            {plan.events.streaming ? "Streaming" : "Non-streaming"} /{" "}
                            {plan.events.observer ? "host event observer" : "no observer binding"}
                        </span>
                    </div>
                </div>
            </section>
            <section className="hb-inspector-section">
                <div className="hb-inspector-section-heading">
                    <h3>Known inventory</h3>
                    <Badge accent={!summary.inherited}>
                        {summary.inherited ? "Inherited + selected" : "Explicit"}
                    </Badge>
                </div>
                <dl className="hb-count-grid">
                    <div>
                        <dt>Kept</dt>
                        <dd>{summary.kept.length}</dd>
                    </div>
                    <div>
                        <dt>Overrides</dt>
                        <dd>{summary.overridden.length}</dd>
                    </div>
                    <div>
                        <dt>Custom</dt>
                        <dd>{plan.customTools.length}</dd>
                    </div>
                    <div>
                        <dt>MCP tools</dt>
                        <dd>{summary.mcpTools}</dd>
                    </div>
                </dl>
                <p className="hb-inspector-note">
                    {summary.removed.length} primary tools removed.{" "}
                    {summary.inherited
                        ? "Unlisted coding tools can remain inherited."
                        : "The primary built-in list is curated, not the entire native catalog."}
                </p>
            </section>
            <section className="hb-inspector-section">
                <div className="hb-inspector-section-heading">
                    <h3>Required host contracts</h3>
                    <Badge>{contracts.length}</Badge>
                </div>
                <ul className="hb-contract-list">
                    {contracts.slice(0, 5).map((contract) => (
                        <li key={contract}>
                            <Braces size={13} aria-hidden="true" />
                            <span>{contract}</span>
                        </li>
                    ))}
                </ul>
                {contracts.length > 5 && (
                    <details className="hb-inspector-details">
                        <summary>Show {contracts.length - 5} more bindings</summary>
                        <ul className="hb-contract-list">
                            {contracts.slice(5).map((contract) => (
                                <li key={contract}>
                                    <Braces size={13} aria-hidden="true" />
                                    <span>{contract}</span>
                                </li>
                            ))}
                        </ul>
                    </details>
                )}
                <p className="hb-inspector-note">
                    Declarations are not implementations. Supply these in your host before using the SDK
                    sketch.
                </p>
            </section>
            <section className="hb-inspector-section">
                <div className="hb-inspector-section-heading">
                    <h3>Decisions to make</h3>
                    <Badge>{decisions.length}</Badge>
                </div>
                <div className="hb-decision-list">
                    {decisions.slice(0, 5).map((decision) => (
                        <DecisionButton key={decision.id} decision={decision} onEvidence={onEvidence} />
                    ))}
                </div>
                {decisions.length > 5 && (
                    <details className="hb-inspector-details">
                        <summary>Show {decisions.length - 5} more decisions</summary>
                        <div className="hb-decision-list">
                            {decisions.slice(5).map((decision) => (
                                <DecisionButton
                                    key={decision.id}
                                    decision={decision}
                                    onEvidence={onEvidence}
                                />
                            ))}
                        </div>
                    </details>
                )}
                {decisions.length === 0 && (
                    <p className="hb-inspector-note">
                        No additional scenario decisions were detected. Host implementation and workload
                        evaluation are still required.
                    </p>
                )}
            </section>
            <div className="hb-inspector-footer">
                <Button onClick={onExport} disabled={exportDisabled}>
                    Inspect the SDK sketch
                    <ArrowUpRight size={15} aria-hidden="true" />
                </Button>
                <p>Configuration planning only. Nothing is running.</p>
            </div>
        </aside>
    );
}

function DecisionButton({
    decision,
    onEvidence,
}: {
    decision: Decision;
    onEvidence: (evidence: Evidence) => void;
}) {
    return (
        <button className="hb-decision" onClick={() => onEvidence({ kind: "decision", value: decision })}>
            <span>
                <span className="hb-decision-kind">{decisionLabels[decision.kind]}</span>
                <strong>{decision.title}</strong>
            </span>
            <ChevronRight size={15} aria-hidden="true" />
        </button>
    );
}
