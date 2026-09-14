// Copyright (c) Microsoft Corporation. All rights reserved.
import { useState } from "react";
import { Check, Copy, ExternalLink } from "lucide-react";
import { reference } from "../content/reference";
import { Button, Notice } from "./ui";

export function CopyTextButton({ text, label }: { text: string; label: string }) {
    const [feedback, setFeedback] = useState<{ text: string; error: string | null } | null>(null);
    const current = feedback?.text === text ? feedback : null;
    async function copy() {
        setFeedback(null);
        try {
            if (!navigator.clipboard?.writeText)
                throw new Error("Clipboard access is unavailable in this browser.");
            await navigator.clipboard.writeText(text);
            setFeedback({ text, error: null });
        } catch (error) {
            setFeedback({ text, error: error instanceof Error ? error.message : String(error) });
        }
    }
    return (
        <div className="hb-copy-control">
            <Button
                size="small"
                disabled={!text}
                aria-label={`Copy ${label}`}
                onClick={() => {
                    void copy();
                }}
            >
                {current && !current.error ? (
                    <Check size={14} aria-hidden="true" />
                ) : (
                    <Copy size={14} aria-hidden="true" />
                )}
                {current && !current.error ? "Copied" : "Copy"}
            </Button>
            {current?.error && (
                <p role="alert" className="hb-field-error">
                    Could not copy: {current.error} Select and copy the readable text instead.
                </p>
            )}
            {current && !current.error && (
                <span className="hb-sr-only" role="status">
                    Copied {label}.
                </span>
            )}
        </div>
    );
}

export function BootstrapSources({ sources }: { sources: string[] }) {
    return (
        <ul className="hb-source-list">
            {Array.from(new Set(sources)).map((id) => {
                const source = reference.sources[id];
                return (
                    <li key={id}>
                        {!source ? (
                            <Notice tone="error" title="Source reference unavailable">
                                The adapter referenced an unknown source: <code>{id}</code>.
                            </Notice>
                        ) : (
                            <>
                                {source.url ? (
                                    <a href={source.url} target="_blank" rel="noopener noreferrer">
                                        {source.label}
                                        <ExternalLink size={13} aria-hidden="true" />
                                        <span className="hb-sr-only">
                                            {" "}
                                            (opens the pinned source in a new tab)
                                        </span>
                                    </a>
                                ) : (
                                    <strong>{source.label}</strong>
                                )}
                                <p>{source.scope}</p>
                            </>
                        )}
                    </li>
                );
            })}
        </ul>
    );
}
