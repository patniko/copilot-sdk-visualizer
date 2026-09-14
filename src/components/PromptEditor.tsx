// Copyright (c) Microsoft Corporation. All rights reserved.
import { BookOpen, Plus, Trash2 } from "lucide-react";
import { SECTION_NAMES } from "../domain/plan";
import { issueFor, useEditorRowIds } from "./editor";
import type { EditorProps } from "./editor";
import { Badge, Button, ChoiceField, EmptyState, Notice, Panel, SelectField, TextAreaField } from "./ui";

export function PromptEditor({ plan, edit, issues, onEvidence }: EditorProps) {
    const rows = useEditorRowIds(plan.prompt.sections.length);
    const nextSection = SECTION_NAMES.find(
        (name) => !plan.prompt.sections.some((section) => section.name === name),
    );
    return (
        <div className="hb-editor-stack">
            <Panel
                title="Choose your level of prompt ownership"
                description="Change the guidance, not the enforced authorization boundary."
                action={<Badge>Session composition</Badge>}
            >
                <ChoiceField
                    label="System message mode"
                    value={plan.prompt.mode}
                    options={[
                        { value: "append", label: "Append", description: "Extend the foundation" },
                        { value: "replace", label: "Replace", description: "Own the full prompt" },
                        { value: "customize", label: "Customize", description: "Edit named sections" },
                    ]}
                    onValueChange={(value) =>
                        edit((draft) => {
                            draft.prompt.mode = value;
                        })
                    }
                />
                <TextAreaField
                    label={
                        plan.prompt.mode === "replace"
                            ? "Replacement system prompt"
                            : "Additional system instructions"
                    }
                    value={plan.prompt.content}
                    onValueChange={(value) =>
                        edit((draft) => {
                            draft.prompt.content = value;
                        })
                    }
                    rows={9}
                    maxLength={12000}
                    error={issueFor(issues, "prompt.content")}
                    hint={
                        plan.prompt.mode === "replace"
                            ? "The foundation's prompt guidance is not retained. Supply operating rules and evaluate the resulting behavior."
                            : "Write task-specific guidance. Existing content is retained when switching modes so you can compare approaches."
                    }
                />
            </Panel>
            {plan.prompt.mode === "customize" && (
                <Panel
                    title="Named prompt sections"
                    description="A static, explicit action for each section. Unlisted sections are not customized here."
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
                            title="Keep the foundation, edit the section"
                        >
                            Add a named section to replace, append, prepend, remove, or explicitly preserve
                            its guidance.
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
                                            value={section.action}
                                            options={[
                                                { value: "replace", label: "Replace" },
                                                { value: "append", label: "Append" },
                                                { value: "prepend", label: "Prepend" },
                                                { value: "remove", label: "Remove" },
                                                { value: "preserve", label: "Preserve" },
                                            ]}
                                            onValueChange={(value) =>
                                                edit((draft) => {
                                                    const target = draft.prompt.sections[index];
                                                    if (target) target.action = value;
                                                })
                                            }
                                        />
                                    </div>
                                    {contentActive ? (
                                        <TextAreaField
                                            label="Section content"
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
                                            Any drafted content is retained here, but omitted from this action
                                            in the SDK sketch.
                                        </p>
                                    )}
                                </article>
                            );
                        })}
                    </div>
                </Panel>
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
