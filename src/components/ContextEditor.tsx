// Copyright (c) Microsoft Corporation. All rights reserved.
import { FolderOpen, LibraryBig } from "lucide-react";
import { issueFor } from "./editor";
import type { EditorProps } from "./editor";
import { Badge, Button, LineListField, Notice, Panel, TextField, ToggleField } from "./ui";

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
                        description="Allow the future host to discover trusted project configuration and instructions."
                        checked={plan.context.discovery}
                        onCheckedChange={(checked) =>
                            edit((draft) => {
                                draft.context.discovery = checked;
                            })
                        }
                    />
                    <ToggleField
                        label="Skills"
                        description="Enable skill loading independently of whether the skill tool is in the inventory."
                        checked={plan.context.skills}
                        onCheckedChange={(checked) =>
                            edit((draft) => {
                                draft.context.skills = checked;
                            })
                        }
                    />
                    <ToggleField
                        label="File-based hooks"
                        description="Opt into configured file hooks. This is separate from host callback hooks."
                        checked={plan.context.fileHooks}
                        onCheckedChange={(checked) =>
                            edit((draft) => {
                                draft.context.fileHooks = checked;
                            })
                        }
                    />
                    <ToggleField
                        label="Host Git operations"
                        description="Allow the runtime's host Git integration for the intended project."
                        checked={plan.context.hostGit}
                        onCheckedChange={(checked) =>
                            edit((draft) => {
                                draft.context.hostGit = checked;
                            })
                        }
                    />
                </div>
            </Panel>
            <Panel
                title="Reviewed capability packs"
                description="Explicit directory inputs for the host. Adding a path is not marketplace installation or live activation."
                action={<Badge>Path-based inputs</Badge>}
            >
                <div className="hb-field-grid">
                    <LineListField
                        label="Skill directories"
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
        </div>
    );
}
