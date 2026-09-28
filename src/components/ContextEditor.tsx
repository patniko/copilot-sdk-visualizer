// Copyright (c) Microsoft Corporation. All rights reserved.
import { FolderOpen, LibraryBig } from "lucide-react";
import { issueFor } from "./editor";
import type { EditorProps } from "./editor";
import { Badge, Button, LineListField, Notice, Panel, TextField, ToggleField } from "./ui";
import { SettingHelp } from "./SettingHelp";
import { contextToggleHelp } from "../content/context-help";
import { valueHelp } from "../content/setting-help";
import { SkillProviderPreview } from "./SkillProviderPreview";

export function ContextEditor({ plan, edit, issues, onEvidence }: EditorProps) {
    return (
        <div className="hb-editor-stack">
            <Notice title="These are future host inputs" tone="accent">
                This browser app does not read a project, inspect directories, install packs, or discover
                instructions. Paths describe the environment your integration will supply.
            </Notice>
            <Panel
                title="Project context"
                description="A code checkout is optional. Native workspace tools and session storage remain separate choices."
                action={<FolderOpen size={19} aria-hidden="true" />}
            >
                <TextField
                    label="Project working directory"
                    help={<SettingHelp help={valueHelp.workspace} />}
                    value={plan.context.workspace}
                    placeholder="Optional, e.g. ./workspace"
                    monospace
                    maxLength={1000}
                    onValueChange={(value) =>
                        edit((draft) => {
                            draft.context.workspace = value;
                        })
                    }
                    error={issueFor(issues, "context.workspace")}
                    hint="Blank leaves the project directory unspecified; it does not sandbox native filesystem tools."
                />
                <div className="hb-toggle-list">
                    <ToggleField
                        label="Configuration discovery"
                        description="Discover supported host/project configuration; explicitly supplied settings take precedence."
                        help={
                            <SettingHelp
                                help={contextToggleHelp.discovery}
                                enabled={plan.context.discovery}
                            />
                        }
                        checked={plan.context.discovery}
                        onCheckedChange={(checked) =>
                            edit((draft) => {
                                draft.context.discovery = checked;
                            })
                        }
                    />
                    <ToggleField
                        label="Skills"
                        description="Allow built-in and directory-based skills to load; tool selection is a separate choice."
                        help={<SettingHelp help={contextToggleHelp.skills} enabled={plan.context.skills} />}
                        checked={plan.context.skills}
                        onCheckedChange={(checked) =>
                            edit((draft) => {
                                draft.context.skills = checked;
                            })
                        }
                    />
                    <ToggleField
                        label="Host Git operations"
                        description="Supply Git branch, status, and history context—not permission to commit or push."
                        help={<SettingHelp help={contextToggleHelp.hostGit} enabled={plan.context.hostGit} />}
                        checked={plan.context.hostGit}
                        onCheckedChange={(checked) =>
                            edit((draft) => {
                                draft.context.hostGit = checked;
                            })
                        }
                    />
                </div>
                <p className="hb-field-hint">
                    Use the help buttons for on/off behavior and examples. Empty and Minimal start with these
                    switches off; the builder&apos;s Copilot composition opts in. Those are profile choices,
                    not universal SDK defaults.
                </p>
            </Panel>
            <Panel
                title="Reviewed capability packs"
                description="Explicit directory inputs for the host. Adding a path is not marketplace installation or live activation."
                action={<Badge>Path-based inputs</Badge>}
            >
                <div className="hb-field-grid">
                    <LineListField
                        label="Skill directories"
                        help={
                            <SettingHelp
                                help={valueHelp.skillDirectories}
                                value={`${plan.context.skillDirectories.length} directories`}
                            />
                        }
                        values={plan.context.skillDirectories}
                        onValuesChange={(values) =>
                            edit((draft) => {
                                draft.context.skillDirectories = values;
                            })
                        }
                        rows={6}
                        monospace
                        placeholder="./reviewed-skills"
                        hint="One future-host directory per line."
                        error={issueFor(issues, "context.skillDirectories")}
                    />
                    <LineListField
                        label="Plugin directories"
                        help={
                            <SettingHelp
                                help={valueHelp.pluginDirectories}
                                value={`${plan.context.pluginDirectories.length} directories`}
                            />
                        }
                        values={plan.context.pluginDirectories}
                        onValuesChange={(values) =>
                            edit((draft) => {
                                draft.context.pluginDirectories = values;
                            })
                        }
                        rows={6}
                        monospace
                        placeholder="./reviewed-plugins"
                        hint="One future-host directory per line."
                        error={issueFor(issues, "context.pluginDirectories")}
                    />
                </div>
                <Notice title="Directory inputs are not a programmatic registry">
                    File materialization is an existing integration path. Skill-provider bindings, pack
                    portability, and atomic live replacement have distinct SDK and lifecycle limits.
                    <Button
                        variant="ghost"
                        size="small"
                        onClick={() =>
                            onEvidence({
                                kind: "topic",
                                title: "Capability pack inputs and their limits",
                                detail: "Reviewed skill and plugin directories are supported inputs. They do not promise a service-backed registry, universal package compatibility, or atomic hot swaps. The runtime skill-provider transport is ahead of the inspected high-level Node callback surface.",
                                sources: [
                                    "sdk-pack-inputs",
                                    "runtime-skills",
                                    "sdk-callbacks",
                                    "plugin-reload-boundary",
                                    "plugin-formats",
                                ],
                            })
                        }
                    >
                        <LibraryBig size={15} aria-hidden="true" />
                        Explore pack boundaries
                    </Button>
                </Notice>
            </Panel>
            <SkillProviderPreview />
        </div>
    );
}
