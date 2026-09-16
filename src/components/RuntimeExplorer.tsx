// Copyright (c) Microsoft Corporation. All rights reserved.
import { useState } from "react";
import type { LucideIcon } from "lucide-react";
import {
    ArrowDown,
    ArrowLeft,
    ArrowRight,
    BookOpen,
    Braces,
    Check,
    CircleHelp,
    Cpu,
    Database,
    Fingerprint,
    GitBranch,
    Layers3,
    Network,
    PackageOpen,
    Play,
    Plug,
    RotateCcw,
    ShieldCheck,
    SlidersHorizontal,
    Sparkles,
    Wrench,
} from "lucide-react";
import { capabilitySides, runtimeCapability, turnWalkthrough } from "../content/runtime-map";
import type { RuntimeCapabilityId } from "../content/runtime-map";
import { reference } from "../content/reference";
import type { Evidence, ViewId } from "./editor";
import { Button } from "./ui";
import "../runtime-explorer.css";

const icons: Record<RuntimeCapabilityId, LucideIcon> = {
    loop: Cpu,
    plugins: PackageOpen,
    skills: BookOpen,
    tools: Wrench,
    mcp: Plug,
    agents: GitBranch,
    inference: Sparkles,
    auth: Fingerprint,
    policy: ShieldCheck,
    context: Layers3,
    sessions: Database,
};

export function RuntimeExplorer({
    onNavigate,
    onEvidence,
}: {
    onNavigate: (view: ViewId) => void;
    onEvidence: (evidence: Evidence) => void;
}) {
    const [selected, setSelected] = useState<RuntimeCapabilityId>("loop");
    const [step, setStep] = useState<number | null>(null);
    const capability = runtimeCapability(selected);
    const Icon = icons[selected];
    const currentStep = step === null ? null : turnWalkthrough[step];
    const active = new Set<RuntimeCapabilityId>(
        currentStep?.active ?? [selected, "loop", ...capability.related],
    );

    function select(id: RuntimeCapabilityId) {
        setSelected(id);
        setStep(null);
    }

    function trace(index: number) {
        const next = turnWalkthrough[index];
        if (!next) throw new RangeError(`Unknown walkthrough step: ${index}`);
        setStep(index);
        setSelected(next.focus);
    }

    function node(id: RuntimeCapabilityId, index?: number, side?: "left" | "right") {
        const item = runtimeCapability(id);
        const NodeIcon = icons[id];
        const core = id === "loop";
        return (
            <button
                key={id}
                className={`rt-node${core ? " rt-node-core" : ""}${active.has(id) ? " rt-node-active" : ""}`}
                style={side ? { gridColumn: side === "left" ? 1 : 3, gridRow: (index ?? 0) + 1 } : undefined}
                aria-label={`Explore ${item.name}`}
                aria-pressed={selected === id}
                aria-controls="runtime-capability-detail"
                onClick={() => select(id)}
                data-capability={id}
                data-active={active.has(id)}
            >
                <span className="rt-node-icon">
                    <NodeIcon size={core ? 28 : 19} aria-hidden="true" />
                </span>
                <span>
                    {core && <small className="rt-core-eyebrow">Copilot runtime</small>}
                    <strong>{item.name}</strong>
                    <small>{core ? "Reason. Act. Continue." : item.seam}</small>
                </span>
                {core && <span className="rt-core-loop">model → tools → results ↺</span>}
            </button>
        );
    }

    return (
        <div className="rt-explorer">
            <section className="rt-hero" aria-labelledby="editor-heading">
                <div>
                    <p className="hb-kicker">
                        <Network size={14} aria-hidden="true" /> Meet the Copilot runtime
                    </p>
                    <h2 id="editor-heading" tabIndex={-1}>
                        Your harness.
                        <br />
                        <span>A whole engine underneath.</span>
                    </h2>
                    <p className="rt-lead">
                        Not just a wrapper around a model. A shared agent loop that brings tools, skills,
                        plugins, inference, and session state together—so you can build the parts that make
                        your product yours.
                    </p>
                </div>
                <div className="rt-hero-note">
                    <span className="rt-overline">The question this map answers</span>
                    <p>“What do I get from the runtime, and what do I still build?”</p>
                    <Button onClick={() => onNavigate("base-profile")}>
                        Configure your harness <ArrowRight size={15} aria-hidden="true" />
                    </Button>
                </div>
            </section>

            <section className="rt-boundaries" aria-label="Application, SDK, and runtime responsibilities">
                <article>
                    <SlidersHorizontal size={20} aria-hidden="true" />
                    <div>
                        <span className="rt-overline">You design</span>
                        <h3>Harness &amp; product</h3>
                        <p>Behavior, domain tools, UX, identity, and authority.</p>
                    </div>
                </article>
                <span className="rt-boundary-arrow" aria-hidden="true">
                    ↔
                </span>
                <article>
                    <Braces size={20} aria-hidden="true" />
                    <div>
                        <span className="rt-overline">The SDK connects</span>
                        <h3>Config, callbacks &amp; events</h3>
                        <p>A language-native client. Not a second agent loop.</p>
                    </div>
                </article>
                <span className="rt-boundary-arrow" aria-hidden="true">
                    ↔
                </span>
                <article className="rt-boundary-runtime">
                    <Cpu size={20} aria-hidden="true" />
                    <div>
                        <span className="rt-overline">The runtime executes</span>
                        <h3>The shared machinery</h3>
                        <p>Model/tool orchestration and capability integration.</p>
                    </div>
                </article>
            </section>

            <section className="rt-atlas" aria-labelledby="runtime-map-title">
                <div className="rt-section-heading">
                    <div>
                        <p className="rt-overline">01 / Explore the engine</p>
                        <h3 id="runtime-map-title">Many capabilities. One execution loop.</h3>
                        <p>Select a node to see the abstraction, your part, and the boundary.</p>
                    </div>
                    <div className="rt-mode-switch" role="group" aria-label="Map exploration mode">
                        <Button
                            size="small"
                            variant={step === null ? "primary" : "ghost"}
                            aria-pressed={step === null}
                            onClick={() => setStep(null)}
                        >
                            <Network size={14} aria-hidden="true" /> Explore
                        </Button>
                        <Button
                            size="small"
                            variant={step !== null ? "primary" : "ghost"}
                            aria-pressed={step !== null}
                            onClick={() => trace(0)}
                        >
                            <Play size={14} aria-hidden="true" /> Trace a turn
                        </Button>
                    </div>
                </div>

                {currentStep && step !== null && (
                    <section className="rt-walkthrough" aria-label="Illustrative turn walkthrough">
                        <div className="rt-walkthrough-top">
                            <span className="rt-overline">Illustrative path · no agent is running</span>
                            <Button size="small" variant="ghost" onClick={() => trace(0)}>
                                <RotateCcw size={13} aria-hidden="true" /> Restart
                            </Button>
                        </div>
                        <ol className="rt-steps">
                            {turnWalkthrough.map((entry, index) => (
                                <li key={entry.title}>
                                    <button
                                        aria-current={step === index ? "step" : undefined}
                                        aria-controls="runtime-turn-detail"
                                        onClick={() => trace(index)}
                                    >
                                        <span>{index + 1}</span>
                                        {entry.title}
                                    </button>
                                </li>
                            ))}
                        </ol>
                        <div
                            className="rt-step-detail"
                            id="runtime-turn-detail"
                            aria-live="polite"
                            aria-atomic="true"
                        >
                            <strong>{currentStep.owner}</strong>
                            <p>{currentStep.description}</p>
                        </div>
                        <div className="rt-step-actions">
                            <Button size="small" disabled={step === 0} onClick={() => trace(step - 1)}>
                                <ArrowLeft size={13} aria-hidden="true" /> Previous step
                            </Button>
                            <span>
                                {step + 1} / {turnWalkthrough.length}
                            </span>
                            {step === turnWalkthrough.length - 1 ? (
                                <Button size="small" onClick={() => select("loop")}>
                                    Back to exploration <ArrowRight size={13} aria-hidden="true" />
                                </Button>
                            ) : (
                                <Button size="small" onClick={() => trace(step + 1)}>
                                    Next step <ArrowRight size={13} aria-hidden="true" />
                                </Button>
                            )}
                        </div>
                    </section>
                )}

                <div className="rt-atlas-layout">
                    <div className="rt-map-surface">
                        <div className="rt-map-label">
                            <span>
                                <Cpu size={14} aria-hidden="true" /> Runtime capability boundary
                            </span>
                            <span>Shared machinery, configured by you</span>
                        </div>
                        <div className="rt-map" role="group" aria-label="Runtime capability topology">
                            <svg
                                className="rt-connections"
                                viewBox="0 0 100 100"
                                preserveAspectRatio="none"
                                aria-hidden="true"
                            >
                                {(["left", "right"] as const).flatMap((side) =>
                                    capabilitySides[side].map((id, index) => {
                                        const x = side === "left" ? 18 : 82;
                                        const bend = side === "left" ? 40 : 60;
                                        const y = 9 + index * 20.5;
                                        return (
                                            <path
                                                key={id}
                                                d={`M ${x} ${y} C ${bend} ${y}, ${bend} 50, 50 50`}
                                                className={active.has(id) ? "rt-connection-active" : ""}
                                                vectorEffect="non-scaling-stroke"
                                            />
                                        );
                                    }),
                                )}
                            </svg>
                            {node("loop")}
                            {capabilitySides.left.map((id, index) => node(id, index, "left"))}
                            {capabilitySides.right.map((id, index) => node(id, index, "right"))}
                        </div>
                        <p className="rt-map-caption">
                            <CircleHelp size={13} aria-hidden="true" />
                            Connections show participation in the shared engine, not call order or automatic
                            enablement. Highlighted nodes are related capabilities; the double outline marks
                            your selection.
                        </p>
                        <div className="rt-outside">
                            <ArrowDown size={16} aria-hidden="true" />
                            <span className="rt-overline">Outside the runtime</span>
                            <p>Model services · MCP servers · your APIs · host storage</p>
                            <small>
                                The runtime integrates them. It does not supply or secure them for you.
                            </small>
                        </div>
                    </div>

                    <section
                        id="runtime-capability-detail"
                        className="rt-detail"
                        aria-labelledby="runtime-detail-title"
                    >
                        <div className="rt-detail-heading" aria-live="polite" aria-atomic="true">
                            <span className="rt-detail-icon">
                                <Icon size={22} aria-hidden="true" />
                            </span>
                            <div>
                                <p className="rt-overline">Inside the abstraction</p>
                                <h3 id="runtime-detail-title">{capability.name}</h3>
                            </div>
                        </div>
                        <h4>{capability.headline}</h4>
                        <p className="rt-detail-summary">{capability.summary}</p>
                        <div className="rt-responsibility rt-provides">
                            <h4>
                                <Check size={15} aria-hidden="true" /> You don&apos;t rebuild
                            </h4>
                            <ul>
                                {capability.provides.map((item) => (
                                    <li key={item}>{item}</li>
                                ))}
                            </ul>
                        </div>
                        <div className="rt-responsibility">
                            <h4>
                                <SlidersHorizontal size={15} aria-hidden="true" /> You still supply
                            </h4>
                            <ul>
                                {capability.owns.map((item) => (
                                    <li key={item}>{item}</li>
                                ))}
                            </ul>
                        </div>
                        <div className="rt-detail-boundary">
                            <strong>The boundary</strong>
                            <p>{capability.boundary}</p>
                        </div>
                        <div className="rt-controls">
                            <p className="rt-overline">Related SDK surfaces · not a config recipe</p>
                            <div>
                                {capability.controls.map((control) => (
                                    <code key={control}>{control}</code>
                                ))}
                            </div>
                        </div>
                        <div className="rt-related">
                            <p className="rt-overline">Connect the ideas</p>
                            <div>
                                {capability.related.map((id) => (
                                    <button
                                        key={id}
                                        onClick={() => select(id)}
                                        aria-controls="runtime-capability-detail"
                                    >
                                        {runtimeCapability(id).name}
                                        <ArrowRight size={12} aria-hidden="true" />
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="rt-detail-actions">
                            <Button variant="primary" onClick={() => onNavigate(capability.view)}>
                                {capability.action}
                                <ArrowRight size={14} aria-hidden="true" />
                            </Button>
                            <Button
                                size="small"
                                variant="ghost"
                                onClick={() =>
                                    onEvidence({
                                        kind: "topic",
                                        title: `${capability.name}: runtime evidence`,
                                        detail: `${capability.summary} ${capability.boundary}`,
                                        sources: capability.sources,
                                    })
                                }
                            >
                                <BookOpen size={14} aria-hidden="true" /> Inspect source evidence
                            </Button>
                        </div>
                    </section>
                </div>
            </section>

            <section className="rt-takeaway" aria-labelledby="runtime-takeaway-title">
                <div className="rt-section-heading">
                    <div>
                        <p className="rt-overline">02 / Keep the ownership clear</p>
                        <h3 id="runtime-takeaway-title">Reuse the machinery. Own the meaning.</h3>
                        <p>
                            Standard interfaces reduce integration work. They do not remove your product
                            decisions.
                        </p>
                    </div>
                </div>
                <div className="rt-ownership-cards">
                    <article>
                        <Cpu size={22} aria-hidden="true" />
                        <h4>Runtime machinery</h4>
                        <p>
                            The agent loop, capability loading, provider adaptation, dispatch, context
                            handling, and lifecycle events.
                        </p>
                        <strong>One engine you reuse.</strong>
                    </article>
                    <article>
                        <SlidersHorizontal size={22} aria-hidden="true" />
                        <h4>Harness configuration</h4>
                        <p>
                            Instructions, selected tools, skills, plugins, specialist roles, model choices,
                            and policy bindings.
                        </p>
                        <strong>The behavior you compose.</strong>
                    </article>
                    <article>
                        <ShieldCheck size={22} aria-hidden="true" />
                        <h4>Application authority</h4>
                        <p>
                            Product UX, user identity, tenant authorization, secret management, deployment
                            isolation, and evaluation.
                        </p>
                        <strong>The responsibility you keep.</strong>
                    </article>
                </div>
                <div className="rt-bottom-line">
                    <p>
                        <strong>The configurator is the design surface—not the runtime.</strong>
                        <br />
                        It produces a plan and integration scaffold. Your host binds real callbacks and runs
                        the engine.
                    </p>
                    <Button onClick={() => onNavigate("bootstrap")}>
                        See how it runs <ArrowRight size={15} aria-hidden="true" />
                    </Button>
                </div>
            </section>
            <p className="rt-provenance">
                Source-backed conceptual map · snapshot {reference.asOf} · runtime{" "}
                <code>{reference.revisions.runtime.slice(0, 7)}</code> / SDK{" "}
                <code>{reference.revisions.sdk.slice(0, 7)}</code>. Not a live inventory or a promise of
                SDK/version parity. Some evidence requires repository access.
            </p>
        </div>
    );
}
