// Copyright (c) Microsoft Corporation. All rights reserved.
import { useState } from "react";
import { ArrowRight, Check, ChevronRight, Columns3 } from "lucide-react";
import { PRESETS, changedAxes } from "../domain/presets";
import type { PresetId } from "../domain/plan";
import { LANGUAGES, RUNTIME_OPTIONS } from "../domain/target";
import { BUILTIN_NAMES } from "../content/builtin-tools";
import { HarnessPrimer } from "./HarnessPrimer";
import type { EditorProps, ViewId } from "./editor";
import { Badge, Button, ChoiceField, Panel } from "./ui";
import { SettingHelp } from "./SettingHelp";
import { valueHelp } from "../content/setting-help";
import { ProfileCompareDialog } from "./ProfileCompareDialog";
import { profileIcons } from "./profile-ui";

const axisViews: Record<string, ViewId> = {
    "Runtime & language": "bootstrap",
    "Client baseline": "base-profile",
    Prompt: "prompt",
    "Built-in tools": "tools",
    "Custom tools": "tools",
    "MCP integrations": "tools",
    Agents: "agents",
    Context: "context",
    Policy: "policy",
    Models: "models",
    Identity: "models",
    "Session state": "policy",
    "Events / evaluation": "policy",
};

export function OverviewEditor({ onNavigate }: { onNavigate: (view: ViewId) => void }) {
    return (
        <div className="hb-editor-stack">
            <section className="hb-runtime-entry" aria-labelledby="runtime-entry-title">
                <div>
                    <p className="hb-kicker">Meet the engine</p>
                    <h3 id="runtime-entry-title">What does the runtime give you?</h3>
                </div>
                <Button onClick={() => onNavigate("runtime")}>
                    Explore the runtime <ArrowRight size={15} aria-hidden="true" />
                </Button>
            </section>
            <HarnessPrimer onNavigate={onNavigate} />
        </div>
    );
}

export function BaseProfileEditor({
    plan,
    edit,
    onApplyPreset,
    onNavigate,
}: EditorProps & {
    onApplyPreset: (id: PresetId) => void;
    onNavigate: (view: ViewId) => void;
}) {
    const changes = changedAxes(plan);
    const [comparing, setComparing] = useState<PresetId | null>(null);
    const currentLabel = PRESETS.find((preset) => preset.id === plan.preset)?.label ?? plan.preset;
    return (
        <div className="hb-editor-stack">
            {comparing && (
                <ProfileCompareDialog
                    focus={comparing}
                    current={plan.preset}
                    onClose={() => setComparing(null)}
                    onApply={onApplyPreset}
                />
            )}
            <div className="hb-profile-grid">
                {PRESETS.map((preset) => {
                    const Icon = profileIcons[preset.id];
                    const selected = plan.preset === preset.id;
                    return (
                        <article
                            key={preset.id}
                            className={`hb-profile-card${selected ? " hb-profile-selected" : ""}`}
                        >
                            <div className="hb-profile-top">
                                <span className="hb-profile-icon">
                                    <Icon size={22} aria-hidden="true" />
                                </span>
                                {selected && (
                                    <Badge accent>
                                        <Check size={12} aria-hidden="true" /> Baseline
                                    </Badge>
                                )}
                            </div>
                            <div>
                                <p className="hb-kicker">{preset.tag}</p>
                                <h3>{preset.label}</h3>
                                <p className="hb-profile-description">{preset.description}</p>
                            </div>
                            <div className="hb-profile-actions">
                                <Button
                                    variant={selected ? "primary" : "secondary"}
                                    onClick={() => onApplyPreset(preset.id)}
                                >
                                    Apply {preset.label}
                                    <ArrowRight size={15} aria-hidden="true" />
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="small"
                                    onClick={() => setComparing(preset.id)}
                                    aria-label={`Compare ${preset.label} with other profiles`}
                                >
                                    <Columns3 size={14} aria-hidden="true" />
                                    Compare profiles
                                </Button>
                            </div>
                        </article>
                    );
                })}
            </div>
            <p className="hb-inline-note">
                A profile is a starting point for a <strong>new session</strong>. It keeps your runtime and
                language, and every setting stays editable. Not sure which one?{" "}
                <button className="hb-text-button" onClick={() => setComparing(plan.preset)}>
                    Compare them side by side
                </button>{" "}
                or{" "}
                <button className="hb-text-button" onClick={() => onNavigate("tools")}>
                    browse all {BUILTIN_NAMES.length} built-in tools
                </button>
                .
            </p>
            <Panel
                title={`Changes from ${currentLabel}`}
                description={
                    changes.length
                        ? "Jump to any area you've changed since applying the profile."
                        : "Nothing yet. Your plan still matches the profile; use the editors to make it yours."
                }
                action={
                    <Badge>
                        {changes.length} changed {changes.length === 1 ? "area" : "areas"}
                    </Badge>
                }
            >
                {changes.length > 0 && (
                    <div className="hb-chip-list">
                        {changes.map((axis) => (
                            <button
                                className="hb-diff-chip"
                                key={axis}
                                onClick={() => onNavigate(axisViews[axis] ?? "overview")}
                            >
                                {axis}
                                <ArrowRight size={12} aria-hidden="true" />
                            </button>
                        ))}
                    </div>
                )}
                <details className="hb-profile-advanced">
                    <summary>
                        <ChevronRight size={14} aria-hidden="true" />
                        Advanced: SDK client baseline
                        <span>{plan.clientMode === "copilot-cli" ? "Copilot CLI" : "Empty"}</span>
                    </summary>
                    <ChoiceField
                        label="SDK client baseline"
                        help={<SettingHelp help={valueHelp.clientMode} value={plan.clientMode} />}
                        value={plan.clientMode}
                        options={[
                            {
                                value: "empty",
                                label: "Empty",
                                description: "Explicit host-owned composition",
                            },
                            {
                                value: "copilot-cli",
                                label: "Copilot CLI",
                                description: "Coding-oriented foundation",
                            },
                        ]}
                        onValueChange={(value) =>
                            edit((draft) => {
                                draft.clientMode = value;
                                if (value === "empty") draft.inventory = "explicit";
                            })
                        }
                        hint="Profiles set this for you. Choosing Empty also makes the tool inventory explicit. Neither option is an operating-system sandbox."
                    />
                </details>
            </Panel>
            <Panel
                title="Next: turn this into a project"
                description="Pick a runtime and language, then inspect the generated dependency and entrypoint files."
            >
                <div className="hb-overview-target">
                    <div className="hb-chip-list">
                        <Badge>
                            {LANGUAGES.find((language) => language.id === plan.target.language)?.label ??
                                plan.target.language}
                        </Badge>
                        <Badge>
                            {RUNTIME_OPTIONS.find((runtime) => runtime.id === plan.target.runtime)?.title ??
                                plan.target.runtime}
                        </Badge>
                    </div>
                    <Button onClick={() => onNavigate("bootstrap")}>
                        Choose runtime &amp; language
                        <ArrowRight size={15} aria-hidden="true" />
                    </Button>
                </div>
            </Panel>
        </div>
    );
}
