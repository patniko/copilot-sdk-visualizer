// Copyright (c) Microsoft Corporation. All rights reserved.
import { ArrowRight, Code2, Cpu } from "lucide-react";
import { LANGUAGES, RUNTIME_OPTIONS } from "../domain/target";
import type { BootstrapTarget } from "../domain/target";
import { Badge, Notice } from "./ui";

export function RuntimePlacement({
    target,
    compact = false,
}: {
    target: BootstrapTarget;
    compact?: boolean;
}) {
    const language = LANGUAGES.find((entry) => entry.id === target.language);
    const runtime = RUNTIME_OPTIONS.find((entry) => entry.id === target.runtime);
    if (!runtime)
        return (
            <Notice tone="error" title="Unknown runtime placement">
                Review the deployment target before generating a project.
            </Notice>
        );
    return (
        <div
            className={`hb-placement${compact ? " hb-placement-compact" : ""}`}
            aria-label={`${language?.label ?? target.language}: ${runtime.boundary}`}
        >
            <div className="hb-placement-heading">
                <Badge>{language?.shortLabel ?? target.language}</Badge>
                <span>
                    {target.runtime === "inprocess" ? "One application process" : "Separate runtime process"}
                </span>
            </div>
            {target.runtime === "inprocess" ? (
                <div className="hb-process-boundary hb-process-shared">
                    <span className="hb-process-caption">Application process / shared state</span>
                    <div className="hb-process-inner">
                        <span className="hb-process-part">
                            <Code2 size={16} aria-hidden="true" />
                            <strong>Host + SDK</strong>
                        </span>
                        <span className="hb-process-channel">
                            <ArrowRight size={15} aria-hidden="true" />C ABI / JSON-RPC
                        </span>
                        <span className="hb-process-part hb-process-runtime">
                            <Cpu size={17} aria-hidden="true" />
                            <strong>Copilot runtime</strong>
                        </span>
                    </div>
                </div>
            ) : (
                <div className="hb-process-split">
                    <div className="hb-process-boundary">
                        <span className="hb-process-caption">Application process</span>
                        <span className="hb-process-part">
                            <Code2 size={17} aria-hidden="true" />
                            <strong>Host + SDK</strong>
                        </span>
                    </div>
                    <span className="hb-process-channel">
                        <ArrowRight size={18} aria-hidden="true" />
                        {target.runtime === "managed" ? "stdio" : "TCP"}
                    </span>
                    <div className="hb-process-boundary hb-process-separate">
                        <span className="hb-process-caption">
                            {target.runtime === "managed" ? "SDK-owned child" : "Host-owned service"}
                        </span>
                        <span className="hb-process-part hb-process-runtime">
                            <Cpu size={17} aria-hidden="true" />
                            <strong>Copilot runtime</strong>
                        </span>
                    </div>
                </div>
            )}
            <p className="hb-field-hint">
                {runtime.channel}. {runtime.lifecycle}.
            </p>
        </div>
    );
}
