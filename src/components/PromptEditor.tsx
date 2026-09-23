// Copyright (c) Microsoft Corporation. All rights reserved.
import { BookOpen, Plus, Trash2 } from "lucide-react";
import { SECTION_NAMES } from "../domain/plan";
import type { BuiltinPromptReference } from "../content/prompts";
import { BuiltinPromptPanel } from "./BuiltinPromptPanel";
import { issueFor, useEditorRowIds } from "./editor";
import type { EditorProps } from "./editor";
import { Badge, Button, ChoiceField, EmptyState, Notice, Panel, SelectField, TextAreaField } from "./ui";
import { SettingHelp } from "./SettingHelp";
import { valueHelp } from "../content/setting-help";

export function PromptEditor({ plan, edit, issues, onEvidence }: EditorProps) {
    const rows = useEditorRowIds(plan.prompt.sections.length);
    const nextSection = SECTION_NAMES.find(
        (name) => !plan.prompt.sections.some((section) => section.name === name),
    );

    function useLiteralReference(reference: BuiltinPromptReference) {
        if (reference.kind !== "literal" || plan.prompt.mode !== "customize") return;
        if (!plan.prompt.sections.some((section) => section.name === reference.id)) rows.appendId();
        edit((draft) => {
            const section = draft.prompt.sections.find((entry) => entry.name === reference.id);
            if (section) {
                section.action = "replace";
                section.content = reference.content;
            } else {
                draft.prompt.sections.push({
                    name: reference.id,
                    action: "replace",
                    content: reference.content,
                });
            }
        });
    }

    return (
        <div className="hb-editor-stack">
            <Panel
                title="How should your prompt relate to the foundation?"
                description="Choose one authoring model. Permissions and host policy remain separate."
                action={<Badge>Session composition</Badge>}
            >
                <ChoiceField
                    label="System message mode"
                    help={<SettingHelp help={valueHelp.promptMode} value={plan.prompt.mode} />}
                    value={plan.prompt.mode}
                    options={[
                        {
                            value: "append",
                            label: "Append",
                            description: "Keep the foundation and add guidance",
                        },
                        {
                            value: "replace",
                            label: "Replace",
                            description: "Write the complete system prompt",
                        },
                        {
                            value: "customize",
                            label: "Customize sections",
                            description: "Change specific built-in sections",
                        },
                    ]}
                    onValueChange={(value) =>
                        edit((draft) => {
                            draft.prompt.mode = value;
                        })
                    }
                />
            </Panel>
            {plan.prompt.mode === "append" && (
                <Panel
                    title="Add guidance to the foundation"
                    description="These instructions are added after the built-in system prompt."
                >
                    <TextAreaField
                        label="Instructions to append"
                        value={plan.prompt.content}
                        onValueChange={(value) =>
                            edit((draft) => {
                                draft.prompt.content = value;
                            })
                        }
                        rows={8}
                        maxLength={12000}
                        error={issueFor(issues, "prompt.content")}
                        hint="Use this for product-specific behavior and task guidance that should coexist with the foundation."
                    />
                </Panel>
            )}
            {plan.prompt.mode === "replace" && (
                <Panel
                    title="Write the complete system prompt"
                    description="This is the full message the model receives instead of the built-in foundation."
                >
                    <Notice title="Replace means full ownership" tone="accent">
                        The foundation&apos;s identity, operating guidance, and prompt-level boundaries are
                        omitted. Include every instruction the model needs here; enforced permissions still
                        remain in your host and services.
                    </Notice>
                    <TextAreaField
                        label="Complete system prompt"
                        value={plan.prompt.content}
                        onValueChange={(value) =>
                            edit((draft) => {
                                draft.prompt.content = value;
                            })
                        }
                        rows={14}
                        maxLength={12000}
                        error={issueFor(issues, "prompt.content")}
                        hint="This single field is the actual replacement—not an addition to the foundation."
                    />
                </Panel>
            )}
            {plan.prompt.mode !== "customize" && (
                <details className="hb-prompt-reference-disclosure">
                    <summary>
                        <BookOpen size={16} aria-hidden="true" />
                        <span>
                            Optional reference: inspect the built-in prompt
                            <small>
                                {plan.prompt.mode === "replace"
                                    ? "Compare what your complete prompt replaces"
                                    : "See the foundation your instructions extend"}
                            </small>
                        </span>
                    </summary>
                    <BuiltinPromptPanel plan={plan} onUseLiteral={useLiteralReference} />
                </details>
            )}
            {plan.prompt.mode === "customize" && (
                <>
                    <Panel
                        title="Customize named prompt sections"
                        description="Keep the foundation, then replace, add to, remove, or preserve only the sections you select."
                        action={
                            <Button
                                size="small"
                                disabled={!nextSection}
                                onClick={() => {
                                    if (!nextSection) return;
                                    rows.appendId();
                                    edit((draft) => {
                                        draft.prompt.sections.push({
                                            name: nextSection,
                                            action: "append",
                                            content: "",
                                        });
                                    });
                                }}
                            >
                                <Plus size={15} aria-hidden="true" />
                                Add section
                            </Button>
                        }
                    >
                        {plan.prompt.sections.length === 0 && (
                            <EmptyState
                                icon={<BookOpen size={23} />}
                                title="Choose the section you want to change"
                            >
                                Add a named section, choose an action, then supply content only when that
                                action needs it.
                            </EmptyState>
                        )}
                        <div className="hb-item-list">
                            {rows.ids.map((id, index) => {
                                const section = plan.prompt.sections[index];
                                if (!section) return null;
                                const contentActive =
                                    section.action !== "remove" && section.action !== "preserve";
                                return (
                                    <article className="hb-item-card" key={id}>
                                        <div className="hb-item-heading">
                                            <h4>Section {index + 1}</h4>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                aria-label={`Remove ${section.name} section`}
                                                onClick={() => {
                                                    rows.removeId(index);
                                                    edit((draft) => {
                                                        draft.prompt.sections.splice(index, 1);
                                                    });
                                                }}
                                            >
                                                <Trash2 size={16} aria-hidden="true" />
                                            </Button>
                                        </div>
                                        <div className="hb-field-grid">
                                            <SelectField
                                                label="Section name"
                                                help={
                                                    <SettingHelp
                                                        help={valueHelp.sectionName}
                                                        value={section.name}
                                                    />
                                                }
                                                value={section.name}
                                                options={SECTION_NAMES.map((name) => ({
                                                    value: name,
                                                    label: name,
                                                    disabled: plan.prompt.sections.some(
                                                        (other, row) => row !== index && other.name === name,
                                                    ),
                                                }))}
                                                error={issueFor(issues, `prompt.sections.${index}.name`)}
                                                onValueChange={(value) =>
                                                    edit((draft) => {
                                                        const target = draft.prompt.sections[index];
                                                        if (target) target.name = value;
                                                    })
                                                }
                                            />
                                            <SelectField
                                                label="Section action"
                                                help={
                                                    <SettingHelp
                                                        help={valueHelp.sectionAction}
                                                        value={section.action}
                                                    />
                                                }
                                                value={section.action}
                                                options={[
                                                    { value: "replace", label: "Replace this section" },
                                                    { value: "append", label: "Append to this section" },
                                                    { value: "prepend", label: "Prepend to this section" },
                                                    { value: "remove", label: "Remove this section" },
                                                    { value: "preserve", label: "Preserve this section" },
                                                ]}
                                                onValueChange={(value) =>
                                                    edit((draft) => {
                                                        const target = draft.prompt.sections[index];
                                                        if (target) target.action = value;
                                                    })
                                                }
                                            />
                                        </div>
                                        <BuiltinPromptPanel
                                            plan={plan}
                                            sectionName={section.name}
                                            onUseLiteral={useLiteralReference}
                                        />
                                        {contentActive ? (
                                            <TextAreaField
                                                label={
                                                    section.action === "replace"
                                                        ? "Replacement section content"
                                                        : "Section content"
                                                }
                                                value={section.content}
                                                rows={5}
                                                maxLength={12000}
                                                error={issueFor(issues, `prompt.sections.${index}.content`)}
                                                onValueChange={(value) =>
                                                    edit((draft) => {
                                                        const target = draft.prompt.sections[index];
                                                        if (target) target.content = value;
                                                    })
                                                }
                                            />
                                        ) : (
                                            <p className="hb-field-hint">
                                                {section.action === "remove"
                                                    ? "This section will be removed from the prompt."
                                                    : "The foundation's section is preserved."}{" "}
                                                Any drafted content is retained here, but omitted from this
                                                action in the SDK sketch.
                                            </p>
                                        )}
                                    </article>
                                );
                            })}
                        </div>
                    </Panel>
                    <Panel
                        title="Optional global instructions"
                        description="Use this only for guidance that applies across the customized prompt, not for replacing a named section."
                    >
                        <TextAreaField
                            label="Global customize instructions"
                            value={plan.prompt.content}
                            onValueChange={(value) =>
                                edit((draft) => {
                                    draft.prompt.content = value;
                                })
                            }
                            rows={5}
                            maxLength={12000}
                            error={issueFor(issues, "prompt.content")}
                            hint="Leave this blank when the named section changes fully describe your customization."
                        />
                    </Panel>
                </>
            )}
            <Notice title="Instructions are not permissions" tone="accent">
                Prompt replacement does not remove enforced host or organization policy. Keep authorization in
                your permission handler and downstream services.
                <Button
                    variant="ghost"
                    size="small"
                    onClick={() =>
                        onEvidence({
                            kind: "topic",
                            title: "Prompt ownership and enforced policy",
                            detail: "Append, replace, and customize change the system message. They do not replace enforced authorization or managed policy. Your host still owns permission decisions and the authority of every effectful service.",
                            sources: ["sdk-prompts", "sdk-permissions", "sdk-managed-lifetime"],
                        })
                    }
                >
                    Read the boundary
                    <BookOpen size={14} aria-hidden="true" />
                </Button>
            </Notice>
        </div>
    );
}
