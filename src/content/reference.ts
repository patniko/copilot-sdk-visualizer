// Copyright (c) Microsoft Corporation. All rights reserved.
import { z } from "zod";
import snapshot from "./reference.json";

const SourceSchema = z.object({ label: z.string(), scope: z.string(), url: z.string().optional() });
const ControlSchema = z.object({
    name: z.string(),
    axis: z.string(),
    description: z.string(),
    scopes: z.array(z.string()),
    when: z.string(),
    stability: z.string(),
    source: z.string(),
});
const GapSchema = z.object({
    id: z.string(),
    title: z.string(),
    status: z.string(),
    summary: z.string(),
    runtime: z.string(),
    boundary: z.string(),
    opportunity: z.string(),
    sources: z.array(z.string()),
});
const ReferenceSchema = z.object({
    asOf: z.string(),
    revisions: z.object({ runtime: z.string(), sdk: z.string() }),
    sources: z.record(z.string(), SourceSchema),
    controls: z.array(ControlSchema),
    axes: z.array(
        z.object({
            id: z.string(),
            title: z.string(),
            label: z.string(),
            summary: z.string(),
            interfaces: z.array(z.string()),
            sources: z.array(z.string()),
        }),
    ),
    gaps: z.array(GapSchema),
});

const sdkBase = `https://github.com/github/copilot-sdk/blob/${snapshot.revisions.sdk}`;
export const reference = ReferenceSchema.parse({
    ...snapshot,
    sources: {
        ...snapshot.sources,
        "sdk-inprocess-guide": {
            label: "In-process hosting across the six SDKs",
            scope: "copilot-sdk · docs/setup/in-process-runtime.md · native loading, prerequisites, lifecycle, and shared-process limits",
            url: `${sdkBase}/docs/setup/in-process-runtime.md`,
        },
        "sdk-managed-runtime": {
            label: "SDK-managed child process and runtime packaging",
            scope: "copilot-sdk · docs/setup/bundled-cli.md · language-specific bundled/downloaded/manual runtime setup",
            url: `${sdkBase}/docs/setup/bundled-cli.md`,
        },
        "sdk-existing-runtime": {
            label: "Existing headless runtime service",
            scope: "copilot-sdk · docs/setup/backend-services.md · TCP connection and independently operated lifecycle",
            url: `${sdkBase}/docs/setup/backend-services.md`,
        },
    },
    controls: [
        ...snapshot.controls,
        {
            name: "connection",
            axis: "cfg-storage",
            description:
                "Choose an SDK-managed child, an existing TCP runtime, or an experimental native in-process connection. This changes deployment and lifecycle, not the harness engine.",
            scopes: ["client"],
            when: "Client construction",
            stability: "In-process APIs and packaging are experimental in every SDK",
            source: "sdk-inprocess-guide",
        },
    ],
});
export type SourceRef = z.infer<typeof SourceSchema>;
export type ReferenceControl = z.infer<typeof ControlSchema>;
export type ReferenceGap = z.infer<typeof GapSchema>;

export function getSource(id: string): SourceRef {
    const source = reference.sources[id];
    if (!source) throw new Error(`Unknown source reference: ${id}`);
    return source;
}
