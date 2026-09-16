// Copyright (c) Microsoft Corporation. All rights reserved.
import { z } from "zod";
import snapshot from "./model-catalog.json";

const revision = z.string().regex(/^[a-f0-9]{40}$/);
export const copilotModelCatalog = z
    .object({
        revisions: z.object({ sdk: revision, runtime: revision }),
        sources: z.object({ sdk: z.url(), runtime: z.url() }),
        modelIds: z
            .array(
                z
                    .string()
                    .max(120)
                    .regex(/^[a-z0-9][a-z0-9.-]*$/),
            )
            .min(1)
            .refine((ids) => new Set(ids).size === ids.length, "Model IDs must be unique."),
    })
    .parse(snapshot);

export function copilotModelOptions(currentId: string) {
    return [
        { value: "", label: "Host supplied" },
        ...(currentId && !copilotModelCatalog.modelIds.includes(currentId)
            ? [{ value: currentId, label: `${currentId} (not in bundled catalog)` }]
            : []),
        ...copilotModelCatalog.modelIds.map((id) => ({ value: id, label: id })),
    ];
}
