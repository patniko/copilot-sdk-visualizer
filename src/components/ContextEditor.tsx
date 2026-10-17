// Copyright (c) Microsoft Corporation. All rights reserved.
import { FolderOpen, LibraryBig, ScrollText } from "lucide-react";
import { issueFor } from "./editor";
import type { EditorProps } from "./editor";
import {
    Badge,
    Button,
    LineListField,
    Notice,
    Panel,
    SelectField,
    TextAreaField,
    TextField,
    ToggleField,
} from "./ui";
import { SettingHelp } from "./SettingHelp";
import { contextToggleHelp } from "../content/context-help";
import { toggleHelp, valueHelp } from "../content/setting-help";
import { SkillProviderPreview } from "./SkillProviderPreview";

const DISCOVERY_ROOTS = [
    { key: "agentDirectories", label: "Agent directories", placeholder: "./reviewed-agents" },
    { key: "hookDirectories", label: "Hook directories", placeholder: "./reviewed-hooks" },
    { key: "instructionDirectories", label: "Instruction directories", placeholder: "./team-instructions" },
] as const;

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
                <LineListField
                    label="Additional accessible directories"
                    help={
                        <SettingHelp
                            help={valueHelp.additionalDirectories}
                            value={`${plan.context.additionalDirectories.length} directories`}
                        />
                    }
                    values={plan.context.additionalDirectories}
                    onValuesChange={(values) =>
                        edit((draft) => {
                            draft.context.additionalDirectories = values;
                        })
                    }
                    rows={3}
                    monospace
                    placeholder="../shared-proto"
                    hint="One future-host directory per line. Unlike the discovery-only roots below, these extend where tools may work; re-supplied on resume."
                    error={issueFor(issues, "context.additionalDirectories")}
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
                <h4 className="hb-subsection-title">Discovery-only roots</h4>
                <p className="hb-field-hint">
                    Load agent, hook, and instruction files from these roots even with configuration discovery
                    off. They grant no general filesystem access; source and managed disables still apply.
                </p>
                <div className="hb-field-grid">
                    {DISCOVERY_ROOTS.map(({ key, label, placeholder }) => (
                        <LineListField
                            key={key}
                            label={label}
                            help={
                                <SettingHelp
                                    help={valueHelp[key]}
                                    value={`${plan.context[key].length} directories`}
                                />
                            }
                            values={plan.context[key]}
                            onValuesChange={(values) =>
                                edit((draft) => {
                                    draft.context[key] = values;
                                })
                            }
                            rows={3}
                            monospace
                            placeholder={placeholder}
                            hint={
                                key === "hookDirectories"
                                    ? "Hook files run commands; review them like code."
                                    : "One future-host directory per line."
                            }
                            error={issueFor(issues, `context.${key}`)}
                        />
                    ))}
                    <LineListField
                        label="Included built-in skills"
                        help={
                            <SettingHelp
                                help={valueHelp.includedBuiltinSkills}
                                value={`${plan.context.includedBuiltinSkills.length} skills`}
                            />
                        }
                        values={plan.context.includedBuiltinSkills}
                        onValuesChange={(values) =>
                            edit((draft) => {
                                draft.context.includedBuiltinSkills = values;
                            })
                        }
                        rows={3}
                        monospace
                        placeholder="skill-name"
                        hint={
                            plan.clientMode === "empty"
                                ? "The Empty baseline excludes every bundled skill unless listed here."
                                : "Bundled skills are already eligible in the Copilot CLI baseline."
                        }
                        error={issueFor(issues, "context.includedBuiltinSkills")}
                    />
                </div>
                <Notice title="Directory inputs are not a programmatic registry">
                    File materialization is an existing integration path. To serve skills from your own
                    storage, use the experimental skill provider below. Pack portability and atomic live
                    replacement still have distinct SDK and lifecycle limits.
                    <Button
                        variant="ghost"
                        size="small"
                        onClick={() =>
                            onEvidence({
                                kind: "topic",
                                title: "Capability pack inputs and their limits",
                                detail: "Reviewed skill, plugin, agent, hook, and instruction directories are supported inputs. They do not promise universal package compatibility or atomic hot swaps. For skills that live in host storage, the SDK offers an experimental session skill provider (listSkills/readSkill) that must be supplied again on resume.",
                                sources: [
                                    "sdk-pack-inputs",
                                    "runtime-skills",
                                    "sdk-skill-provider",
                                    "sdk-discovery-roots",
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
            <SkillProviderPreview plan={plan} edit={edit} issues={issues} />
            <Panel
                title="Custom instructions"
                description="Choose which instruction files load and add organization-wide guidance."
                action={<ScrollText size={19} aria-hidden="true" />}
            >
                <SelectField
                    label="Custom instruction files"
                    help={
                        <SettingHelp
                            help={valueHelp.customInstructions}
                            value={plan.context.customInstructions}
                        />
                    }
                    value={plan.context.customInstructions}
                    options={[
                        { value: "default", label: "Baseline default" },
                        { value: "load", label: "Load instruction files" },
                        { value: "skip", label: "Skip instruction files" },
                    ]}
                    onValueChange={(value) =>
                        edit((draft) => {
                            draft.context.customInstructions = value;
                        })
                    }
                    hint={
                        plan.clientMode === "empty"
                            ? "The Empty baseline skips files such as AGENTS.md unless you choose Load."
                            : "The Copilot CLI baseline loads files such as AGENTS.md unless you choose Skip."
                    }
                />
                <div className="hb-toggle-list">
                    <ToggleField
                        label="On-demand instruction discovery"
                        description="Pick up instruction files for folders the agent views during the session."
                        help={
                            <SettingHelp
                                help={toggleHelp.onDemandInstructions}
                                enabled={plan.context.onDemandInstructions}
                            />
                        }
                        checked={plan.context.onDemandInstructions}
                        onCheckedChange={(checked) =>
                            edit((draft) => {
                                draft.context.onDemandInstructions = checked;
                            })
                        }
                    />
                    <ToggleField
                        label="Refresh instruction cache"
                        description="Re-read changed instruction files when this session is created (create only)."
                        help={
                            <SettingHelp
                                help={toggleHelp.refreshCustomInstructions}
                                enabled={plan.context.refreshCustomInstructions}
                            />
                        }
                        checked={plan.context.refreshCustomInstructions}
                        onCheckedChange={(checked) =>
                            edit((draft) => {
                                draft.context.refreshCustomInstructions = checked;
                            })
                        }
                    />
                </div>
                <TextAreaField
                    label="Organization instructions"
                    help={<SettingHelp help={valueHelp.organizationInstructions} />}
                    value={plan.context.organizationInstructions}
                    rows={4}
                    maxLength={12000}
                    placeholder="Optional guidance added to every session's system prompt"
                    onValueChange={(value) =>
                        edit((draft) => {
                            draft.context.organizationInstructions = value;
                        })
                    }
                    error={issueFor(issues, "context.organizationInstructions")}
                    hint="Prompt guidance, not enforced policy. Keep secrets out of it."
                />
            </Panel>
        </div>
    );
}
