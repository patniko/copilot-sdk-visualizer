#!/usr/bin/env node
// Copyright (c) Microsoft Corporation. All rights reserved.
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));

function read(name) {
    return JSON.parse(readFileSync(`${root}/src/content/${name}.json`, "utf8"));
}

function write(name, value) {
    writeFileSync(`${root}/src/content/${name}.public.json`, `${JSON.stringify(value, null, 4)}\n`);
}

const reference = read("reference");
write("reference", {
    ...reference,
    sources: Object.fromEntries(
        Object.entries(reference.sources).map(([id, source]) => [
            id,
            {
                label: source.label,
                scope: "Maintained in the private research snapshot.",
            },
        ]),
    ),
});

const tools = read("tool-catalog");
write("tool-catalog", {
    ...tools,
    revision: "private",
    context: {
        ...tools.context,
        sources: [],
        aliases: tools.context.aliases.map((alias) => ({ ...alias, sources: [] })),
    },
    tools: tools.tools.map((tool) => ({ ...tool, sources: [] })),
});

const prompts = read("builtin-prompts");
write("builtin-prompts", {
    ...prompts,
    revision: "private",
    sections: prompts.sections.map((section) => ({ ...section, source: "" })),
});

const models = read("model-catalog");
write("model-catalog", { modelIds: models.modelIds });
