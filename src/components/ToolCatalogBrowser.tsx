// Copyright (c) Microsoft Corporation. All rights reserved.
import { useRef, useState } from "react";
import type { Ref } from "react";
import * as Tabs from "@radix-ui/react-tabs";
import { ArrowRight, BookOpen, Braces, Search } from "lucide-react";
import { BUILTIN_NAMES, BUILTIN_SPECS, DEFAULT_STATUS_LABELS, toolCatalog } from "../content/builtin-tools";
import type { BuiltinDefaultStatus, BuiltinName, BuiltinSpec } from "../content/builtin-tools";
import type { EditorProps } from "./editor";
import { BuiltinToolDetail } from "./BuiltinToolDetail";
import { ToolCatalogSources } from "./ToolCatalogSources";
import {
    REFERENCE_DEFAULT_STATUSES,
    referenceBaselineNames,
    referenceDefaultGroups,
    toolActionLabel,
    toolSearchText,
} from "./tool-catalog-ui";
import { Badge, Button, EmptyState, Notice, Panel, SelectField, TextField } from "./ui";

type DefaultFilter = "all" | BuiltinDefaultStatus;
type GroupFilter = "all" | BuiltinSpec["group"];

export function ToolCatalogBrowser(props: EditorProps) {
    const { plan } = props;
    const [tab, setTab] = useState<"descriptors" | "aliases">("descriptors");
    const [query, setQuery] = useState("");
    const [defaultFilter, setDefaultFilter] = useState<DefaultFilter>("all");
    const [groupFilter, setGroupFilter] = useState<GroupFilter>("all");
    const [selectedName, setSelectedName] = useState<BuiltinName>("view");
    const [aliasQuery, setAliasQuery] = useState("");
    const detailHeading = useRef<HTMLHeadingElement | null>(null);
    const aliasSearch = useRef<HTMLInputElement | null>(null);
    const inherited = plan.inventory === "coding-defaults";
    const normalized = query.trim().toLowerCase();
    const filtered = BUILTIN_NAMES.filter(
        (name) =>
            (defaultFilter === "all" || BUILTIN_SPECS[name].defaultStatus === defaultFilter) &&
            (groupFilter === "all" || BUILTIN_SPECS[name].group === groupFilter) &&
            toolSearchText(name).includes(normalized),
    );
    const active = filtered.find((name) => name === selectedName) ?? filtered[0];
    const legacyOverrides = BUILTIN_NAMES.filter(
        (name) => plan.tools[name].action === "override" && !BUILTIN_SPECS[name].overrideable,
    );

    function inspectTool(name: BuiltinName) {
        setQuery("");
        setDefaultFilter("all");
        setGroupFilter("all");
        setSelectedName(name);
        setTab("descriptors");
        window.requestAnimationFrame(() => detailHeading.current?.focus());
    }

    function inspectAlias(name: string) {
        setAliasQuery(name);
        setTab("aliases");
        window.requestAnimationFrame(() => aliasSearch.current?.focus());
    }

    function showDefaultGroup(status: BuiltinDefaultStatus) {
        setQuery("");
        setGroupFilter("all");
        setDefaultFilter(status);
        setTab("descriptors");
    }

    return (
        <Panel
            title="Complete built-in tool catalog"
            description="Every captured descriptor is browsable here. Compiled membership, reference defaults, and current plan selection are different facts."
            action={<Badge>{BUILTIN_NAMES.length} descriptors</Badge>}
            className="hb-tool-browser"
        >
            <ReferenceProfile onInspectTool={inspectTool} onShowDefaultGroup={showDefaultGroup} />
            {legacyOverrides.length > 0 && (
                <Notice
                    title={`${legacyOverrides.length} retained unverified override ${legacyOverrides.length === 1 ? "request" : "requests"}`}
                    tone="error"
                >
                    <p>
                        These saved choices remain editable and can be retained in valid planner JSON.
                        SDK/bootstrap generation blocks them rather than inventing a host route.
                    </p>
                    <div className="hb-chip-list">
                        {legacyOverrides.map((name) => (
                            <button className="hb-diff-chip" key={name} onClick={() => inspectTool(name)}>
                                Review <code>{name}</code>
                                <ArrowRight size={12} aria-hidden="true" />
                            </button>
                        ))}
                    </div>
                </Notice>
            )}
            <Tabs.Root
                value={tab}
                onValueChange={(value) => {
                    if (value === "descriptors" || value === "aliases") setTab(value);
                }}
            >
                <Tabs.List className="hb-tabs-list" aria-label="Tool catalog views">
                    <Tabs.Trigger className="hb-tab" value="descriptors">
                        <Braces size={15} aria-hidden="true" />
                        Built-in descriptors<Badge>{BUILTIN_NAMES.length}</Badge>
                    </Tabs.Trigger>
                    <Tabs.Trigger className="hb-tab" value="aliases">
                        <BookOpen size={15} aria-hidden="true" />
                        Selection aliases<Badge>{toolCatalog.context.aliases.length}</Badge>
                    </Tabs.Trigger>
                </Tabs.List>
                <Tabs.Content className="hb-tab-content" value="descriptors">
                    <div className="hb-search-field">
                        <Search size={16} aria-hidden="true" />
                        <TextField
                            label="Search all built-in tools"
                            value={query}
                            onValueChange={setQuery}
                            type="search"
                            placeholder="Search names, descriptions, gates, inputs, or aliases"
                        />
                    </div>
                    <div className="hb-field-grid">
                        <SelectField<DefaultFilter>
                            label="Reference default state"
                            value={defaultFilter}
                            onValueChange={setDefaultFilter}
                            options={[
                                { value: "all", label: "All reference states" },
                                ...REFERENCE_DEFAULT_STATUSES.map((status) => ({
                                    value: status,
                                    label: DEFAULT_STATUS_LABELS[status],
                                })),
                            ]}
                        />
                        <SelectField<GroupFilter>
                            label="Descriptor group"
                            value={groupFilter}
                            onValueChange={setGroupFilter}
                            options={[
                                { value: "all", label: "All groups" },
                                { value: "Workspace", label: "Workspace" },
                                { value: "Session", label: "Session" },
                            ]}
                        />
                    </div>
                    <div className="hb-tool-result-count">
                        <p role="status">
                            {filtered.length} of {BUILTIN_NAMES.length} descriptors. Filters only change this
                            browser, not the plan.
                        </p>
                        {(query || defaultFilter !== "all" || groupFilter !== "all") && (
                            <Button
                                variant="ghost"
                                size="small"
                                onClick={() => {
                                    setQuery("");
                                    setDefaultFilter("all");
                                    setGroupFilter("all");
                                }}
                            >
                                Clear filters
                            </Button>
                        )}
                    </div>
                    {active ? (
                        <Tabs.Root
                            className="hb-tool-workbench"
                            orientation="vertical"
                            activationMode="manual"
                            value={active}
                            onValueChange={(value) => {
                                const name = BUILTIN_NAMES.find((entry) => entry === value);
                                if (name) setSelectedName(name);
                            }}
                        >
                            <div className="hb-tool-index-pane">
                                <p className="hb-small-label">Descriptor / reference state</p>
                                <p className="hb-field-hint">
                                    Arrow keys browse; Enter selects. Tab moves to details.
                                </p>
                                <Tabs.List className="hb-tool-index" aria-label="Built-in tool descriptors">
                                    {filtered.map((name) => {
                                        const spec = BUILTIN_SPECS[name];
                                        const legacy =
                                            plan.tools[name].action === "override" && !spec.overrideable;
                                        return (
                                            <Tabs.Trigger
                                                key={name}
                                                value={name}
                                                className="hb-tool-index-item"
                                                aria-label={`${name}; ${DEFAULT_STATUS_LABELS[spec.defaultStatus]}; current plan: ${legacy ? "unverified override" : toolActionLabel(plan.tools[name].action, inherited)}`}
                                            >
                                                <code>{name}</code>
                                                <span
                                                    className={`hb-tool-default-label hb-tool-default-${spec.defaultStatus}`}
                                                >
                                                    {DEFAULT_STATUS_LABELS[spec.defaultStatus]}
                                                </span>
                                                <span
                                                    className={
                                                        legacy
                                                            ? "hb-tool-plan-tag hb-tool-plan-tag-unverified"
                                                            : "hb-tool-plan-tag"
                                                    }
                                                >
                                                    Plan:{" "}
                                                    {legacy
                                                        ? "unverified override"
                                                        : toolActionLabel(plan.tools[name].action, inherited)}
                                                </span>
                                            </Tabs.Trigger>
                                        );
                                    })}
                                </Tabs.List>
                            </div>
                            <Tabs.Content key={active} className="hb-tool-detail-pane" value={active}>
                                <BuiltinToolDetail
                                    {...props}
                                    name={active}
                                    headingRef={detailHeading}
                                    onInspectAlias={inspectAlias}
                                />
                            </Tabs.Content>
                        </Tabs.Root>
                    ) : (
                        <EmptyState icon={<Search size={23} />} title="No matching descriptors">
                            Change the search or reference-state filter. No plan selection has changed.
                        </EmptyState>
                    )}
                </Tabs.Content>
                <Tabs.Content className="hb-tab-content" value="aliases">
                    <AliasBrowser
                        query={aliasQuery}
                        onQueryChange={setAliasQuery}
                        onInspectTool={inspectTool}
                        inputRef={aliasSearch}
                    />
                </Tabs.Content>
            </Tabs.Root>
            <Notice title="Declaration names and selection aliases are separate">
                All {BUILTIN_NAMES.length} built-in names are reserved from the custom-tool adder. Use a
                descriptor&apos;s verified Override control instead. <code>catalog_search</code> is explicitly
                reserved; <code>tool_search_tool</code> has a verified but specialized override protocol.
                Aliases do not add descriptors or automatically expand SDK filters.
            </Notice>
        </Panel>
    );
}

function ReferenceProfile({
    onInspectTool,
    onShowDefaultGroup,
}: {
    onInspectTool: (name: BuiltinName) => void;
    onShowDefaultGroup: (status: BuiltinDefaultStatus) => void;
}) {
    const profile = toolCatalog.context.referenceProfile;
    return (
        <section className="hb-tool-reference-profile" aria-label="Reference coding default profile">
            <div>
                <h4>Reference defaults, not your current selection</h4>
                <p>{profile.label}.</p>
            </div>
            <p>
                <strong>Split editing, no added filters:</strong> <code>availableTools</code> is{" "}
                {profile.availableTools}; <code>excludedTools</code> is {profile.excludedTools}. The platform
                shell family is separate from the {referenceBaselineNames.length} baseline entries below.
            </p>
            <div className="hb-tool-reference-counts">
                {referenceDefaultGroups.map((group) => (
                    <button
                        key={group.status}
                        onClick={() => onShowDefaultGroup(group.status)}
                        aria-label={`Show ${group.names.length} ${group.label.toLowerCase()} descriptors`}
                    >
                        <strong>{group.names.length}</strong>
                        <span>{group.label}</span>
                    </button>
                ))}
            </div>
            <div className="hb-tool-baseline-names">
                <span>Baseline entries</span>
                <div className="hb-chip-list">
                    {referenceBaselineNames.map((name) => (
                        <button className="hb-diff-chip" key={name} onClick={() => onInspectTool(name)}>
                            <code>{name}</code>
                            <ArrowRight size={12} aria-hidden="true" />
                        </button>
                    ))}
                </div>
            </div>
            <p className="hb-field-hint">
                Bash and PowerShell families are platform-specific, not simultaneously default-on. Counts
                above describe the snapshot, not running tools.
            </p>
            <details className="hb-tool-context">
                <summary>Reference context, gates, and schema semantics</summary>
                <dl>
                    <div>
                        <dt>Platform</dt>
                        <dd>{profile.platform}</dd>
                    </div>
                    <div>
                        <dt>Editing branch</dt>
                        <dd>{profile.editingStyle}</dd>
                    </div>
                    <div>
                        <dt>Root mode / agent</dt>
                        <dd>
                            {profile.agentMode}; custom agent: {profile.customAgent}.
                        </dd>
                    </div>
                    <div>
                        <dt>Optional capabilities</dt>
                        <dd>{profile.optionalCapabilitiesAndExperiments}</dd>
                    </div>
                    <div>
                        <dt>Reference scope</dt>
                        <dd>{profile.scope}</dd>
                    </div>
                    {REFERENCE_DEFAULT_STATUSES.map((status) => (
                        <div key={status}>
                            <dt>{DEFAULT_STATUS_LABELS[status]}</dt>
                            <dd>{toolCatalog.context.defaultStatusDefinitions[status]}</dd>
                        </div>
                    ))}
                    <div>
                        <dt>Inherited coding policy</dt>
                        <dd>{toolCatalog.context.inheritedCoding}</dd>
                    </div>
                    <div>
                        <dt>Override schemas</dt>
                        <dd>{toolCatalog.context.parametersSemantics}</dd>
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
                <p className="hb-field-hint">
                    Static repository snapshot{" "}
                    <code title={toolCatalog.revision}>{toolCatalog.revision.slice(0, 7)}</code>, not live
                    discovery or authenticated session inspection.
                </p>
                <ToolCatalogSources sources={toolCatalog.context.sources} />
            </details>
        </section>
    );
}

function AliasBrowser({
    query,
    onQueryChange,
    onInspectTool,
    inputRef,
}: {
    query: string;
    onQueryChange: (value: string) => void;
    onInspectTool: (name: BuiltinName) => void;
    inputRef: Ref<HTMLInputElement>;
}) {
    const normalized = query.trim().toLowerCase();
    const aliases = toolCatalog.context.aliases.filter((alias) =>
        `${alias.name} ${alias.targets.join(" ")}`.toLowerCase().includes(normalized),
    );
    return (
        <>
            <Notice title="Selection aliases / groups are not extra tools" tone="accent">
                <p>{toolCatalog.context.aliasSemantics}</p>
                <p>
                    These runtime selection aliases are not automatically valid expansion rules for the
                    SDK&apos;s <code>availableTools</code> or
                    <code> excludedTools</code> fields. Some share a spelling with a descriptor; the alias and
                    descriptor are distinct surfaces.
                </p>
            </Notice>
            <div className="hb-search-field">
                <Search size={16} aria-hidden="true" />
                <TextField
                    ref={inputRef}
                    label="Search selection aliases"
                    type="search"
                    value={query}
                    onValueChange={onQueryChange}
                    placeholder="Search alias names or their targets"
                />
            </div>
            <p className="hb-field-hint" role="status">
                {aliases.length} of {toolCatalog.context.aliases.length} selection aliases. Browsing a target
                does not add or enable it.
            </p>
            <div className="hb-tool-alias-list">
                {aliases.map((alias) => (
                    <article
                        className="hb-tool-alias-card"
                        key={alias.name}
                        aria-label={`${alias.name} selection alias`}
                    >
                        <div>
                            <h4>
                                <code>{alias.name}</code>
                            </h4>
                            <Badge>Selection alias</Badge>
                        </div>
                        {BUILTIN_NAMES.some((name) => name === alias.name) && (
                            <p className="hb-field-hint">
                                Also spells a descriptor name; this entry describes the alias expansion, not
                                that descriptor.
                            </p>
                        )}
                        <p className="hb-small-label">Captured targets</p>
                        <div className="hb-chip-list">
                            {alias.targets.map((target) => {
                                const name = BUILTIN_NAMES.find((entry) => entry === target);
                                return name ? (
                                    <button
                                        className="hb-diff-chip"
                                        key={target}
                                        onClick={() => onInspectTool(name)}
                                        aria-label={`Inspect ${target} descriptor`}
                                    >
                                        <code>{target}</code>
                                        <ArrowRight size={12} aria-hidden="true" />
                                    </button>
                                ) : (
                                    <span className="hb-alias-nondescriptor" key={target}>
                                        <code>{target}</code>
                                        <span>Group / projected target, not a native descriptor</span>
                                    </span>
                                );
                            })}
                        </div>
                        <details className="hb-tool-evidence">
                            <summary>Pinned alias source</summary>
                            <ToolCatalogSources sources={alias.sources} />
                        </details>
                    </article>
                ))}
            </div>
            {aliases.length === 0 && (
                <EmptyState icon={<Search size={23} />} title="No matching aliases">
                    Try a broader alias or target name. The native descriptor inventory is unchanged.
                </EmptyState>
            )}
        </>
    );
}
