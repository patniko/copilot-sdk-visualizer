// Copyright (c) Microsoft Corporation. All rights reserved.
import { LibraryBig, Plus } from "lucide-react";
import { reference } from "../content/reference";
import type { Evidence } from "./editor";
import { Badge, Button, Panel, ToggleField } from "./ui";

const sampleSkills = [
    {
        name: "refund-policy",
        description: "Explain the tenant's refund rules and cite the governing policy.",
        userInvocable: true,
        modelInvocable: true,
        argumentHint: "<order id>",
    },
    {
        name: "escalation-playbook",
        description: "Steps for handing a conversation to a human support agent.",
        userInvocable: true,
        modelInvocable: false,
        argumentHint: "",
    },
];

const limits = [
    "The runtime lists the catalog first and fetches each full SKILL.md only when a skill is used.",
    "Up to 1,024 skills and 1 MiB of catalog metadata; each SKILL.md is text-only, up to 1 MiB, with no related files or assets.",
    "The provider is bound per session and never persisted. Cloud, relay, and handoff sessions will not support it.",
];

export function SkillProviderPreview({ onEvidence }: { onEvidence: (evidence: Evidence) => void }) {
    const gap = reference.gaps.find((entry) => entry.id === "gap-skills");
    return (
        <Panel
            title="Skill provider"
            description="Serve skills from your own service—such as a CMS or per-tenant catalog—instead of shipping folders."
            action={<Badge accent>Coming soon</Badge>}
            className="hb-coming-soon"
        >
            <p className="hb-coming-soon-note">
                The runtime already supports this, but the SDKs don&apos;t expose it yet. These controls
                preview the options and are not saved or exported.
            </p>
            <fieldset className="hb-coming-soon-fields" disabled aria-describedby="skill-provider-status">
                <legend className="hb-sr-only">Skill provider preview (not available yet)</legend>
                <span id="skill-provider-status" className="hb-sr-only">
                    Not available in the SDK yet.
                </span>
                <div className="hb-toggle-list">
                    <ToggleField
                        label="Serve skills from a host provider"
                        description="Your host answers skill catalog and content requests for each session."
                        help={null}
                        checked={false}
                        onCheckedChange={() => undefined}
                    />
                </div>
                <div className="hb-skill-catalog">
                    <div className="hb-skill-catalog-head" aria-hidden="true">
                        <span>Name</span>
                        <span>Description</span>
                        <span>Argument hint</span>
                        <span>User can invoke</span>
                        <span>Model can invoke</span>
                    </div>
                    {sampleSkills.map((skill) => (
                        <div className="hb-skill-catalog-row" key={skill.name}>
                            <input
                                className="hb-input hb-mono"
                                aria-label="Skill name"
                                value={skill.name}
                                readOnly
                            />
                            <input
                                className="hb-input"
                                aria-label="Skill description"
                                value={skill.description}
                                readOnly
                            />
                            <input
                                className="hb-input hb-mono"
                                aria-label="Argument hint"
                                value={skill.argumentHint}
                                placeholder="Optional"
                                readOnly
                            />
                            <label className="hb-skill-check">
                                <input type="checkbox" checked={skill.userInvocable} readOnly />
                                <span className="hb-sr-only">User can invoke</span>
                            </label>
                            <label className="hb-skill-check">
                                <input type="checkbox" checked={skill.modelInvocable} readOnly />
                                <span className="hb-sr-only">Model can invoke</span>
                            </label>
                        </div>
                    ))}
                    <Button size="small" className="hb-skill-catalog-add">
                        <Plus size={14} aria-hidden="true" />
                        Add skill
                    </Button>
                </div>
            </fieldset>
            <ul className="hb-coming-soon-limits">
                {limits.map((limit) => (
                    <li key={limit}>{limit}</li>
                ))}
            </ul>
            <p className="hb-field-hint">
                Today, have your host write reviewed SKILL.md folders to disk and list them in Skill
                directories above.
                {gap && (
                    <>
                        {" "}
                        <Button
                            variant="ghost"
                            size="small"
                            onClick={() => onEvidence({ kind: "gap", value: gap })}
                        >
                            <LibraryBig size={14} aria-hidden="true" />
                            Why it isn&apos;t available yet
                        </Button>
                    </>
                )}
            </p>
        </Panel>
    );
}
