// Copyright (c) Microsoft Corporation. All rights reserved.
import { useState } from "react";
import { ArrowRight, Braces, CircleHelp, Plus, Search, Trash2, Wrench } from "lucide-react";
import { BUILTIN_NAMES, BUILTIN_SPECS, createCustomTool } from "../domain/plan";
import type { BuiltinName, CustomTool } from "../domain/plan";
import { toolSummary } from "../domain/analysis";
import { issueFor, uniqueName } from "./editor";
import type { EditorProps } from "./editor";
import { McpEditor } from "./McpEditor";
import {
    Badge,
    Button,
    ChoiceField,
    EmptyState,
    Notice,
    Panel,
    TextAreaField,
    TextField,
    ToggleField,
} from "./ui";

export function ToolsEditor(props: EditorProps) {
    const { plan, edit, issues } = props;
    const [query, setQuery] = useState("");
    const summary = toolSummary(plan);
    const filtered = BUILTIN_NAMES.filter((name) =>
        `${name} ${BUILTIN_SPECS[name].label} ${BUILTIN_SPECS[name].group}`
            .toLowerCase()
            .includes(query.trim().toLowerCase()),
    );
    return (
        <div className="hb-editor-stack">
            <Panel
                title="Make the advertised inventory intentional"
                description="Availability and implementation are separate decisions. Keep a name, change its behavior, or remove it."
            >
                <ChoiceField
                    label="Tool inventory"
                    value={plan.inventory}
                    options={[
                        {
                            value: "explicit",
                            label: "Explicit inventory",
                            description: "Only the selected declarations",
                        },
                        {
                            value: "coding-defaults",
                            label: "Coding defaults",
                            description: "Selected tools + inherited inventory",
                            disabled: plan.clientMode === "empty",
                        },
                    ]}
                    onValueChange={(value) =>
                        edit((draft) => {
                            draft.inventory = value;
                        })
                    }
                    error={issueFor(issues, "inventory")}
                    hint={
                        plan.clientMode === "empty"
                            ? "Empty client mode requires an explicit inventory. The client baseline is editable in Overview."
                            : "Coding defaults can expose additional runtime tools not listed in this curated primary set."
                    }
                />
                <div className="hb-tool-totals" aria-label="Current tool counts">
                    <span>
                        <strong>{summary.kept.length}</strong> kept
                    </span>
                    <span>
                        <strong>{summary.overridden.length}</strong> overridden
                    </span>
                    <span>
                        <strong>{summary.removed.length}</strong> removed
                    </span>
                    <span>
                        <strong>{plan.customTools.length}</strong> custom
                    </span>
                    <span>
                        <strong>{summary.mcpTools}</strong> MCP
                    </span>
                </div>
            </Panel>
            <Panel
                title="Primary built-in tools"
                description="A curated primary set, not the full runtime catalog. Override routes the same tool name to your host."
                action={<Badge>{BUILTIN_NAMES.length} primary tools</Badge>}
            >
                <div className="hb-search-field">
                    <Search size={16} aria-hidden="true" />
                    <TextField
                        label="Filter primary tools"
                        value={query}
                        onValueChange={setQuery}
                        placeholder="Find a tool by name or purpose"
                        type="search"
                    />
                </div>
                <div className="hb-builtin-list">
                    {filtered.map((name) => (
                        <BuiltinRow key={name} name={name} {...props} />
                    ))}
                    {filtered.length === 0 && (
                        <p className="hb-muted-copy">No primary tools match this filter.</p>
                    )}
                </div>
                <Notice title="Some names are deliberately reserved">
                    <code>catalog_search</code> and <code>tool_search_tool</code> are not available in the
                    generic custom-tool adder. Use the dedicated override control above for the listed
                    built-ins.
                </Notice>
            </Panel>
            <Panel
                title="Custom host tools"
                description="Declare a capability the host will implement. This app never invokes its handler."
                action={
                    <Button
                        size="small"
                        disabled={plan.customTools.length >= 20}
                        onClick={() => {
                            const tool = createCustomTool(
                                crypto.randomUUID(),
                                uniqueName("lookup_record", [
                                    ...BUILTIN_NAMES,
                                    "catalog_search",
                                    "tool_search_tool",
                                    ...plan.customTools.map((entry) => entry.name),
                                ]),
                            );
                            edit((draft) => {
                                draft.customTools.push(tool);
                            });
                        }}
                    >
                        <Plus size={15} aria-hidden="true" />
                        Add custom tool
                    </Button>
                }
            >
                {plan.customTools.length === 0 && (
                    <EmptyState icon={<Wrench size={23} />} title="Your domain, your handler">
                        Add a record lookup, document service, or bounded workflow action without inheriting a
                        native implementation.
                    </EmptyState>
                )}
                <div className="hb-item-list">
                    {plan.customTools.map((tool, index) => (
                        <CustomToolRow key={tool.id} tool={tool} index={index} {...props} />
                    ))}
                </div>
            </Panel>
            <McpEditor {...props} />
        </div>
    );
}

function BuiltinRow({ name, plan, edit, issues, onEvidence }: EditorProps & { name: BuiltinName }) {
    const spec = BUILTIN_SPECS[name];
    const settings = plan.tools[name];
    return (
        <article
            className={`hb-builtin-row hb-builtin-${settings.action}`}
            aria-label={`${name} built-in tool`}
        >
            <div className="hb-builtin-heading">
                <div className="hb-builtin-identity">
                    <span className="hb-tool-icon">
                        <Braces size={17} aria-hidden="true" />
                    </span>
                    <div>
                        <div className="hb-name-line">
                            <code>{name}</code>
                            <span>{spec.group}</span>
                        </div>
                        <p>{spec.label}</p>
                    </div>
                </div>
                <ChoiceField
                    label={`${name} action`}
                    compact
                    value={settings.action}
                    options={[
                        { value: "keep", label: "Keep" },
                        { value: "override", label: "Override" },
                        { value: "remove", label: "Remove" },
                    ]}
                    onValueChange={(value) =>
                        edit((draft) => {
                            draft.tools[name].action = value;
                        })
                    }
                />
            </div>
            {settings.action === "override" && (
                <div className="hb-override-editor">
                    <div className="hb-route-change">
                        <div>
                            <span>Before</span>
                            <code>{name}</code>
                            <ArrowRight size={13} aria-hidden="true" />
                            <span>Native implementation</span>
                        </div>
                        <div>
                            <span>Now</span>
                            <code>{name}</code>
                            <ArrowRight size={13} aria-hidden="true" />
                            <code>host.toolHandlers[&quot;{name}&quot;]</code>
                        </div>
                    </div>
                    <TextAreaField
                        label={`${name} override description`}
                        rows={2}
                        maxLength={600}
                        value={settings.description}
                        onValueChange={(value) =>
                            edit((draft) => {
                                draft.tools[name].description = value;
                            })
                        }
                        error={issueFor(issues, `tools.${name}.description`)}
                        hint="Describe the actual replacement behavior that the model should expect."
                    />
                    <TextAreaField
                        label={`${name} override parameters (JSON)`}
                        monospace
                        spellCheck={false}
                        rows={7}
                        maxLength={12000}
                        value={settings.parameters}
                        onValueChange={(value) =>
                            edit((draft) => {
                                draft.tools[name].parameters = value;
                            })
                        }
                        error={issueFor(issues, `tools.${name}.parameters`)}
                        hint={
                            'Your host schema must have top-level "type": "object". The starter schema is illustrative, not the native schema.'
                        }
                    />
                    <div className="hb-override-boundary">
                        <p>
                            <strong>No automatic original implementation.</strong> Your handler owns the
                            replacement effect and its authorization checks.
                        </p>
                        <Button
                            variant="ghost"
                            size="small"
                            onClick={() =>
                                onEvidence({
                                    kind: "topic",
                                    title: `What overriding ${name} changes`,
                                    detail: "overridesBuiltInTool replaces the advertised description, parameter schema, and execution route under the same unqualified tool name. The host must provide the handler; native effects and native permission checks are not automatically inherited. Updating live declarations alone does not rebind SDK handlers.",
                                    sources: [
                                        "override-planning",
                                        "override-schema",
                                        "override-dispatch",
                                        "override-permissions",
                                        "sdk-live-tools",
                                    ],
                                })
                            }
                        >
                            <CircleHelp size={15} aria-hidden="true" />
                            Why this matters
                        </Button>
                    </div>
                </div>
            )}
        </article>
    );
}

function CustomToolRow({ tool, index, edit, issues }: EditorProps & { tool: CustomTool; index: number }) {
    function editTool(recipe: (current: CustomTool) => void) {
        edit((draft) => {
            const target = draft.customTools.find((entry) => entry.id === tool.id);
            if (target) recipe(target);
        });
    }
    return (
        <article className="hb-item-card" aria-label={`Custom tool ${tool.name || index + 1}`}>
            <div className="hb-item-heading">
                <span className="hb-item-title">
                    <Wrench size={16} aria-hidden="true" />
                    <h4>Host tool {index + 1}</h4>
                </span>
                <Button
                    variant="ghost"
                    size="icon"
                    aria-label={`Remove custom tool ${tool.name || index + 1}`}
                    onClick={() => {
                        edit((draft) => {
                            draft.customTools = draft.customTools.filter((entry) => entry.id !== tool.id);
                        });
                    }}
                >
                    <Trash2 size={16} aria-hidden="true" />
                </Button>
            </div>
            <TextField
                label="Custom tool name"
                value={tool.name}
                maxLength={64}
                monospace
                spellCheck={false}
                onValueChange={(value) =>
                    editTool((target) => {
                        target.name = value;
                    })
                }
                error={issueFor(issues, `customTools.${index}.name`)}
                hint="An unqualified declaration name. Use letters, digits, underscores, or hyphens; no custom: prefix."
            />
            <TextAreaField
                label="Custom tool description"
                rows={2}
                maxLength={600}
                value={tool.description}
                onValueChange={(value) =>
                    editTool((target) => {
                        target.description = value;
                    })
                }
                error={issueFor(issues, `customTools.${index}.description`)}
            />
            <TextAreaField
                label="Custom tool parameters (JSON)"
                monospace
                spellCheck={false}
                rows={7}
                maxLength={12000}
                value={tool.parameters}
                onValueChange={(value) =>
                    editTool((target) => {
                        target.parameters = value;
                    })
                }
                error={issueFor(issues, `customTools.${index}.parameters`)}
                hint={
                    'Use a JSON object schema with top-level "type": "object". The host must validate its own semantics.'
                }
            />
            <ToggleField
                label="Terminal tool"
                description="Mark successful execution as terminal. This is not a cancellation or failure-handling policy."
                checked={tool.terminal}
                onCheckedChange={(checked) =>
                    editTool((target) => {
                        target.terminal = checked;
                    })
                }
            />
        </article>
    );
}
