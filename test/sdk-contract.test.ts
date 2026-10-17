// Copyright (c) Microsoft Corporation. All rights reserved.
import { existsSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import ts from "typescript";
import { expect, it } from "vitest";
import {
    HOST_HANDLERS,
    LIFECYCLE_HOOKS,
    createAgent,
    createCustomTool,
    createMcpServer,
} from "../src/domain/plan";
import { createPreset } from "../src/domain/presets";
import { generateSdkCode } from "../src/domain/export";
import { buildBootstrapProject } from "../src/domain/bootstrap";

const sdkInput = process.env.COPILOT_SDK_SOURCE;

it.skipIf(!sdkInput)(
    "type-checks generated sketches against an explicitly supplied SDK checkout",
    async () => {
        if (!sdkInput) return;
        const input = sdkInput;
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
        varied.policy = { ...varied.policy, permissionMode: "host", preToolHook: true, postToolHook: true };
        const allowAll = createPreset("minimal");
        allowAll.policy.permissionMode = "allow-all";
        const extended = createPreset("copilot");
        extended.customTools = [
            { ...createCustomTool("deferred", "lookup_record"), defer: "auto", skipPermission: true },
        ];
        extended.agents = [
            {
                ...createAgent("agent"),
                displayName: "Reviewer",
                hooks: '{ "preToolUse": [ { "type": "command", "bash": "./check.sh" } ] }',
            },
        ];
        extended.excludedBuiltinAgents = ["rubber-duck"];
        extended.context = {
            ...extended.context,
            agentDirectories: ["./agents"],
            hookDirectories: ["./hooks"],
            instructionDirectories: ["./instructions"],
            additionalDirectories: ["./shared"],
            skillProvider: true,
            includedBuiltinSkills: ["customize-cloud-agent"],
            customInstructions: "load",
            onDemandInstructions: true,
            refreshCustomInstructions: true,
            organizationInstructions: "Follow the organization's review policy.",
        };
        extended.policy = {
            ...extended.policy,
            hooks: [...LIFECYCLE_HOOKS],
            handlers: [...HOST_HANDLERS],
            managed: {
                load: true,
                enforceModelDefaults: true,
                deny: ["Shell(rm)"],
                ask: ["Write"],
                allow: ["Read"],
                limitTo: ["Domain(*.example.com)"],
                disableBypassPermissionsMode: "disable",
                disableAssistedPermissionsMode: true,
            },
        };
        extended.model = {
            ...extended.model,
            id: "auto",
            autoTier: "balance",
            reasoningSummary: "concise",
            allowedModels: ["claude-sonnet-5.5", "gpt-6-sol"],
        };
        extended.capabilities = {
            imageGeneration: true,
            toolSearch: "enabled",
            toolSearchDeferThreshold: 20,
            askUserVariant: "elicitation",
        };
        extended.session = {
            ...extended.session,
            name: "release-review",
            interactiveUser: true,
            diagnostics: "warning",
            sessionStore: true,
            fileChangeTracking: true,
            allowTranscriptRecovery: false,
            continuePendingWork: true,
        };
        extended.events = { ...extended.events, subAgentStreaming: false, logLevel: "info" };
        extended.output = {
            responseSchema: '{ "type": "object", "properties": { "summary": { "type": "string" } } }',
        };
        const byok = createPreset("minimal");
        byok.model = {
            ...byok.model,
            provider: "openai",
            endpoint: "http://localhost:11434/v1",
            modelProvider: "ollama",
            wireModel: "llama3.3",
            maxPromptTokens: 100_000,
            maxOutputTokens: 8_000,
        };

        const variants = [
            createPreset("empty"),
            createPreset("minimal"),
            createPreset("copilot"),
            varied,
            allowAll,
            extended,
            byok,
        ];
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
            .filter(
                (diagnostic) => !diagnostic.file || generated.has(path.resolve(diagnostic.file.fileName)),
            );
        const formatted = ts.formatDiagnosticsWithColorAndContext(diagnostics, {
            getCanonicalFileName: (filename) => filename,
            getCurrentDirectory: () => process.cwd(),
            getNewLine: () => "\n",
        });
        expect(diagnostics, formatted).toEqual([]);
    },
);

it.skipIf(!sdkInput)(
    "type-checks complete TypeScript bootstrap projects against an explicitly supplied SDK checkout",
    async () => {
        if (!sdkInput) return;
        const sdkSource = path.resolve(sdkInput);
        const extended = createPreset("copilot");
        extended.target.language = "typescript";
        extended.policy = {
            ...extended.policy,
            preToolHook: true,
            postToolHook: true,
            hooks: [...LIFECYCLE_HOOKS],
            handlers: [...HOST_HANDLERS],
        };
        extended.context.skillProvider = true;
        extended.capabilities.askUserVariant = "elicitation";
        extended.model.allowedModels = ["claude-sonnet-5.5"];
        extended.output.responseSchema =
            '{ "type": "object", "properties": { "ok": { "type": "boolean" } } }';
        const plans = [createPreset("minimal"), createPreset("copilot"), extended].map((plan) => ({
            ...plan,
            target: { ...plan.target, language: "typescript" as const },
        }));
        const files: string[] = [];
        for (const [index, plan] of plans.entries()) {
            const result = buildBootstrapProject(plan);
            if (!result.ok) throw new Error(result.blockers.map((blocker) => blocker.detail).join("\n"));
            const root = path.resolve(`.test-artifacts/sdk-contract/project-${index}`);
            for (const file of result.project.files) {
                if (!file.path.startsWith("src/") && file.path !== "integration.json") continue;
                const target = path.join(root, file.path);
                await mkdir(path.dirname(target), { recursive: true });
                await writeFile(target, file.content);
                if (file.path.endsWith(".ts")) files.push(target);
            }
        }
        const program = ts.createProgram(files, {
            noEmit: true,
            strict: true,
            skipLibCheck: true,
            target: ts.ScriptTarget.ES2023,
            module: ts.ModuleKind.ESNext,
            moduleResolution: ts.ModuleResolutionKind.Bundler,
            types: ["node"],
            paths: { "@github/copilot-sdk": [sdkSource] },
        });
        const generated = new Set(files);
        const diagnostics = ts
            .getPreEmitDiagnostics(program)
            .filter(
                (diagnostic) => !diagnostic.file || generated.has(path.resolve(diagnostic.file.fileName)),
            );
        const formatted = ts.formatDiagnosticsWithColorAndContext(diagnostics, {
            getCanonicalFileName: (filename) => filename,
            getCurrentDirectory: () => process.cwd(),
            getNewLine: () => "\n",
        });
        expect(diagnostics, formatted).toEqual([]);
    },
);
