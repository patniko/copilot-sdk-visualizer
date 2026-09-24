// Copyright (c) Microsoft Corporation. All rights reserved.
import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import { ArrowRight, Check, Minus } from "lucide-react";
import { PRESETS, createPreset } from "../domain/presets";
import type { HarnessPlan, PresetId } from "../domain/plan";
import { BUILTIN_NAMES, BUILTIN_SPECS } from "../content/builtin-tools";
import { Badge, Button, Modal } from "./ui";
import { profileIcons } from "./profile-ui";

type Cell = string | boolean | { tools: HarnessPlan } | { quote: string };
type Row = {
    label: string;
    hint?: string;
    legend?: boolean;
    value: (plan: HarnessPlan) => Cell;
    key?: (plan: HarnessPlan) => string;
};
type Section = { title: string; rows: Row[] };

const identityLabels: Record<HarnessPlan["identity"], string> = {
    "host-token": "Per-session token callback",
    developer: "Developer login",
    "s2s-installation": "GitHub App service identity",
};

const keptTools = (plan: HarnessPlan) => BUILTIN_NAMES.filter((name) => plan.tools[name].action !== "remove");

const SECTIONS: Section[] = [
    {
        title: "Baseline",
        rows: [
            {
                label: "SDK client",
                value: (plan) => (plan.clientMode === "copilot-cli" ? "Copilot CLI" : "Empty"),
            },
            {
                label: "Tool inventory",
                value: (plan) => (plan.inventory === "explicit" ? "Explicit list" : "Runtime defaults"),
            },
        ],
    },
    {
        title: "Prompt",
        rows: [
            {
                label: "Prompt mode",
                value: (plan) =>
                    plan.prompt.mode === "default"
                        ? "Built-in prompt, unchanged"
                        : plan.prompt.mode === "append"
                          ? "Append to built-in prompt"
                          : plan.prompt.mode === "replace"
                            ? "Replace built-in prompt"
                            : "Customize sections",
            },
            {
                label: "Starter prompt",
                value: (plan) => (plan.prompt.mode === "default" ? "None" : { quote: plan.prompt.content }),
            },
        ],
    },
    {
        title: "Tools",
        rows: [
            {
                label: "Built-in tools",
                hint: `${BUILTIN_NAMES.length} descriptors`,
                legend: true,
                value: (plan) => ({ tools: plan }),
                key: (plan) => `${plan.inventory}:${keptTools(plan).join(",")}`,
            },
            {
                label: "Custom tools, MCP, agents",
                value: (plan) =>
                    plan.customTools.length + plan.mcpServers.length + plan.agents.length
                        ? `${plan.customTools.length} / ${plan.mcpServers.length} / ${plan.agents.length}`
                        : "None",
            },
        ],
    },
    {
        title: "Context",
        rows: [
            { label: "Project workspace", value: (plan) => plan.context.workspace || "None" },
            { label: "Ambient discovery", value: (plan) => plan.context.discovery },
            { label: "Skills", value: (plan) => plan.context.skills },
            { label: "File-based hooks", value: (plan) => plan.context.fileHooks },
            { label: "Host git context", value: (plan) => plan.context.hostGit },
        ],
    },
    {
        title: "Identity & session",
        rows: [
            { label: "GitHub credential", value: (plan) => identityLabels[plan.identity] },
            {
                label: "Session storage",
                value: (plan) =>
                    plan.session.storage === "virtual" ? "Virtual session provider" : "Local state directory",
            },
            {
                label: "Idle timeout",
                value: (plan) =>
                    plan.session.idleTimeoutSeconds
                        ? `${Math.round(plan.session.idleTimeoutSeconds / 60)} min`
                        : "None",
            },
            { label: "Large-output spill", value: (plan) => plan.session.largeOutput },
        ],
    },
    {
        title: "Policy & events",
        rows: [
            {
                label: "Permission decisions",
                value: (plan) => (plan.policy.permissionMode === "host" ? "Host decides" : "Allow all"),
            },
            {
                label: "Pre/post tool hooks",
                value: (plan) => plan.policy.preToolHook || plan.policy.postToolHook,
            },
            { label: "Streaming events", value: (plan) => plan.events.streaming },
        ],
    },
];

function cellKey(row: Row, plan: HarnessPlan) {
    return row.key ? row.key(plan) : JSON.stringify(row.value(plan));
}

export function ProfileCompareDialog({
    focus,
    current,
    onClose,
    onApply,
}: {
    focus: PresetId;
    current: PresetId;
    onClose: () => void;
    onApply: (id: PresetId) => void;
}) {
    const [differencesOnly, setDifferencesOnly] = useState(false);
    const plans = useMemo(
        () =>
            Object.fromEntries(PRESETS.map((preset) => [preset.id, createPreset(preset.id)])) as Record<
                PresetId,
                HarnessPlan
            >,
        [],
    );
    const sections = SECTIONS.map((section) => ({
        ...section,
        rows: section.rows.map((row) => ({
            row,
            differs: new Set(PRESETS.map((preset) => cellKey(row, plans[preset.id]))).size > 1,
        })),
    }));
    const differing = sections.reduce(
        (sum, section) => sum + section.rows.filter((r) => r.differs).length,
        0,
    );
    const total = sections.reduce((sum, section) => sum + section.rows.length, 0);

    return (
        <Modal
            open
            onOpenChange={(open) => {
                if (!open) onClose();
            }}
            title="Compare starting profiles"
            description="The exact configuration each profile applies to a new session, side by side. Every value stays editable after you apply one."
            size="wide"
        >
            <div className="hb-compare">
                <div className="hb-compare-toolbar">
                    <p>
                        <span className="hb-compare-diff-dot" aria-hidden="true" /> {differing} of {total}{" "}
                        settings differ between profiles
                    </p>
                    <label className="hb-compare-toggle">
                        <input
                            type="checkbox"
                            checked={differencesOnly}
                            onChange={(event) => setDifferencesOnly(event.target.checked)}
                        />
                        Show differences only
                    </label>
                </div>
                <div className="hb-compare-scroll">
                    <table className="hb-compare-table">
                        <colgroup>
                            <col className="hb-compare-label-col" />
                            {PRESETS.map((preset) => (
                                <col
                                    key={preset.id}
                                    className={preset.id === focus ? "hb-compare-focus-col" : undefined}
                                />
                            ))}
                        </colgroup>
                        <thead>
                            <tr>
                                <th scope="col">
                                    <span className="hb-sr-only">Setting</span>
                                </th>
                                {PRESETS.map((preset) => {
                                    const Icon = profileIcons[preset.id];
                                    return (
                                        <th
                                            scope="col"
                                            key={preset.id}
                                            className={preset.id === focus ? "hb-compare-focus" : undefined}
                                        >
                                            <div className="hb-compare-head">
                                                <span className="hb-compare-head-title">
                                                    <Icon size={16} aria-hidden="true" />
                                                    {preset.label}
                                                </span>
                                                <span className="hb-compare-tag">{preset.tag}</span>
                                                {preset.id === current ? (
                                                    <Badge accent>
                                                        <Check size={12} aria-hidden="true" /> Baseline
                                                    </Badge>
                                                ) : (
                                                    <Button
                                                        size="small"
                                                        variant={
                                                            preset.id === focus ? "primary" : "secondary"
                                                        }
                                                        onClick={() => {
                                                            onClose();
                                                            onApply(preset.id);
                                                        }}
                                                    >
                                                        Apply
                                                        <ArrowRight size={13} aria-hidden="true" />
                                                    </Button>
                                                )}
                                            </div>
                                        </th>
                                    );
                                })}
                            </tr>
                        </thead>
                        {sections.map((section) => {
                            const rows = differencesOnly
                                ? section.rows.filter((r) => r.differs)
                                : section.rows;
                            if (!rows.length) return null;
                            return (
                                <tbody key={section.title}>
                                    <tr className="hb-compare-section">
                                        <th scope="rowgroup" colSpan={PRESETS.length + 1}>
                                            {section.title}
                                        </th>
                                    </tr>
                                    {rows.map(({ row, differs }) => (
                                        <tr
                                            key={row.label}
                                            className={differs ? "hb-compare-differs" : undefined}
                                        >
                                            <th scope="row">
                                                <span className="hb-compare-row-label">
                                                    {differs && (
                                                        <span
                                                            className="hb-compare-diff-dot"
                                                            title="Differs between profiles"
                                                        />
                                                    )}
                                                    {row.label}
                                                </span>
                                                {row.hint && (
                                                    <span className="hb-compare-hint">{row.hint}</span>
                                                )}
                                                {row.legend && <ToolLegend />}
                                                {differs && <span className="hb-sr-only">(differs)</span>}
                                            </th>
                                            {PRESETS.map((preset) => (
                                                <td
                                                    key={preset.id}
                                                    className={
                                                        preset.id === focus ? "hb-compare-focus" : undefined
                                                    }
                                                >
                                                    <CellValue cell={row.value(plans[preset.id])} />
                                                </td>
                                            ))}
                                        </tr>
                                    ))}
                                </tbody>
                            );
                        })}
                    </table>
                </div>
            </div>
        </Modal>
    );
}

function CellValue({ cell }: { cell: Cell }): ReactNode {
    if (typeof cell === "boolean")
        return cell ? (
            <span className="hb-compare-bool hb-compare-on">
                <Check size={13} aria-hidden="true" /> On
            </span>
        ) : (
            <span className="hb-compare-bool">
                <Minus size={13} aria-hidden="true" /> Off
            </span>
        );
    if (typeof cell === "string")
        return <span className={cell === "None" ? "hb-compare-none" : undefined}>{cell}</span>;
    if ("quote" in cell) return <q className="hb-compare-quote">{cell.quote}</q>;
    return <ToolStrip plan={cell.tools} />;
}

function ToolLegend() {
    return (
        <span className="hb-compare-tool-legend" aria-hidden="true">
            <span>
                <i className="hb-compare-tool hb-compare-tool-on" /> Available
            </span>
            <span>
                <i className="hb-compare-tool hb-compare-tool-maybe" /> Conditional
            </span>
            <span>
                <i className="hb-compare-tool" /> Not selected
            </span>
        </span>
    );
}

function ToolStrip({ plan }: { plan: HarnessPlan }) {
    const inherited = plan.inventory === "coding-defaults";
    const kept = keptTools(plan);
    const cells = BUILTIN_NAMES.map((name) => {
        const status = BUILTIN_SPECS[name].defaultStatus;
        const state =
            plan.tools[name].action === "remove"
                ? "off"
                : !inherited
                  ? "on"
                  : status === "baseline-enabled"
                    ? "on"
                    : status === "internal"
                      ? "off"
                      : "maybe";
        return { name, state };
    });
    const on = cells.filter((cell) => cell.state === "on").length;
    const maybe = cells.filter((cell) => cell.state === "maybe").length;
    return (
        <div className="hb-compare-tools">
            <div
                className="hb-compare-tool-grid"
                role="img"
                aria-label={
                    inherited
                        ? `Runtime selects about ${on} baseline tools; ${maybe} more are conditional or platform-specific`
                        : `${kept.length} of ${BUILTIN_NAMES.length} tools selected`
                }
            >
                {cells.map((cell) => (
                    <span
                        key={cell.name}
                        className={`hb-compare-tool hb-compare-tool-${cell.state}`}
                        title={`${cell.name}: ${cell.state === "on" ? "available" : cell.state === "maybe" ? "conditional" : "not selected"}`}
                    />
                ))}
            </div>
            <p>
                {inherited ? (
                    <>
                        <strong>~{on}</strong> baseline + {maybe} conditional, chosen by the runtime
                    </>
                ) : kept.length ? (
                    <>
                        <strong>{kept.length}</strong> selected: {kept.join(", ")}
                    </>
                ) : (
                    <>
                        <strong>0</strong> — you add every tool
                    </>
                )}
            </p>
        </div>
    );
}
