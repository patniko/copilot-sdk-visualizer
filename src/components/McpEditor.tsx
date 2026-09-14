// Copyright (c) Microsoft Corporation. All rights reserved.
import { Network, Plus, Trash2 } from "lucide-react";
import { createMcpServer } from "../domain/plan";
import type { McpServer } from "../domain/plan";
import { issueFor, uniqueName, useEditorRowIds } from "./editor";
import type { EditorProps } from "./editor";
import { Badge, Button, EmptyState, Notice, Panel, TextField } from "./ui";

export function McpEditor(props: EditorProps) {
    const { plan, edit } = props;
    return (
        <Panel
            title="Remote MCP services"
            description="Plan HTTP connections and exact tool names. No discovery or network requests happen here."
            action={
                <Button
                    size="small"
                    disabled={plan.mcpServers.length >= 10}
                    onClick={() => {
                        const server = createMcpServer(
                            crypto.randomUUID(),
                            uniqueName(
                                "documents",
                                plan.mcpServers.map((entry) => entry.name),
                            ),
                        );
                        // Canonical names must be supplied from real discovery, never derived from the server alias.
                        for (const tool of server.tools) tool.wireName = "";
                        edit((draft) => {
                            draft.mcpServers.push(server);
                        });
                    }}
                >
                    <Plus size={15} aria-hidden="true" />
                    Add MCP server
                </Button>
            }
        >
            {plan.mcpServers.length === 0 && (
                <EmptyState icon={<Network size={23} />} title="Connect a service in your future host">
                    Define the endpoint and a reviewed tool allowlist. Credentials and service authorization
                    stay in host code.
                </EmptyState>
            )}
            <div className="hb-item-list">
                {plan.mcpServers.map((server, index) => (
                    <ServerRow key={server.id} server={server} index={index} {...props} />
                ))}
            </div>
            {plan.mcpServers.length > 0 && (
                <Notice title="A name is not an authority boundary">
                    Verify raw tool names and canonical wire names against your future runtime&apos;s
                    discovery results. Server aliases do not determine canonical names. Do not include
                    credentials in URLs.
                </Notice>
            )}
        </Panel>
    );
}

function ServerRow({ server, index, edit, issues }: EditorProps & { server: McpServer; index: number }) {
    const rows = useEditorRowIds(server.tools.length);
    function editServer(recipe: (current: McpServer) => void) {
        edit((draft) => {
            const target = draft.mcpServers.find((entry) => entry.id === server.id);
            if (target) recipe(target);
        });
    }
    return (
        <article className="hb-item-card" aria-label={`MCP server ${server.name || index + 1}`}>
            <div className="hb-item-heading">
                <span className="hb-item-title">
                    <Network size={16} aria-hidden="true" />
                    <h4>Remote service {index + 1}</h4>
                    <Badge>HTTP</Badge>
                </span>
                <Button
                    variant="ghost"
                    size="icon"
                    aria-label={`Remove MCP server ${server.name || index + 1}`}
                    onClick={() => {
                        edit((draft) => {
                            draft.mcpServers = draft.mcpServers.filter((entry) => entry.id !== server.id);
                        });
                    }}
                >
                    <Trash2 size={16} aria-hidden="true" />
                </Button>
            </div>
            <div className="hb-field-grid">
                <TextField
                    label="MCP server name"
                    value={server.name}
                    maxLength={64}
                    monospace
                    onValueChange={(value) =>
                        editServer((target) => {
                            target.name = value;
                        })
                    }
                    error={issueFor(issues, `mcpServers.${index}.name`)}
                    hint="Local declaration alias, not a tool prefix."
                />
                <TextField
                    label="MCP endpoint URL"
                    type="url"
                    value={server.url}
                    maxLength={1500}
                    spellCheck={false}
                    onValueChange={(value) =>
                        editServer((target) => {
                            target.url = value;
                        })
                    }
                    error={issueFor(issues, `mcpServers.${index}.url`)}
                    hint="The example URL is illustrative and has not been contacted."
                />
            </div>
            <fieldset className="hb-mcp-tools">
                <legend>Reviewed server tools</legend>
                {rows.ids.map((id, toolIndex) => {
                    const tool = server.tools[toolIndex];
                    if (!tool) return null;
                    return (
                        <div key={id} className="hb-mcp-tool-row">
                            <div className="hb-field-grid">
                                <TextField
                                    label="Raw server tool name"
                                    value={tool.name}
                                    monospace
                                    maxLength={64}
                                    spellCheck={false}
                                    onValueChange={(value) =>
                                        editServer((target) => {
                                            const entry = target.tools[toolIndex];
                                            if (entry) entry.name = value;
                                        })
                                    }
                                    error={issueFor(issues, `mcpServers.${index}.tools.${toolIndex}.name`)}
                                    hint="As exposed by the MCP service; no mcp: prefix."
                                />
                                <TextField
                                    label="Canonical runtime wire name"
                                    value={tool.wireName}
                                    placeholder="Enter the exact discovered name"
                                    monospace
                                    maxLength={64}
                                    spellCheck={false}
                                    onValueChange={(value) =>
                                        editServer((target) => {
                                            const entry = target.tools[toolIndex];
                                            if (entry) entry.wireName = value;
                                        })
                                    }
                                    error={issueFor(
                                        issues,
                                        `mcpServers.${index}.tools.${toolIndex}.wireName`,
                                    )}
                                    hint="Entered explicitly; not inferred from the server alias."
                                />
                            </div>
                            <Button
                                variant="ghost"
                                size="icon"
                                disabled={server.tools.length === 1}
                                aria-label={`Remove MCP tool ${tool.name || toolIndex + 1}`}
                                title={
                                    server.tools.length === 1
                                        ? "Remove the server to remove its last tool"
                                        : "Remove this tool"
                                }
                                onClick={() => {
                                    rows.removeId(toolIndex);
                                    editServer((target) => {
                                        target.tools.splice(toolIndex, 1);
                                    });
                                }}
                            >
                                <Trash2 size={15} aria-hidden="true" />
                            </Button>
                        </div>
                    );
                })}
                <Button
                    variant="ghost"
                    size="small"
                    disabled={server.tools.length >= 30}
                    onClick={() => {
                        const name = uniqueName(
                            "search",
                            server.tools.map((tool) => tool.name),
                        );
                        rows.appendId();
                        editServer((target) => {
                            target.tools.push({ name, wireName: "" });
                        });
                    }}
                >
                    <Plus size={14} aria-hidden="true" />
                    Add server tool
                </Button>
            </fieldset>
        </article>
    );
}
