// Copyright (c) Microsoft Corporation. All rights reserved.
import { useState } from "react";
import {
    Activity,
    BrainCircuit,
    Database,
    ExternalLink,
    Eye,
    Gauge,
    LockKeyhole,
    Puzzle,
    RefreshCw,
    Search,
    ShieldCheck,
} from "lucide-react";
import { advancedCategories, advancedControls, advancedSupportLevels } from "../content/advanced-controls";
import type { AdvancedCategory, AdvancedSupport } from "../content/advanced-controls";
import { reference } from "../content/reference";
import { Badge, EmptyState, Notice, SelectField, TextField } from "./ui";
import "../advanced.css";

const categoryIcons = {
    "Security posture": ShieldCheck,
    "Limits & throughput": Gauge,
    "Privacy & persistence": Database,
    "Model execution": BrainCircuit,
    Lifecycle: RefreshCw,
    "Context & capabilities": Puzzle,
    Diagnostics: Activity,
} satisfies Record<AdvancedCategory, typeof ShieldCheck>;

const supportTone = {
    "Documented SDK": "Documented",
    "Typed SDK": "Typed surface",
    "Runtime contract": "Runtime-only",
    Experimental: "Experimental",
} satisfies Record<AdvancedSupport, string>;

export function AdvancedEditor() {
    const [query, setQuery] = useState("");
    const [category, setCategory] = useState<AdvancedCategory | "all">("all");
    const [support, setSupport] = useState<AdvancedSupport | "all">("all");
    const normalized = query.trim().toLowerCase();
    const controls = advancedControls.filter(
        (control) =>
            (category === "all" || control.category === category) &&
            (support === "all" || control.support === support) &&
            `${control.title} ${control.key} ${control.summary} ${control.opportunity} ${control.layer} ${control.scope} ${control.support}`
                .concat(
                    ` ${control.leverKind ?? ""} ${control.valueType ?? ""} ${control.defaultValue ?? ""} ${control.constraints ?? ""}`,
                )
                .toLowerCase()
                .includes(normalized),
    );
    const sensitiveCount = advancedControls.filter((control) => control.sensitive).length;
    const quantifiedCount = advancedControls.filter(
        (control) => control.defaultValue || control.constraints,
    ).length;

    return (
        <div className="hb-editor-stack">
            <Notice title="A future configuration map, not a runtime control panel" tone="accent">
                These source-backed settings exist below the visualizer&apos;s current planning surface. They
                are read-only because some are startup-only, runtime-internal, experimental, security
                critical, or inconsistent across SDK languages. Nothing on this page changes the plan or a
                running session.
            </Notice>

            <div className="hb-advanced-summary" aria-label="Advanced control catalog summary">
                <div>
                    <strong>{advancedControls.length}</strong>
                    <span>candidate controls</span>
                </div>
                <div>
                    <strong>{advancedSupportLevels.length}</strong>
                    <span>support levels</span>
                </div>
                <div>
                    <strong>{sensitiveCount}</strong>
                    <span>sensitive boundaries</span>
                </div>
                <div>
                    <strong>{quantifiedCount}</strong>
                    <span>quantified levers</span>
                </div>
            </div>

            <section className="hb-advanced-browser" aria-labelledby="advanced-browser-title">
                <div className="hb-advanced-browser-head">
                    <div>
                        <p className="hb-kicker">Runtime depth map</p>
                        <h3 id="advanced-browser-title">Explore possible future controls</h3>
                        <p>
                            Start with documented SDK options. Runtime-only and experimental entries need a
                            stable public contract before they should become editable.
                        </p>
                    </div>
                    <Badge>
                        <Eye size={12} aria-hidden="true" /> Read only
                    </Badge>
                </div>

                <div className="hb-advanced-filters">
                    <div className="hb-search-field">
                        <Search size={17} aria-hidden="true" />
                        <TextField
                            label="Search advanced controls"
                            type="search"
                            value={query}
                            onValueChange={setQuery}
                            placeholder="Search compaction, view limits, timeouts..."
                        />
                    </div>
                    <SelectField
                        label="Category"
                        value={category}
                        onValueChange={setCategory}
                        options={[
                            { value: "all", label: "All categories" },
                            ...advancedCategories.map((value) => ({ value, label: value })),
                        ]}
                    />
                    <SelectField
                        label="Support level"
                        value={support}
                        onValueChange={setSupport}
                        options={[
                            { value: "all", label: "All support levels" },
                            ...advancedSupportLevels.map((value) => ({
                                value,
                                label: supportTone[value],
                            })),
                        ]}
                    />
                </div>

                <div className="hb-catalog-count" role="status">
                    {controls.length} of {advancedControls.length} candidate controls
                </div>

                <div className="hb-advanced-groups">
                    {advancedCategories.map((group) => {
                        const entries = controls.filter((control) => control.category === group);
                        if (!entries.length) return null;
                        const Icon = categoryIcons[group];
                        return (
                            <section
                                className="hb-advanced-group"
                                key={group}
                                aria-labelledby={`group-${group}`}
                            >
                                <header>
                                    <span className="hb-advanced-group-icon">
                                        <Icon size={18} aria-hidden="true" />
                                    </span>
                                    <div>
                                        <h4 id={`group-${group}`}>{group}</h4>
                                        <p>
                                            {entries.length}{" "}
                                            {entries.length === 1 ? "candidate" : "candidates"}
                                        </p>
                                    </div>
                                </header>
                                <div className="hb-advanced-list">
                                    {entries.map((control) => (
                                        <article className="hb-advanced-card" key={control.id}>
                                            <div className="hb-advanced-card-top">
                                                <div>
                                                    <h5>{control.title}</h5>
                                                    <code>{control.key}</code>
                                                </div>
                                                <div className="hb-chip-list">
                                                    <Badge>{supportTone[control.support]}</Badge>
                                                    {control.sensitive && (
                                                        <Badge>
                                                            <LockKeyhole size={11} aria-hidden="true" />
                                                            Sensitive
                                                        </Badge>
                                                    )}
                                                </div>
                                            </div>
                                            <p className="hb-advanced-summary-copy">{control.summary}</p>
                                            {(control.leverKind ||
                                                control.valueType ||
                                                control.defaultValue ||
                                                control.constraints) && (
                                                <dl className="hb-advanced-contract">
                                                    {control.leverKind && (
                                                        <div>
                                                            <dt>Lever status</dt>
                                                            <dd>{control.leverKind}</dd>
                                                        </div>
                                                    )}
                                                    {control.valueType && (
                                                        <div>
                                                            <dt>Value type</dt>
                                                            <dd>{control.valueType}</dd>
                                                        </div>
                                                    )}
                                                    {control.defaultValue && (
                                                        <div>
                                                            <dt>Default / effective limit</dt>
                                                            <dd>{control.defaultValue}</dd>
                                                        </div>
                                                    )}
                                                    {control.constraints && (
                                                        <div>
                                                            <dt>Range and constraints</dt>
                                                            <dd>{control.constraints}</dd>
                                                        </div>
                                                    )}
                                                </dl>
                                            )}
                                            <dl className="hb-advanced-meta">
                                                <div>
                                                    <dt>Layer</dt>
                                                    <dd>{control.layer}</dd>
                                                </div>
                                                <div>
                                                    <dt>Scope</dt>
                                                    <dd>{control.scope}</dd>
                                                </div>
                                                <div>
                                                    <dt>Future value</dt>
                                                    <dd>{control.opportunity}</dd>
                                                </div>
                                                <div>
                                                    <dt>Why read only</dt>
                                                    <dd>{control.readOnlyReason}</dd>
                                                </div>
                                            </dl>
                                            <a
                                                className="hb-advanced-source"
                                                href={control.sourceUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                            >
                                                {control.sourceLabel}
                                                <ExternalLink size={12} aria-hidden="true" />
                                                <span className="hb-sr-only">
                                                    {" "}
                                                    (opens source in a new tab)
                                                </span>
                                            </a>
                                        </article>
                                    ))}
                                </div>
                            </section>
                        );
                    })}
                </div>

                {controls.length === 0 && (
                    <EmptyState icon={<Search size={23} />} title="No matching advanced controls">
                        Try a broader search or reset the category and support filters.
                    </EmptyState>
                )}
            </section>

            <div className="hb-reference-stamp">
                <LockKeyhole size={15} aria-hidden="true" />
                <p>
                    Source snapshot: SDK <code>{reference.revisions.sdk.slice(0, 7)}</code> and runtime{" "}
                    <code>{reference.revisions.runtime.slice(0, 7)}</code>. Secret values, experiment
                    assignments, trust bypasses, and operator routing overrides are intentionally excluded.
                </p>
            </div>
        </div>
    );
}
