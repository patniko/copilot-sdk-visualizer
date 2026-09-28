// Copyright (c) Microsoft Corporation. All rights reserved.
import { useId, useState } from "react";
import { BookOpen, Search } from "lucide-react";
import { previewPromptSection, promptReference } from "../content/prompts";
import type { BuiltinPromptReference } from "../content/prompts";
import { inputsInReference, promptInputs } from "../content/prompt-inputs";
import type { PromptInput } from "../content/prompt-inputs";
import type { HarnessPlan, SectionName } from "../domain/plan";
import { Badge, Button, EmptyState, Notice, Panel, SelectField, TextField } from "./ui";
import "../prompt-reference.css";

interface BuiltinPromptProps {
    plan: HarnessPlan;
    sectionName?: SectionName;
    onUseLiteral?: (section: BuiltinPromptReference) => void;
}

const kindLabels = {
    literal: "Literal generic default",
    template: "Unresolved source template",
    fragment: "Captured source fragment",
    dynamic: "Runtime-dependent content",
    assembly: "Assembled section group",
};

export function BuiltinPromptPanel({ sectionName, ...props }: BuiltinPromptProps) {
    if (!sectionName) return <BuiltinPromptBrowser {...props} />;
    const section = promptReference.sections.find((entry) => entry.id === sectionName);
    if (!section)
        return (
            <Notice tone="error" title="Built-in reference unavailable">
                The snapshot does not contain the {sectionName} section.
            </Notice>
        );
    return (
        <details className="hb-inline-prompt-reference">
            <summary>
                <BookOpen size={15} aria-hidden="true" />
                <span>
                    Built-in reference: <code>{section.id}</code>
                </span>
                <Badge>{section.kind}</Badge>
            </summary>
            <PromptReferencePreview section={section} {...props} />
        </details>
    );
}

function BuiltinPromptBrowser({ plan, onUseLiteral }: Omit<BuiltinPromptProps, "sectionName">) {
    const [query, setQuery] = useState("");
    const [selected, setSelected] = useState<SectionName>(() => plan.prompt.sections[0]?.name ?? "preamble");
    const search = query.trim().toLowerCase();
    const sections = promptReference.sections.filter((section) =>
        `${section.id} ${section.title} ${section.kind} ${section.note} ${section.content}`
            .toLowerCase()
            .includes(search),
    );
    const active = sections.find((section) => section.id === selected) ?? sections[0];
    return (
        <Panel
            title="See the built-in prompt reference"
            description={promptReference.context}
            action={<Badge>{promptReference.sections.length} SDK sections</Badge>}
        >
            <div className="hb-prompt-reference-filters">
                <div className="hb-search-field">
                    <Search size={16} aria-hidden="true" />
                    <TextField
                        label="Search built-in prompt reference"
                        value={query}
                        onValueChange={setQuery}
                        type="search"
                        placeholder="Find a section, phrase, or source kind"
                    />
                </div>
                {active && (
                    <SelectField
                        label="Built-in prompt section"
                        value={active.id}
                        options={sections.map((section) => ({
                            value: section.id,
                            label: `${section.id} - ${section.title}`,
                        }))}
                        onValueChange={setSelected}
                    />
                )}
            </div>
            {active ? (
                <PromptReferencePreview plan={plan} section={active} onUseLiteral={onUseLiteral} />
            ) : (
                <EmptyState icon={<Search size={22} />} title="No matching prompt sections">
                    Change the search to browse the captured repository text.
                </EmptyState>
            )}
            <p className="hb-field-hint">
                The runtime-input labels are explanations, not SDK macros to paste into your prompt. Generic
                tone can differ by model. This browser shows repository material only, never a live
                assistant&apos;s resolved instructions.
            </p>
            <AllRuntimeInputs />
        </Panel>
    );
}

function PromptReferencePreview({
    plan,
    section,
    onUseLiteral,
}: {
    plan: HarnessPlan;
    section: BuiltinPromptReference;
    onUseLiteral?: (section: BuiltinPromptReference) => void;
}) {
    const id = useId();
    const preview = previewPromptSection(plan, section.id);
    const inputs = inputsInReference(section.content);
    const notInherited = plan.prompt.mode === "replace";
    const canAddSection =
        plan.prompt.sections.length < promptReference.sections.length ||
        plan.prompt.sections.some((entry) => entry.name === section.id);
    return (
        <div className="hb-prompt-reference-preview">
            <div className="hb-prompt-reference-heading">
                <div>
                    <strong>{section.title}</strong>
                    <span className="hb-chip-list">
                        <Badge>{section.kind}</Badge>
                        <span>{kindLabels[section.kind]}</span>
                    </span>
                </div>
            </div>
            <p className="hb-field-hint">{section.note}</p>
            {section.members && section.members.length > 0 && (
                <p className="hb-field-hint">
                    Addressable group members:{" "}
                    {section.members.map((member) => (
                        <code key={member} className="hb-prompt-member">
                            {member}
                        </code>
                    ))}
                </p>
            )}
            <div className="hb-prompt-comparison">
                <div className="hb-prompt-comparison-pane">
                    <label htmlFor={`${id}-source`}>Built-in reference with explained runtime regions</label>
                    <textarea
                        id={`${id}-source`}
                        className="hb-prompt-source-text"
                        readOnly
                        spellCheck={false}
                        value={preview.before}
                        aria-label={`${section.id} captured source reference`}
                    />
                </div>
                {inputs.length > 0 && (
                    <section className="hb-runtime-inputs" aria-label={`${section.id} runtime inputs`}>
                        <h4>What fills these regions?</h4>
                        <p className="hb-field-hint">
                            These are values or instruction fragments the runtime supplies when assembling a
                            session. They are not editable SDK macro variables.
                        </p>
                        {inputs.map((input) => (
                            <RuntimeInputEntry key={input.id} input={input} />
                        ))}
                    </section>
                )}
                <div className="hb-prompt-comparison-pane">
                    <div className="hb-prompt-preview-label">
                        {notInherited ? (
                            <span>Section-local edit preview</span>
                        ) : (
                            <label htmlFor={`${id}-preview`}>Section-local edit preview</label>
                        )}
                        <Badge accent>{preview.status}</Badge>
                    </div>
                    {notInherited ? (
                        <div className="hb-prompt-not-inherited">
                            <BookOpen size={21} aria-hidden="true" />
                            <strong>Built-ins are not inherited</strong>
                            <p>{preview.note}</p>
                            <p>
                                The captured source remains visible for comparison; it is not appended to your
                                replacement.
                            </p>
                        </div>
                    ) : (
                        <>
                            <textarea
                                id={`${id}-preview`}
                                className="hb-prompt-source-text"
                                readOnly
                                spellCheck={false}
                                value={preview.after}
                                aria-label={`${section.id} section-local edit preview`}
                            />
                            {!preview.after && (
                                <p className="hb-field-hint">This section-local preview has no content.</p>
                            )}
                        </>
                    )}
                </div>
            </div>
            {!notInherited && (
                <Notice title="Section-local, not a fully resolved prompt">
                    <p>{preview.note}</p>
                    <p>
                        Additional system instructions remain in the main editor. This preview does not replay
                        full prompt ordering or resolve runtime inputs.
                    </p>
                </Notice>
            )}
            {section.kind === "literal" && plan.prompt.mode === "customize" && onUseLiteral && (
                <div className="hb-literal-reference-action">
                    <Button
                        size="small"
                        disabled={!canAddSection}
                        onClick={() => onUseLiteral(section)}
                        aria-label={`Replace ${section.id} with this literal reference`}
                    >
                        Replace with this literal reference
                    </Button>
                    <p>
                        Sets only <code>{section.id}</code> to a static Replace action. Undo restores the
                        previous section edit.
                    </p>
                </div>
            )}
        </div>
    );
}

function RuntimeInputEntry({ input }: { input: PromptInput }) {
    return (
        <details className="hb-runtime-input">
            <summary>{input.label}</summary>
            <p>{input.meaning}</p>
            <dl>
                <div>
                    <dt>Supplied by</dt>
                    <dd>{input.suppliedBy}</dd>
                </div>
                <div>
                    <dt>Example, not live content</dt>
                    <dd>{input.example}</dd>
                </div>
                <div>
                    <dt>When it appears</dt>
                    <dd>{input.condition}</dd>
                </div>
            </dl>
        </details>
    );
}

function AllRuntimeInputs() {
    const [query, setQuery] = useState("");
    const normalized = query.trim().toLowerCase();
    const inputs = promptInputs.filter((input) =>
        `${input.id} ${input.label} ${input.meaning} ${input.suppliedBy}`.toLowerCase().includes(normalized),
    );
    return (
        <details className="hb-runtime-input-catalog">
            <summary>All {promptInputs.length} explained runtime inputs</summary>
            <Notice title="You do not need to learn a macro language">
                The earlier braced labels were reference placeholders. The builder now names each
                runtime-supplied region and explains its source, meaning, and conditions. These labels are not
                instructions for interpolating strings in the SDK.
            </Notice>
            <TextField
                label="Search runtime inputs"
                value={query}
                onValueChange={setQuery}
                type="search"
                placeholder="Find sandbox, model, tools, memory, or host context"
            />
            <p className="hb-field-hint" role="status">
                {inputs.length} of {promptInputs.length} runtime inputs
            </p>
            {inputs.map((input) => (
                <RuntimeInputEntry key={input.id} input={input} />
            ))}
            {inputs.length === 0 && <p>No matching runtime inputs.</p>}
        </details>
    );
}
