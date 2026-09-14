// Copyright (c) Microsoft Corporation. All rights reserved.
import { useMemo, useState } from "react";
import * as Tabs from "@radix-ui/react-tabs";
import { Check, Copy, Download, FileCode2, FileJson2 } from "lucide-react";
import { downloadName, exportPlan, generateSdkCode } from "../domain/export";
import { analyzePlan, hostContracts } from "../domain/analysis";
import type { HarnessPlan, PlanIssue } from "../domain/plan";
import { Badge, Button, Modal, Notice } from "./ui";

interface GeneratedOutput {
    sdk: string;
    plan: string;
    error: string | null;
    sdkError: string | null;
}

export function ExportDialog({
    plan,
    issues,
    blocked,
    onClose,
    onBuild,
}: {
    plan: HarnessPlan;
    issues: PlanIssue[];
    blocked: boolean;
    onClose: () => void;
    onBuild?: () => void;
}) {
    const [tab, setTab] = useState<"sdk" | "plan">("sdk");
    const [feedback, setFeedback] = useState<{ error: boolean; message: string } | null>(null);
    const output = useMemo<GeneratedOutput>(() => {
        if (blocked || issues.length)
            return {
                sdk: "",
                plan: "",
                error: "Resolve the draft's validation or recovery issues before exporting.",
                sdkError: null,
            };
        try {
            const planner = exportPlan(plan);
            try {
                return { sdk: generateSdkCode(plan), plan: planner, error: null, sdkError: null };
            } catch (error) {
                return {
                    sdk: "",
                    plan: planner,
                    error: null,
                    sdkError: error instanceof Error ? error.message : String(error),
                };
            }
        } catch (error) {
            return {
                sdk: "",
                plan: "",
                error: `Export failed: ${error instanceof Error ? error.message : String(error)}`,
                sdkError: null,
            };
        }
    }, [plan, issues.length, blocked]);
    const text = output[tab];
    const label = tab === "sdk" ? "SDK TypeScript" : "Plan JSON";
    const disabled =
        Boolean(output.error || (tab === "sdk" && output.sdkError)) || blocked || issues.length > 0;
    const contracts = Array.from(new Set(hostContracts(plan)));
    const decisions = analyzePlan(plan);

    async function copy() {
        setFeedback(null);
        try {
            if (!navigator.clipboard?.writeText)
                throw new Error("Clipboard access is unavailable in this browser.");
            await navigator.clipboard.writeText(text);
            setFeedback({ error: false, message: `${label} copied to clipboard.` });
        } catch (error) {
            setFeedback({
                error: true,
                message: `Could not copy: ${error instanceof Error ? error.message : String(error)} Select and copy the readable ${label} below instead.`,
            });
        }
    }

    function download() {
        setFeedback(null);
        try {
            const name = downloadName(plan, tab === "sdk" ? "ts" : "plan.json");
            const blob = new Blob([text], {
                type: tab === "sdk" ? "text/typescript;charset=utf-8" : "application/json;charset=utf-8",
            });
            const url = URL.createObjectURL(blob);
            const anchor = document.createElement("a");
            try {
                anchor.href = url;
                anchor.download = name;
                document.body.append(anchor);
                anchor.click();
            } finally {
                anchor.remove();
                window.setTimeout(() => URL.revokeObjectURL(url), 1000);
            }
            setFeedback({ error: false, message: `Download requested: ${name}` });
        } catch (error) {
            setFeedback({
                error: true,
                message: `Could not download: ${error instanceof Error ? error.message : String(error)} You can copy the text below instead.`,
            });
        }
    }

    return (
        <Modal
            open
            onOpenChange={(open) => {
                if (!open) onClose();
            }}
            title="Export plan & TypeScript sketch"
            description="Keep the reversible planner file or inspect the single-file TypeScript integration reference. Neither is executed here."
            size="wide"
        >
            <div className="hb-legacy-export-note">
                <Notice title="For a complete language-specific project, use Build & run">
                    This export is planner JSON or a TypeScript reference sketch, not the selected
                    language&apos;s complete bootstrap. Build &amp; run includes dependencies, entrypoint,
                    host notes, and install/preflight/run steps.
                    {onBuild && (
                        <Button variant="ghost" size="small" onClick={onBuild}>
                            Open Build &amp; run
                        </Button>
                    )}
                </Notice>
            </div>
            {output.error && (
                <Notice title="Export is unavailable" tone="error">
                    {output.error}
                </Notice>
            )}
            <div className="hb-export-layout">
                <div className="hb-export-main">
                    <Tabs.Root
                        value={tab}
                        onValueChange={(value) => {
                            if (value !== "sdk" && value !== "plan") return;
                            setTab(value);
                            setFeedback(null);
                        }}
                    >
                        <Tabs.List className="hb-tabs-list" aria-label="Export format">
                            <Tabs.Trigger className="hb-tab" value="sdk">
                                <FileCode2 size={16} aria-hidden="true" />
                                SDK TypeScript
                            </Tabs.Trigger>
                            <Tabs.Trigger className="hb-tab" value="plan">
                                <FileJson2 size={16} aria-hidden="true" />
                                Plan JSON
                            </Tabs.Trigger>
                        </Tabs.List>
                        <div className="hb-export-toolbar">
                            <Badge>
                                {tab === "sdk" ? "Host-integration template" : "Reversible planner format"}
                            </Badge>
                            <div className="hb-button-group">
                                <Button
                                    size="small"
                                    disabled={disabled}
                                    onClick={() => {
                                        void copy();
                                    }}
                                >
                                    <Copy size={14} aria-hidden="true" />
                                    Copy
                                </Button>
                                <Button size="small" disabled={disabled} onClick={download}>
                                    <Download size={14} aria-hidden="true" />
                                    Download
                                </Button>
                            </div>
                        </div>
                        {feedback && (
                            <div
                                className={`hb-export-feedback${feedback.error ? " hb-export-feedback-error" : ""}`}
                                role={feedback.error ? "alert" : "status"}
                            >
                                {!feedback.error && <Check size={14} aria-hidden="true" />}
                                {feedback.message}
                            </div>
                        )}
                        <Tabs.Content value="sdk" className="hb-export-tab-content">
                            {output.sdkError && (
                                <Notice title="SDK sketch needs review" tone="error">
                                    {output.sdkError}
                                </Notice>
                            )}
                            <p className="hb-export-explainer">
                                A TypeScript integration sketch,{" "}
                                <strong>not runnable without the required host bindings</strong>. Review and
                                adapt it to your SDK/runtime pair. Never execute an unreviewed sketch.
                            </p>
                            <textarea
                                className="hb-code-preview"
                                aria-label="SDK TypeScript integration sketch"
                                readOnly
                                spellCheck={false}
                                wrap="off"
                                value={output.sdk}
                            />
                        </Tabs.Content>
                        <Tabs.Content value="plan" className="hb-export-tab-content">
                            <p className="hb-export-explainer">
                                Import this file back into the builder. It is a{" "}
                                <strong>HarnessPlan, not a directly serializable SessionConfig</strong>;
                                functions and credentials stay in the host.
                            </p>
                            <textarea
                                className="hb-code-preview"
                                aria-label="Exported plan JSON"
                                readOnly
                                spellCheck={false}
                                wrap="off"
                                value={output.plan}
                            />
                        </Tabs.Content>
                    </Tabs.Root>
                    <p className="hb-field-hint">
                        Clipboard unavailable? Focus the code field and select the text to copy it manually.
                    </p>
                </div>
                <aside className="hb-export-bindings" aria-label="Export requirements">
                    <h3>Bring these implementations</h3>
                    <p>The sketch intentionally leaves host work explicit.</p>
                    <ul>
                        {contracts.map((contract) => (
                            <li key={contract}>{contract}</li>
                        ))}
                    </ul>
                    {plan.model.provider !== "copilot" && plan.model.credential === "api-key" && (
                        <Notice title="Environment binding">
                            The future host must supply <code>{plan.model.credentialEnv}</code>. Only its name
                            is included; never put its value in the plan.
                        </Notice>
                    )}
                    {decisions.length > 0 && (
                        <details className="hb-export-decisions">
                            <summary>{decisions.length} decisions and boundaries</summary>
                            {decisions.map((decision) => (
                                <div key={decision.id}>
                                    <strong>{decision.title}</strong>
                                    <p>{decision.detail}</p>
                                </div>
                            ))}
                        </details>
                    )}
                    <Notice title="New-session composition">
                        Applying a profile is not a live SDK mode change. Declarations alone do not rebind
                        handlers.
                    </Notice>
                </aside>
            </div>
        </Modal>
    );
}
