// Copyright (c) Microsoft Corporation. All rights reserved.
import { lazy, Suspense, useEffect, useState } from "react";
import {
    ArrowRight,
    BookOpen,
    Check,
    ChevronRight,
    CircleAlert,
    Download,
    FileText,
    FolderOpen,
    LayoutDashboard,
    Layers3,
    LockKeyhole,
    Moon,
    Network,
    PackageOpen,
    PanelLeftClose,
    PanelLeftOpen,
    PanelRightOpen,
    Redo2,
    ShieldCheck,
    SlidersHorizontal,
    Sun,
    Undo2,
    Upload,
    Users,
    Wrench,
    X,
} from "lucide-react";
import { useHarness } from "./hooks/useHarness";
import { useStoredBoolean } from "./hooks/useStoredBoolean";
import { useViewNavigation } from "./hooks/useViewNavigation";
import { PRESETS, changedAxes, createPreset } from "./domain/presets";
import type { HarnessPlan, PresetId } from "./domain/plan";
import { AgentsEditor } from "./components/AgentsEditor";
import { ContextEditor } from "./components/ContextEditor";
import { CopilotMark } from "./components/CopilotMark";
import { EvidenceDialog } from "./components/EvidenceDialog";
import { ModelsEditor } from "./components/ModelsEditor";
import { BaseProfileEditor, OverviewEditor } from "./components/OverviewEditor";
import { PlanInspector } from "./components/PlanInspector";
import { PolicyEditor } from "./components/PolicyEditor";
import { PromptEditor } from "./components/PromptEditor";
import { ToolsEditor } from "./components/ToolsEditor";
import { viewForPath } from "./components/editor";
import type { EditorProps, Evidence, ViewId } from "./components/editor";
import { Button, Modal, Notice } from "./components/ui";
import "./builder.css";

const BootstrapEditor = lazy(() =>
    import("./components/BootstrapEditor").then((module) => ({ default: module.BootstrapEditor })),
);
const ExportDialog = lazy(() =>
    import("./components/ExportDialog").then((module) => ({ default: module.ExportDialog })),
);
const ImportDialog = lazy(() =>
    import("./components/ImportDialog").then((module) => ({ default: module.ImportDialog })),
);
const ReferencePanel = lazy(() =>
    import("./components/ReferencePanel").then((module) => ({ default: module.ReferencePanel })),
);
const RuntimeExplorer = lazy(() =>
    import("./components/RuntimeExplorer").then((module) => ({ default: module.RuntimeExplorer })),
);

const navigation = [
    { id: "overview", label: "Overview", detail: "How the harness fits together", icon: LayoutDashboard },
    { id: "runtime", label: "Runtime", detail: "What the engine gives you", icon: Network },
    { id: "base-profile", label: "Base Profile", detail: "Starting profiles", icon: Layers3 },
    { id: "prompt", label: "Prompt", detail: "Behavior & instructions", icon: FileText },
    { id: "tools", label: "Tools", detail: "Inventory & implementations", icon: Wrench },
    { id: "context", label: "Context & packs", detail: "Inputs & discovery", icon: FolderOpen },
    { id: "agents", label: "Agents", detail: "Roles & delegation", icon: Users },
    {
        id: "models",
        label: "Models & identity",
        detail: "Providers & host credentials",
        icon: SlidersHorizontal,
    },
    { id: "policy", label: "Policy & state", detail: "Permissions & lifecycle", icon: ShieldCheck },
    { id: "bootstrap", label: "Build & run", detail: "Language, files & host setup", icon: PackageOpen },
    { id: "reference", label: "Learn / reference", detail: "Source-backed boundaries", icon: BookOpen },
] as const;

const SIDEBAR_STORAGE_KEY = "harness-builder:sidebar-collapsed";
const PLAN_STORAGE_KEY = "harness-builder:plan-collapsed";

const viewHeadings: Record<ViewId, { eyebrow: string; title: string; description: string }> = {
    overview: {
        eyebrow: "Start here",
        title: "Understand the harness.",
        description: "See what the shared runtime provides, what you compose, and what your host owns.",
    },
    runtime: {
        eyebrow: "Meet the runtime",
        title: "Meet the engine behind your harness.",
        description:
            "Explore the shared machinery, the configuration seams, and the authority your host keeps.",
    },
    "base-profile": {
        eyebrow: "01 / Starting point",
        title: "Compose the behavior.",
        description: "Keep the engine. Choose a starting point, then make each boundary your own.",
    },
    prompt: {
        eyebrow: "02 / Instructions",
        title: "Give the work a frame.",
        description: "Choose how much of the system prompt you own, and make the operating rules explicit.",
    },
    tools: {
        eyebrow: "03 / Capabilities",
        title: "Same tool. Your implementation.",
        description: "Separate what the model can see from what the host actually does.",
    },
    context: {
        eyebrow: "04 / Inputs",
        title: "Be deliberate about context.",
        description:
            "Supply the project, instructions, and capability packs your future host should make available.",
    },
    agents: {
        eyebrow: "05 / Delegation",
        title: "Give every role a purpose.",
        description:
            "Define focused specialists without confusing tool visibility, model preference, and authority.",
    },
    models: {
        eyebrow: "06 / Connection",
        title: "Choose the model. Own the identity.",
        description: "Plan the provider and credential bindings without putting secrets in the browser.",
    },
    policy: {
        eyebrow: "07 / Host responsibilities",
        title: "Make the boundaries real.",
        description: "Keep permissions, persistence, observations, and your quality bar explicit.",
    },
    bootstrap: {
        eyebrow: "08 / Bring it to your host",
        title: "Build the project. Wire the host.",
        description:
            "Configure behavior, choose runtime and language, install dependencies, integrate the host, then preflight and run locally.",
    },
    reference: {
        eyebrow: "09 / Source-backed learning",
        title: "Understand the seams.",
        description: "Look up the supported surface, the lifecycle, and the limits behind each decision.",
    },
};

type CompositionChange = { kind: "preset" | "recovery"; id: PresetId };

function changeLabel(change: CompositionChange) {
    return PRESETS.find((preset) => preset.id === change.id)?.label ?? change.id;
}

export default function App() {
    const harness = useHarness();
    const { plan, issues, blocked, saveError, canUndo, canRedo } = harness;
    const { view, navigate } = useViewNavigation(navigation);
    const [sidebarCollapsed, toggleSidebar] = useStoredBoolean(SIDEBAR_STORAGE_KEY);
    const [planCollapsed, togglePlan] = useStoredBoolean(PLAN_STORAGE_KEY);
    const [theme, setTheme] = useState(() =>
        document.documentElement.dataset.theme === "dark" ? "dark" : "light",
    );
    const [revision, setRevision] = useState(0);
    const [pending, setPending] = useState<CompositionChange | null>(null);
    const [evidence, setEvidence] = useState<Evidence | null>(null);
    const [importOpen, setImportOpen] = useState(false);
    const [exportOpen, setExportOpen] = useState(false);
    const [feedback, setFeedbackState] = useState<string | null>(null);
    const [feedbackId, setFeedbackId] = useState(0);
    function setFeedback(message: string | null) {
        setFeedbackState(message);
        if (message) setFeedbackId((current) => current + 1);
    }
    useEffect(() => {
        if (!feedback) return;
        const timer = window.setTimeout(() => setFeedbackState(null), 5000);
        return () => window.clearTimeout(timer);
    }, [feedback, feedbackId]);
    const heading = viewHeadings[view];
    const exportDisabled = blocked || issues.length > 0;
    const changes = changedAxes(plan);
    const behaviorChanges = changes.filter((axis) => axis !== "Runtime & language");
    const saveLabel = blocked
        ? "Recovery needed"
        : issues.length
          ? "Invalid edits - not saved"
          : saveError
            ? "Not saved locally"
            : "Autosave on";

    function edit(recipe: (draft: HarnessPlan) => void) {
        setFeedback(null);
        harness.update((current) => {
            const next = structuredClone(current);
            recipe(next);
            return next;
        });
    }

    function replace(next: HarnessPlan, message: string) {
        harness.replace(next);
        setRevision((current) => current + 1);
        setFeedback(message);
    }

    function applyChange(change: CompositionChange) {
        const next = createPreset(change.id);
        if (change.kind === "preset") next.target = structuredClone(plan.target);
        replace(
            next,
            change.kind === "recovery"
                ? `Recovery applied with the ${changeLabel(change)} profile.`
                : `Applied ${changeLabel(change)}. Undo restores the previous draft.`,
        );
        setPending(null);
    }

    function requestChange(change: CompositionChange) {
        const renamed = plan.name !== createPreset(plan.preset).name;
        if (blocked || behaviorChanges.length || renamed || issues.length) setPending(change);
        else applyChange(change);
    }

    const editorProps: EditorProps = { plan, edit, issues, onEvidence: setEvidence };

    return (
        <div className={`harness-builder${view === "runtime" ? " hb-runtime-mode" : ""}`}>
            <a
                className="hb-skip-link"
                href="#builder-main"
                onClick={(event) => {
                    event.preventDefault();
                    document.getElementById("builder-main")?.focus();
                }}
            >
                Skip to editor
            </a>
            <header className="hb-header">
                <div className="hb-brand">
                    <span className="hb-brand-mark">
                        <CopilotMark size={25} />
                    </span>
                    <div>
                        <h1>Harness Builder</h1>
                        <p>GitHub Copilot runtime</p>
                    </div>
                </div>
                {view !== "runtime" && (
                    <div className="hb-header-draft">
                        <div className="hb-draft-identity">
                            <label htmlFor="harness-draft-name">Draft name</label>
                            <input
                                id="harness-draft-name"
                                value={plan.name}
                                className="hb-draft-name"
                                maxLength={80}
                                disabled={blocked}
                                aria-invalid={issues.some((issue) => issue.path === "name")}
                                aria-describedby={
                                    issues.some((issue) => issue.path === "name")
                                        ? "draft-validation"
                                        : undefined
                                }
                                onChange={(event) => {
                                    const value = event.currentTarget.value;
                                    edit((draft) => {
                                        draft.name = value;
                                    });
                                }}
                            />
                        </div>
                        <div className="hb-draft-actions">
                            <span
                                className={`hb-save-status${exportDisabled || saveError ? " hb-save-status-error" : ""}`}
                                role="status"
                            >
                                {exportDisabled || saveError ? (
                                    <CircleAlert size={14} aria-hidden="true" />
                                ) : (
                                    <Check size={14} aria-hidden="true" />
                                )}
                                {saveLabel}
                            </span>
                            <div className="hb-history" aria-label="Draft history">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    aria-label="Undo"
                                    title="Undo the last plan change"
                                    disabled={!canUndo || blocked}
                                    onClick={() => {
                                        harness.undo();
                                        setRevision((current) => current + 1);
                                        setFeedback("Previous draft restored.");
                                    }}
                                >
                                    <Undo2 size={17} aria-hidden="true" />
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    aria-label="Redo"
                                    title="Redo the last undone change"
                                    disabled={!canRedo || blocked}
                                    onClick={() => {
                                        harness.redo();
                                        setRevision((current) => current + 1);
                                        setFeedback("Draft change reapplied.");
                                    }}
                                >
                                    <Redo2 size={17} aria-hidden="true" />
                                </Button>
                            </div>
                        </div>
                    </div>
                )}
                <div className="hb-header-actions">
                    <Button
                        variant="ghost"
                        size="icon"
                        aria-label={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
                        onClick={() => {
                            const next = theme === "dark" ? "light" : "dark";
                            document.documentElement.dataset.theme = next;
                            setTheme(next);
                        }}
                    >
                        {theme === "dark" ? (
                            <Sun size={18} aria-hidden="true" />
                        ) : (
                            <Moon size={18} aria-hidden="true" />
                        )}
                    </Button>
                    <span className="hb-header-divider" aria-hidden="true" />
                    <Button className="hb-import-action" onClick={() => setImportOpen(true)}>
                        <Upload size={16} aria-hidden="true" />
                        <span>Import</span>
                    </Button>
                    <Button
                        className="hb-plan-export-action"
                        variant="primary"
                        disabled={exportDisabled}
                        onClick={() => setExportOpen(true)}
                        title={
                            exportDisabled
                                ? "Resolve draft issues before exporting"
                                : "Export plan and SDK integration sketch"
                        }
                    >
                        <Download size={16} aria-hidden="true" />
                        <span>Export</span>
                    </Button>
                </div>
            </header>
            <div
                className={`hb-workspace${sidebarCollapsed ? " hb-sidebar-collapsed" : ""}${
                    planCollapsed && view !== "runtime" ? " hb-plan-collapsed" : ""
                }`}
            >
                <div className="hb-sidebar">
                    <div className="hb-sidebar-header">
                        <p className="hb-nav-label">Compose your harness</p>
                        <button
                            className="hb-sidebar-toggle"
                            type="button"
                            aria-label={sidebarCollapsed ? "Expand navigation" : "Collapse navigation"}
                            aria-expanded={!sidebarCollapsed}
                            title={sidebarCollapsed ? "Expand navigation" : "Collapse navigation"}
                            onClick={toggleSidebar}
                        >
                            {sidebarCollapsed ? (
                                <PanelLeftOpen size={18} aria-hidden="true" />
                            ) : (
                                <PanelLeftClose size={18} aria-hidden="true" />
                            )}
                        </button>
                    </div>
                    <nav aria-label="Harness workflow" className="hb-navigation">
                        {navigation.map((entry) => {
                            const Icon = entry.icon;
                            const active = entry.id === view;
                            const hasIssues = issues.some((issue) => viewForPath(issue.path) === entry.id);
                            return (
                                <button
                                    key={entry.id}
                                    className={`hb-nav-item${active ? " hb-nav-active" : ""}`}
                                    aria-current={active ? "page" : undefined}
                                    aria-controls="builder-main"
                                    title={sidebarCollapsed ? `${entry.label} — ${entry.detail}` : undefined}
                                    onClick={() => navigate(entry.id)}
                                >
                                    <Icon size={18} aria-hidden="true" />
                                    <span>
                                        <strong>{entry.label}</strong>
                                        <small>{entry.detail}</small>
                                    </span>
                                    {hasIssues ? (
                                        <span className="hb-nav-issue" aria-label="Contains invalid fields">
                                            !
                                        </span>
                                    ) : active ? (
                                        <ChevronRight
                                            className="hb-nav-chevron"
                                            size={14}
                                            aria-hidden="true"
                                        />
                                    ) : null}
                                </button>
                            );
                        })}
                    </nav>
                </div>
                <main id="builder-main" tabIndex={-1} className="hb-main" aria-labelledby="editor-heading">
                    {view !== "runtime" && (
                        <div className="hb-page-heading">
                            <p className="hb-kicker">{heading.eyebrow}</p>
                            <h2 id="editor-heading" tabIndex={-1}>
                                {heading.title}
                            </h2>
                            <p>{heading.description}</p>
                        </div>
                    )}
                    {blocked && (
                        <Notice title="Your saved draft needs explicit recovery" tone="error">
                            <p>
                                {saveError ?? "The saved draft could not be read."} No saved data has been
                                silently replaced.
                            </p>
                            <div className="hb-recovery-actions">
                                <Button onClick={() => setImportOpen(true)}>
                                    <Upload size={14} aria-hidden="true" />
                                    Import a valid plan
                                </Button>
                                <Button onClick={() => requestChange({ kind: "recovery", id: "empty" })}>
                                    Recover with Empty
                                </Button>
                            </div>
                        </Notice>
                    )}
                    {!blocked && saveError && issues.length === 0 && (
                        <Notice title="The current draft is not saved locally" tone="error">
                            {saveError} Export the valid draft to keep a copy.
                        </Notice>
                    )}
                    {issues.length > 0 && !blocked && (
                        <div id="draft-validation" className="hb-validation" role="status">
                            <CircleAlert size={18} aria-hidden="true" />
                            <details>
                                <summary>
                                    {issues.length} invalid {issues.length === 1 ? "field" : "fields"} - last
                                    valid saved draft retained
                                </summary>
                                <p>Fix the fields below to resume saving and exporting.</p>
                                <ul>
                                    {issues.map((issue, index) => (
                                        <li key={`${issue.path}-${index}`}>
                                            <button onClick={() => navigate(viewForPath(issue.path))}>
                                                <code>{issue.path || "plan"}</code>: {issue.message}
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            </details>
                        </div>
                    )}
                    <Suspense
                        fallback={
                            <div className="hb-loading" role="status">
                                Loading view…
                            </div>
                        }
                    >
                        {view === "runtime" ? (
                            <RuntimeExplorer onNavigate={navigate} />
                        ) : view === "reference" ? (
                            <ReferencePanel onEvidence={setEvidence} onNavigate={navigate} />
                        ) : (
                            <fieldset
                                className="hb-editor-fields"
                                disabled={blocked}
                                key={`${view}-${revision}`}
                            >
                                <legend className="hb-sr-only">
                                    {navigation.find((entry) => entry.id === view)?.label} editor
                                </legend>
                                {view === "overview" && <OverviewEditor onNavigate={navigate} />}
                                {view === "base-profile" && (
                                    <BaseProfileEditor
                                        {...editorProps}
                                        onApplyPreset={(id) => requestChange({ kind: "preset", id })}
                                        onNavigate={navigate}
                                    />
                                )}
                                {view === "prompt" && <PromptEditor {...editorProps} />}
                                {view === "tools" && <ToolsEditor {...editorProps} />}
                                {view === "context" && <ContextEditor {...editorProps} />}
                                {view === "agents" && <AgentsEditor {...editorProps} />}
                                {view === "models" && <ModelsEditor {...editorProps} />}
                                {view === "policy" && <PolicyEditor {...editorProps} />}
                                {view === "bootstrap" && (
                                    <BootstrapEditor
                                        {...editorProps}
                                        blocked={blocked}
                                        onNavigate={navigate}
                                    />
                                )}
                            </fieldset>
                        )}
                    </Suspense>
                    {view !== "runtime" && (
                        <footer className="hb-editor-footer">
                            <LockKeyhole size={13} aria-hidden="true" />
                            Browser-local planning. Exported paths and bindings refer to your future host.
                        </footer>
                    )}
                </main>
                {view !== "runtime" && !planCollapsed && (
                    <PlanInspector
                        plan={plan}
                        onEvidence={setEvidence}
                        onExport={() => setExportOpen(true)}
                        onCollapse={togglePlan}
                        exportDisabled={exportDisabled}
                    />
                )}
                {view !== "runtime" && planCollapsed && (
                    <aside className="hb-inspector-rail" aria-label="Live plan is collapsed">
                        <button
                            type="button"
                            className="hb-inspector-toggle"
                            aria-label="Expand live plan"
                            title="Expand live plan"
                            onClick={togglePlan}
                        >
                            <PanelRightOpen size={18} aria-hidden="true" />
                        </button>
                        <span>Live plan</span>
                    </aside>
                )}
            </div>
            {pending && (
                <Modal
                    open
                    onOpenChange={(open) => {
                        if (!open) setPending(null);
                    }}
                    title={
                        pending.kind === "recovery"
                            ? "Replace the unreadable saved draft?"
                            : `Apply ${changeLabel(pending)}?`
                    }
                    description={
                        pending.kind === "recovery"
                            ? "This explicitly starts a fresh Empty profile with the default TypeScript / managed-child target and replaces the unreadable saved data."
                            : "This replaces the behavior composition and draft name. Your runtime placement, language, and connection settings are preserved."
                    }
                >
                    <div className="hb-editor-stack">
                        <Notice
                            title={
                                pending.kind === "recovery"
                                    ? "Recovery is an explicit replacement"
                                    : "Your previous in-memory draft stays in history"
                            }
                        >
                            {pending.kind === "recovery"
                                ? "If you have a valid exported plan, cancel and import it instead. Undo cannot recover unreadable stored data."
                                : `You have ${behaviorChanges.length} changed behavior ${behaviorChanges.length === 1 ? "axis" : "axes"}${issues.length ? " and invalid in-progress fields" : ""}. Runtime and language choices are kept. Undo can restore the draft after applying this change.`}
                        </Notice>
                        <div className="hb-dialog-actions">
                            <Button onClick={() => setPending(null)}>Cancel</Button>
                            <Button variant="primary" onClick={() => applyChange(pending)}>
                                {pending.kind === "recovery"
                                    ? "Replace saved draft"
                                    : `Apply ${changeLabel(pending)}`}
                                <ArrowRight size={15} aria-hidden="true" />
                            </Button>
                        </div>
                    </div>
                </Modal>
            )}
            {importOpen && (
                <Suspense fallback={null}>
                    <ImportDialog
                        blocked={blocked}
                        onClose={() => setImportOpen(false)}
                        onImport={(imported) => {
                            replace(imported, `Imported ${imported.name}. No data was uploaded.`);
                            setImportOpen(false);
                            navigate("overview");
                        }}
                    />
                </Suspense>
            )}
            {exportOpen && (
                <Suspense fallback={null}>
                    <ExportDialog
                        plan={plan}
                        issues={issues}
                        blocked={blocked}
                        onClose={() => setExportOpen(false)}
                        onBuild={() => {
                            setExportOpen(false);
                            navigate("bootstrap");
                        }}
                    />
                </Suspense>
            )}
            {evidence && (
                <EvidenceDialog evidence={evidence} onClose={() => setEvidence(null)} onNavigate={navigate} />
            )}
            <div className="hb-toast-region" role="status" aria-live="polite">
                {feedback && (
                    <div className="hb-action-feedback" key={feedbackId}>
                        <Check size={15} aria-hidden="true" />
                        <span>{feedback}</span>
                        <Button
                            variant="ghost"
                            size="icon"
                            aria-label="Dismiss draft update"
                            onClick={() => setFeedback(null)}
                        >
                            <X size={14} aria-hidden="true" />
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}
