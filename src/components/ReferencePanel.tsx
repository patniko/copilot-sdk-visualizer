// Copyright (c) Microsoft Corporation. All rights reserved.
import { useState } from "react";
import * as Tabs from "@radix-ui/react-tabs";
import { ArrowUpRight, BookOpen, ExternalLink, Search } from "lucide-react";
import { reference } from "../content/reference";
import { SDK_DOCS_HOME, SDK_DOC_MAP } from "../content/sdk-docs";
import { controlCoverage, scopeLabel } from "./reference-ui";
import type { Evidence, ViewId } from "./editor";
import { Badge, Button, EmptyState, Notice, SelectField, TextField } from "./ui";

const catalogScopes = Array.from(new Set(reference.controls.flatMap((control) => control.scopes)));
const visibleSdkDocs = SDK_DOC_MAP.filter((group) => group.view !== "advanced");

const viewLabels: Record<ViewId, string> = {
    overview: "Overview",
    runtime: "Runtime map",
    "base-profile": "Base Profile",
    prompt: "Prompt",
    tools: "Tools",
    context: "Context & packs",
    agents: "Agents",
    models: "Models & identity",
    policy: "Policy & state",
    advanced: "Advanced",
    bootstrap: "Build & run",
    reference: "Reference",
};

export function ReferencePanel({
    onEvidence,
    onNavigate,
}: {
    onEvidence: (evidence: Evidence) => void;
    onNavigate: (view: ViewId) => void;
}) {
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
                    <Tabs.Trigger className="hb-tab" value="sdk-docs">
                        Map to SDK docs<Badge>{visibleSdkDocs.length}</Badge>
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
                <Tabs.Content value="sdk-docs" className="hb-tab-content">
                    <Notice title="Where to read next in the official SDK docs" tone="accent">
                        Each builder step maps to a guide in the <code>{"github/copilot-sdk"}</code> docs.
                        These links point at the living documentation (main branch), unlike the commit-pinned
                        evidence in the other tabs. Open the matching editor here, then follow the guide when
                        you implement it in your host.{" "}
                        <a href={SDK_DOCS_HOME} target="_blank" rel="noopener noreferrer">
                            SDK docs home
                            <ExternalLink size={13} aria-hidden="true" />
                        </a>
                    </Notice>
                    <div className="hb-docmap-grid">
                        {visibleSdkDocs.map((group) => (
                            <section className="hb-docmap-card" key={group.view}>
                                <header className="hb-docmap-head">
                                    <div>
                                        <span className="hb-kicker">{viewLabels[group.view]}</span>
                                        <h4>{group.title}</h4>
                                        <p className="hb-muted-copy">{group.summary}</p>
                                    </div>
                                    {group.view !== "reference" && (
                                        <Button size="small" onClick={() => onNavigate(group.view)}>
                                            Open editor
                                            <ArrowUpRight size={13} aria-hidden="true" />
                                        </Button>
                                    )}
                                </header>
                                <ul className="hb-docmap-links">
                                    {group.links.map((link) => (
                                        <li key={link.url}>
                                            <a href={link.url} target="_blank" rel="noopener noreferrer">
                                                {link.label}
                                                <ExternalLink size={12} aria-hidden="true" />
                                                <span className="hb-sr-only">
                                                    {" "}
                                                    (opens SDK docs in a new tab)
                                                </span>
                                            </a>
                                            <p>{link.note}</p>
                                        </li>
                                    ))}
                                </ul>
                            </section>
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
