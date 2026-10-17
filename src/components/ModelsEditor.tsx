// Copyright (c) Microsoft Corporation. All rights reserved.
import { issueFor } from "./editor";
import type { EditorProps } from "./editor";
import {
    Badge,
    Button,
    ChoiceField,
    CountField,
    LineListField,
    Notice,
    Panel,
    SelectField,
    TextField,
} from "./ui";
import { SettingHelp } from "./SettingHelp";
import { valueHelp } from "../content/setting-help";
import { ExternalLink } from "lucide-react";
import { S2S_AUTH_AVAILABILITY, S2S_AUTH_DOCS } from "../content/sdk-docs";
import { copilotModelOptions } from "../content/models";
import { MODEL_PROVIDER_PRODUCTS } from "../domain/plan";

const endpointExamples = {
    openai: "https://api.openai.com/v1",
    azure: "https://your-resource.openai.azure.com",
    anthropic: "https://api.anthropic.com",
};

function modelOptions(currentId: string) {
    const [hostSupplied, ...rest] = copilotModelOptions(currentId === "auto" ? "" : currentId);
    return [
        ...(hostSupplied ? [hostSupplied] : []),
        { value: "auto", label: "auto (Copilot routing)" },
        ...rest,
    ];
}

export function ModelsEditor({ plan, edit, issues }: EditorProps) {
    const byok = plan.model.provider !== "copilot";
    const endpointExample = plan.model.provider === "copilot" ? "" : endpointExamples[plan.model.provider];

    return (
        <div className="hb-editor-stack">
            <Panel
                title="How will this harness access a model?"
                description="Start with who owns inference. The remaining decisions follow from that choice."
                action={<Badge>Step 1</Badge>}
            >
                <ChoiceField
                    label="Inference access"
                    help={
                        <SettingHelp
                            help={valueHelp.modelProvider}
                            value={byok ? "Bring your own" : "GitHub Copilot"}
                        />
                    }
                    value={byok ? "byok" : "copilot"}
                    options={[
                        {
                            value: "copilot",
                            label: "GitHub Copilot account",
                            description:
                                "GitHub manages billing, inference, model access, and service availability.",
                        },
                        {
                            value: "byok",
                            label: "Bring your own inference",
                            description:
                                "You operate the endpoint, credentials, billing, capacity, and model availability.",
                        },
                    ]}
                    onValueChange={(value) =>
                        edit((draft) => {
                            draft.model.provider = value === "copilot" ? "copilot" : "openai";
                            if (value === "copilot") {
                                // Provider-only fields are invalid on the Copilot route.
                                draft.model.modelProvider = "";
                                draft.model.wireModel = "";
                                draft.model.maxPromptTokens = 0;
                                draft.model.maxOutputTokens = 0;
                            }
                        })
                    }
                />
                <Notice
                    title={byok ? "You own the inference stack" : "GitHub manages the inference service"}
                    tone="accent"
                >
                    {byok
                        ? "Connect a local OpenAI-compatible server, a third-party provider, or Azure inference. Your host owns credentials, provider charges, deployment capacity, and model compatibility."
                        : "The selected GitHub Copilot account or organization determines billing, entitlements, and which models are available. Your host authenticates the caller; it does not operate a separate inference endpoint."}
                </Notice>
            </Panel>

            {byok ? (
                <Panel
                    title="Connect your inference provider"
                    description="Choose the provider contract first, then point the host at the endpoint you operate."
                    action={<Badge>Step 2</Badge>}
                >
                    <SelectField
                        label="Provider type"
                        value={plan.model.provider}
                        options={[
                            { value: "openai", label: "OpenAI-compatible (cloud or local)" },
                            { value: "azure", label: "Azure inference" },
                            { value: "anthropic", label: "Anthropic" },
                        ]}
                        onValueChange={(value) =>
                            edit((draft) => {
                                draft.model.provider = value;
                            })
                        }
                        hint="Local model servers and third-party gateways can use the OpenAI-compatible route when they implement the selected wire API."
                    />
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
                        hint="Optional here. Leave blank to supply the endpoint string in host code; generated code will fail until it is provided. If entered, use HTTP(S) and keep credentials out of the URL."
                    />
                    <div className="hb-example-row">
                        <span>Examples are illustrative and are never contacted by this planner.</span>
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
                                {
                                    value: "responses",
                                    label: "Responses",
                                    description: "Use an endpoint implementing the Responses API.",
                                },
                                {
                                    value: "completions",
                                    label: "Chat completions",
                                    description: "Use an endpoint implementing Chat Completions.",
                                },
                            ]}
                            onValueChange={(value) =>
                                edit((draft) => {
                                    draft.model.wireApi = value;
                                })
                            }
                        />
                    )}
                    <div>
                        <h4 className="hb-subsection-title">Optional provider overrides</h4>
                        <div className="hb-field-grid">
                            <SelectField
                                label="Serving product"
                                help={
                                    <SettingHelp
                                        help={valueHelp.providerProduct}
                                        value={plan.model.modelProvider || "Unset"}
                                    />
                                }
                                value={plan.model.modelProvider}
                                options={[
                                    { value: "", label: "Unset" },
                                    ...MODEL_PROVIDER_PRODUCTS.map((product) => ({
                                        value: product,
                                        label: product,
                                    })),
                                ]}
                                onValueChange={(value) =>
                                    edit((draft) => {
                                        draft.model.modelProvider = value;
                                    })
                                }
                                error={issueFor(issues, "model.modelProvider")}
                                hint="Telemetry only: names the product serving the model. It does not change routing."
                            />
                            <TextField
                                label="Wire model name"
                                help={<SettingHelp help={valueHelp.wireModel} />}
                                value={plan.model.wireModel}
                                maxLength={120}
                                monospace
                                spellCheck={false}
                                placeholder="Defaults to the model ID"
                                onValueChange={(value) =>
                                    edit((draft) => {
                                        draft.model.wireModel = value;
                                    })
                                }
                                error={issueFor(issues, "model.wireModel")}
                                hint="Use when the provider's name differs, such as an Azure deployment name."
                            />
                            <CountField
                                label="Max prompt tokens"
                                help={
                                    <SettingHelp
                                        help={valueHelp.maxPromptTokens}
                                        value={plan.model.maxPromptTokens || "Unset"}
                                    />
                                }
                                value={plan.model.maxPromptTokens}
                                max={100_000_000}
                                onValueChange={(value) =>
                                    edit((draft) => {
                                        draft.model.maxPromptTokens = value;
                                    })
                                }
                                error={issueFor(issues, "model.maxPromptTokens")}
                                hint="Blank or 0 keeps the model default. Compaction runs before this limit."
                            />
                            <CountField
                                label="Max output tokens"
                                help={
                                    <SettingHelp
                                        help={valueHelp.maxOutputTokens}
                                        value={plan.model.maxOutputTokens || "Unset"}
                                    />
                                }
                                value={plan.model.maxOutputTokens}
                                max={100_000_000}
                                onValueChange={(value) =>
                                    edit((draft) => {
                                        draft.model.maxOutputTokens = value;
                                    })
                                }
                                error={issueFor(issues, "model.maxOutputTokens")}
                                hint="Blank or 0 keeps the model default. Responses stop and truncate at this limit."
                            />
                        </div>
                    </div>
                </Panel>
            ) : (
                <Panel
                    title="Connect a GitHub Copilot account"
                    description="Choose whose Copilot entitlement the future host uses for inference."
                    action={<Badge>Step 2</Badge>}
                >
                    <ChoiceField
                        label="GitHub credential ownership"
                        help={<SettingHelp help={valueHelp.identity} value={plan.identity} />}
                        value={plan.identity}
                        options={[
                            {
                                value: "host-token",
                                label: "Per-session token callback",
                                description: "Your host supplies and refreshes an explicitly scoped token.",
                            },
                            {
                                value: "developer",
                                label: "Developer login",
                                description: "Use the future local runtime's signed-in GitHub account.",
                            },
                            {
                                value: "s2s-installation",
                                label: "GitHub App service identity",
                                badge: "Coming soon",
                                description: "Feature-flagged; available only to accounts enabled by GitHub.",
                            },
                        ]}
                        onValueChange={(value) =>
                            edit((draft) => {
                                draft.identity = value;
                            })
                        }
                    />
                    {plan.identity === "s2s-installation" ? (
                        <>
                            <Notice title="Coming soon - feature-flagged" tone="accent">
                                {S2S_AUTH_AVAILABILITY} Selection configures generation only; it does not
                                grant billing approval, model access, or higher rate limits.
                            </Notice>
                            <div className="hb-setup-docs">
                                <a href={S2S_AUTH_DOCS} target="_blank" rel="noopener noreferrer">
                                    GitHub App setup guide
                                    <ExternalLink size={12} aria-hidden="true" />
                                </a>
                            </div>
                            <Notice title="Secrets stay outside this plan">
                                Never put the app private key, app JWT, installation token, or token expiry in
                                the browser, saved plan, or exported configuration.
                            </Notice>
                        </>
                    ) : (
                        <Notice title="No token values belong in this plan">
                            {plan.identity === "host-token"
                                ? "The generated host requires a GitHub token provider. Use this route for explicit per-session identity, especially in shared services."
                                : "The future local runtime uses its developer login. This is convenient for local development, not a substitute for tenant authorization in a shared service."}
                        </Notice>
                    )}
                </Panel>
            )}

            {byok && (
                <Panel
                    title="Bind provider credentials"
                    description="Tell the future host where to obtain a secret without storing the secret in the plan."
                    action={<Badge>Step 3</Badge>}
                >
                    <ChoiceField
                        label="Provider credential source"
                        help={<SettingHelp help={valueHelp.credentials} value={plan.model.credential} />}
                        value={plan.model.credential}
                        options={[
                            {
                                value: "api-key",
                                label: "Environment variable",
                                description: "Read an API-key variable in the host process.",
                            },
                            {
                                value: "bearer-callback",
                                label: "Bearer-token callback",
                                description: "Acquire and refresh a token through host code.",
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
                            hint="Enter a variable name such as MODEL_API_KEY, never the credential value."
                        />
                    ) : (
                        <Notice title="Host implementation required">
                            Supply a provider bearer-token callback in the host. The host owns acquisition,
                            caching, expiry, and refresh.
                        </Notice>
                    )}
                </Panel>
            )}

            <Panel
                title="Choose model behavior"
                description={
                    byok
                        ? "Select a model exposed by your endpoint, then request only the capabilities it supports."
                        : "Select an available Copilot model or let the host resolve one from account and organization policy."
                }
                action={<Badge>Step {byok ? 4 : 3}</Badge>}
            >
                <div className="hb-field-grid">
                    {byok ? (
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
                            placeholder="Model exposed by your endpoint"
                            onValueChange={(value) =>
                                edit((draft) => {
                                    draft.model.id = value;
                                })
                            }
                            error={issueFor(issues, "model.id")}
                            hint="Use the model identifier accepted by your provider endpoint."
                        />
                    ) : (
                        <SelectField
                            label="Model ID"
                            help={
                                <SettingHelp
                                    help={valueHelp.modelId}
                                    value={plan.model.id.trim() || "Host supplied"}
                                />
                            }
                            value={plan.model.id}
                            options={modelOptions(plan.model.id)}
                            onValueChange={(value) =>
                                edit((draft) => {
                                    draft.model.id = value;
                                })
                            }
                            error={issueFor(issues, "model.id")}
                            hint="Choose from the bundled model catalog, or leave model selection to the host. Account and organization policy determine actual availability."
                        />
                    )}
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
                </div>
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
                    hint="Model availability, reasoning levels, and context tiers depend on the active account or provider."
                />
                <div className="hb-field-grid">
                    {!byok && (
                        <SelectField
                            label="Auto routing tier"
                            help={<SettingHelp help={valueHelp.autoTier} value={plan.model.autoTier} />}
                            value={plan.model.autoTier}
                            options={[
                                { value: "default", label: "Runtime default" },
                                { value: "efficiency", label: "Efficiency" },
                                { value: "balance", label: "Balance" },
                                { value: "intelligence", label: "Intelligence" },
                                { value: "fast", label: "Fast (integrator latency preset)" },
                            ]}
                            onValueChange={(value) =>
                                edit((draft) => {
                                    draft.model.autoTier = value;
                                })
                            }
                            hint={
                                plan.model.id.trim() === "auto"
                                    ? "Routing preference for the auto model."
                                    : "Only meaningful when the model is auto; ignored for a specific model."
                            }
                        />
                    )}
                    <SelectField
                        label="Reasoning summary"
                        help={
                            <SettingHelp
                                help={valueHelp.reasoningSummary}
                                value={plan.model.reasoningSummary}
                            />
                        }
                        value={plan.model.reasoningSummary}
                        options={[
                            { value: "default", label: "Model default" },
                            { value: "none", label: "None" },
                            { value: "concise", label: "Concise" },
                            { value: "detailed", label: "Detailed" },
                        ]}
                        onValueChange={(value) =>
                            edit((draft) => {
                                draft.model.reasoningSummary = value;
                            })
                        }
                        hint="Applies to models with configurable reasoning summaries."
                    />
                </div>
                <LineListField
                    label="Allowed models"
                    help={
                        <SettingHelp
                            help={valueHelp.allowedModels}
                            value={
                                plan.model.allowedModels.length
                                    ? `${plan.model.allowedModels.length} models`
                                    : "Runtime policy"
                            }
                        />
                    }
                    values={plan.model.allowedModels}
                    onValuesChange={(values) =>
                        edit((draft) => {
                            draft.model.allowedModels = values;
                        })
                    }
                    rows={3}
                    monospace
                    spellCheck={false}
                    placeholder={"gpt-5.5\nclaude-sonnet-5"}
                    error={issueFor(issues, "model.allowedModels")}
                    hint="Exact model IDs, one per line; include the session model. TypeScript and Rust set allowedModels in session config; Python, Go, C#, and Java call session.model.setAllowedModels right after create."
                />
                <p className="hb-field-hint">
                    This planner does not discover live account models, verify entitlements, test endpoint
                    compatibility, or make inference requests.
                </p>
            </Panel>

            {!byok && (issueFor(issues, "model.modelProvider") || issueFor(issues, "model.wireModel")) && (
                <Panel
                    title="Retained provider overrides"
                    description="These custom-provider values are invalid for the GitHub Copilot route."
                >
                    <Notice title="Provider-only values are set" tone="error">
                        {issueFor(issues, "model.modelProvider") ?? issueFor(issues, "model.wireModel")}
                        <Button
                            variant="ghost"
                            size="small"
                            onClick={() =>
                                edit((draft) => {
                                    draft.model.modelProvider = "";
                                    draft.model.wireModel = "";
                                    draft.model.maxPromptTokens = 0;
                                    draft.model.maxOutputTokens = 0;
                                })
                            }
                        >
                            Clear provider overrides
                        </Button>
                    </Notice>
                </Panel>
            )}

            {!byok && issueFor(issues, "model.endpoint") && (
                <Panel
                    title="Retained provider endpoint"
                    description="This BYOK value is inactive for GitHub Copilot, but the reversible plan cannot retain an invalid or credential-bearing URL."
                >
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
                    />
                </Panel>
            )}

            {(plan.model.provider === "copilot" || plan.model.credential !== "api-key") &&
                issueFor(issues, "model.credentialEnv") && (
                    <Panel
                        title="Retained provider setting"
                        description="This value is inactive for the selected route, but must remain a valid environment variable name in the reversible plan."
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
        </div>
    );
}
