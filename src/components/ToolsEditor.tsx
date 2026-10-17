// Copyright (c) Microsoft Corporation. All rights reserved.
import * as Tabs from "@radix-ui/react-tabs";
import { Plus, Sparkles, Trash2, Wrench } from "lucide-react";
import { BUILTIN_NAMES, createCustomTool } from "../domain/plan";
import type { CustomTool } from "../domain/plan";
import { toolCatalog } from "../content/builtin-tools";
import { toolSummary } from "../domain/analysis";
import { issueFor, uniqueName } from "./editor";
import type { EditorProps } from "./editor";
import { McpEditor } from "./McpEditor";
import { SettingHelp } from "./SettingHelp";
import { toggleHelp, valueHelp } from "../content/setting-help";
import { ToolCatalogBrowser, ToolCatalogReference } from "./ToolCatalogBrowser";
import {
    Badge,
    Button,
    ChoiceField,
    CountField,
    EmptyState,
    ExperimentalBadge,
    Notice,
    Panel,
    SelectField,
    TextAreaField,
    TextField,
    ToggleField,
} from "./ui";
import "../tool-catalog.css";

export function ToolsEditor(props: EditorProps) {
    const { plan, edit, issues } = props;
    const summary = toolSummary(plan);
    return (
        <div className="hb-editor-stack">
            <Panel
                title="Choose the tool selection policy"
                description="Current plan decisions are not a live enabled-tool inventory. Availability, implementation, and authority remain separate."
                action={<SettingHelp help={valueHelp.inventory} value={plan.inventory} />}
            >
                <ChoiceField
                    label="Tool inventory"
                    hideLabel
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
            </Panel>
            <Panel
                title="Tool capabilities"
                description="Session options that change how tools are loaded and how ask_user and images behave."
                action={<Sparkles size={19} aria-hidden="true" />}
            >
                <div className="hb-toggle-list">
                    <ToggleField
                        label="Image generation"
                        badge={<ExperimentalBadge />}
                        help={
                            <SettingHelp
                                help={toggleHelp.imageGeneration}
                                enabled={plan.capabilities.imageGeneration}
                            />
                        }
                        description="Opt in to an authorized Copilot image model. Not available with bring-your-own providers; not persisted across runtime restarts."
                        checked={plan.capabilities.imageGeneration}
                        onCheckedChange={(checked) =>
                            edit((draft) => {
                                draft.capabilities.imageGeneration = checked;
                            })
                        }
                    />
                </div>
                {plan.capabilities.imageGeneration && plan.model.provider !== "copilot" && (
                    <Notice title="Not available with a custom provider" tone="accent">
                        Image generation needs the GitHub Copilot inference route. The opt-in is kept in the
                        plan but has no effect while Models &amp; identity uses bring-your-own inference.
                    </Notice>
                )}
                <div className="hb-field-grid">
                    <SelectField
                        label="Tool search"
                        help={
                            <SettingHelp help={valueHelp.toolSearch} value={plan.capabilities.toolSearch} />
                        }
                        value={plan.capabilities.toolSearch}
                        options={[
                            { value: "default", label: "Runtime default" },
                            { value: "enabled", label: "Enabled" },
                            { value: "disabled", label: "Disabled (preload every tool)" },
                        ]}
                        onValueChange={(value) =>
                            edit((draft) => {
                                draft.capabilities.toolSearch = value;
                            })
                        }
                        hint="Defers MCP and external tools behind tool_search_tool when there are many."
                    />
                    <CountField
                        label="Deferral threshold"
                        help={
                            <SettingHelp
                                help={valueHelp.toolSearchThreshold}
                                value={plan.capabilities.toolSearchDeferThreshold || "Built-in (30)"}
                            />
                        }
                        value={plan.capabilities.toolSearchDeferThreshold}
                        max={10_000}
                        placeholder="Built-in (30)"
                        onValueChange={(value) =>
                            edit((draft) => {
                                draft.capabilities.toolSearchDeferThreshold = value;
                            })
                        }
                        error={issueFor(issues, "capabilities.toolSearchDeferThreshold")}
                        hint="Total tool count before deferral starts. Blank or 0 keeps the built-in threshold."
                    />
                </div>
                <SelectField
                    label="ask_user shape"
                    help={
                        <SettingHelp
                            help={valueHelp.askUserVariant}
                            value={plan.capabilities.askUserVariant}
                        />
                    }
                    value={plan.capabilities.askUserVariant}
                    options={[
                        { value: "default", label: "SDK default (legacy)" },
                        { value: "legacy", label: "Legacy questions" },
                        { value: "elicitation", label: "Elicitation forms" },
                    ]}
                    onValueChange={(value) =>
                        edit((draft) => {
                            draft.capabilities.askUserVariant = value;
                        })
                    }
                    error={issueFor(issues, "capabilities.askUserVariant")}
                    hint="Elicitation forms need the elicitation request handler under Policy & state."
                />
            </Panel>
            <Tabs.Root defaultValue="built-in" className="hb-tools-tabs">
                <Tabs.List className="hb-tabs-list" aria-label="Tool configuration areas">
                    <Tabs.Trigger className="hb-tab" value="built-in">
                        Built-in tools
                    </Tabs.Trigger>
                    <Tabs.Trigger className="hb-tab" value="custom">
                        Custom tools <Badge>{plan.customTools.length}</Badge>
                    </Tabs.Trigger>
                    <Tabs.Trigger className="hb-tab" value="mcp">
                        MCP servers <Badge>{plan.mcpServers.length}</Badge>
                    </Tabs.Trigger>
                    <Tabs.Trigger className="hb-tab" value="reference">
                        Reference
                    </Tabs.Trigger>
                </Tabs.List>
                <Tabs.Content value="built-in" className="hb-tab-content">
                    <ToolCatalogBrowser {...props} />
                </Tabs.Content>
                <Tabs.Content value="custom" className="hb-tab-content">
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
                                Add a record lookup, document service, or bounded workflow action without
                                inheriting a native implementation.
                            </EmptyState>
                        )}
                        <div className="hb-item-list">
                            {plan.customTools.map((tool, index) => (
                                <CustomToolRow key={tool.id} tool={tool} index={index} {...props} />
                            ))}
                        </div>
                    </Panel>
                </Tabs.Content>
                <Tabs.Content value="mcp" className="hb-tab-content">
                    <McpEditor {...props} />
                </Tabs.Content>
                <Tabs.Content value="reference" className="hb-tab-content">
                    <ToolCatalogReference />
                </Tabs.Content>
            </Tabs.Root>
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
            <details className="hb-tool-advanced-config">
                <summary>Advanced configuration</summary>
                <TextAreaField
                    label="Custom tool parameters (JSON)"
                    help={<SettingHelp help={valueHelp.toolSchema} />}
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
                    help={<SettingHelp help={toggleHelp.terminal} enabled={tool.terminal} />}
                    description="Mark successful execution as terminal. This is not a cancellation or failure-handling policy."
                    checked={tool.terminal}
                    onCheckedChange={(checked) =>
                        editTool((target) => {
                            target.terminal = checked;
                        })
                    }
                />
                <ToggleField
                    label="Skip permission prompt"
                    help={<SettingHelp help={toggleHelp.skipPermission} enabled={tool.skipPermission} />}
                    description="Run without asking the permission handler. Use only for operations your handler already authorizes."
                    checked={tool.skipPermission}
                    onCheckedChange={(checked) =>
                        editTool((target) => {
                            target.skipPermission = checked;
                        })
                    }
                />
                <SelectField
                    label="Tool deferral"
                    help={<SettingHelp help={valueHelp.toolDefer} value={tool.defer} />}
                    value={tool.defer}
                    options={[
                        { value: "default", label: "SDK default (auto)" },
                        { value: "auto", label: "Auto: may load through tool search" },
                        { value: "never", label: "Never: always preload" },
                    ]}
                    onValueChange={(value) =>
                        editTool((target) => {
                            target.defer = value;
                        })
                    }
                    error={issueFor(issues, `customTools.${index}.defer`)}
                />
            </details>
        </article>
    );
}
