// Copyright (c) Microsoft Corporation. All rights reserved.
import { ExternalLink } from "lucide-react";
import { FILE_HOOKS_REFERENCE_URL, fileHookEventGroups } from "../content/file-hook-events";
import { Badge } from "./ui";

export function FileHookEventList() {
    return (
        <>
            <div className="hb-hook-groups">
                {fileHookEventGroups.map((group) => (
                    <section key={group.phase} className="hb-hook-group" aria-label={group.phase}>
                        <h4>{group.phase}</h4>
                        <ul>
                            {group.events.map((event) => (
                                <li key={event.name}>
                                    <div className="hb-hook-event-head">
                                        <code>{event.name}</code>
                                        <Badge accent={event.effect !== "Observe only"}>{event.effect}</Badge>
                                    </div>
                                    <p>{event.firesWhen}</p>
                                    <p className="hb-hook-event-detail">{event.detail}</p>
                                </li>
                            ))}
                        </ul>
                    </section>
                ))}
            </div>
            <a className="hb-hook-reference" href={FILE_HOOKS_REFERENCE_URL} target="_blank" rel="noreferrer">
                Hooks reference: payloads, matchers, and exit codes
                <ExternalLink size={14} aria-hidden="true" />
            </a>
        </>
    );
}
