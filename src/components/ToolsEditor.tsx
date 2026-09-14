// Copyright (c) Microsoft Corporation. All rights reserved.
import { Plus, Trash2, Wrench } from "lucide-react";
import { BUILTIN_NAMES, createCustomTool } from "../domain/plan";
import type { CustomTool } from "../domain/plan";
import { toolCatalog } from "../content/builtin-tools";
import { toolSummary } from "../domain/analysis";
import { issueFor, uniqueName } from "./editor";
import type { EditorProps } from "./editor";
import { McpEditor } from "./McpEditor";
import { ToolCatalogBrowser } from "./ToolCatalogBrowser";
import { Button, ChoiceField, EmptyState, Panel, TextAreaField, TextField, ToggleField } from "./ui";
import "../tool-catalog.css";

export function ToolsEditor(props: EditorProps) {
    const { plan, edit, issues } = props;
    const summary = toolSummary(plan);
    return (
        <div className="hb-editor-stack">
            <Panel
                title="Choose the tool selection policy"
                description="Current plan decisions are not a live enabled-tool inventory. Availability, implementation, and authority remain separate."
            >
                <ChoiceField
                    label="Tool inventory"
                    value={plan.inventory}
                    options={[
                        {
                            value: "explicit",
                            label: "Explicit inventory",
                            description: "Selected names, still subject to gates",
                        },
                        {
                            value: "coding-defaults",
                            label: "Coding defaults",
                            description: "Leave runtime default selection intact",
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
                            : summary.inherited
                              ? toolCatalog.context.inheritedCoding
                              : "Keep selects a name in the explicit inventory. Runtime, platform, feature, and permission gates still apply."
                    }
                />
                <div className="hb-tool-totals" aria-label="Current plan decisions, not enabled-tool counts">
                    <span>
                        <strong>{summary.kept.length}</strong>{" "}
                        {summary.inherited
                            ? "left to default policy / not excluded"
                            : "selected built-in names"}
                    </span>
                    <span>
                        <strong>{summary.overridden.length}</strong> override requests
                    </span>
                    <span>
                        <strong>{summary.removed.length}</strong> exclusions
                    </span>
                    <span>
                        <strong>{plan.customTools.length}</strong> custom declarations
                    </span>
                    <span>
                        <strong>{summary.mcpTools}</strong> MCP declarations
                    </span>
                </div>
                <p className="hb-field-hint">
                    Switching inventory policy retains your Keep / Override / Remove choices. In inherited
                    mode, Keep is labeled Runtime default and never forces all {BUILTIN_NAMES.length}{" "}
                    descriptors on.
                </p>
            </Panel>
            <ToolCatalogBrowser {...props} />
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
