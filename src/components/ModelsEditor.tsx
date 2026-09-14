// Copyright (c) Microsoft Corporation. All rights reserved.
import { KeyRound, SlidersHorizontal } from "lucide-react";
import { issueFor } from "./editor";
import type { EditorProps } from "./editor";
import { Badge, Button, ChoiceField, Notice, Panel, SelectField, TextField } from "./ui";
import { SettingHelp } from "./SettingHelp";
import { valueHelp } from "../content/setting-help";

const endpointExamples = {
    openai: "https://api.openai.com/v1",
    azure: "https://your-resource.openai.azure.com",
    anthropic: "https://api.anthropic.com",
};

export function ModelsEditor({ plan, edit, issues }: EditorProps) {
    const byok = plan.model.provider !== "copilot";
    const endpointExample = plan.model.provider === "copilot" ? "" : endpointExamples[plan.model.provider];
    return (
        <div className="hb-editor-stack">
            <Panel
                title="Provider and model"
                description="A host-owned endpoint and model choice, not a live model catalog."
                action={<SlidersHorizontal size={19} aria-hidden="true" />}
            >
                <div className="hb-field-grid">
                    <SelectField
                        label="Model provider"
                        help={<SettingHelp help={valueHelp.modelProvider} value={plan.model.provider} />}
                        value={plan.model.provider}
                        options={[
                            { value: "copilot", label: "GitHub Copilot" },
                            { value: "openai", label: "OpenAI" },
                            { value: "azure", label: "Azure OpenAI" },
                            { value: "anthropic", label: "Anthropic" },
                        ]}
                        onValueChange={(value) =>
                            edit((draft) => {
                                draft.model.provider = value;
                            })
                        }
                    />
                    <TextField
                        label="Model ID"
                        help={
                            <SettingHelp
                                help={valueHelp.modelId}
                                value={plan.model.id.trim() || "Host supplied"}
                            />
                        }
                        value={plan.model.id}
                        maxLength={120}
                        placeholder="Supplied by your host"
                        onValueChange={(value) =>
                            edit((draft) => {
                                draft.model.id = value;
                            })
                        }
                        error={issueFor(issues, "model.id")}
                        hint="Leave blank to require host.model in the SDK sketch."
                    />
                </div>
                {byok && (
                    <div className="hb-editor-stack hb-tight-stack">
                        <TextField
                            label="Provider endpoint"
                            help={<SettingHelp help={valueHelp.providerEndpoint} />}
                            type="url"
                            value={plan.model.endpoint}
                            maxLength={1500}
                            placeholder={endpointExample}
                            spellCheck={false}
                            onValueChange={(value) =>
                                edit((draft) => {
                                    draft.model.endpoint = value;
                                })
                            }
                            error={issueFor(issues, "model.endpoint")}
                            hint="An editable HTTP(S) endpoint. No URL credentials, API keys, or secret query parameters."
                        />
                        <div className="hb-example-row">
                            <span>Endpoint examples are illustrative, not verified connections.</span>
                            <Button
                                variant="ghost"
                                size="small"
                                onClick={() =>
                                    edit((draft) => {
                                        draft.model.endpoint = endpointExample;
                                    })
                                }
                            >
                                Use example
                            </Button>
                        </div>
                        {(plan.model.provider === "openai" || plan.model.provider === "azure") && (
                            <ChoiceField
                                label="Provider wire API"
                                help={<SettingHelp help={valueHelp.wireApi} value={plan.model.wireApi} />}
                                value={plan.model.wireApi}
                                options={[
                                    { value: "responses", label: "Responses" },
                                    { value: "completions", label: "Chat completions" },
                                ]}
                                onValueChange={(value) =>
                                    edit((draft) => {
                                        draft.model.wireApi = value;
                                    })
                                }
                                hint="Choose the wire contract supported by your actual endpoint."
                            />
                        )}
                    </div>
                )}
                {!byok && issueFor(issues, "model.endpoint") && (
                    <TextField
                        label="Retained provider endpoint"
                        help={<SettingHelp help={valueHelp.providerEndpoint} />}
                        value={plan.model.endpoint}
                        maxLength={1500}
                        onValueChange={(value) =>
                            edit((draft) => {
                                draft.model.endpoint = value;
                            })
                        }
                        error={issueFor(issues, "model.endpoint")}
                        hint="This endpoint is unused by GitHub Copilot. Clear it or correct it so the reversible plan does not retain an invalid or credential-bearing URL."
                    />
                )}
                <div className="hb-field-grid">
                    <SelectField
                        label="Reasoning effort"
                        help={<SettingHelp help={valueHelp.reasoning} value={plan.model.reasoningEffort} />}
                        value={plan.model.reasoningEffort}
                        options={[
                            { value: "default", label: "Model default" },
                            { value: "low", label: "Low" },
                            { value: "medium", label: "Medium" },
                            { value: "high", label: "High" },
                            { value: "xhigh", label: "Extra high" },
                        ]}
                        onValueChange={(value) =>
                            edit((draft) => {
                                draft.model.reasoningEffort = value;
                            })
                        }
                    />
                    <SelectField
                        label="Context tier"
                        help={<SettingHelp help={valueHelp.contextTier} value={plan.model.contextTier} />}
                        value={plan.model.contextTier}
                        options={[
                            { value: "default", label: "Model default" },
                            { value: "long_context", label: "Long context" },
                        ]}
                        onValueChange={(value) =>
                            edit((draft) => {
                                draft.model.contextTier = value;
                            })
                        }
                    />
                </div>
                <p className="hb-field-hint">
                    Support is provider- and model-dependent. This planner does not discover models, verify
                    availability, or make inference requests.
                </p>
            </Panel>
            {byok && (
                <Panel
                    title="Provider credential binding"
                    description="Name a host secret source. Never paste an actual credential into the plan."
                    action={<Badge>Host-owned</Badge>}
                >
                    <ChoiceField
                        label="Provider credential source"
                        help={<SettingHelp help={valueHelp.credentials} value={plan.model.credential} />}
                        value={plan.model.credential}
                        options={[
                            {
                                value: "api-key",
                                label: "Environment variable",
                                description: "An API-key variable name only",
                            },
                            {
                                value: "bearer-callback",
                                label: "Bearer callback",
                                description: "Experimental host integration",
                            },
                        ]}
                        onValueChange={(value) =>
                            edit((draft) => {
                                draft.model.credential = value;
                            })
                        }
                    />
                    {plan.model.credential === "api-key" ? (
                        <TextField
                            label="API-key environment variable name"
                            help={<SettingHelp help={valueHelp.credentialEnv} />}
                            value={plan.model.credentialEnv}
                            placeholder="MODEL_API_KEY"
                            autoComplete="off"
                            spellCheck={false}
                            monospace
                            onValueChange={(value) =>
                                edit((draft) => {
                                    draft.model.credentialEnv = value;
                                })
                            }
                            error={issueFor(issues, "model.credentialEnv")}
                            hint="Example: MODEL_API_KEY. The generated host reads process.env; this browser never reads its value."
                        />
                    ) : (
                        <Notice title="Experimental: host.providerToken">
                            Supply a provider bearer-token callback in the host. The host owns caching and
                            refresh. This callback is distinct from a per-session GitHub token provider.
                        </Notice>
                    )}
                </Panel>
            )}
            {(plan.model.provider === "copilot" || plan.model.credential !== "api-key") &&
                issueFor(issues, "model.credentialEnv") && (
                    <Panel
                        title="Retained provider setting"
                        description="This value is not used by the active credential route, but must remain a valid environment variable name in the reversible plan."
                    >
                        <TextField
                            label="Retained API-key environment variable name"
                            help={<SettingHelp help={valueHelp.credentialEnv} />}
                            value={plan.model.credentialEnv}
                            autoComplete="off"
                            spellCheck={false}
                            monospace
                            onValueChange={(value) =>
                                edit((draft) => {
                                    draft.model.credentialEnv = value;
                                })
                            }
                            error={issueFor(issues, "model.credentialEnv")}
                        />
                    </Panel>
                )}
            <Panel
                title="GitHub identity ownership"
                description="Keep the caller's identity separate from the model provider and each downstream service."
                action={<KeyRound size={19} aria-hidden="true" />}
            >
                <ChoiceField
                    label="GitHub credential ownership"
                    help={<SettingHelp help={valueHelp.identity} value={plan.identity} />}
                    value={plan.identity}
                    options={[
                        {
                            value: "host-token",
                            label: "Host token callback",
                            description: "Explicit per-session identity",
                        },
                        {
                            value: "developer",
                            label: "Developer identity",
                            description: "Future host's logged-in user",
                        },
                    ]}
                    onValueChange={(value) =>
                        edit((draft) => {
                            draft.identity = value;
                        })
                    }
                />
                <Notice
                    title={
                        byok
                            ? "GitHub identity is retained, not used by this provider route"
                            : "No token values belong in this plan"
                    }
                >
                    {byok
                        ? "The BYOK sketch uses the provider credential source above. Switching providers preserves this GitHub identity choice without reading any credentials."
                        : plan.identity === "host-token"
                          ? "The sketch requires host.callbacks.gitHubTokenProvider. Your host supplies and scopes the credential at runtime."
                          : "The sketch opts into the future host's logged-in developer credentials. Shared services should use explicit session identity and downstream authorization instead."}
                </Notice>
            </Panel>
        </div>
    );
}
