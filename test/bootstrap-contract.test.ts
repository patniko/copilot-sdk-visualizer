// Copyright (c) Microsoft Corporation. All rights reserved.
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { spawnSync } from "node:child_process";
import ts from "typescript";
import { expect, it } from "vitest";
import { createPreset } from "../src/domain/presets";
import { buildBootstrapProject } from "../src/domain/bootstrap";

it("type-checks the full TypeScript bootstrap against the selected SDK source", async () => {
    const sdk = process.env.COPILOT_SDK_SOURCE;
    if (!sdk) throw new Error("Set COPILOT_SDK_SOURCE for the optional contract checks.");
    const files: string[] = [];
    for (const runtime of ["managed", "external", "inprocess"] as const) {
        const plan = createPreset("minimal");
        plan.target.runtime = runtime;
        plan.tools.view.action = "override";
        plan.policy.preToolHook = true;
        plan.policy.postToolHook = true;
        const result = buildBootstrapProject(plan);
        if (!result.ok) throw new Error(JSON.stringify(result.blockers));
        const root = path.resolve(".test-artifacts/bootstrap-contract", runtime);
        for (const file of result.project.files) {
            const target = path.join(root, file.path);
            await mkdir(path.dirname(target), { recursive: true });
            await writeFile(target, file.content);
            if (file.path.endsWith(".ts")) files.push(target);
            if (file.path.endsWith(".sh")) {
                const syntax = spawnSync("bash", ["-n", target], { encoding: "utf8" });
                expect(syntax.status, syntax.stderr).toBe(0);
            }
        }
    }
    const program = ts.createProgram(files, {
        noEmit: true,
        strict: true,
        skipLibCheck: true,
        target: ts.ScriptTarget.ES2023,
        module: ts.ModuleKind.ESNext,
        moduleResolution: ts.ModuleResolutionKind.Bundler,
        allowSyntheticDefaultImports: true,
        resolveJsonModule: true,
        types: ["node"],
        paths: { "@github/copilot-sdk": [path.resolve(sdk)] },
    });
    const ownFiles = new Set(files);
    const diagnostics = ts
        .getPreEmitDiagnostics(program)
        .filter((diagnostic) => !diagnostic.file || ownFiles.has(path.resolve(diagnostic.file.fileName)));
    expect(
        diagnostics,
        ts.formatDiagnosticsWithColorAndContext(diagnostics, {
            getCanonicalFileName: (file) => file,
            getCurrentDirectory: () => process.cwd(),
            getNewLine: () => "\n",
        }),
    ).toEqual([]);
});

it("runs bootstrap preflight without constructing a runtime or invoking a model", async () => {
    const plan = createPreset("empty");
    const result = buildBootstrapProject(plan);
    if (!result.ok) throw new Error("Expected TypeScript project.");
    const root = path.resolve(".test-artifacts/bootstrap-preflight");
    for (const file of result.project.files) {
        const relative = file.path.endsWith(".ts")
            ? file.path.replace(/^src\//, "dist/").replace(/\.ts$/, ".js")
            : file.path;
        const target = path.join(root, relative);
        await mkdir(path.dirname(target), { recursive: true });
        await writeFile(
            target,
            file.path.endsWith(".ts")
                ? ts.transpileModule(file.content, {
                      compilerOptions: { target: ts.ScriptTarget.ES2023, module: ts.ModuleKind.ESNext },
                  }).outputText
                : file.content,
        );
    }
    const stub = path.join(root, "node_modules/@github/copilot-sdk");
    await mkdir(stub, { recursive: true });
    await writeFile(path.join(stub, "package.json"), '{"type":"module","exports":"./index.js"}');
    await writeFile(
        path.join(stub, "index.js"),
        'export class CopilotClient { constructor() { throw new Error("Preflight must not construct a runtime."); } } export const RuntimeConnection = {}; export function defineTool() { throw new Error("No tool registration during preflight."); }',
    );
    const env = {
        PATH: process.env.PATH ?? "",
        COPILOT_MODEL: "test-model",
        GITHUB_TOKEN: "preflight-fixture-only",
        GITHUB_TOKEN_EXPIRES_AT: String(Math.floor(Date.now() / 1000) + 300),
    };
    const checked = spawnSync(process.execPath, ["dist/main.js", "--check"], {
        cwd: root,
        env,
        encoding: "utf8",
    });
    expect(checked.status, checked.stderr).toBe(0);
    expect(checked.stdout).toContain("No runtime or model was started");
    expect(checked.stdout + checked.stderr).not.toContain("preflight-fixture-only");
    const missing = spawnSync(process.execPath, ["dist/main.js", "--check"], {
        cwd: root,
        env: { PATH: env.PATH },
        encoding: "utf8",
    });
    expect(missing.status).toBe(1);
    expect(missing.stderr).toContain("Missing environment");
});
