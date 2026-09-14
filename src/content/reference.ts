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

export const reference = ReferenceSchema.parse(snapshot);
export type SourceRef = z.infer<typeof SourceSchema>;
export type ReferenceControl = z.infer<typeof ControlSchema>;
export type ReferenceGap = z.infer<typeof GapSchema>;

export function getSource(id: string): SourceRef {
    const source = reference.sources[id];
    if (!source) throw new Error(`Unknown source reference: ${id}`);
    return source;
}
