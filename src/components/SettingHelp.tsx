// Copyright (c) Microsoft Corporation. All rights reserved.
import { useId } from "react";
import * as Popover from "@radix-ui/react-popover";
import { CircleHelp, ExternalLink, X } from "lucide-react";
import type { ContextToggleHelp } from "../content/context-help";
import "../setting-help.css";

export function SettingHelp({ help, enabled }: { help: ContextToggleHelp; enabled: boolean }) {
    const headingId = useId();
    const descriptionId = useId();
    return (
        <Popover.Root>
            <Popover.Trigger asChild>
                <button
                    className="hb-setting-help-trigger"
                    type="button"
                    aria-label={`Explain ${help.title}`}
                    title={help.summary}
                >
                    <CircleHelp size={16} aria-hidden="true" />
                </button>
            </Popover.Trigger>
            <Popover.Portal>
                <Popover.Content
                    className="hb-setting-help"
                    side="bottom"
                    align="start"
                    sideOffset={8}
                    collisionPadding={16}
                    aria-labelledby={headingId}
                    aria-describedby={descriptionId}
                >
                    <div className="hb-setting-help-heading">
                        <h3 id={headingId}>{help.title}</h3>
                        <Popover.Close asChild>
                            <button
                                type="button"
                                className="hb-setting-help-close"
                                aria-label="Close setting help"
                            >
                                <X size={16} aria-hidden="true" />
                            </button>
                        </Popover.Close>
                    </div>
                    <p id={descriptionId} className="hb-setting-help-scope">
                        This changes the generated session configuration. Nothing runs in this browser, and it
                        is not a live-session toggle.
                    </p>
                    <code className="hb-setting-help-option">
                        {help.option}: {String(enabled)}
                    </code>
                    <dl className="hb-setting-help-effects">
                        <div data-current={enabled || undefined}>
                            <dt>When on</dt>
                            <dd>{help.enabled}</dd>
                        </div>
                        <div data-current={!enabled || undefined}>
                            <dt>When off</dt>
                            <dd>{help.disabled}</dd>
                        </div>
                        <div>
                            <dt>Example</dt>
                            <dd>{help.example}</dd>
                        </div>
                    </dl>
                    <div className="hb-setting-help-boundary">
                        <strong>What this does not control</strong>
                        <p>{help.boundary}</p>
                    </div>
                    <p className="hb-setting-help-scope">
                        Option names shown here use the SDK/runtime contract; language bootstraps translate
                        them to the matching language API.
                    </p>
                    <div className="hb-setting-help-sources">
                        {help.sources.map((source) => (
                            <a key={source.url} href={source.url} target="_blank" rel="noopener noreferrer">
                                {source.label}
                                <ExternalLink size={12} aria-hidden="true" />
                            </a>
                        ))}
                    </div>
                    <Popover.Arrow className="hb-setting-help-arrow" />
                </Popover.Content>
            </Popover.Portal>
        </Popover.Root>
    );
}
