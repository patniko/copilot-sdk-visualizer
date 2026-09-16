#!/usr/bin/env node
// Copyright (c) Microsoft Corporation. All rights reserved.
import { execFileSync } from "node:child_process";
import { existsSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const options = new Set(process.argv.slice(2));
const dryRun = options.has("--dry-run");
const allowDirty = options.has("--allow-dirty");

function output(command, args) {
    return execFileSync(command, args, {
        cwd: root,
        encoding: "utf8",
        stdio: ["ignore", "pipe", "inherit"],
    }).trim();
}

function run(command, args) {
    execFileSync(command, args, { cwd: root, stdio: "inherit" });
}

function pagesUrl(remote) {
    const match = remote.match(/github\.com[/:]([^/]+)\/([^/]+?)(?:\.git)?$/);
    return match ? `https://${match[1]}.github.io/${match[2]}/` : undefined;
}

function main() {
    if (options.has("--help")) {
        console.log(`Usage: pnpm deploy:pages [-- --dry-run] [-- --allow-dirty]

Build and publish dist/ to the gh-pages branch on origin.

  --dry-run      Build and validate without publishing.
  --allow-dirty  Permit a build from uncommitted source files.`);
        return;
    }

    const remote = output("git", ["remote", "get-url", "origin"]);
    const branch = output("git", ["branch", "--show-current"]);
    const revision = output("git", ["rev-parse", "--short", "HEAD"]);
    const dirty = output("git", ["status", "--porcelain"]);

    if (!branch) throw new Error("Deploy from a named branch, not a detached HEAD.");
    if (dirty && !allowDirty) {
        throw new Error(
            "The working tree has uncommitted changes. Commit them first, or pass --allow-dirty intentionally.",
        );
    }

    let upstream;
    try {
        upstream = output("git", ["rev-parse", "--abbrev-ref", "--symbolic-full-name", "@{upstream}"]);
    } catch {
        throw new Error(`Branch ${branch} has no upstream. Push the source branch before deploying.`);
    }

    const unpushed = Number(output("git", ["rev-list", "--count", `${upstream}..HEAD`]));
    if (unpushed > 0) {
        throw new Error(
            `${branch} has ${unpushed} unpushed commit${unpushed === 1 ? "" : "s"}. Push the source branch before deploying.`,
        );
    }

    run("pnpm", ["run", "build"]);
    if (!existsSync(`${root}/dist/index.html`)) throw new Error("The build did not produce dist/index.html.");
    writeFileSync(`${root}/dist/.nojekyll`, "");

    if (dryRun) {
        console.log(`Dry run complete: dist/ is ready for ${pagesUrl(remote) ?? remote}`);
        return;
    }

    run("pnpm", [
        "exec",
        "gh-pages",
        "--dist",
        "dist",
        "--branch",
        "gh-pages",
        "--repo",
        remote,
        "--message",
        `Deploy ${revision}`,
        "--dotfiles",
    ]);

    console.log(`Published ${revision} from ${branch} to ${pagesUrl(remote) ?? `${remote}#gh-pages`}`);
}

try {
    main();
} catch (error) {
    console.error(`Deploy failed: ${error instanceof Error ? error.message : String(error)}`);
    process.exitCode = 1;
}
