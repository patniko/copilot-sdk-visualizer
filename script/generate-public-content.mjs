#!/usr/bin/env node
// Copyright (c) Microsoft Corporation. All rights reserved.
import assert from "node:assert/strict";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const check = process.argv.includes("--check");

function read(name) {
    return JSON.parse(readFileSync(`${root}/src/content/${name}.json`, "utf8"));
}

function output(name, value) {
    const file = `${root}/src/content/${name}.public.json`;
    const content = `${JSON.stringify(value, null, 4)}\n`;
    assert.doesNotMatch(content, /\b[a-f0-9]{40}\b/i, `${name} contains a source revision`);
    if (check) {
        assert.equal(readFileSync(file, "utf8"), content, `${name}.public.json is out of date`);
    } else if (!existsSync(file) || readFileSync(file, "utf8") !== content) {
        writeFileSync(file, content);
    }
}

const reference = read("reference");
const publicReference = {
    ...reference,
    revisions: { runtime: "private", sdk: "private" },
    sources: Object.fromEntries(
        Object.entries(reference.sources).map(([id, source]) => [
            id,
            {
                label: source.label,
                scope: "Maintained in the private research snapshot.",
            },
        ]),
    ),
};
for (const source of Object.values(publicReference.sources)) {
    assert.deepEqual(Object.keys(source).sort(), ["label", "scope"]);
}
output("reference", publicReference);

const tools = read("tool-catalog");
const publicTools = {
    ...tools,
    revision: "private",
    context: {
        ...tools.context,
        sources: [],
        aliases: tools.context.aliases.map((alias) => ({ ...alias, sources: [] })),
    },
    tools: tools.tools.map((tool) => ({ ...tool, sources: [] })),
};
assert.equal(publicTools.context.sources.length, 0);
assert(publicTools.context.aliases.every((alias) => alias.sources.length === 0));
assert(publicTools.tools.every((tool) => tool.sources.length === 0));
output("tool-catalog", publicTools);

const prompts = read("builtin-prompts");
const publicPrompts = {
    ...prompts,
    revision: "private",
    sections: prompts.sections.map((section) => ({ ...section, source: "" })),
};
assert(publicPrompts.sections.every((section) => section.source === ""));
output("builtin-prompts", publicPrompts);

const models = read("model-catalog");
const publicModels = { modelIds: models.modelIds };
assert.deepEqual(Object.keys(publicModels), ["modelIds"]);
output("model-catalog", publicModels);

console.log(
    check ? "Public content snapshots are current and sanitized." : "Public content snapshots generated.",
);
