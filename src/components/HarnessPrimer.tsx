// Copyright (c) Microsoft Corporation. All rights reserved.
import {
    ArrowRight,
    Code2,
    Cpu,
    ExternalLink,
    PackageOpen,
    Play,
    ServerCog,
    SlidersHorizontal,
} from "lucide-react";
import { SDK_GETTING_STARTED } from "../content/sdk-docs";
import type { ViewId } from "./editor";
import { Button } from "./ui";
import "../onboarding.css";

const layers = [
    {
        id: "host",
        icon: ServerCog,
        name: "Your app",
        detail: "UX, identity, authorization, and the services your tools call.",
        owner: "You own",
    },
    {
        id: "sdk",
        icon: Code2,
        name: "SDK",
        detail: "Carries your harness to the runtime and wires up your callbacks.",
        owner: "You wire",
    },
    {
        id: "harness",
        icon: SlidersHorizontal,
        name: "Harness",
        detail: "Prompt, tools, context, agents, and policy.",
        owner: "You compose here",
    },
    {
        id: "runtime",
        icon: Cpu,
        name: "Copilot runtime",
        detail: "Session lifecycle, the model/tool loop, and events.",
        owner: "Shared",
    },
] as const;

const steps = [
    {
        icon: SlidersHorizontal,
        title: "Compose",
        detail: "Pick a starting profile, then shape the prompt, tools, and policy.",
        action: { label: "Choose a profile", view: "base-profile" },
    },
    {
        icon: PackageOpen,
        title: "Build",
        detail: "Choose a language and where the runtime runs, then download the project.",
        action: { label: "Open Build & run", view: "bootstrap" },
    },
    {
        icon: Play,
        title: "Run",
        detail: "Install, fill in the host code, and run your first agent turn in your app.",
    },
] as const satisfies readonly {
    icon: typeof Play;
    title: string;
    detail: string;
    action?: { label: string; view: ViewId };
}[];

export function HarnessPrimer({ onNavigate }: { onNavigate: (view: ViewId) => void }) {
    return (
        <>
            <section className="hb-primer" aria-labelledby="hb-primer-title">
                <div className="hb-primer-heading">
                    <h2 id="hb-primer-title">What is a harness?</h2>
                    <p>
                        The configuration that turns the shared Copilot runtime into <em>your</em> agent. You
                        compose it here; your app runs it.
                    </p>
                </div>
                <div className="hb-stack">
                    <span className="hb-stack-bracket hb-stack-bracket-yours" aria-hidden="true">
                        Yours
                    </span>
                    <span className="hb-stack-bracket hb-stack-bracket-shared" aria-hidden="true">
                        Shared
                    </span>
                    <ol
                        className="hb-stack-layers"
                        aria-label="The four layers, from your app down to the runtime"
                    >
                        {layers.map((layer) => {
                            const Icon = layer.icon;
                            return (
                                <li key={layer.id} className={`hb-stack-layer hb-stack-${layer.id}`}>
                                    <span className="hb-stack-icon">
                                        <Icon size={18} aria-hidden="true" />
                                    </span>
                                    <div className="hb-stack-copy">
                                        <strong>{layer.name}</strong>
                                        <span>{layer.detail}</span>
                                    </div>
                                    {layer.id === "runtime" ? (
                                        <Button size="small" onClick={() => onNavigate("runtime")}>
                                            Explore the runtime
                                            <ArrowRight size={14} aria-hidden="true" />
                                        </Button>
                                    ) : (
                                        <span className="hb-stack-owner">{layer.owner}</span>
                                    )}
                                </li>
                            );
                        })}
                    </ol>
                </div>
            </section>

            <section className="hb-primer" aria-labelledby="hb-path-title">
                <div className="hb-primer-heading">
                    <h2 id="hb-path-title">From plan to running agent</h2>
                    <p>Nothing runs in the browser. You leave with a project to run in your own app.</p>
                </div>
                <ol className="hb-path">
                    {steps.map((step, index) => {
                        const Icon = step.icon;
                        return (
                            <li key={step.title} className="hb-path-step">
                                <div className="hb-path-top">
                                    <span className="hb-path-icon">
                                        <Icon size={18} aria-hidden="true" />
                                    </span>
                                    <span className="hb-path-index">Step {index + 1}</span>
                                </div>
                                <strong>{step.title}</strong>
                                <p>{step.detail}</p>
                                {"action" in step ? (
                                    <Button size="small" onClick={() => onNavigate(step.action.view)}>
                                        {step.action.label}
                                        <ArrowRight size={14} aria-hidden="true" />
                                    </Button>
                                ) : (
                                    <a
                                        className="hb-path-link"
                                        href={SDK_GETTING_STARTED}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                    >
                                        SDK getting started
                                        <ExternalLink size={13} aria-hidden="true" />
                                    </a>
                                )}
                            </li>
                        );
                    })}
                </ol>
            </section>
        </>
    );
}
