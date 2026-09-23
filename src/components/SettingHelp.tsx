// Copyright (c) Microsoft Corporation. All rights reserved.
import { useId } from "react";
import * as Popover from "@radix-ui/react-popover";
import { CircleHelp, X } from "lucide-react";
import type { ToggleHelp, ValueHelp } from "../content/help-types";
import "../setting-help.css";

type SettingHelpProps = (
    | { help: ToggleHelp; enabled: boolean; value?: never }
    | { help: ValueHelp; value?: string | number; enabled?: never }
) & { label?: string };

export function SettingHelp(props: SettingHelpProps) {
    const { help } = props;
    const title = props.label ?? help.title;
    const current = props.enabled ?? props.value;
    const choice = "details" in help;
    const callbackValue =
        !choice && help.valueLabels && typeof current === "boolean"
            ? current
                ? help.valueLabels.enabled
                : help.valueLabels.disabled
            : undefined;
    const headingId = useId();
    const descriptionId = useId();
    return (
        <Popover.Root>
            <Popover.Trigger asChild>
                <button
                    className="hb-setting-help-trigger"
                    type="button"
                    aria-label={`Explain ${title}`}
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
                        <h3 id={headingId}>{title}</h3>
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
                        {help.scope ??
                            "This changes the generated session configuration. Nothing runs in this browser, and it is not a live-session toggle."}
                    </p>
                    <code className="hb-setting-help-option">
                        {help.option}
                        {!choice && !help.valueLabels ? `: ${String(current)}` : ""}
                    </code>
                    {(callbackValue || (choice && current !== undefined)) && (
                        <p className="hb-setting-help-current">
                            {callbackValue ?? `Current choice: ${current}`}
                        </p>
                    )}
                    <dl className="hb-setting-help-effects">
                        {choice ? (
                            help.details.map((detail) => (
                                <div
                                    key={detail.title}
                                    data-current={
                                        (detail.value !== undefined && detail.value === String(current)) ||
                                        undefined
                                    }
                                >
                                    <dt>{detail.title}</dt>
                                    <dd>{detail.text}</dd>
                                </div>
                            ))
                        ) : (
                            <>
                                <div data-current={current === true || undefined}>
                                    <dt>When on</dt>
                                    <dd>{help.enabled}</dd>
                                </div>
                                <div data-current={current === false || undefined}>
                                    <dt>When off</dt>
                                    <dd>{help.disabled}</dd>
                                </div>
                            </>
                        )}
                        <div>
                            <dt>Example</dt>
                            <dd>{help.example}</dd>
                        </div>
                    </dl>
                    <div className="hb-setting-help-boundary">
                        <strong>What this does not control</strong>
                        <p>{help.boundary}</p>
                    </div>
                    <Popover.Arrow className="hb-setting-help-arrow" />
                </Popover.Content>
            </Popover.Portal>
        </Popover.Root>
    );
}
