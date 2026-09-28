// Copyright (c) Microsoft Corporation. All rights reserved.
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const OUTPUT = fileURLToPath(new URL("../src/content/model-catalog.json", import.meta.url));
const SDK_SOURCE = "nodejs/src/client.ts";
const RUNTIME_SOURCE = "files/session-limit-baseline/session_limit_public_models.json";
const args = process.argv.slice(2);

if (args.includes("--help")) {
    process.stdout.write(
        "Usage: node script/capture-model-catalog.mjs [--run | --check] <sdk-checkout> <runtime-checkout>\n\n" +
            "Reads each checkout's committed HEAD, without fetching or running the SDK/runtime.\n" +
            "Captures the runtime's generated HELP_VISIBLE_MODELS list, not account entitlements.\n" +
            "Default: print a summary without writing files.\n" +
            "--run: write only src/content/model-catalog.json.\n" +
            "--check: compare the existing snapshot with those source revisions.\n",
    );
    process.exit(0);
}

const run = args.includes("--run");
const check = args.includes("--check");
const positional = args.filter((argument) => !argument.startsWith("--"));
assert(!(run && check), "Choose --run or --check, not both.");
assert(
    args.every((argument) => !argument.startsWith("--") || ["--run", "--check"].includes(argument)),
    "Unknown option; see --help.",
);
assert.equal(positional.length, 2, "Supply the SDK and runtime checkouts; see --help.");
const [sdkRoot, runtimeRoot] = positional.map((root) => path.resolve(root));

function git(root, ...arguments_) {
    return execFileSync("git", arguments_, {
        cwd: root,
        encoding: "utf8",
        maxBuffer: 4 * 1024 * 1024,
        stdio: ["ignore", "pipe", "pipe"],
    });
}

const sdk = git(sdkRoot, "rev-parse", "HEAD").trim();
const runtime = git(runtimeRoot, "rev-parse", "HEAD").trim();
const client = git(sdkRoot, "show", `${sdk}:${SDK_SOURCE}`);
assert(
    client.includes("async listModels()") && client.includes('sendRequest("models.list", {})'),
    "SDK model discovery has changed; review the source before refreshing this catalog.",
);
const modelIds = JSON.parse(git(runtimeRoot, "show", `${runtime}:${RUNTIME_SOURCE}`));
assert(Array.isArray(modelIds) && modelIds.length > 0, "The public model list must be a nonempty array.");
assert(
    modelIds.every((id) => typeof id === "string" && /^[a-z0-9][a-z0-9.-]{0,119}$/.test(id)),
    "The public model list contains an invalid model ID.",
);
assert.equal(new Set(modelIds).size, modelIds.length, "The public model list contains duplicate IDs.");

const snapshot = {
    revisions: { sdk, runtime },
    sources: {
        sdk: `https://github.com/github/copilot-sdk/blob/${sdk}/${SDK_SOURCE}`,
        runtime: `https://github.com/github/copilot-agent-runtime/blob/${runtime}/${RUNTIME_SOURCE}`,
    },
    modelIds,
};
if (run) writeFileSync(OUTPUT, JSON.stringify(snapshot, null, 4) + "\n");
if (check) {
    assert.deepEqual(
        JSON.parse(readFileSync(OUTPUT, "utf8")),
        snapshot,
        "The bundled catalog differs from the source checkouts. Review and refresh with --run.",
    );
}
process.stdout.write(
    `${modelIds.length} public model IDs; SDK ${sdk}; runtime ${runtime}${run ? " (written)" : check ? " (matches)" : " (no files written)"}.\n`,
);
