// Copyright (c) Microsoft Corporation. All rights reserved.
import { ArrowRight, Box, Check, Code2, FileCheck2, Layers3, ShieldCheck, Unplug } from "lucide-react";
import { PRESETS, SCENARIOS, changedAxes } from "../domain/presets";
import type { ScenarioId } from "../domain/presets";
import type { PresetId } from "../domain/plan";
import { LANGUAGES, RUNTIME_OPTIONS } from "../domain/target";
import { BUILTIN_NAMES, toolCatalog } from "../content/builtin-tools";
import { referenceBaselineNames } from "./tool-catalog-ui";
import { HarnessPrimer } from "./HarnessPrimer";
import type { EditorProps, ViewId } from "./editor";
import { Badge, Button, ChoiceField, Panel } from "./ui";
import { SettingHelp } from "./SettingHelp";
import { valueHelp } from "../content/setting-help";
import "../tool-catalog.css";

const profileDetails = {
    empty: {
        icon: Box,
        inventory: "Explicit inventory; no inherited tools",
        prompt: "Your prompt, end to end",
        footer: "Build from explicit decisions",
    },
    minimal: {
        icon: Layers3,
        inventory: "Explicit: 2 selected session names",
        prompt: "A small, editable prompt",
        footer: "A proposed composition, not an SDK mode",
    },
    copilot: {
        icon: Code2,
        inventory: "Runtime-default selection",
        prompt: "Coding guidance, extended",
        footer: "An opinionated coding starting point",
    },
} satisfies Record<PresetId, { icon: typeof Box; inventory: string; prompt: string; footer: string }>;

const scenarioIcons = {
    "workspace-free": Unplug,
    "tenant-documents": FileCheck2,
    "governed-workflow": ShieldCheck,
};
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
                    <p>
                        Explore how plugins, skills, tools, inference, and state connect—and which parts your
                        harness and host still own.
                    </p>
                </div>
                <Button onClick={() => onNavigate("runtime")}>
                    Explore the runtime map <ArrowRight size={15} aria-hidden="true" />
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
    onApplyScenario,
    onNavigate,
}: EditorProps & {
    onApplyPreset: (id: PresetId) => void;
    onApplyScenario: (id: ScenarioId) => void;
    onNavigate: (view: ViewId) => void;
}) {
    const changes = changedAxes(plan);
    return (
        <div className="hb-editor-stack">
            <div className="hb-profile-grid">
                {PRESETS.map((preset) => {
                    const details = profileDetails[preset.id];
                    const Icon = details.icon;
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
                            <div className="hb-profile-facts">
                                <span>
                                    <Check size={14} aria-hidden="true" />
                                    {details.inventory}
                                </span>
                                <span>
                                    <Check size={14} aria-hidden="true" />
                                    {details.prompt}
                                </span>
                            </div>
                            <Button
                                variant={selected ? "primary" : "secondary"}
                                onClick={() => onApplyPreset(preset.id)}
                            >
                                Apply {preset.label}
                                <ArrowRight size={15} aria-hidden="true" />
                            </Button>
                            <p className="hb-profile-footnote">{details.footer}</p>
                        </article>
                    );
                })}
            </div>
            <p className="hb-inline-note">
                Profiles compose a <strong>new session</strong>. They do not switch a running SDK session or
                change the shared runtime engine. Applying a behavior profile keeps your runtime and language
                choices.
            </p>
            <div className="hb-overview-tool-catalog">
                <div>
                    <strong>Runtime defaults are a selection policy, not all tools switched on.</strong>
                    <p>
                        Empty and Minimal start with explicit inventories. Copilot preserves runtime model,
                        platform, capability, and experiment choices. The full catalog has{" "}
                        {BUILTIN_NAMES.length} descriptors and {toolCatalog.context.aliases.length} separate
                        selection aliases.
                    </p>
                    <p>
                        The illustrative online, local root coding reference uses split editing with no added
                        filters: {referenceBaselineNames.length} baseline entries (
                        {referenceBaselineNames.join(", ")}). Shell families are platform-specific; explicit
                        selections still have gates.
                    </p>
                </div>
                <Button size="small" onClick={() => onNavigate("tools")}>
                    Browse all {BUILTIN_NAMES.length} built-ins
                    <ArrowRight size={14} aria-hidden="true" />
                </Button>
            </div>
            <Panel
                title="Make it fit your workload"
                description="Apply a concrete recipe, then inspect what changed. Every application can be undone."
            >
                <div className="hb-scenario-list">
                    {SCENARIOS.map((scenario) => {
                        const Icon = scenarioIcons[scenario.id];
                        return (
                            <article className="hb-scenario" key={scenario.id}>
                                <span className="hb-scenario-icon">
                                    <Icon size={20} aria-hidden="true" />
                                </span>
                                <div>
                                    <h4>{scenario.title}</h4>
                                    <p>{scenario.description}</p>
                                </div>
                                <Button
                                    size="small"
                                    onClick={() => onApplyScenario(scenario.id)}
                                    aria-label={`Apply ${scenario.title}`}
                                >
                                    Apply
                                    <ArrowRight size={14} aria-hidden="true" />
                                </Button>
                            </article>
                        );
                    })}
                </div>
            </Panel>
            <Panel
                title="Your composition, not a new engine"
                description="The baseline is a comparison point. Each setting below and in the sidebar remains independently editable."
                action={
                    <Badge>
                        {changes.length} changed {changes.length === 1 ? "axis" : "axes"}
                    </Badge>
                }
            >
                <ChoiceField
                    label="SDK client baseline"
                    help={<SettingHelp help={valueHelp.clientMode} value={plan.clientMode} />}
                    value={plan.clientMode}
                    options={[
                        { value: "empty", label: "Empty", description: "Explicit host-owned composition" },
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
                    hint="Choosing Empty also makes the inventory explicit. Neither client baseline is an operating-system sandbox."
                />
                <div className="hb-baseline-diff">
                    <p className="hb-small-label">
                        Differences from the{" "}
                        {plan.preset === "copilot"
                            ? "Copilot"
                            : plan.preset === "minimal"
                              ? "Minimal"
                              : "Empty"}{" "}
                        preset
                    </p>
                    {changes.length ? (
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
                    ) : (
                        <p className="hb-muted-copy">
                            The configuration matches this starting profile. Use the editors to make it yours.
                        </p>
                    )}
                </div>
            </Panel>
            <Panel
                title="Next: turn this composition into a project"
                description="Choose a deployment target, inspect the actual dependency and entrypoint files, then integrate and run them in your host."
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
                <p className="hb-field-hint">
                    This is independent of Empty, Minimal, or Copilot behavior. Host TODOs, environment
                    requirements, and packaging limits stay explicit.
                </p>
            </Panel>
        </div>
    );
}
