// Copyright (c) Microsoft Corporation. All rights reserved.
import { issueFor } from "./editor";
import type { EditorProps } from "./editor";
import { Badge, Button, ChoiceField, Notice, Panel, SelectField, TextField } from "./ui";
import { SettingHelp } from "./SettingHelp";
import { valueHelp } from "../content/setting-help";
import { ExternalLink } from "lucide-react";
import { S2S_AUTH_DOCS } from "../content/sdk-docs";

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
                        hint="An HTTP(S) inference endpoint. Keep API keys and credential query parameters out of the URL."
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
                                description:
                                    "For eligible service-to-service or high-volume workloads using a short-lived installation token.",
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
                            <Notice title="Selection configures generation only" tone="accent">
                                This option does not grant GitHub App installation authentication, billing
                                approval, model access, or any fixed or higher rate limit. GitHub must enable
                                the account or organization separately.
                            </Notice>
                            <div
                                className="hb-setup-docs"
                                role="note"
                                aria-label="GitHub App setup checklist"
                            >
                                <p className="hb-small-label">Eligible GitHub App setup checklist</p>
                                <ol className="hb-s2s-checklist">
                                    <li>
                                        Create a GitHub App with the repository permission{" "}
                                        <strong>Copilot Requests: Read &amp; write</strong>.
                                    </li>
                                    <li>
                                        Install it on the billing and attribution account. The account or
                                        organization must be enabled for installation authentication, and the
                                        current permission check requires <strong>All repositories</strong>.
                                    </li>
                                    <li>
                                        In trusted host code, use the app private key and installation ID to
                                        create an app JWT and mint an installation token. The mint request
                                        must include at least one <code>repository_ids</code> entry and{" "}
                                        <code>permissions.copilot_requests = write</code>.
                                    </li>
                                    <li>
                                        Pass only the minted installation token to the runtime as{" "}
                                        <code>COPILOT_GITHUB_TOKEN</code> and disable logged-in-user fallback.
                                        Do not use the per-session GitHub token callback.
                                    </li>
                                    <li>
                                        Installation tokens expire after one hour. Mint a replacement, restart
                                        or reconfigure the runtime with the new environment, then resume the
                                        session when appropriate; callback refresh is not supported.
                                    </li>
                                </ol>
                                <a href={S2S_AUTH_DOCS} target="_blank" rel="noopener noreferrer">
                                    Read GitHub’s server-to-server authentication guide
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
                        placeholder={
                            byok ? "Model exposed by your endpoint" : "Resolved by Copilot or your host"
                        }
                        onValueChange={(value) =>
                            edit((draft) => {
                                draft.model.id = value;
                            })
                        }
                        error={issueFor(issues, "model.id")}
                        hint={
                            byok
                                ? "Use the model identifier accepted by your provider endpoint."
                                : "Leave blank to let the future host supply a model allowed for the Copilot account."
                        }
                    />
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
                <p className="hb-field-hint">
                    This planner does not discover models, verify entitlements, test endpoint compatibility,
                    or make inference requests.
                </p>
            </Panel>

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
