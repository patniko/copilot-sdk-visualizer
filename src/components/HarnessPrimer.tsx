// Copyright (c) Microsoft Corporation. All rights reserved.
import {
    ArrowRight,
    Code2,
    Cpu,
    ExternalLink,
    PackageOpen,
    ServerCog,
    SlidersHorizontal,
} from "lucide-react";
import { SDK_GETTING_STARTED } from "../content/sdk-docs";
import type { ViewId } from "./editor";
import { Button } from "./ui";

const layers = [
    {
        icon: Cpu,
        name: "Runtime engine",
        detail: "Shared session lifecycle, the model/tool loop, context processing, and events. You keep it — you do not rebuild it.",
        owner: "Shared",
    },
    {
        icon: SlidersHorizontal,
        name: "Harness configuration",
        detail: "Prompt, tool inventory and implementations, context, agents, methods, and evaluation. This is what you compose here.",
        owner: "You compose",
    },
    {
        icon: Code2,
        name: "SDK / integration",
        detail: "A language-native client that carries your configuration, binds host callbacks, and delivers events over a transport.",
        owner: "You wire",
    },
    {
        icon: ServerCog,
        name: "Application / host",
        detail: "Your product UX, identity, tenant authorization, deployment isolation, and the services your tools actually call.",
        owner: "You own",
    },
] as const;

const steps: { label: string; view?: ViewId }[] = [
    { label: "Understand the four layers above", view: undefined },
    { label: "Pick a starting profile and configure it", view: "base-profile" },
    { label: "See what each choice exposes and requires", view: "prompt" },
    { label: "Choose runtime placement and SDK language", view: "bootstrap" },
    { label: "Download the complete bootstrap project", view: "bootstrap" },
    { label: "Install deps, implement host code, run preflight", view: "bootstrap" },
    { label: "Run an agent turn in your own host", view: undefined },
];

export function HarnessPrimer({ onNavigate }: { onNavigate: (view: ViewId) => void }) {
    return (
        <section className="hb-primer" aria-labelledby="hb-primer-title">
            <h2 id="hb-primer-title">What is a harness, and how do you build one?</h2>
            <p className="hb-primer-lead">
                One shared <strong>runtime engine</strong> can power many agents. A <strong>harness</strong>{" "}
                is the configuration on top of it — prompt, tools, context, agents, and policy. This workbench
                helps you compose that harness and hand your <strong>host</strong> a project to run it.
                Nothing runs in the browser.
            </p>

            <ol className="hb-primer-layers" aria-label="The four layers">
                {layers.map((layer) => {
                    const Icon = layer.icon;
                    return (
                        <li key={layer.name}>
                            <span className="hb-primer-layer-icon">
                                <Icon size={18} aria-hidden="true" />
                            </span>
                            <div>
                                <div className="hb-primer-layer-top">
                                    <strong>{layer.name}</strong>
                                    <span className="hb-primer-owner">{layer.owner}</span>
                                </div>
                                <p>{layer.detail}</p>
                            </div>
                        </li>
                    );
                })}
            </ol>

            <div className="hb-primer-steps">
                <p className="hb-small-label">Build a harness in seven steps</p>
                <ol>
                    {steps.map((step, index) => (
                        <li key={step.label}>
                            <span className="hb-primer-step-index">{index + 1}</span>
                            {step.view ? (
                                <button
                                    className="hb-primer-step-link"
                                    onClick={() => onNavigate(step.view!)}
                                >
                                    {step.label}
                                    <ArrowRight size={12} aria-hidden="true" />
                                </button>
                            ) : (
                                <span>{step.label}</span>
                            )}
                        </li>
                    ))}
                </ol>
            </div>

            <div className="hb-primer-footer">
                <Button onClick={() => onNavigate("bootstrap")}>
                    <PackageOpen size={15} aria-hidden="true" />
                    Jump to Build &amp; run
                </Button>
                <a href={SDK_GETTING_STARTED} target="_blank" rel="noopener noreferrer">
                    Read the SDK “Getting started” tutorial
                    <ExternalLink size={13} aria-hidden="true" />
                </a>
            </div>
        </section>
    );
}
