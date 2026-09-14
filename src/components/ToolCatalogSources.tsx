// Copyright (c) Microsoft Corporation. All rights reserved.
import { ExternalLink } from "lucide-react";
import { toolCatalog } from "../content/builtin-tools";

export function ToolCatalogSources({ sources }: { sources: string[] }) {
    return (
        <ul className="hb-tool-source-list">
            {Array.from(new Set(sources)).map((url) => (
                <li key={url}>
                    <a href={url} target="_blank" rel="noopener noreferrer">
                        <code>{url.split(`/blob/${toolCatalog.revision}/`)[1] ?? url}</code>
                        <ExternalLink size={13} aria-hidden="true" />
                        <span className="hb-sr-only"> (opens pinned source in a new tab)</span>
                    </a>
                </li>
            ))}
        </ul>
    );
}
