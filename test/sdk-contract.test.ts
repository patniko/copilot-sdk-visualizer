// Copyright (c) Microsoft Corporation. All rights reserved.
import { existsSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import ts from "typescript";
import { expect, it } from "vitest";
import { createAgent, createCustomTool, createMcpServer } from "../src/domain/plan";
import { createPreset } from "../src/domain/presets";
import { generateSdkCode } from "../src/domain/export";

it("type-checks generated sketches against an explicitly supplied SDK checkout", async () => {
    const input = process.env.COPILOT_SDK_SOURCE;
    if (!input)
        throw new Error("Set COPILOT_SDK_SOURCE to the SDK's nodejs/src/index.ts for this optional check.");
    const sdkSource = path.resolve(input);
    if (!existsSync(sdkSource)) throw new Error(`SDK entrypoint does not exist: ${sdkSource}`);
    const output = path.resolve(".test-artifacts/sdk-contract");
    await mkdir(output, { recursive: true });

    const varied = createPreset("minimal");
    varied.tools.view.action = "override";
    varied.customTools = [createCustomTool("custom", "lookup_record")];
    varied.mcpServers = [createMcpServer("mcp")];
    varied.agents = [createAgent("agent")];
    varied.selectedAgent = "reviewer";
    varied.rootExcludedTools = ["lookup_record"];
    varied.prompt = {
        mode: "customize",
        content: "Host guidance",
        sections: [{ name: "tone", action: "replace", content: "Be direct." }],
    };
    varied.policy = { preToolHook: true, postToolHook: true };

    const variants = [createPreset("empty"), createPreset("minimal"), createPreset("copilot"), varied];
    for (const provider of ["openai", "azure", "anthropic"] as const) {
        const plan = createPreset("minimal");
        plan.model.provider = provider;
        plan.model.endpoint = "https://example.com/v1";
        plan.model.credential = provider === "azure" ? "bearer-callback" : "api-key";
        variants.push(plan);
        variants.push({ ...plan, model: { ...plan.model, endpoint: "" } });
    }
    for (const runtime of ["managed", "external", "inprocess"] as const) {
        const plan = createPreset("minimal");
        plan.identity = "s2s-installation";
        plan.target.runtime = runtime;
        variants.push(plan);
    }
    const files: string[] = [];
    for (let index = 0; index < variants.length; index++) {
        const plan = variants[index];
        if (!plan) throw new Error("A generated variant is missing.");
        const filename = path.join(output, `harness-${index}.ts`);
        await writeFile(filename, generateSdkCode(plan));
        files.push(filename);
    }
    const program = ts.createProgram(files, {
        noEmit: true,
        strict: true,
        skipLibCheck: true,
        noUncheckedIndexedAccess: true,
        target: ts.ScriptTarget.ES2023,
        module: ts.ModuleKind.ESNext,
        moduleResolution: ts.ModuleResolutionKind.Bundler,
        allowSyntheticDefaultImports: true,
        resolveJsonModule: true,
        types: ["node"],
        paths: { "@github/copilot-sdk": [sdkSource] },
    });
    const generated = new Set(files);
    const diagnostics = ts
        .getPreEmitDiagnostics(program)
        .filter((diagnostic) => !diagnostic.file || generated.has(path.resolve(diagnostic.file.fileName)));
    const formatted = ts.formatDiagnosticsWithColorAndContext(diagnostics, {
        getCanonicalFileName: (filename) => filename,
        getCurrentDirectory: () => process.cwd(),
        getNewLine: () => "\n",
    });
    expect(diagnostics, formatted).toEqual([]);
});
