// Copyright (c) Microsoft Corporation. All rights reserved.
import { useId, useRef, useState } from "react";
import * as Tabs from "@radix-ui/react-tabs";
import {
    ArrowUpRight,
    BookOpen,
    Code2,
    Download,
    FileText,
    KeyRound,
    ListChecks,
    PackageOpen,
    Server,
    ShieldCheck,
    Terminal,
} from "lucide-react";
import { createBootstrapArchive } from "../domain/bootstrap/archive";
import { downloadBlob } from "../browser/download";
import type {
    BootstrapCommands,
    BootstrapFile,
    BootstrapProject,
    BootstrapRequirement,
} from "../domain/bootstrap/types";
import { BootstrapFileTree } from "./BootstrapFileTree";
import { CopyTextButton } from "./BootstrapPrimitives";
import { Badge, Button, Notice, Panel } from "./ui";

const requirementIcons = { environment: KeyRound, "host-code": Code2, runtime: Server, review: ShieldCheck };
const requirementLabels = {
    environment: "Environment",
    "host-code": "Host code",
    runtime: "Runtime",
    review: "Review",
};

function firstFile(files: BootstrapFile[]) {
    return files.find((file) => /(^|\/)readme(?:\.[^/]+)?$/i.test(file.path)) ?? files[0];
}

function publicProjectNotes(notes: string[]) {
    return notes.map((note) => note.replace(/\b[a-f0-9]{40}\b/gi, "the pinned SDK revision"));
}

export function BootstrapProjectPanel({ project }: { project: BootstrapProject }) {
    const [tab, setTab] = useState<"files" | "commands" | "requirements">("files");
    const [selectedPath, setSelectedPath] = useState(() => firstFile(project.files)?.path ?? "");
    const [downloadFeedback, setDownloadFeedback] = useState<{
        project: BootstrapProject;
        error: boolean;
        message: string;
    } | null>(null);
    const fileHeading = useRef<HTMLHeadingElement | null>(null);
    const requirementsPane = useRef<HTMLDivElement | null>(null);
    const filePreviewId = useId();
    const file = project.files.find((entry) => entry.path === selectedPath) ?? firstFile(project.files);
    const feedback = downloadFeedback?.project === project ? downloadFeedback : null;
    const notes = publicProjectNotes(project.notes);

    function selectFile(path: string) {
        setSelectedPath(path);
        setTab("files");
        window.requestAnimationFrame(() => fileHeading.current?.focus());
    }

    function showRequirements() {
        setTab("requirements");
        window.requestAnimationFrame(() => requirementsPane.current?.focus());
    }

    function download() {
        setDownloadFeedback(null);
        try {
            const archive = createBootstrapArchive(project);
            downloadBlob(new Blob([archive], { type: "application/zip" }), `${project.name}.zip`);
            setDownloadFeedback({
                project,
                error: false,
                message: `ZIP download requested: ${project.name}.zip`,
            });
        } catch (error) {
            setDownloadFeedback({
                project,
                error: true,
                message: `Could not export the bootstrap ZIP: ${error instanceof Error ? error.message : String(error)}`,
            });
        }
    }

    return (
        <Panel
            title={`${project.languageLabel} bootstrap project`}
            description="A scaffold with real dependency files, entrypoint, and host integration work. Start with the README."
            action={
                <Button variant="primary" disabled={!file} onClick={download}>
                    <Download size={15} aria-hidden="true" />
                    Download ZIP
                </Button>
            }
        >
            {file && (
                <Notice title="Scaffold files, not a finished integration" tone="accent">
                    Host integrations can contain explicit failing TODOs. Supply environment values and
                    implement the required handlers before running a workload; do not replace them with
                    success-shaped no-ops.
                </Notice>
            )}
            <div className="hb-project-summary">
                <span>
                    <PackageOpen size={16} aria-hidden="true" />
                    <code>{project.name}</code>
                </span>
                <Badge>{project.files.length} files</Badge>
                <Badge>{project.requirements.length} host requirements</Badge>
            </div>
            {feedback && (
                <div
                    className={`hb-export-feedback${feedback.error ? " hb-export-feedback-error" : ""}`}
                    role={feedback.error ? "alert" : "status"}
                >
                    {feedback.message}
                </div>
            )}
            {!file ? (
                <Notice title="The adapter returned no project files" tone="error">
                    A complete bootstrap cannot be exported until the language adapter supplies its files.
                </Notice>
            ) : (
                <Tabs.Root
                    value={tab}
                    onValueChange={(value) => {
                        if (value === "files" || value === "commands" || value === "requirements")
                            setTab(value);
                    }}
                >
                    <Tabs.List className="hb-tabs-list hb-project-tabs" aria-label="Bootstrap project views">
                        <Tabs.Trigger className="hb-tab" value="files">
                            <FileText size={15} aria-hidden="true" />
                            Project files
                        </Tabs.Trigger>
                        <Tabs.Trigger className="hb-tab" value="commands">
                            <Terminal size={15} aria-hidden="true" />
                            Install &amp; run
                        </Tabs.Trigger>
                        <Tabs.Trigger className="hb-tab" value="requirements">
                            <ListChecks size={15} aria-hidden="true" />
                            Host integration
                        </Tabs.Trigger>
                    </Tabs.List>
                    <Tabs.Content className="hb-tab-content" value="files">
                        <div className="hb-file-workbench">
                            <BootstrapFileTree
                                files={project.files}
                                selected={file.path}
                                onSelect={selectFile}
                            />
                            <section className="hb-project-file" aria-label="Selected bootstrap file">
                                <div className="hb-project-file-toolbar">
                                    <div>
                                        <h4 ref={fileHeading} tabIndex={-1}>
                                            {file.path}
                                        </h4>
                                        <Badge>{file.language}</Badge>
                                    </div>
                                    <CopyTextButton text={file.content} label={file.path} />
                                </div>
                                <label htmlFor={filePreviewId} className="hb-sr-only">
                                    Contents of {file.path}
                                </label>
                                <textarea
                                    id={filePreviewId}
                                    className={`hb-project-file-preview${file.language === "markdown" ? " hb-project-readme" : ""}`}
                                    value={file.content}
                                    readOnly
                                    spellCheck={false}
                                    wrap={file.language === "markdown" ? "soft" : "off"}
                                />
                            </section>
                        </div>
                        <p className="hb-field-hint">
                            These are the exact files included in the ZIP. The preview never evaluates or
                            executes their contents.
                        </p>
                    </Tabs.Content>
                    <Tabs.Content className="hb-tab-content" value="commands">
                        <CommandSteps commands={project.commands} onHostIntegration={showRequirements} />
                    </Tabs.Content>
                    <Tabs.Content ref={requirementsPane} className="hb-tab-content" value="requirements">
                        <Notice title="Required integration checklist">
                            These are implementation obligations, not completed checks. Follow each
                            requirement to the generated file it describes. Environment entries are names
                            only; the browser never requests their secret values.
                        </Notice>
                        <ul className="hb-requirement-list">
                            {project.requirements.map((requirement) => (
                                <RequirementRow
                                    key={requirement.id}
                                    requirement={requirement}
                                    hasFile={project.files.some((entry) => entry.path === requirement.file)}
                                    onSelectFile={selectFile}
                                />
                            ))}
                        </ul>
                        {project.requirements.length === 0 && (
                            <p className="hb-muted-copy">
                                No additional requirements were returned by this adapter. Review the README
                                and preflight; this is not a claim of production readiness.
                            </p>
                        )}
                    </Tabs.Content>
                </Tabs.Root>
            )}
            <details className="hb-project-notes">
                <summary>
                    <BookOpen size={16} aria-hidden="true" />
                    Version &amp; native packaging notes
                </summary>
                <div className="hb-editor-stack">
                    <ul className="hb-project-note-list">
                        {notes.map((note, index) => (
                            <li key={index}>{note}</li>
                        ))}
                    </ul>
                    <p className="hb-field-hint">
                        Use the adapter&apos;s dependency and native-package notes for version compatibility.
                    </p>
                </div>
            </details>
        </Panel>
    );
}

function CommandSteps({
    commands,
    onHostIntegration,
}: {
    commands: BootstrapCommands;
    onHostIntegration: () => void;
}) {
    return (
        <div className="hb-editor-stack">
            <Notice title="Run these in your host, not in this app">
                Download and extract the ZIP, then work from its project directory. Installation downloads
                dependencies; the final run can make real model requests and execute effects permitted by your
                host policy. All commands below are display-and-copy only.
            </Notice>
            <CommandCard
                title="1. Install dependencies"
                description="Use the selected language's package tooling in the extracted project."
                command={commands.install.join("\n")}
                label="dependency installation commands"
            />
            <div className="hb-host-integration-step">
                <div>
                    <h4>2. Supply environment values and host implementations</h4>
                    <p>
                        The environment reference is not automatically loaded. Complete the explicit host
                        TODOs before the local preflight and workload.
                    </p>
                </div>
                <Button size="small" onClick={onHostIntegration}>
                    Review host integration
                    <ArrowUpRight size={14} aria-hidden="true" />
                </Button>
            </div>
            <CommandCard
                title="3. Check the bootstrap locally"
                description="Preflight is not an agent turn. Resolve missing environment, packaging, and host integration messages first."
                command={commands.check}
                label="local preflight command"
            />
            {commands.startRuntime && (
                <CommandCard
                    title="4. Start the separately operated runtime"
                    description="Run this on the server host, separately from the application. Secure non-loopback exposure and keep service lifecycle ownership explicit."
                    command={commands.startRuntime}
                    label="runtime service start command"
                />
            )}
            <CommandCard
                title={`${commands.startRuntime ? "5" : "4"}. Run an agent turn`}
                description="Only after host integration and preflight. This command can make model calls; copying it does not run it."
                command={commands.run}
                label="agent run command"
            />
        </div>
    );
}

function CommandCard({
    title,
    description,
    command,
    label,
}: {
    title: string;
    description: string;
    command: string;
    label: string;
}) {
    return (
        <section className="hb-command-card">
            <div className="hb-command-heading">
                <div>
                    <h4>{title}</h4>
                    <p>{description}</p>
                </div>
                <CopyTextButton text={command} label={label} />
            </div>
            {command ? (
                <pre className="hb-command-code" tabIndex={0} aria-label={label}>
                    <code>{command}</code>
                </pre>
            ) : (
                <Notice tone="error" title="Command unavailable">
                    The adapter did not provide {label}. Review this adapter before using the project.
                </Notice>
            )}
        </section>
    );
}

function RequirementRow({
    requirement,
    hasFile,
    onSelectFile,
}: {
    requirement: BootstrapRequirement;
    hasFile: boolean;
    onSelectFile: (path: string) => void;
}) {
    const Icon = requirementIcons[requirement.kind];
    return (
        <li className="hb-requirement">
            <span className="hb-requirement-icon">
                <Icon size={18} aria-hidden="true" />
            </span>
            <div>
                <Badge>{requirementLabels[requirement.kind]}</Badge>
                <h4>{requirement.title}</h4>
                <p>{requirement.detail}</p>
                <Button
                    variant="ghost"
                    size="small"
                    disabled={!hasFile}
                    onClick={() => onSelectFile(requirement.file)}
                >
                    Open <code>{requirement.file}</code>
                    <ArrowUpRight size={13} aria-hidden="true" />
                </Button>
                {!hasFile && (
                    <p className="hb-field-error">
                        The adapter references a file that is not present: {requirement.file}.
                    </p>
                )}
            </div>
        </li>
    );
}
