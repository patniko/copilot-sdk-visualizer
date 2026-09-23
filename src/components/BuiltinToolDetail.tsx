// Copyright (c) Microsoft Corporation. All rights reserved.
import type { Ref } from "react";
import { ArrowRight, Braces, CircleHelp, LockKeyhole } from "lucide-react";
import { BUILTIN_SPECS, DEFAULT_STATUS_LABELS, aliasesForTool, toolCatalog } from "../content/builtin-tools";
import type { BuiltinName } from "../content/builtin-tools";
import { issueFor } from "./editor";
import type { EditorProps } from "./editor";
import { inputKindLabels, toolActionLabel } from "./tool-catalog-ui";
import { SettingHelp } from "./SettingHelp";
import { valueHelp } from "../content/setting-help";
import { Badge, Button, ChoiceField, Notice, TextAreaField } from "./ui";

export function BuiltinToolDetail({
    name,
    plan,
    edit,
    issues,
    onEvidence,
    headingRef,
    onInspectAlias,
}: EditorProps & {
    name: BuiltinName;
    headingRef: Ref<HTMLHeadingElement>;
    onInspectAlias: (name: string) => void;
}) {
    const spec = BUILTIN_SPECS[name];
    const settings = plan.tools[name];
    const inherited = plan.inventory === "coding-defaults";
    const legacyOverride = settings.action === "override" && !spec.overrideable;
    const aliases = aliasesForTool(name);

    return (
        <article className="hb-tool-detail" aria-label={`${name} built-in tool`}>
            <div className="hb-tool-detail-heading">
                <div>
                    <span className="hb-item-title">
                        <Braces size={18} aria-hidden="true" />
                        <h4 ref={headingRef} tabIndex={-1}>
                            {name}
                        </h4>
                    </span>
                    <p>{spec.label}</p>
                </div>
                <Badge>{spec.group}</Badge>
            </div>
            <div className="hb-tool-plan-control">
                <div className="hb-field-heading">
                    <p className="hb-small-label">Current plan selection</p>
                    <SettingHelp help={valueHelp.toolAction} value={settings.action} />
                </div>
                <ChoiceField
                    label={`${name} action`}
                    value={settings.action}
                    compact
                    options={[
                        { value: "keep", label: inherited ? "Runtime default" : "Keep" },
                        {
                            value: "override",
                            label: "Override",
                            disabled: !spec.overrideable && !legacyOverride,
                        },
                        { value: "remove", label: "Remove" },
                    ]}
                    onValueChange={(value) => {
                        if (value === "override" && !spec.overrideable && !legacyOverride) return;
                        edit((draft) => {
                            draft.tools[name].action = value;
                        });
                    }}
                />
                <p className="hb-field-hint">
                    <strong>{toolActionLabel(settings.action, inherited)}.</strong>{" "}
                    {settings.action === "keep"
                        ? inherited
                            ? "Not excluded: leave runtime model, platform, capability, and experiment selection intact. This does not force the descriptor on."
                            : "This name is selected in the explicit inventory, still subject to runtime, platform, feature, and permission gates."
                        : settings.action === "remove"
                          ? "Exclude this name from the plan. Other tool names and downstream authority remain separate choices."
                          : "A requested host implementation, not a running handler or a permission grant."}
                </p>
            </div>
            {legacyOverride && (
                <Notice
                    tone="error"
                    title={
                        name === "catalog_search"
                            ? "Reserved override retained for review"
                            : "Unverified legacy override retained"
                    }
                >
                    {name === "catalog_search"
                        ? "catalog_search is explicitly reserved; external definitions and overrides are forbidden."
                        : "This snapshot has no verified external override route for this descriptor. That is not universal proof that every SDK version lacks one."}{" "}
                    Your existing action, description, and custom schema remain editable and are preserved in
                    valid planner JSON. SDK/bootstrap generation is blocked for this route. Choose{" "}
                    {inherited ? "Runtime default" : "Keep"} or Remove to clear the request; a new Override
                    selection will then be disabled.
                </Notice>
            )}
            <section className="hb-tool-description">
                <h5>Descriptor description</h5>
                <p>{spec.description}</p>
            </section>
            <section className="hb-tool-reference-default">
                <div>
                    <h5>Reference coding default</h5>
                    <Badge accent={spec.defaultStatus === "baseline-enabled"}>
                        {DEFAULT_STATUS_LABELS[spec.defaultStatus]}
                    </Badge>
                </div>
                <p>{spec.defaultReason}</p>
                <p className="hb-field-hint">
                    This describes the pinned reference profile, not the current plan or a live enabled-tool
                    inventory.
                </p>
            </section>
            <dl className="hb-tool-contract-facts">
                <div>
                    <dt>Native input kind</dt>
                    <dd>
                        <strong>{inputKindLabels[spec.inputKind]}</strong>
                        <code>{spec.inputKind}</code>
                        <p>{toolCatalog.context.inputKindDefinitions[spec.inputKind]}</p>
                    </dd>
                </div>
                <div>
                    <dt>External override route</dt>
                    <dd>
                        <strong>
                            {spec.overrideable
                                ? "Verified in this snapshot"
                                : name === "catalog_search"
                                  ? "Explicitly reserved"
                                  : "Not verified in this snapshot"}
                        </strong>
                        <p>
                            {spec.overrideable
                                ? "Override support does not enable a disabled tool or bypass permissions."
                                : name === "catalog_search"
                                  ? "This descriptor cannot be declared or overridden as an external tool."
                                  : "New Override choices are disabled conservatively, not as a universal SDK capability claim."}
                        </p>
                    </dd>
                </div>
                <div>
                    <dt>Workspace review flag</dt>
                    <dd>
                        <strong>
                            {spec.workspace
                                ? "Host / project effects require review"
                                : "No direct workspace flag"}
                        </strong>
                        <p>
                            False does not mean no network, storage, incidental filesystem I/O, or permission
                            checks. Review the default reason and source for this tool.
                        </p>
                    </dd>
                </div>
            </dl>
            {name === "tool_search_tool" && <ToolSearchProtocol />}
            {!spec.overrideable && !legacyOverride && (
                <div className="hb-tool-override-unavailable">
                    {name === "catalog_search" ? (
                        <LockKeyhole size={16} aria-hidden="true" />
                    ) : (
                        <CircleHelp size={16} aria-hidden="true" />
                    )}
                    <p>
                        {name === "catalog_search"
                            ? "catalog_search is reserved. Keep/Runtime default and Remove remain selection-policy decisions; Override is unavailable."
                            : "No verified external override route is captured here. You can keep or remove the name, but cannot add a new override in this builder."}
                    </p>
                </div>
            )}
            {settings.action === "override" && (
                <section className="hb-override-editor">
                    <h5>{legacyOverride ? "Preserved override request" : "Your host override"}</h5>
                    <div className="hb-route-change">
                        <div>
                            <span>Native</span>
                            <code>{name}</code>
                            <ArrowRight size={13} aria-hidden="true" />
                            <span>Native implementation, when selected</span>
                        </div>
                        <div>
                            <span>Request</span>
                            <code>{name}</code>
                            <ArrowRight size={13} aria-hidden="true" />
                            <code>host.toolHandlers[&quot;{name}&quot;]</code>
                        </div>
                    </div>
                    {legacyOverride && (
                        <p className="hb-field-error">
                            This planner blocks SDK/bootstrap generation for this request. The diagram
                            preserves the requested route only; it does not verify support in another SDK
                            version.
                        </p>
                    )}
                    <TextAreaField
                        label={`${name} override description`}
                        rows={3}
                        maxLength={600}
                        value={settings.description}
                        onValueChange={(value) =>
                            edit((draft) => {
                                draft.tools[name].description = value;
                            })
                        }
                        error={issueFor(issues, `tools.${name}.description`)}
                        hint="Describe the actual custom behavior the host will implement."
                    />
                    <TextAreaField
                        label={`${name} override parameters (JSON)`}
                        help={<SettingHelp help={valueHelp.toolSchema} />}
                        monospace
                        spellCheck={false}
                        rows={9}
                        maxLength={12000}
                        value={settings.parameters}
                        onValueChange={(value) =>
                            edit((draft) => {
                                draft.tools[name].parameters = value;
                            })
                        }
                        error={issueFor(issues, `tools.${name}.parameters`)}
                        hint={
                            'Starter CUSTOM override schema, not a native signature. Use top-level "type": "object" and implement this contract in the host.'
                        }
                    />
                    <Notice title="Custom schema, not native parameters">
                        {toolCatalog.context.parametersSemantics}
                    </Notice>
                    <div className="hb-override-boundary">
                        <p>
                            <strong>No automatic original implementation.</strong> Your handler owns its
                            effect and authorization checks. A declaration update alone does not rebind SDK
                            handlers.
                        </p>
                        <Button
                            variant="ghost"
                            size="small"
                            onClick={() =>
                                onEvidence({
                                    kind: "topic",
                                    title: `What requesting an override of ${name} means`,
                                    detail: legacyOverride
                                        ? "The requested override is preserved for planning only. This descriptor has no verified external override route in the snapshot; catalog_search is explicitly reserved. SDK/bootstrap generation must reject the request rather than substitute a native effect. Valid planner JSON can retain the request for review."
                                        : "A verified built-in override can replace its advertised description, custom input contract, and host execution route. It does not enable a gated-off tool or inherit native effects and authorization checks. tool_search_tool has a specialized discovery protocol; declaration updates alone do not rebind SDK handlers.",
                                    sources: [
                                        "override-planning",
                                        "override-schema",
                                        "override-dispatch",
                                        "override-permissions",
                                        "sdk-live-tools",
                                    ],
                                })
                            }
                        >
                            <CircleHelp size={15} aria-hidden="true" />
                            Review the host boundary
                        </Button>
                    </div>
                </section>
            )}
            {aliases.length > 0 && (
                <section className="hb-tool-related-aliases">
                    <h5>Selection aliases mentioning this descriptor</h5>
                    <div className="hb-chip-list">
                        {aliases.map((alias) => (
                            <button
                                className="hb-diff-chip"
                                key={alias.name}
                                onClick={() => onInspectAlias(alias.name)}
                            >
                                <code>{alias.name}</code>
                                <ArrowRight size={12} aria-hidden="true" />
                            </button>
                        ))}
                    </div>
                    <p className="hb-field-hint">
                        Browse the alias definition only. This does not add tools or expand an SDK filter.
                    </p>
                </section>
            )}
        </article>
    );
}

function ToolSearchProtocol() {
    return (
        <Notice title="Verified, but specialized: tool-search overrides" tone="accent">
            <div className="hb-tool-search-protocol">
                <code>availableTools</code>
                <ArrowRight size={14} aria-hidden="true" />
                <span>Host search</span>
                <ArrowRight size={14} aria-hidden="true" />
                <code>toolReferences</code>
            </div>
            <p>
                The specialized callback searches the offered <code>availableTools</code> and identifies
                matching tools through <code>toolReferences</code>. Implement that discovery contract rather
                than returning generic tool-result text. The starter CUSTOM schema is not the full native
                request/result protocol.
            </p>
            <p>
                Model/provider, deferred-catalog, and search-setting gates still apply. This is distinct from
                the internal <code>generic_tool_search</code> branch.
            </p>
        </Notice>
    );
}
