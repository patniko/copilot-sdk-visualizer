// Copyright (c) Microsoft Corporation. All rights reserved.
import { useRef, useState } from "react";
import { Search } from "lucide-react";
import { BUILTIN_NAMES, BUILTIN_SPECS, toolCatalog } from "../content/builtin-tools";
import type { BuiltinName } from "../content/builtin-tools";
import type { EditorProps } from "./editor";
import { BuiltinToolDetail } from "./BuiltinToolDetail";
import {
    ADVANCED_TOOL_NAMES,
    INTERNAL_TOOL_NAMES,
    PRIMARY_TOOL_NAMES,
    toolActionLabel,
    toolCategory,
    toolSearchText,
} from "./tool-catalog-ui";
import type { ToolCategory } from "./tool-catalog-ui";
import { Badge, Button, ChoiceField, EmptyState, Notice, Panel, SelectField, TextField } from "./ui";

type CatalogScope = "primary" | "advanced" | "changes";
type CategoryFilter = "all" | ToolCategory;

const userFacingNames = [...PRIMARY_TOOL_NAMES, ...ADVANCED_TOOL_NAMES] as readonly BuiltinName[];

function isConfigured(inherited: boolean, action: "keep" | "override" | "remove") {
    if (action === "override") return true;
    return inherited ? action === "remove" : action === "keep";
}

export function ToolCatalogBrowser(props: EditorProps) {
    const { plan } = props;
    const [scope, setScope] = useState<CatalogScope>("primary");
    const [query, setQuery] = useState("");
    const [category, setCategory] = useState<CategoryFilter>("all");
    const [selectedName, setSelectedName] = useState<BuiltinName>("view");
    const detailHeading = useRef<HTMLHeadingElement | null>(null);
    const inherited = plan.inventory === "coding-defaults";
    const normalized = query.trim().toLowerCase();
    const changedNames = userFacingNames.filter((name) => isConfigured(inherited, plan.tools[name].action));
    const hiddenConfigured = INTERNAL_TOOL_NAMES.filter((name) =>
        isConfigured(inherited, plan.tools[name].action),
    );
    const scoped =
        scope === "primary" ? PRIMARY_TOOL_NAMES : scope === "advanced" ? ADVANCED_TOOL_NAMES : changedNames;
    const filtered = scoped.filter(
        (name) =>
            (category === "all" || toolCategory(name) === category) &&
            toolSearchText(name).includes(normalized),
    );
    const active = filtered.find((name) => name === selectedName) ?? filtered[0];

    function clearFilters() {
        setQuery("");
        setCategory("all");
    }

    return (
        <Panel
            title="Built-in tools"
            description="Choose recognizable product capabilities. Runtime plumbing and specialized worker descriptors are intentionally hidden."
            action={<Badge>{userFacingNames.length} relevant capabilities</Badge>}
            className="hb-tool-browser"
        >
            {hiddenConfigured.length > 0 && (
                <Notice
                    title={`${hiddenConfigured.length} specialized tool ${hiddenConfigured.length === 1 ? "setting is" : "settings are"} retained`}
                    tone="accent"
                >
                    This plan contains hidden runtime-specialized choices. They remain in the plan and export,
                    but are not presented as ordinary tools. Review them in the exported plan before
                    implementation.
                </Notice>
            )}
            <ChoiceField
                label="Built-in tool view"
                value={scope}
                options={[
                    {
                        value: "primary",
                        label: "Everyday tools",
                        description: "Files, search, commands, interaction, and web access",
                    },
                    {
                        value: "advanced",
                        label: "Advanced capabilities",
                        description: "Agents, skills, code intelligence, databases, and tool discovery",
                    },
                    {
                        value: "changes",
                        label: "Your changes",
                        description: `${changedNames.length} explicit selection or exclusion decisions`,
                    },
                ]}
                onValueChange={(value) => {
                    setScope(value);
                    clearFilters();
                }}
            />
            <div className="hb-tool-browser-filters">
                <div className="hb-search-field">
                    <Search size={16} aria-hidden="true" />
                    <TextField
                        label="Search visible built-in tools"
                        value={query}
                        onValueChange={setQuery}
                        type="search"
                        placeholder="Search tool names and purposes"
                    />
                </div>
                <SelectField<CategoryFilter>
                    label="Capability category"
                    value={category}
                    onValueChange={setCategory}
                    options={[
                        { value: "all", label: "All categories" },
                        { value: "files", label: "Files and editing" },
                        { value: "search", label: "Search and code intelligence" },
                        { value: "commands", label: "Commands and processes" },
                        { value: "interaction", label: "Interaction and web" },
                        { value: "advanced", label: "Advanced orchestration" },
                    ]}
                />
            </div>
            <div className="hb-tool-result-count">
                <p role="status">
                    {filtered.length} tools shown. Internal runtime descriptors are excluded from this view.
                </p>
                {(query || category !== "all") && (
                    <Button variant="ghost" size="small" onClick={clearFilters}>
                        Clear filters
                    </Button>
                )}
            </div>
            {active ? (
                <div className="hb-tool-workbench">
                    <div className="hb-tool-index-pane">
                        <p className="hb-small-label">Capability / current plan</p>
                        <div className="hb-tool-index" role="list" aria-label="Visible built-in tools">
                            {filtered.map((name) => {
                                const spec = BUILTIN_SPECS[name];
                                const selected = name === active;
                                return (
                                    <button
                                        type="button"
                                        key={name}
                                        className={`hb-tool-index-item${selected ? " hb-tool-index-item-active" : ""}`}
                                        aria-pressed={selected}
                                        onClick={() => {
                                            setSelectedName(name);
                                            window.requestAnimationFrame(() =>
                                                detailHeading.current?.focus(),
                                            );
                                        }}
                                    >
                                        <code>{name}</code>
                                        <span className="hb-tool-default-label">{spec.label}</span>
                                        <span className="hb-tool-plan-tag">
                                            {toolActionLabel(plan.tools[name].action, inherited)}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                    <div className="hb-tool-detail-pane">
                        <BuiltinToolDetail
                            {...props}
                            name={active}
                            headingRef={detailHeading}
                            onInspectAlias={() => undefined}
                            showReferenceDetails={false}
                        />
                    </div>
                </div>
            ) : (
                <EmptyState icon={<Search size={23} />} title="No matching tools">
                    {scope === "changes"
                        ? "No user-facing built-in tool decisions have changed in this plan."
                        : "Change the search or category filter."}
                </EmptyState>
            )}
        </Panel>
    );
}

export function ToolCatalogReference() {
    const visibleAliases = toolCatalog.context.aliases.filter((alias) =>
        alias.targets.some((target) => userFacingNames.some((name) => name === target)),
    );
    return (
        <Panel
            title="Runtime catalog reference"
            description="Background context for the planner. This is not a second tool-selection surface."
            action={<Badge>{BUILTIN_NAMES.length} captured descriptors</Badge>}
        >
            <div className="hb-tool-reference-counts hb-tool-visibility-counts">
                <div>
                    <strong>{PRIMARY_TOOL_NAMES.length}</strong>
                    <span>Everyday tools</span>
                </div>
                <div>
                    <strong>{ADVANCED_TOOL_NAMES.length}</strong>
                    <span>Advanced capabilities</span>
                </div>
                <div>
                    <strong>{INTERNAL_TOOL_NAMES.length}</strong>
                    <span>Internal descriptors hidden</span>
                </div>
            </div>
            <Notice title="Why some descriptors are hidden">
                The runtime catalog contains lifecycle controls, worker-specific tools, management surfaces,
                and implementation variants that are not ordinary product capabilities. Imported settings are
                preserved, but this planner does not invite users to configure that plumbing.
            </Notice>
            <details className="hb-tool-context">
                <summary>Reference profile and selection semantics</summary>
                <dl>
                    <div>
                        <dt>Reference profile</dt>
                        <dd>{toolCatalog.context.referenceProfile.label}</dd>
                    </div>
                    <div>
                        <dt>Inherited policy</dt>
                        <dd>{toolCatalog.context.inheritedCoding}</dd>
                    </div>
                    <div>
                        <dt>Override support</dt>
                        <dd>{toolCatalog.context.overrideSemantics}</dd>
                    </div>
                    <div>
                        <dt>Workspace flags</dt>
                        <dd>{toolCatalog.context.workspaceSemantics}</dd>
                    </div>
                </dl>
            </details>
            <details className="hb-tool-context">
                <summary>Selection aliases relevant to visible tools ({visibleAliases.length})</summary>
                <div className="hb-tool-alias-list">
                    {visibleAliases.map((alias) => (
                        <article className="hb-tool-alias-card" key={alias.name}>
                            <div>
                                <h4>
                                    <code>{alias.name}</code>
                                </h4>
                                <Badge>Selection alias</Badge>
                            </div>
                            <p className="hb-field-hint">
                                Targets:{" "}
                                {alias.targets
                                    .filter((target) => userFacingNames.some((name) => name === target))
                                    .join(", ")}
                            </p>
                        </article>
                    ))}
                </div>
            </details>
            <p className="hb-field-hint">
                Static planning snapshot. Aliases are not tools, and hidden descriptors are not silently
                removed from imported plans.
            </p>
        </Panel>
    );
}
