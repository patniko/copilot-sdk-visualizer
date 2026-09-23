#!/usr/bin/env node
// Copyright (c) Microsoft Corporation. All rights reserved.
import assert from "node:assert/strict";
import { readFileSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const html = readFileSync(`${root}/dist/index.html`, "utf8");
const entry = html.match(/<script[^>]+src="\.\/(assets\/index-[^"]+\.js)"/)?.[1];
assert(entry, "The production build does not contain an initial JavaScript entry.");

const bytes = statSync(`${root}/dist/${entry}`).size;
const budget = 500_000;
assert(
    bytes <= budget,
    `Initial JavaScript is ${(bytes / 1000).toFixed(2)} kB; the budget is ${(budget / 1000).toFixed(0)} kB.`,
);
console.log(`Initial JavaScript: ${(bytes / 1000).toFixed(2)} kB / ${(budget / 1000).toFixed(0)} kB.`);
