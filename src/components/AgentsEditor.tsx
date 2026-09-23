// Copyright (c) Microsoft Corporation. All rights reserved.
import { Plus, Trash2, Users } from "lucide-react";
import { createAgent } from "../domain/plan";
import { SettingHelp } from "./SettingHelp";
import { valueHelp } from "../content/setting-help";
import type { Agent } from "../domain/plan";
import { issueFor, uniqueName } from "./editor";
import type { EditorProps } from "./editor";
import {
    Badge,
    Button,
    EmptyState,
    LineListField,
    Notice,
    Panel,
    SelectField,
    TextAreaField,
    TextField,
} from "./ui";

export function AgentsEditor(props: EditorProps) {
    const { plan, edit, issues } = props;
    return (
        <div className="hb-editor-stack">
            <Panel
                title="Specialists with a defined scope"
                description="Compose named agents from prompts, tool lists, and optional model preferences."
                action={
                    <Button
                        size="small"
                        disabled={plan.agents.length >= 12}
                        onClick={() => {
                            const agent = createAgent(
                                crypto.randomUUID(),
                                uniqueName(
                                    "reviewer",
                                    plan.agents.map((entry) => entry.name),
                                ),
                            );
                            edit((draft) => {
                                draft.agents.push(agent);
                            });
                        }}
                    >
                        <Plus size={15} aria-hidden="true" />
                        Add agent
                    </Button>
                }
            >
                {plan.agents.length === 0 && (
                    <EmptyState icon={<Users size={24} />} title="One agent can be enough">
                        Add a specialist when your workload benefits from a distinct role, not simply to add
                        more agents.
                    </EmptyState>
                )}
                <div className="hb-item-list">
                    {plan.agents.map((agent, index) => (
                        <AgentRow key={agent.id} agent={agent} index={index} {...props} />
                    ))}
                </div>
            </Panel>
            <Panel
                title="Root agent composition"
                description="Select the primary role and define exclusions at that scope only."
                action={<Badge>Root scope</Badge>}
            >
                <SelectField
                    label="Selected root agent"
                    help={
                        <SettingHelp
                            help={valueHelp.selectedAgent}
                            value={plan.selectedAgent || "Default agent"}
                        />
                    }
                    value={plan.selectedAgent}
                    options={[
                        { id: "default", value: "", label: "Default agent" },
                        ...plan.agents.map((agent) => ({
                            id: agent.id,
                            value: agent.name,
                            label: agent.name || "(unnamed agent)",
                            disabled: !agent.name,
                        })),
                    ]}
                    onValueChange={(value) =>
                        edit((draft) => {
                            draft.selectedAgent = value;
                        })
                    }
                    error={issueFor(issues, "selectedAgent")}
                />
                <LineListField
                    label="Root-only excluded tools"
                    help={
                        <SettingHelp
                            help={valueHelp.rootExclusions}
                            value={`${plan.rootExcludedTools.length} exclusions`}
                        />
                    }
                    values={plan.rootExcludedTools}
                    onValuesChange={(values) =>
                        edit((draft) => {
                            draft.rootExcludedTools = values;
                        })
                    }
                    monospace
                    rows={4}
                    placeholder="One tool name per line"
                    hint="These defaultAgent exclusions hide tools from the primary agent while retaining them for subagents."
                    error={issueFor(issues, "rootExcludedTools")}
                />
                <Notice title="Root exclusions are not child exclusions">
                    This is not a top-level-only tool marker or an identity boundary. Use each
                    specialist&apos;s allowed tool names deliberately, and keep authorization in the host.
                </Notice>
            </Panel>
        </div>
    );
}

function AgentRow({ agent, index, edit, issues }: EditorProps & { agent: Agent; index: number }) {
    function editAgent(recipe: (current: Agent) => void) {
        edit((draft) => {
            const target = draft.agents.find((entry) => entry.id === agent.id);
            if (target) recipe(target);
        });
    }
    return (
        <article className="hb-item-card" aria-label={`Custom agent ${agent.name || index + 1}`}>
            <div className="hb-item-heading">
                <span className="hb-item-title">
                    <Users size={17} aria-hidden="true" />
                    <h4>Specialist {index + 1}</h4>
                </span>
                <Button
                    variant="ghost"
                    size="icon"
                    aria-label={`Remove agent ${agent.name || index + 1}`}
                    onClick={() => {
                        edit((draft) => {
                            draft.agents = draft.agents.filter((entry) => entry.id !== agent.id);
                            if (draft.selectedAgent === agent.name) draft.selectedAgent = "";
                        });
                    }}
                >
                    <Trash2 size={16} aria-hidden="true" />
                </Button>
            </div>
            <div className="hb-field-grid hb-agent-identity-grid">
                <TextField
                    label="Agent name"
                    value={agent.name}
                    monospace
                    maxLength={64}
                    onValueChange={(value) =>
                        edit((draft) => {
                            const target = draft.agents.find((entry) => entry.id === agent.id);
                            if (!target) return;
                            if (target.name && draft.selectedAgent === target.name)
                                draft.selectedAgent = value;
                            target.name = value;
                        })
                    }
                    error={issueFor(issues, `agents.${index}.name`)}
                />
                <TextField
                    label="Agent model preference"
                    help={
                        <SettingHelp
                            help={valueHelp.agentModel}
                            value={agent.model || "Use session selection"}
                        />
                    }
                    value={agent.model}
                    maxLength={120}
                    placeholder="Optional; use session selection"
                    onValueChange={(value) =>
                        editAgent((target) => {
                            target.model = value;
                        })
                    }
                    error={issueFor(issues, `agents.${index}.model`)}
                    hint="A preference can fall back. It is not a hard model allowlist."
                />
            </div>
            <TextAreaField
                label="Agent description"
                value={agent.description}
                rows={2}
                maxLength={600}
                onValueChange={(value) =>
                    editAgent((target) => {
                        target.description = value;
                    })
                }
                error={issueFor(issues, `agents.${index}.description`)}
            />
            <TextAreaField
                label="Agent prompt"
                value={agent.prompt}
                rows={6}
                maxLength={8000}
                onValueChange={(value) =>
                    editAgent((target) => {
                        target.prompt = value;
                    })
                }
                error={issueFor(issues, `agents.${index}.prompt`)}
            />
            <LineListField
                label="Agent allowed tool names"
                help={<SettingHelp help={valueHelp.agentTools} value={`${agent.tools.length} names`} />}
                values={agent.tools}
                onValuesChange={(values) =>
                    editAgent((target) => {
                        target.tools = values;
                    })
                }
                monospace
                rows={3}
                placeholder="view"
                hint="One unqualified name per line. This does not grant tools missing from the session or establish service authority."
                error={issueFor(issues, `agents.${index}.tools`)}
            />
        </article>
    );
}
