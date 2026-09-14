// Copyright (c) Microsoft Corporation. All rights reserved.
import { useState } from "react";
import * as Tabs from "@radix-ui/react-tabs";
import { ArrowUpRight, BookOpen, Search } from "lucide-react";
import { reference } from "../content/reference";
import { controlCoverage, scopeLabel } from "./reference-ui";
import type { Evidence } from "./editor";
import { Badge, EmptyState, Notice, SelectField, TextField } from "./ui";

const catalogScopes = Array.from(new Set(reference.controls.flatMap((control) => control.scopes)));

export function ReferencePanel({ onEvidence }: { onEvidence: (evidence: Evidence) => void }) {
    const [query, setQuery] = useState("");
    const [scope, setScope] = useState("all");
    const [axis, setAxis] = useState("all");
    const normalized = query.trim().toLowerCase();
    const controls = reference.controls.filter(
        (control) =>
            (scope === "all" || control.scopes.includes(scope)) &&
            (axis === "all" || control.axis === axis) &&
            `${control.name} ${control.description} ${control.stability} ${control.when} ${control.scopes.join(" ")}`
                .toLowerCase()
                .includes(normalized),
    );
    return (
        <div className="hb-editor-stack">
            <Notice title="A source catalog, not a promise of editable controls" tone="accent">
                This snapshot includes {reference.controls.length} controls and {reference.gaps.length}{" "}
                boundaries. The builder exposes a curated planning subset; live, runtime-only, and host
                callback surfaces are labeled separately.
            </Notice>
            <Tabs.Root defaultValue="catalog" className="hb-reference-tabs">
                <Tabs.List className="hb-tabs-list" aria-label="Reference views">
                    <Tabs.Trigger className="hb-tab" value="catalog">
                        Configuration catalog<Badge>{reference.controls.length}</Badge>
                    </Tabs.Trigger>
                    <Tabs.Trigger className="hb-tab" value="gaps">
                        Boundaries &amp; gaps<Badge>{reference.gaps.length}</Badge>
                    </Tabs.Trigger>
                </Tabs.List>
                <Tabs.Content value="catalog" className="hb-tab-content">
                    <div className="hb-catalog-filters">
                        <div className="hb-search-field">
                            <Search size={17} aria-hidden="true" />
                            <TextField
                                label="Search configuration catalog"
                                type="search"
                                value={query}
                                onValueChange={setQuery}
                                placeholder="Search controls, behavior, or lifecycle"
                            />
                        </div>
                        <div className="hb-field-grid">
                            <SelectField
                                label="Scope"
                                value={scope}
                                onValueChange={setScope}
                                options={[
                                    { value: "all", label: "All scopes" },
                                    ...catalogScopes.map((value) => ({ value, label: scopeLabel(value) })),
                                ]}
                            />
                            <SelectField
                                label="Configuration axis"
                                value={axis}
                                onValueChange={setAxis}
                                options={[
                                    { value: "all", label: "All axes" },
                                    ...reference.axes.map((entry) => ({
                                        value: entry.id,
                                        label: entry.label,
                                    })),
                                ]}
                            />
                        </div>
                    </div>
                    <div className="hb-catalog-count" role="status">
                        {controls.length} of {reference.controls.length} controls
                    </div>
                    <div className="hb-catalog-list">
                        {controls.map((control) => (
                            <button
                                className="hb-catalog-row"
                                key={control.name}
                                onClick={() => onEvidence({ kind: "control", value: control })}
                            >
                                <span className="hb-catalog-row-top">
                                    <code>{control.name}</code>
                                    <ArrowUpRight size={15} aria-hidden="true" />
                                </span>
                                <span className="hb-catalog-description">{control.description}</span>
                                <span className="hb-chip-list">
                                    {control.scopes.map((entry) => (
                                        <Badge key={entry}>{scopeLabel(entry)}</Badge>
                                    ))}
                                    <span className="hb-catalog-coverage">
                                        {controlCoverage(control.name).label}
                                    </span>
                                </span>
                            </button>
                        ))}
                    </div>
                    {controls.length === 0 && (
                        <EmptyState icon={<Search size={23} />} title="No matching controls">
                            Try a broader search or change the scope and configuration axis.
                        </EmptyState>
                    )}
                </Tabs.Content>
                <Tabs.Content value="gaps" className="hb-tab-content">
                    <p className="hb-muted-copy">
                        Start with what exists, then inspect the precise boundary and the integration path. A
                        projection gap is not necessarily a missing runtime implementation.
                    </p>
                    <div className="hb-gap-grid">
                        {reference.gaps.map((gap) => (
                            <button
                                className="hb-gap-card"
                                key={gap.id}
                                onClick={() => onEvidence({ kind: "gap", value: gap })}
                            >
                                <span className="hb-gap-top">
                                    <BookOpen size={20} aria-hidden="true" />
                                    <ArrowUpRight size={15} aria-hidden="true" />
                                </span>
                                <Badge>{gap.status}</Badge>
                                <span className="hb-gap-title">{gap.title}</span>
                                <span className="hb-muted-copy">{gap.summary}</span>
                                <span className="hb-text-link">
                                    Inspect evidence and limits
                                    <ArrowUpRight size={13} aria-hidden="true" />
                                </span>
                            </button>
                        ))}
                    </div>
                </Tabs.Content>
            </Tabs.Root>
            <div className="hb-reference-stamp">
                <BookOpen size={15} aria-hidden="true" />
                <p>
                    Snapshot <time dateTime={reference.asOf}>{reference.asOf}</time>. Commit-pinned source
                    links may require organization access. Nothing is fetched automatically.
                </p>
            </div>
        </div>
    );
}
