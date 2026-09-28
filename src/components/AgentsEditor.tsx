// Copyright (c) Microsoft Corporation. All rights reserved.
import { useId, useState } from "react";
import type { ReactNode } from "react";
import { Plus, Search, Trash2, Users } from "lucide-react";
import { createAgent } from "../domain/plan";
import { SettingHelp } from "./SettingHelp";
import { valueHelp } from "../content/setting-help";
import type { Agent, HarnessPlan } from "../domain/plan";
import { issueFor, uniqueName } from "./editor";
import type { EditorProps } from "./editor";
import { ADVANCED_TOOL_NAMES, PRIMARY_TOOL_NAMES } from "./tool-catalog-ui";
import { Badge, Button, EmptyState, Notice, Panel, SelectField, TextAreaField, TextField } from "./ui";

export function AgentsEditor(props: EditorProps) {
    const { plan, edit, issues } = props;
    return (
        <div className="hb-editor-stack">
            <Panel
                title="Specialists with a defined scope"
                description="Compose named agents from prompts, tool lists, and optional model preferences."
                action={
                    <Button
                        size="small"
                        disabled={plan.agents.length >= 12}
                        onClick={() => {
                            const agent = createAgent(
                                crypto.randomUUID(),
                                uniqueName(
                                    "reviewer",
                                    plan.agents.map((entry) => entry.name),
                                ),
                            );
                            edit((draft) => {
                                draft.agents.push(agent);
                            });
                        }}
                    >
                        <Plus size={15} aria-hidden="true" />
                        Add agent
                    </Button>
                }
            >
                {plan.agents.length === 0 && (
                    <EmptyState icon={<Users size={24} />} title="One agent can be enough">
                        Add a specialist when your workload benefits from a distinct role, not simply to add
                        more agents.
                    </EmptyState>
                )}
                <div className="hb-item-list">
                    {plan.agents.map((agent, index) => (
                        <AgentRow key={agent.id} agent={agent} index={index} {...props} />
                    ))}
                </div>
            </Panel>
            <Panel
                title="Root agent composition"
                description="Select the primary role and define exclusions at that scope only."
                action={<Badge>Root scope</Badge>}
            >
                <SelectField
                    label="Selected root agent"
                    help={
                        <SettingHelp
                            help={valueHelp.selectedAgent}
                            value={plan.selectedAgent || "Default agent"}
                        />
                    }
                    value={plan.selectedAgent}
                    options={[
                        { id: "default", value: "", label: "Default agent" },
                        ...plan.agents.map((agent) => ({
                            id: agent.id,
                            value: agent.name,
                            label: agent.name || "(unnamed agent)",
                            disabled: !agent.name,
                        })),
                    ]}
                    onValueChange={(value) =>
                        edit((draft) => {
                            draft.selectedAgent = value;
                        })
                    }
                    error={issueFor(issues, "selectedAgent")}
                />
                <RootToolExclusions {...props} />
            </Panel>
        </div>
    );
}

type RootToolOption = {
    name: string;
    source: "Built-in" | "Custom" | "MCP" | "Retained";
};

function configuredTools(plan: HarnessPlan, retainedNames: readonly string[]): RootToolOption[] {
    const options = new Map<string, RootToolOption>();
    for (const name of [...PRIMARY_TOOL_NAMES, ...ADVANCED_TOOL_NAMES]) {
        if (plan.tools[name].action !== "remove") options.set(name, { name, source: "Built-in" });
    }
    for (const tool of plan.customTools) {
        if (tool.name.trim()) options.set(tool.name, { name: tool.name, source: "Custom" });
    }
    for (const server of plan.mcpServers) {
        for (const tool of server.tools) {
            if (tool.wireName.trim()) options.set(tool.wireName, { name: tool.wireName, source: "MCP" });
        }
    }
    for (const name of retainedNames) {
        if (!options.has(name)) options.set(name, { name, source: "Retained" });
    }
    return [...options.values()];
}

function RootToolExclusions({ plan, edit, issues }: EditorProps) {
    return (
        <ToolSelectionPicker
            plan={plan}
            title="Tools hidden from the root agent"
            selected={plan.rootExcludedTools}
            mode="exclude"
            help={
                <SettingHelp
                    help={valueHelp.rootExclusions}
                    value={`${plan.rootExcludedTools.length} exclusions`}
                />
            }
            hint="Select from the tools configured on the Tools page. Excluded tools remain available to specialists unless their own tool list removes them."
            clearLabel="Clear exclusions"
            error={issueFor(issues, "rootExcludedTools")}
            onChange={(values) =>
                edit((draft) => {
                    draft.rootExcludedTools = values;
                })
            }
        />
    );
}

function ToolSelectionPicker({
    plan,
    title,
    selected,
    mode,
    help,
    hint,
    clearLabel,
    error,
    onChange,
}: {
    plan: HarnessPlan;
    title: string;
    selected: readonly string[];
    mode: "allow" | "exclude";
    help: ReactNode;
    hint: string;
    clearLabel: string;
    error?: string;
    onChange: (values: string[]) => void;
}) {
    const id = useId();
    const errorId = `${id}-error`;
    const [query, setQuery] = useState("");
    const normalized = query.trim().toLowerCase();
    const options = configuredTools(plan, selected);
    const visible = options.filter((option) => option.name.toLowerCase().includes(normalized));
    const sources = ["Built-in", "Custom", "MCP", "Retained"] as const;
    const retainedCount = options.filter((option) => option.source === "Retained").length;

    function setSelected(name: string, checked: boolean) {
        onChange(checked ? [...new Set([...selected, name])] : selected.filter((entry) => entry !== name));
    }

    return (
        <section
            className="hb-root-tool-picker"
            aria-label={title}
            aria-describedby={error ? errorId : undefined}
        >
            <div className="hb-root-tool-picker-heading">
                <div className="hb-field-heading">
                    <h4>{title}</h4>
                    {help}
                </div>
                {selected.length > 0 && (
                    <Button variant="ghost" size="small" onClick={() => onChange([])}>
                        {clearLabel}
                    </Button>
                )}
            </div>
            <p className="hb-field-hint">{hint}</p>
            {options.length > 6 && (
                <div className="hb-search-field hb-root-tool-search">
                    <Search size={16} aria-hidden="true" />
                    <TextField
                        label={`Search ${title.toLowerCase()}`}
                        type="search"
                        value={query}
                        onValueChange={setQuery}
                        placeholder="Find a configured tool"
                    />
                </div>
            )}
            <div className="hb-root-tool-groups">
                {sources.map((source) => {
                    const group = visible.filter((option) => option.source === source);
                    if (group.length === 0) return null;
                    return (
                        <section key={source} aria-label={`${source} tools`}>
                            <div className="hb-root-tool-group-heading">
                                <span>{source === "Retained" ? "Retained from imported plan" : source}</span>
                                <Badge>{group.length}</Badge>
                            </div>
                            <div className="hb-root-tool-options">
                                {group.map((option) => {
                                    const checked = selected.includes(option.name);
                                    const actionLabel =
                                        mode === "exclude"
                                            ? checked
                                                ? `Include ${option.name} in root agent`
                                                : `Exclude ${option.name} from root agent`
                                            : checked
                                              ? `Remove ${option.name} from specialist tools`
                                              : `Allow ${option.name} for specialist`;
                                    return (
                                        <label className="hb-root-tool-option" key={option.name}>
                                            <input
                                                type="checkbox"
                                                checked={checked}
                                                onChange={(event) =>
                                                    setSelected(option.name, event.currentTarget.checked)
                                                }
                                                aria-label={actionLabel}
                                            />
                                            <code>{option.name}</code>
                                        </label>
                                    );
                                })}
                            </div>
                        </section>
                    );
                })}
            </div>
            {visible.length === 0 && (
                <EmptyState icon={<Search size={20} />} title="No configured tools match">
                    Change the search or configure additional tools on the Tools page.
                </EmptyState>
            )}
            {retainedCount > 0 && (
                <Notice
                    title={`${retainedCount} imported ${retainedCount === 1 ? "name is" : "names are"} retained`}
                >
                    {mode === "exclude"
                        ? "These exclusions no longer match the visible configured inventory."
                        : "These allowed names no longer match the visible configured inventory."}{" "}
                    They remain selected until you remove them.
                </Notice>
            )}
            {error && (
                <p className="hb-field-error" id={errorId}>
                    {error}
                </p>
            )}
        </section>
    );
}

function AgentRow({ agent, index, plan, edit, issues }: EditorProps & { agent: Agent; index: number }) {
    function editAgent(recipe: (current: Agent) => void) {
        edit((draft) => {
            const target = draft.agents.find((entry) => entry.id === agent.id);
            if (target) recipe(target);
        });
    }
    return (
        <article className="hb-item-card" aria-label={`Custom agent ${agent.name || index + 1}`}>
            <div className="hb-item-heading">
                <span className="hb-item-title">
                    <Users size={17} aria-hidden="true" />
                    <h4>Specialist {index + 1}</h4>
                </span>
                <Button
                    variant="ghost"
                    size="icon"
                    aria-label={`Remove agent ${agent.name || index + 1}`}
                    onClick={() => {
                        edit((draft) => {
                            draft.agents = draft.agents.filter((entry) => entry.id !== agent.id);
                            if (draft.selectedAgent === agent.name) draft.selectedAgent = "";
                        });
                    }}
                >
                    <Trash2 size={16} aria-hidden="true" />
                </Button>
            </div>
            <div className="hb-field-grid hb-agent-identity-grid">
                <TextField
                    label="Agent name"
                    value={agent.name}
                    monospace
                    maxLength={64}
                    onValueChange={(value) =>
                        edit((draft) => {
                            const target = draft.agents.find((entry) => entry.id === agent.id);
                            if (!target) return;
                            if (target.name && draft.selectedAgent === target.name)
                                draft.selectedAgent = value;
                            target.name = value;
                        })
                    }
                    error={issueFor(issues, `agents.${index}.name`)}
                />
                <TextField
                    label="Agent model preference"
                    help={
                        <SettingHelp
                            help={valueHelp.agentModel}
                            value={agent.model || "Use session selection"}
                        />
                    }
                    value={agent.model}
                    maxLength={120}
                    placeholder="Optional; use session selection"
                    onValueChange={(value) =>
                        editAgent((target) => {
                            target.model = value;
                        })
                    }
                    error={issueFor(issues, `agents.${index}.model`)}
                    hint="A preference can fall back. It is not a hard model allowlist."
                />
            </div>
            <TextAreaField
                label="Agent description"
                value={agent.description}
                rows={2}
                maxLength={600}
                onValueChange={(value) =>
                    editAgent((target) => {
                        target.description = value;
                    })
                }
                error={issueFor(issues, `agents.${index}.description`)}
            />
            <TextAreaField
                label="Agent prompt"
                value={agent.prompt}
                rows={6}
                maxLength={8000}
                onValueChange={(value) =>
                    editAgent((target) => {
                        target.prompt = value;
                    })
                }
                error={issueFor(issues, `agents.${index}.prompt`)}
            />
            <ToolSelectionPicker
                plan={plan}
                title="Tools available to this specialist"
                selected={agent.tools}
                mode="allow"
                help={<SettingHelp help={valueHelp.agentTools} value={`${agent.tools.length} tools`} />}
                hint="Choose from the tools configured on the Tools page. An empty selection gives this specialist no tools."
                clearLabel="Clear allowed tools"
                error={issueFor(issues, `agents.${index}.tools`)}
                onChange={(values) =>
                    editAgent((target) => {
                        target.tools = values;
                    })
                }
            />
        </article>
    );
}
