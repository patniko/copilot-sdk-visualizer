// Copyright (c) Microsoft Corporation. All rights reserved.
import { z } from "zod";
import snapshot from "./model-catalog.public.json";

export const copilotModelCatalog = z
    .object({
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
