// Copyright (c) Microsoft Corporation. All rights reserved.
import { useId, useMemo } from "react";
import {
    ArrowRight,
    BookOpen,
    Cable,
    CircleAlert,
    Cpu,
    ExternalLink,
    PackageOpen,
    Terminal,
} from "lucide-react";
import { buildBootstrapProject } from "../domain/bootstrap";
import type { BootstrapBlocker, BootstrapResult } from "../domain/bootstrap/types";
import { LANGUAGES, RUNTIME_OPTIONS } from "../domain/target";
import { SettingHelp } from "./SettingHelp";
import { valueHelp } from "../content/setting-help";
import type { RuntimeKind } from "../domain/target";
import { sdkDocsForView } from "../content/sdk-docs";
import { createPreset } from "../domain/presets";
import { BootstrapProjectPanel } from "./BootstrapProjectPanel";
import { RuntimePlacement } from "./RuntimePlacement";
import { issueFor, viewForPath } from "./editor";
import type { EditorProps, ViewId } from "./editor";
import "../bootstrap.css";
import { Badge, Button, ChoiceField, Notice, Panel, TextField } from "./ui";

type Generation =
    | { state: "recovery" }
    | { state: "error"; message: string }
    | { state: "result"; result: BootstrapResult };

const runtimeIcons = { managed: Terminal, external: Cable, inprocess: Cpu } satisfies Record<
    RuntimeKind,
    typeof Cpu
>;

export function BootstrapEditor({
    plan,
    edit,
    issues,
    onEvidence,
    onNavigate,
    blocked,
}: EditorProps & { onNavigate: (view: ViewId) => void; blocked: boolean }) {
    const radioName = useId();
    const generation = useMemo<Generation>(() => {
        if (blocked) return { state: "recovery" };
        try {
            return { state: "result", result: buildBootstrapProject(plan) };
        } catch (error) {
            return { state: "error", message: error instanceof Error ? error.message : String(error) };
        }
    }, [plan, blocked]);
    const runtime = RUNTIME_OPTIONS.find((option) => option.id === plan.target.runtime);

    return (
        <div className="hb-editor-stack hb-bootstrap-editor">
            <ol className="hb-bootstrap-steps" aria-label="From configuration to a running host">
                <li>
                    <span>1</span>Choose target
                </li>
                <li>
                    <span>2</span>Install dependencies
                </li>
                <li>
                    <span>3</span>Integrate host
                </li>
                <li>
                    <span>4</span>Preflight &amp; run
                </li>
            </ol>
            <Panel
                title="Where should the runtime live?"
                action={<SettingHelp help={valueHelp.runtime} value={plan.target.runtime} />}
                description="Choose a process boundary, transport, and lifecycle owner. None of these choices creates a sandbox."
            >
                <fieldset className="hb-runtime-options">
                    <legend>Runtime placement</legend>
                    <div className="hb-runtime-option-grid">
                        {RUNTIME_OPTIONS.map((option) => {
                            const Icon = runtimeIcons[option.id];
                            return (
                                <label className="hb-runtime-option" key={option.id}>
                                    <input
                                        type="radio"
                                        className="hb-sr-only"
                                        name={radioName}
                                        value={option.id}
                                        checked={plan.target.runtime === option.id}
                                        aria-label={option.title}
                                        onChange={() =>
                                            edit((draft) => {
                                                draft.target.runtime = option.id;
                                            })
                                        }
                                    />
                                    <span className="hb-runtime-option-body">
                                        <span className="hb-runtime-option-top">
                                            <Icon size={22} aria-hidden="true" />
                                            <Badge>{option.tag}</Badge>
                                        </span>
                                        <strong>{option.title}</strong>
                                        <span className="hb-runtime-option-description">
                                            {option.description}
                                        </span>
                                        <span className="hb-runtime-option-setup">{option.setupPath}</span>
                                        <span className="hb-runtime-option-channel">{option.channel}</span>
                                    </span>
                                </label>
                            );
                        })}
                    </div>
                </fieldset>
                <RuntimePlacement target={plan.target} />
                {runtime && (
                    <Notice
                        title={
                            plan.target.runtime === "inprocess"
                                ? "Native packaging is an explicit dependency"
                                : "Ownership matters"
                        }
                    >
                        {runtime.note}
                    </Notice>
                )}
                {plan.target.runtime === "managed" && (
                    <TextField
                        label="Managed runtime executable (optional)"
                        help={<SettingHelp help={valueHelp.runtimePath} />}
                        value={plan.target.cliPath}
                        monospace
                        maxLength={1000}
                        placeholder="Use the SDK's default runtime distribution"
                        onValueChange={(value) =>
                            edit((draft) => {
                                draft.target.cliPath = value;
                            })
                        }
                        error={issueFor(issues, "target.cliPath")}
                        hint="cliPath overrides the SDK-owned child executable only. This is a future-host path; the browser never reads or starts it."
                    />
                )}
                {plan.target.runtime === "external" && (
                    <TextField
                        label="Existing runtime endpoint"
                        help={<SettingHelp help={valueHelp.runtimeEndpoint} />}
                        value={plan.target.serverUrl}
                        monospace
                        maxLength={1500}
                        autoComplete="off"
                        spellCheck={false}
                        placeholder="127.0.0.1:4321"
                        onValueChange={(value) =>
                            edit((draft) => {
                                draft.target.serverUrl = value;
                            })
                        }
                        error={issueFor(issues, "target.serverUrl")}
                        hint="Use host:port or tcp://host:port, without credentials. This is a runtime TCP service, not a model or MCP endpoint."
                    />
                )}
                {plan.target.runtime === "inprocess" && (
                    <p className="hb-field-hint">
                        Supply the matching native bundle and the language&apos;s native opt-in in the host.
                        Where supported, <code>COPILOT_CLI_PATH</code> participates in native discovery before
                        the first client. There is no per-client <code>nativePath</code> option in this
                        planner.
                    </p>
                )}
                {(plan.target.runtime !== "managed" && plan.target.cliPath.trim()) ||
                (plan.target.runtime !== "external" && plan.target.serverUrl.trim()) ? (
                    <div className="hb-inactive-target" role="note">
                        <strong>Inactive settings are retained, not applied.</strong>
                        {plan.target.runtime !== "managed" && plan.target.cliPath.trim() && (
                            <p>
                                The managed-child <code>cliPath</code> is kept for switching back. It does not
                                select this{" "}
                                {plan.target.runtime === "inprocess" ? "native library" : "external service"}.
                            </p>
                        )}
                        {plan.target.runtime !== "external" && plan.target.serverUrl.trim() && (
                            <p>
                                The existing-service endpoint is kept for external mode; no TCP connection is
                                made in this selection.
                            </p>
                        )}
                    </div>
                ) : null}
                <Button
                    variant="ghost"
                    size="small"
                    onClick={() =>
                        onEvidence({
                            kind: "topic",
                            title: "Runtime placement and host ownership",
                            detail: "Managed clients own a child-process lifecycle over stdio. An existing runtime has a host-owned lifecycle and a client connection over TCP. Experimental native hosting loads a matching library into the application process, shares process state, and requires language-specific packaging. A subprocess is not a sandbox; client disconnect is not shared-service shutdown.",
                            sources: ["sdk-transports", "runtime-core"],
                        })
                    }
                >
                    <BookOpen size={15} aria-hidden="true" />
                    Inspect the connection boundary
                </Button>
                <div className="hb-setup-docs" role="note">
                    <p className="hb-small-label">Matching SDK setup guides</p>
                    <ul className="hb-setup-docs-links">
                        {sdkDocsForView("bootstrap")?.links.map((link) => (
                            <li key={link.url}>
                                <a href={link.url} target="_blank" rel="noopener noreferrer">
                                    {link.label}
                                    <ExternalLink size={12} aria-hidden="true" />
                                    <span className="hb-sr-only"> (opens SDK docs in a new tab)</span>
                                </a>
                                <span> — {link.note}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            </Panel>
            <Panel
                title="Choose the SDK language"
                description="Language and runtime deployment are independent of your behavior profile. Unsupported combinations are reported below, never silently rewritten."
                action={<Badge>{LANGUAGES.length} SDKs</Badge>}
            >
                <div className="hb-language-picker">
                    <ChoiceField
                        label="Bootstrap language"
                        help={<SettingHelp help={valueHelp.language} value={plan.target.language} />}
                        value={plan.target.language}
                        options={LANGUAGES.map((language) => ({ value: language.id, label: language.label }))}
                        onValueChange={(value) =>
                            edit((draft) => {
                                draft.target.language = value;
                            })
                        }
                        error={issueFor(issues, "target.language")}
                    />
                </div>
            </Panel>
            {generation.state === "recovery" && (
                <Notice title="Recover the saved draft first" tone="error">
                    Use the explicit recovery or import controls above before generating a project. No project
                    is generated from the recovery preview.
                </Notice>
            )}
            {generation.state === "error" && (
                <Notice title="Bootstrap generation failed" tone="error">
                    <p className="hb-preserve-lines">{generation.message}</p>
                    <p>
                        No substitute project was produced. Your configuration is unchanged; this adapter
                        error must be resolved before exporting a bootstrap.
                    </p>
                </Notice>
            )}
            {generation.state === "result" &&
                (generation.result.ok ? (
                    <BootstrapProjectPanel
                        key={`${plan.target.language}-${plan.target.runtime}`}
                        project={generation.result.project}
                    />
                ) : (
                    <Panel
                        title="Resolve these choices before scaffolding"
                        description="No incomplete project is exported and no plan settings are dropped to make generation succeed."
                        action={<Badge>{generation.result.blockers.length} blockers</Badge>}
                    >
                        {generation.result.blockers.length === 0 && (
                            <Notice tone="error" title="No bootstrap project was returned">
                                The adapter returned neither a project nor an explanation. Generation must be
                                corrected before a ZIP can be exported.
                            </Notice>
                        )}
                        <div className="hb-bootstrap-blockers">
                            {generation.result.blockers.map((blocker, index) => (
                                <BlockerCard
                                    key={`${blocker.id}-${index}`}
                                    blocker={blocker}
                                    plan={plan}
                                    edit={edit}
                                    issues={issues}
                                    onEvidence={onEvidence}
                                    onNavigate={onNavigate}
                                />
                            ))}
                        </div>
                    </Panel>
                ))}
            <div className="hb-bootstrap-local-note">
                <PackageOpen size={16} aria-hidden="true" />
                <p>
                    Generation and ZIP creation stay in this browser. Installing and running the exported
                    project are explicit actions in your own host.
                </p>
            </div>
        </div>
    );
}

function BlockerCard({
    blocker,
    plan,
    edit,
    onEvidence,
    onNavigate,
}: EditorProps & { blocker: BootstrapBlocker; onNavigate: (view: ViewId) => void }) {
    const canChooseLocal =
        plan.target.language === "java" &&
        plan.session.storage === "virtual" &&
        blocker.fields.includes("session.storage");
    return (
        <article className="hb-bootstrap-blocker">
            <div className="hb-bootstrap-blocker-heading">
                <CircleAlert size={18} aria-hidden="true" />
                <h4>{blocker.title}</h4>
            </div>
            <p>{blocker.detail}</p>
            <div className="hb-blocker-actions">
                {Array.from(new Set(blocker.fields)).map((field) => (
                    <Button key={field} size="small" onClick={() => onNavigate(viewForPath(field))}>
                        Edit <code>{field}</code>
                        <ArrowRight size={13} aria-hidden="true" />
                    </Button>
                ))}
                {blocker.sources.length > 0 && (
                    <Button
                        variant="ghost"
                        size="small"
                        onClick={() =>
                            onEvidence({
                                kind: "topic",
                                title: blocker.title,
                                detail: blocker.detail,
                                sources: blocker.sources,
                            })
                        }
                    >
                        <BookOpen size={14} aria-hidden="true" />
                        Review details
                    </Button>
                )}
            </div>
            {canChooseLocal && (
                <div className="hb-explicit-remediation">
                    <p>
                        <strong>Explicit alternative:</strong> use a local session state directory in the
                        future host. This changes storage semantics; it does not implement a virtual provider.
                    </p>
                    <Button
                        size="small"
                        onClick={() =>
                            edit((draft) => {
                                draft.session.storage = "local";
                                if (!draft.session.baseDirectory.trim())
                                    draft.session.baseDirectory = createPreset(
                                        draft.preset,
                                    ).session.baseDirectory;
                            })
                        }
                    >
                        Use local session storage
                        <ArrowRight size={13} aria-hidden="true" />
                    </Button>
                </div>
            )}
        </article>
    );
}
