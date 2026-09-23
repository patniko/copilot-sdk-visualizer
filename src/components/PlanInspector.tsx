// Copyright (c) Microsoft Corporation. All rights reserved.
import { Activity, ArrowDown, Download, Braces, ChevronRight, Layers3, PanelRightClose } from "lucide-react";
import { analyzePlan, hostContracts, toolSummary } from "../domain/analysis";
import type { Decision } from "../domain/analysis";
import type { HarnessPlan } from "../domain/plan";
import { BUILTIN_NAMES, BUILTIN_SPECS, toolCatalog } from "../content/builtin-tools";
import type { Evidence } from "./editor";
import { RuntimePlacement } from "./RuntimePlacement";
import { referenceBaselineNames, referenceDefaultGroups } from "./tool-catalog-ui";
import { Badge, Button } from "./ui";
import "../tool-catalog.css";

const providerLabels = {
    copilot: "GitHub Copilot",
    openai: "OpenAI",
    azure: "Azure OpenAI",
    anthropic: "Anthropic",
};
const decisionLabels = { host: "Host work", review: "Choice", gap: "Boundary" };

export function PlanInspector({
    plan,
    onEvidence,
    onExport,
    onCollapse,
    exportDisabled,
}: {
    plan: HarnessPlan;
    onEvidence: (evidence: Evidence) => void;
    onExport: () => void;
    onCollapse: () => void;
    exportDisabled: boolean;
}) {
    const summary = toolSummary(plan);
    const contracts = Array.from(new Set(hostContracts(plan)));
    const decisions = analyzePlan(plan);
    const unverifiedOverrides = summary.overridden.filter((name) => !BUILTIN_SPECS[name].overrideable);
    return (
        <aside className="hb-inspector" aria-labelledby="live-plan-heading" tabIndex={0}>
            <div className="hb-inspector-header">
                <div>
                    <h2 id="live-plan-heading">Live plan</h2>
                </div>
                <button
                    type="button"
                    className="hb-inspector-toggle"
                    aria-label="Collapse live plan"
                    title="Collapse live plan"
                    onClick={onCollapse}
                >
                    <PanelRightClose size={18} aria-hidden="true" />
                </button>
            </div>
            <section
                className="hb-runtime-map"
                aria-label="Runtime placement, configured capabilities, and provider events"
            >
                <RuntimePlacement target={plan.target} compact />
                <ArrowDown className="hb-map-arrow" size={15} aria-hidden="true" />
                <div className="hb-map-node">
                    <Layers3 size={17} aria-hidden="true" />
                    <div>
                        <strong>Capabilities &amp; context</strong>
                        <span>
                            {summary.inherited
                                ? `Runtime defaults · ${summary.removed.length} exclusions`
                                : `${summary.kept.length} selected built-ins`}
                        </span>
                        <span>
                            {plan.customTools.length} custom · {summary.mcpTools} MCP ·{" "}
                            {summary.overridden.length} overrides
                        </span>
                    </div>
                </div>
                <ArrowDown className="hb-map-arrow" size={15} aria-hidden="true" />
                <div className="hb-map-node">
                    <Activity size={17} aria-hidden="true" />
                    <div>
                        <strong>{providerLabels[plan.model.provider]}</strong>
                        <span>
                            {plan.model.id || "Default model"} ·{" "}
                            {plan.events.streaming ? "streaming" : "non-streaming"}
                        </span>
                    </div>
                </div>
            </section>
            <details className="hb-inspector-section hb-inspector-disclosure">
                <summary>At a glance</summary>
                <dl className="hb-plan-summary-grid">
                    <div>
                        <dt>Tool policy</dt>
                        <dd>{summary.inherited ? "Runtime defaults" : "Explicit selection"}</dd>
                    </div>
                    <div>
                        <dt>Extensions</dt>
                        <dd>{plan.customTools.length + summary.mcpTools}</dd>
                    </div>
                    <div>
                        <dt>Host bindings</dt>
                        <dd>{contracts.length}</dd>
                    </div>
                    <div>
                        <dt>Plan implications</dt>
                        <dd>{decisions.length}</dd>
                    </div>
                </dl>
                {unverifiedOverrides.length > 0 && (
                    <p className="hb-inspector-unverified">
                        {unverifiedOverrides.length} stored override{" "}
                        {unverifiedOverrides.length === 1 ? "request has" : "requests have"} no verified
                        route. SDK/bootstrap generation is blocked for those requests; valid planner JSON can
                        retain them.
                    </p>
                )}
            </details>
            {decisions.length > 0 && (
                <details className="hb-inspector-section hb-inspector-disclosure">
                    <summary>
                        <span>What your choices mean</span>
                        <Badge>{decisions.length}</Badge>
                    </summary>
                    <div className="hb-decision-list">
                        {decisions.slice(0, 3).map((decision) => (
                            <DecisionButton key={decision.id} decision={decision} onEvidence={onEvidence} />
                        ))}
                    </div>
                    {decisions.length > 3 && (
                        <details className="hb-inspector-details">
                            <summary>Show {decisions.length - 3} more</summary>
                            <div className="hb-decision-list">
                                {decisions.slice(3).map((decision) => (
                                    <DecisionButton
                                        key={decision.id}
                                        decision={decision}
                                        onEvidence={onEvidence}
                                    />
                                ))}
                            </div>
                        </details>
                    )}
                </details>
            )}
            <details className="hb-inspector-technical">
                <summary>
                    <span>Technical details</span>
                    <span>{contracts.length} host bindings</span>
                </summary>
                <section className="hb-inspector-section">
                    <div className="hb-inspector-section-heading">
                        <h3>Selection policy</h3>
                        <Badge accent={!summary.inherited}>
                            {summary.inherited ? "Runtime defaults" : "Explicit names"}
                        </Badge>
                    </div>
                    <dl
                        className="hb-count-grid hb-selection-count-grid"
                        aria-label="Plan decisions, not enabled-tool counts"
                    >
                        <div>
                            <dt>{summary.inherited ? "Default policy" : "Selected names"}</dt>
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
                            <dt>MCP</dt>
                            <dd>{summary.mcpTools}</dd>
                        </div>
                    </dl>
                    <p className="hb-inspector-note">
                        {summary.removed.length} named exclusions.{" "}
                        {summary.inherited
                            ? "The runtime still decides which default-policy tools to offer."
                            : "Selected names remain subject to runtime, platform, feature, and permission gates."}
                    </p>
                    <details className="hb-inspector-tool-reference">
                        <summary>
                            Reference coding defaults: {referenceBaselineNames.length} baseline entries
                        </summary>
                        <p>
                            Illustrative online, local, top-level coding with split editing and no added
                            allow/exclude filters. Not the current plan.
                        </p>
                        <div className="hb-chip-list">
                            {referenceBaselineNames.map((name) => (
                                <code key={name}>{name}</code>
                            ))}
                        </div>
                        <p>
                            {referenceDefaultGroups
                                .filter((group) => group.status !== "baseline-enabled")
                                .map((group) => `${group.names.length} ${group.status}`)
                                .join(" / ")}
                            .
                        </p>
                        <p>
                            Shell families are platform-specific. Model, capability, service, and experiment
                            conditions remain authoritative.
                        </p>
                        <p>
                            {BUILTIN_NAMES.length} descriptors and {toolCatalog.context.aliases.length}{" "}
                            separate selection aliases; aliases do not add tools.
                        </p>
                    </details>
                </section>
                <section className="hb-inspector-section">
                    <div className="hb-inspector-section-heading">
                        <h3>Required host contracts</h3>
                        <Badge>{contracts.length}</Badge>
                    </div>
                    <ul className="hb-contract-list">
                        {contracts.map((contract) => (
                            <li key={contract}>
                                <Braces size={13} aria-hidden="true" />
                                <span>{contract}</span>
                            </li>
                        ))}
                    </ul>
                    <p className="hb-inspector-note">
                        Build &amp; run turns these declarations into project integration requirements.
                    </p>
                </section>
            </details>
            <div className="hb-inspector-footer">
                <Button
                    variant="primary"
                    onClick={onExport}
                    disabled={exportDisabled}
                    title={exportDisabled ? "Resolve draft issues before exporting" : undefined}
                >
                    <Download size={15} aria-hidden="true" />
                    Export plan
                </Button>
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
