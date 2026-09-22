// Copyright (c) Microsoft Corporation. All rights reserved.
import { Activity, Database, ShieldCheck } from "lucide-react";
import { issueFor } from "./editor";
import type { EditorProps } from "./editor";
import { Badge, ChoiceField, Notice, Panel, TextAreaField, TextField, ToggleField } from "./ui";
import { SettingHelp } from "./SettingHelp";
import { toggleHelp, valueHelp } from "../content/setting-help";

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
                <p className="hb-field-hint">
                    Hooks do not replace the inner execution algorithm. Keep effect authorization in the
                    handler and downstream service, too.
                </p>
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
                </div>
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
