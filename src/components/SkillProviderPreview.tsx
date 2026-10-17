// Copyright (c) Microsoft Corporation. All rights reserved.
import { issueFor } from "./editor";
import type { EditorProps } from "./editor";
import { SettingHelp } from "./SettingHelp";
import { toggleHelp } from "../content/setting-help";
import { Badge, ExperimentalBadge, Notice, Panel, ToggleField } from "./ui";

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

export function SkillProviderPreview({ plan, edit, issues }: Pick<EditorProps, "plan" | "edit" | "issues">) {
    const enabled = plan.context.skillProvider;
    return (
        <Panel
            title="Skill provider"
            description="Serve skills from your own service—such as a CMS or per-tenant catalog—instead of shipping folders."
        >
            <div className="hb-toggle-list">
                <ToggleField
                    label="Serve skills from a host provider"
                    description="Your host answers listSkills and readSkill for each session. Requires Skills on; pass the provider again on every resume."
                    badge={<ExperimentalBadge />}
                    help={<SettingHelp help={toggleHelp.skillProvider} enabled={enabled} />}
                    checked={enabled}
                    onCheckedChange={(checked) =>
                        edit((draft) => {
                            draft.context.skillProvider = checked;
                        })
                    }
                    error={issueFor(issues, "context.skillProvider")}
                />
            </div>
            {enabled && (
                <Notice title="Host implementation required" tone="accent">
                    The generated host fails preflight until you implement the provider. It is not persisted:
                    resuming without it removes the provider&apos;s skills. Cloud sessions do not support
                    providers.
                </Notice>
            )}
            <div className="hb-skill-catalog" aria-describedby="skill-provider-example">
                <p id="skill-provider-example" className="hb-field-hint">
                    Example descriptors a provider might return from listSkills. Illustrative only; the
                    builder does not store or serve a skill catalog.
                </p>
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
                            aria-label={`Example skill name: ${skill.name}`}
                            value={skill.name}
                            readOnly
                        />
                        <input
                            className="hb-input"
                            aria-label={`Example description for ${skill.name}`}
                            value={skill.description}
                            readOnly
                        />
                        <input
                            className="hb-input hb-mono"
                            aria-label={`Example argument hint for ${skill.name}`}
                            value={skill.argumentHint}
                            placeholder="Optional"
                            readOnly
                        />
                        <label className="hb-skill-check">
                            <input type="checkbox" checked={skill.userInvocable} readOnly disabled />
                            <span className="hb-sr-only">User can invoke {skill.name}</span>
                        </label>
                        <label className="hb-skill-check">
                            <input type="checkbox" checked={skill.modelInvocable} readOnly disabled />
                            <span className="hb-sr-only">Model can invoke {skill.name}</span>
                        </label>
                    </div>
                ))}
            </div>
            <p className="hb-coming-soon-limits">
                <Badge>Runtime limits</Badge> Up to 1,024 skills and 1 MiB of catalog metadata; each SKILL.md
                is text-only, up to 1 MiB, with no related files or assets. Each call must finish within 30
                seconds.
            </p>
        </Panel>
    );
}
