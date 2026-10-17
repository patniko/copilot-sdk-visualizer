// Copyright (c) Microsoft Corporation. All rights reserved.
import { lazy, Suspense, useState } from "react";
import { Activity, ChevronRight, Database, Lock, ShieldCheck, Webhook } from "lucide-react";
import { issueFor } from "./editor";
import type { EditorProps } from "./editor";
import {
    Badge,
    CheckboxListField,
    ChoiceField,
    ExperimentalBadge,
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
import { DIAGNOSTIC_LEVELS, HOST_HANDLERS, LIFECYCLE_HOOKS, LOG_LEVELS } from "../domain/plan";
import type { HarnessPlan, HostHandler, LifecycleHook } from "../domain/plan";

const HOOK_DESCRIPTIONS: Record<LifecycleHook, string> = {
    preMcpToolCall: "Before an MCP tool call is sent to its server.",
    userPromptSubmitted: "When a prompt is submitted; can rewrite it or block it.",
    userPromptTransformed: "After the runtime transforms a prompt, before it is stored.",
    sessionStart: "When the session starts; add context or set up state.",
    sessionEnd: "When the session ends; release resources.",
    errorOccurred: "When an error occurs; report or decide how to recover.",
    agentStop: "When the top-level agent stops; can block with a reason to continue.",
    subagentStart: "Before a sub-agent's first turn; prepend context.",
    subagentStop: "After a sub-agent turn; block with a reason or rewrite its response.",
};

const HANDLER_DESCRIPTIONS: Record<HostHandler, string> = {
    elicitation: "Answer form-based questions; needed for the elicitation ask_user shape.",
    exitPlanMode: "Approve or reject the agent's plan before it acts.",
    autoModeSwitch: "Decide whether the agent may switch into an automatic mode.",
    mcpAuth: "Supply OAuth token data when an MCP server needs sign-in.",
};

const MANAGED_RULES = [
    { key: "deny", label: "Always deny", placeholder: "Shell(git push *)" },
    { key: "ask", label: "Always ask", placeholder: "Write(**)" },
    { key: "allow", label: "Allow without prompting", placeholder: "Read(**)" },
] as const;

type ManagedPolicy = HarnessPlan["policy"]["managed"];

const FileHookEventList = lazy(() =>
    import("./FileHookEventList").then((module) => ({ default: module.FileHookEventList })),
);

function FileHookEvents() {
    const [open, setOpen] = useState(false);
    return (
        <details
            className="hb-panel-collapsible hb-hook-events"
            open={open}
            onToggle={(event) => setOpen(event.currentTarget.open)}
        >
            <summary className="hb-panel-heading">
                <ChevronRight size={16} aria-hidden="true" />
                <div>
                    <h4>Lifecycle events</h4>
                    <p>Every event a hook file can attach commands to.</p>
                </div>
            </summary>
            {open && (
                <Suspense fallback={<p className="hb-field-hint">Loading events…</p>}>
                    <FileHookEventList />
                </Suspense>
            )}
        </details>
    );
}

export function PolicyEditor({ plan, edit, issues }: EditorProps) {
    return (
        <div className="hb-editor-stack">
            <Panel
                title="Host policy at execution boundaries"
                description="Connect real host decisions, not permission-shaped prompt text."
                action={<ShieldCheck size={20} aria-hidden="true" />}
            >
                <ChoiceField
                    label="Permission handling"
                    help={<SettingHelp help={valueHelp.permissionMode} value={plan.policy.permissionMode} />}
                    value={plan.policy.permissionMode}
                    options={[
                        {
                            value: "host",
                            label: "Host permission handler",
                            description: "Require application-owned approval code",
                        },
                        {
                            value: "allow-all",
                            label: "Explicit allow all",
                            description: "Approve each ordinary request once",
                        },
                    ]}
                    onValueChange={(value) =>
                        edit((draft) => {
                            draft.policy.permissionMode = value;
                        })
                    }
                />
                {plan.policy.permissionMode === "host" ? (
                    <Notice title="Host permission handler required" tone="accent">
                        Generated projects fail preflight until you implement the permission callback. Put
                        identity, tenant, resource, and approval rules in host code.
                    </Notice>
                ) : (
                    <Notice title="Every runtime permission prompt will be approved" tone="accent">
                        The generated host explicitly installs the SDK&apos;s approve-all helper, which
                        returns approve-once for ordinary requests. Managed policy, content exclusion,
                        downstream authorization, tool validity, and sandbox enablement still apply. If
                        sandbox bypass is enabled, this can approve a bypass request.
                    </Notice>
                )}
                <div className="hb-toggle-list">
                    <ToggleField
                        label="Pre-tool policy hook"
                        help={<SettingHelp help={toggleHelp.preToolHook} enabled={plan.policy.preToolHook} />}
                        description="Require a host callback before tool execution for workload-specific policy decisions."
                        checked={plan.policy.preToolHook}
                        onCheckedChange={(checked) =>
                            edit((draft) => {
                                draft.policy.preToolHook = checked;
                            })
                        }
                    />
                    <ToggleField
                        label="Post-tool result hook"
                        help={
                            <SettingHelp help={toggleHelp.postToolHook} enabled={plan.policy.postToolHook} />
                        }
                        description="Require a host callback to inspect or process tool results at the supported boundary."
                        checked={plan.policy.postToolHook}
                        onCheckedChange={(checked) =>
                            edit((draft) => {
                                draft.policy.postToolHook = checked;
                            })
                        }
                    />
                </div>
                <CheckboxListField
                    label="SDK lifecycle hooks"
                    help={
                        <SettingHelp
                            help={valueHelp.lifecycleHooks}
                            value={`${plan.policy.hooks.length} selected`}
                        />
                    }
                    values={plan.policy.hooks}
                    options={LIFECYCLE_HOOKS.map((hook) => ({
                        value: hook,
                        label: hook,
                        description: HOOK_DESCRIPTIONS[hook],
                        badge:
                            hook === "userPromptSubmitted" || hook === "subagentStop"
                                ? "Can block"
                                : undefined,
                    }))}
                    onValuesChange={(values) =>
                        edit((draft) => {
                            draft.policy.hooks = values;
                        })
                    }
                    error={issueFor(issues, "policy.hooks")}
                    hint="Each selection becomes a required host callback. userPromptSubmitted can refuse a prompt; subagentStop can keep a sub-agent working with a reason or rewrite its response."
                />
                <CheckboxListField
                    label="Host request handlers"
                    help={
                        <SettingHelp
                            help={valueHelp.hostHandlers}
                            value={`${plan.policy.handlers.length} selected`}
                        />
                    }
                    values={plan.policy.handlers}
                    options={HOST_HANDLERS.map((handler) => ({
                        value: handler,
                        label: handler,
                        description: HANDLER_DESCRIPTIONS[handler],
                    }))}
                    onValuesChange={(values) =>
                        edit((draft) => {
                            draft.policy.handlers = values;
                        })
                    }
                    error={issueFor(issues, "policy.handlers")}
                    hint="Each selection becomes a required host handler; your application owns the UI and decisions."
                />
            </Panel>
            <ManagedPolicyPanel {...{ plan, edit, issues }} />
            <Panel
                title="File-based lifecycle hooks"
                description="Let trusted hook files run commands at runtime lifecycle events."
                action={<Webhook size={19} aria-hidden="true" />}
            >
                <div className="hb-toggle-list">
                    <ToggleField
                        label="File-based hooks"
                        description="Load file-defined lifecycle hooks, including commands in .github/hooks/."
                        help={
                            <SettingHelp
                                help={contextToggleHelp.fileHooks}
                                enabled={plan.context.fileHooks}
                            />
                        }
                        checked={plan.context.fileHooks}
                        onCheckedChange={(checked) =>
                            edit((draft) => {
                                draft.context.fileHooks = checked;
                            })
                        }
                    />
                </div>
                <FileHookEvents />
            </Panel>
            <Panel
                title="Session state and lifetime"
                description="No project workspace does not mean no session state."
                action={<Database size={19} aria-hidden="true" />}
            >
                <ChoiceField
                    label="Session storage"
                    help={<SettingHelp help={valueHelp.storage} value={plan.session.storage} />}
                    value={plan.session.storage}
                    options={[
                        {
                            value: "local",
                            label: "Local state directory",
                            description: "A path in the future host",
                        },
                        {
                            value: "virtual",
                            label: "Virtual session provider",
                            description: "A host filesystem adapter",
                        },
                    ]}
                    onValueChange={(value) =>
                        edit((draft) => {
                            draft.session.storage = value;
                        })
                    }
                />
                {plan.session.storage === "local" ? (
                    <TextField
                        label="Session state directory"
                        help={<SettingHelp help={valueHelp.stateDirectory} />}
                        value={plan.session.baseDirectory}
                        maxLength={1000}
                        monospace
                        placeholder="./.harness-state"
                        onValueChange={(value) =>
                            edit((draft) => {
                                draft.session.baseDirectory = value;
                            })
                        }
                        error={issueFor(issues, "session.baseDirectory")}
                        hint="An explicit future-host path. This browser does not create it."
                    />
                ) : (
                    <Notice title="Implement a real filesystem-shaped provider">
                        Supply <code>createSessionFsProvider</code> with the required durability and
                        filesystem semantics. This virtualizes session state, not every tool&apos;s filesystem
                        access. The sketch declares no SQLite capability.
                    </Notice>
                )}
                <TextField
                    label="Idle cleanup timeout (seconds)"
                    help={
                        <SettingHelp
                            help={valueHelp.idle}
                            value={
                                Number.isFinite(plan.session.idleTimeoutSeconds)
                                    ? plan.session.idleTimeoutSeconds
                                    : "Not set"
                            }
                        />
                    }
                    type="number"
                    min={0}
                    max={Number.MAX_SAFE_INTEGER}
                    step={1}
                    value={
                        Number.isFinite(plan.session.idleTimeoutSeconds)
                            ? String(plan.session.idleTimeoutSeconds)
                            : ""
                    }
                    onValueChange={(value) =>
                        edit((draft) => {
                            draft.session.idleTimeoutSeconds = value.trim() ? Number(value) : Number.NaN;
                        })
                    }
                    error={issueFor(issues, "session.idleTimeoutSeconds")}
                    hint="0 disables idle cleanup. This is a client/startup setting, not a wait timeout or retention policy."
                />
                <div className="hb-toggle-list">
                    <ToggleField
                        label="Infinite sessions"
                        help={<SettingHelp help={toggleHelp.infinite} enabled={plan.session.infinite} />}
                        description="Enable runtime context management for longer sessions. State and retention still need an explicit policy."
                        checked={plan.session.infinite}
                        onCheckedChange={(checked) =>
                            edit((draft) => {
                                draft.session.infinite = checked;
                            })
                        }
                    />
                    <ToggleField
                        label="Large-output handling"
                        help={
                            <SettingHelp help={toggleHelp.largeOutput} enabled={plan.session.largeOutput} />
                        }
                        description="Allow large-result handling that can spill to temporary files independently of session storage."
                        checked={plan.session.largeOutput}
                        onCheckedChange={(checked) =>
                            edit((draft) => {
                                draft.session.largeOutput = checked;
                            })
                        }
                    />
                </div>
                {!plan.session.largeOutput && (
                    <p className="hb-field-hint">
                        With large-output handling disabled, bound result sizes in your host tools.
                    </p>
                )}
                <TextField
                    label="Session name"
                    help={<SettingHelp help={valueHelp.sessionName} value={plan.session.name || "Unnamed"} />}
                    value={plan.session.name}
                    maxLength={100}
                    placeholder="Optional, e.g. Ticket 4821"
                    onValueChange={(value) =>
                        edit((draft) => {
                            draft.session.name = value;
                        })
                    }
                    error={issueFor(issues, "session.name")}
                    hint="Applied at creation only. A name persists the session immediately so it can be listed and resumed."
                />
                <SelectField
                    label="MCP diagnostics"
                    help={<SettingHelp help={valueHelp.diagnostics} value={plan.session.diagnostics} />}
                    value={plan.session.diagnostics}
                    options={DIAGNOSTIC_LEVELS.map((level) => ({
                        value: level,
                        label: level === "off" ? "Off" : level.charAt(0).toUpperCase() + level.slice(1),
                    }))}
                    onValueChange={(value) =>
                        edit((draft) => {
                            draft.session.diagnostics = value;
                        })
                    }
                    error={issueFor(issues, "session.diagnostics")}
                />
                {(plan.session.diagnostics === "debug" || plan.session.diagnostics === "trace") && (
                    <Notice title="Verbose diagnostics capture sensitive payloads" tone="accent">
                        Debug and trace entries can contain MCP payloads, tool arguments, paths, and server
                        stderr. Do not upload them as telemetry or export them without deliberate host action.
                    </Notice>
                )}
                <div className="hb-toggle-list">
                    <ToggleField
                        label="Interactive user"
                        help={
                            <SettingHelp
                                help={toggleHelp.interactiveUser}
                                enabled={plan.session.interactiveUser}
                            />
                        }
                        description="Declare that a person types this session's messages rather than an automated pipeline."
                        checked={plan.session.interactiveUser}
                        onCheckedChange={(checked) =>
                            edit((draft) => {
                                draft.session.interactiveUser = checked;
                            })
                        }
                    />
                    <ToggleField
                        label="Cross-session store"
                        help={
                            <SettingHelp help={toggleHelp.sessionStore} enabled={plan.session.sessionStore} />
                        }
                        description="Write session content to the shared store so later sessions can search it."
                        checked={plan.session.sessionStore}
                        onCheckedChange={(checked) =>
                            edit((draft) => {
                                draft.session.sessionStore = checked;
                            })
                        }
                    />
                    <ToggleField
                        label="File change tracking"
                        help={
                            <SettingHelp
                                help={toggleHelp.fileChangeTracking}
                                enabled={plan.session.fileChangeTracking}
                            />
                        }
                        description="Capture file changes for rewind and a cumulative session diff."
                        checked={plan.session.fileChangeTracking}
                        onCheckedChange={(checked) =>
                            edit((draft) => {
                                draft.session.fileChangeTracking = checked;
                            })
                        }
                    />
                </div>
                <h4 className="hb-subsection-title">Applies when resuming</h4>
                <div className="hb-toggle-list">
                    <ToggleField
                        label="Transcript recovery"
                        help={
                            <SettingHelp
                                help={toggleHelp.allowTranscriptRecovery}
                                enabled={plan.session.allowTranscriptRecovery}
                            />
                        }
                        description="Applies when resuming: repair a damaged transcript instead of failing."
                        checked={plan.session.allowTranscriptRecovery}
                        onCheckedChange={(checked) =>
                            edit((draft) => {
                                draft.session.allowTranscriptRecovery = checked;
                            })
                        }
                    />
                    <ToggleField
                        label="Continue pending work"
                        help={
                            <SettingHelp
                                help={toggleHelp.continuePendingWork}
                                enabled={plan.session.continuePendingWork}
                            />
                        }
                        description="Applies when resuming: continue tool calls and permission prompts that were pending."
                        checked={plan.session.continuePendingWork}
                        onCheckedChange={(checked) =>
                            edit((draft) => {
                                draft.session.continuePendingWork = checked;
                            })
                        }
                    />
                </div>
            </Panel>
            <Panel
                title="Observation and evaluation"
                description="Define what the host observes and what success means for the actual workload."
                action={<Activity size={19} aria-hidden="true" />}
            >
                <div className="hb-toggle-list">
                    <ToggleField
                        label="Streaming"
                        help={<SettingHelp help={toggleHelp.streaming} enabled={plan.events.streaming} />}
                        description="Request incremental output from the configured runtime session."
                        checked={plan.events.streaming}
                        onCheckedChange={(checked) =>
                            edit((draft) => {
                                draft.events.streaming = checked;
                            })
                        }
                    />
                    <ToggleField
                        label="Event observer"
                        help={<SettingHelp help={toggleHelp.observer} enabled={plan.events.observer} />}
                        description="Require host.callbacks.onEvent for host-owned observation and product state."
                        checked={plan.events.observer}
                        onCheckedChange={(checked) =>
                            edit((draft) => {
                                draft.events.observer = checked;
                            })
                        }
                    />
                    <ToggleField
                        label="Sub-agent streaming"
                        help={
                            <SettingHelp
                                help={toggleHelp.subAgentStreaming}
                                enabled={plan.events.subAgentStreaming}
                            />
                        }
                        description="Forward streaming deltas from sub-agents. Off keeps only their lifecycle and final events."
                        checked={plan.events.subAgentStreaming}
                        onCheckedChange={(checked) =>
                            edit((draft) => {
                                draft.events.subAgentStreaming = checked;
                            })
                        }
                    />
                </div>
                <SelectField
                    label="Runtime log level"
                    help={<SettingHelp help={valueHelp.logLevel} value={plan.events.logLevel} />}
                    value={plan.events.logLevel}
                    options={LOG_LEVELS.map((level) => ({
                        value: level,
                        label:
                            level === "default"
                                ? "Runtime default"
                                : level.charAt(0).toUpperCase() + level.slice(1),
                    }))}
                    onValueChange={(value) =>
                        edit((draft) => {
                            draft.events.logLevel = value;
                        })
                    }
                    hint="A client option for the runtime the SDK starts; an existing runtime service keeps its own logging."
                />
                <TextAreaField
                    label="Structured response schema (JSON)"
                    help={<SettingHelp help={valueHelp.responseSchema} />}
                    value={plan.output.responseSchema}
                    rows={6}
                    maxLength={12000}
                    monospace
                    spellCheck={false}
                    placeholder='{ "type": "object", "properties": { … } }'
                    onValueChange={(value) =>
                        edit((draft) => {
                            draft.output.responseSchema = value;
                        })
                    }
                    error={issueFor(issues, "output.responseSchema")}
                    hint='Optional. A JSON object schema with top-level "type": "object", sent with each run prompt. Blank means free-text answers.'
                />
                <TextAreaField
                    label="Workload evaluation criteria"
                    help={<SettingHelp help={valueHelp.evaluation} />}
                    value={plan.evaluation}
                    rows={7}
                    maxLength={12000}
                    onValueChange={(value) =>
                        edit((draft) => {
                            draft.evaluation = value;
                        })
                    }
                    error={issueFor(issues, "evaluation")}
                    hint="Record representative tasks, expected tool routes, authorization checks, failure behavior, and measurable acceptance criteria."
                />
                <Badge>Host-owned criteria, not an SDK property</Badge>
                <p className="hb-field-hint">
                    Criteria are retained in the exported plan. No evaluation, model call, or telemetry
                    transmission runs here.
                </p>
            </Panel>
        </div>
    );
}

function ManagedPolicyPanel({ plan, edit, issues }: Pick<EditorProps, "plan" | "edit" | "issues">) {
    const managed = plan.policy.managed;
    const editManaged = (recipe: (target: ManagedPolicy) => void) =>
        edit((draft) => {
            recipe(draft.policy.managed);
        });
    return (
        <Panel
            title="Managed policy"
            description="Enterprise rules the session cannot relax. Host-injected rules are re-supplied on every resume."
            action={<Lock size={19} aria-hidden="true" />}
        >
            <div className="hb-toggle-list">
                <ToggleField
                    label="Load managed settings"
                    help={<SettingHelp help={toggleHelp.managedLoad} enabled={managed.load} />}
                    description="Fetch account, organization, and device policy at startup. Needs a GitHub token; fails closed without one."
                    checked={managed.load}
                    onCheckedChange={(checked) =>
                        editManaged((target) => {
                            target.load = checked;
                        })
                    }
                />
                <ToggleField
                    label="Enforce managed model defaults"
                    help={
                        <SettingHelp
                            help={toggleHelp.enforceModelDefaults}
                            enabled={managed.enforceModelDefaults}
                        />
                    }
                    description="Apply locked managed model values and reject conflicting model changes."
                    checked={managed.enforceModelDefaults}
                    onCheckedChange={(checked) =>
                        editManaged((target) => {
                            target.enforceModelDefaults = checked;
                        })
                    }
                />
            </div>
            {managed.load && plan.model.provider !== "copilot" && (
                <Notice title="Managed settings need GitHub identity">
                    The runtime fetches managed policy with the session&apos;s GitHub token. A bring-your-own
                    provider route still needs that token, or session creation is rejected.
                </Notice>
            )}
            <h4 className="hb-subsection-title">Host-injected permission rules</h4>
            <div className="hb-field-grid">
                {MANAGED_RULES.map(({ key, label, placeholder }) => (
                    <LineListField
                        key={key}
                        label={label}
                        help={
                            <SettingHelp
                                help={valueHelp.managedRules}
                                label={`Managed rules: ${label}`}
                                value={`${managed[key].length} rules`}
                            />
                        }
                        values={managed[key]}
                        onValuesChange={(values) =>
                            editManaged((target) => {
                                target[key] = values;
                            })
                        }
                        rows={3}
                        monospace
                        spellCheck={false}
                        placeholder={placeholder}
                        hint="One rule per line."
                        error={issueFor(issues, `policy.managed.${key}`)}
                    />
                ))}
                <LineListField
                    label="Limit network hosts to"
                    help={
                        <SettingHelp
                            help={valueHelp.managedLimitTo}
                            value={`${managed.limitTo.length} hosts`}
                        />
                    }
                    values={managed.limitTo}
                    onValuesChange={(values) =>
                        editManaged((target) => {
                            target.limitTo = values;
                        })
                    }
                    rows={3}
                    monospace
                    spellCheck={false}
                    placeholder="Domain(api.example.com)"
                    hint="Domain(host), Domain(IP), or Domain(*.example.com); no schemes, ports, or paths. Once set, unlisted hosts are denied."
                    error={issueFor(issues, "policy.managed.limitTo")}
                />
            </div>
            <SelectField
                label="Bypass-permissions policy"
                help={
                    <SettingHelp
                        help={valueHelp.bypassMode}
                        value={managed.disableBypassPermissionsMode || "No restriction"}
                    />
                }
                value={managed.disableBypassPermissionsMode}
                options={[
                    { value: "", label: "No restriction" },
                    { value: "disable", label: "Disable bypass mode" },
                    { value: "allow-auto-only", label: "Allow automatic bypass only" },
                ]}
                onValueChange={(value) =>
                    editManaged((target) => {
                        target.disableBypassPermissionsMode = value;
                    })
                }
            />
            <div className="hb-toggle-list">
                <ToggleField
                    label="Disable Assisted permissions"
                    badge={<ExperimentalBadge />}
                    help={
                        <SettingHelp
                            help={toggleHelp.disableAssisted}
                            enabled={managed.disableAssistedPermissionsMode}
                        />
                    }
                    description="Block the experimental Assisted permissions mode for this session."
                    checked={managed.disableAssistedPermissionsMode}
                    onCheckedChange={(checked) =>
                        editManaged((target) => {
                            target.disableAssistedPermissionsMode = checked;
                        })
                    }
                />
            </div>
        </Panel>
    );
}
