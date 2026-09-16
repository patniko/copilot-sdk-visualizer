// Copyright (c) Microsoft Corporation. All rights reserved.
import ts from "typescript";
import { describe, expect, it } from "vitest";
import { createCustomTool, createMcpServer, parsePlan } from "./plan";
import { createPreset } from "./presets";
import { downloadName, exportPlan, generateSdkCode } from "./export";

function inspectConfiguration(code: string) {
    const file = ts.createSourceFile("harness.ts", code, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
    let client: ts.ObjectLiteralExpression | undefined;
    let session: ts.ObjectLiteralExpression | undefined;
    function visit(node: ts.Node) {
        if (ts.isNewExpression(node) && node.expression.getText(file) === "CopilotClient") {
            const options = node.arguments?.[0];
            if (options && ts.isObjectLiteralExpression(options)) client = options;
        }
        if (ts.isCallExpression(node) && node.expression.getText(file) === "client.createSession") {
            const options = node.arguments[0];
            if (options && ts.isObjectLiteralExpression(options)) session = options;
        }
        ts.forEachChild(node, visit);
    }
    visit(file);
    const fields = (value: ts.ObjectLiteralExpression | undefined) =>
        new Map(
            value?.properties
                .filter(ts.isPropertyAssignment)
                .map((property) => [property.name.getText(file), property.initializer.getText(file)]) ?? [],
        );
    return { client: fields(client), session: fields(session) };
}

describe("plan and SDK exports", () => {
    it.each(["empty", "minimal", "copilot"] as const)(
        "emits parseable TypeScript for %s without running a runtime",
        (preset) => {
            const plan = createPreset(preset);
            const code = generateSdkCode(plan);
            const result = ts.transpileModule(code, {
                compilerOptions: {
                    target: ts.ScriptTarget.ES2023,
                    module: ts.ModuleKind.ESNext,
                    strict: true,
                },
                reportDiagnostics: true,
            });
            expect(
                result.diagnostics?.filter(
                    (diagnostic) => diagnostic.category === ts.DiagnosticCategory.Error,
                ),
            ).toEqual([]);
            const fields = inspectConfiguration(code);
            expect(fields.client.get("mode")).toBe(JSON.stringify(plan.clientMode));
            expect(fields.session.has("mode")).toBe(false);
            expect(fields.session.has("onPermissionRequest")).toBe(true);
            expect(parsePlan(exportPlan(plan))).toEqual(plan);
        },
    );

    it("distinguishes an explicit empty inventory from omitted coding defaults", () => {
        expect(
            inspectConfiguration(generateSdkCode(createPreset("empty"))).session.get("availableTools"),
        ).toBe("[]");
        expect(
            inspectConfiguration(generateSdkCode(createPreset("copilot"))).session.has("availableTools"),
        ).toBe(false);
    });

    it("replaces the implementation with an explicit marker and source-independent filter", () => {
        const plan = createPreset("minimal");
        plan.tools.view.action = "override";
        const code = generateSdkCode(plan);
        expect(code).toContain('defineTool("view"');
        expect(code).toContain("overridesBuiltInTool: true");
        expect(code).toContain('handler: toolHandler(host, "view")');
        const selected = inspectConfiguration(code).session.get("availableTools");
        expect(selected).toContain('"view"');
        expect(selected).not.toContain('"builtin:view"');
    });

    it("preserves explicit MCP wire names without inventing prefixes or broadening exposure", () => {
        const plan = createPreset("minimal");
        const server = createMcpServer("id");
        server.tools[0] = { name: "search", wireName: "discovered-canonical-name" };
        plan.mcpServers = [server];
        const fields = inspectConfiguration(generateSdkCode(plan));
        expect(fields.session.get("availableTools")).toContain("mcp:discovered-canonical-name");
        expect(fields.session.get("availableTools")).not.toContain("mcp:*");
        expect(fields.session.get("mcpServers")).toContain('"tools": ["search"]');
    });

    it("exports references and guarded callbacks, never a credential value", () => {
        const plan = createPreset("minimal");
        plan.model.provider = "azure";
        plan.model.endpoint = "https://example.openai.azure.com/openai/v1";
        plan.model.credentialEnv = "SERVICE_MODEL_KEY";
        const code = generateSdkCode(plan);
        expect(code).toContain('process.env["SERVICE_MODEL_KEY"]');
        expect(code).not.toContain("approveAll");
        expect(code).toContain(
            'required(host.callbacks.createSessionFsProvider, "session filesystem provider")',
        );
        plan.model.credential = "bearer-callback";
        expect(generateSdkCode(plan)).toContain(
            'required(host.providerToken, "provider bearer-token callback")',
        );
        expect(generateSdkCode(plan)).not.toContain("process.env[");
    });

    it.each(["managed", "inprocess", "external"] as const)(
        "generates placement-correct S2S authentication for %s runtimes",
        (runtime) => {
            const plan = createPreset("minimal");
            plan.identity = "s2s-installation";
            plan.target.runtime = runtime;
            const code = generateSdkCode(plan);
            const fields = inspectConfiguration(code);
            expect(code).not.toContain("GITHUB_TOKEN_EXPIRES_AT");
            expect(code).not.toContain("gitHubTokenProvider");
            expect(fields.session.has("gitHubTokenProvider")).toBe(false);
            if (runtime === "managed") {
                expect(fields.client.get("useLoggedInUser")).toBe("false");
                expect(fields.client.get("env")).toContain("COPILOT_GITHUB_TOKEN");
            } else if (runtime === "inprocess") {
                expect(fields.client.get("useLoggedInUser")).toBe("false");
                expect(fields.client.has("env")).toBe(false);
                expect(code).toContain("before runtime load");
            } else {
                expect(fields.client.has("env")).toBe(false);
                expect(fields.client.has("useLoggedInUser")).toBe(false);
                expect(code).toContain("connecting client must not receive or inject");
            }
        },
    );

    it("preserves unusual JSON keys without emitting prototype-setting object literals", () => {
        const plan = createPreset("empty");
        const tool = createCustomTool("tool", "constructor");
        tool.parameters = '{"type":"object","properties":{"__proto__":{"type":"string"}}}';
        plan.customTools = [tool];
        const code = generateSdkCode(plan);
        expect(code).toContain('["__proto__"]:');
        expect(code).toContain("Object.hasOwn(host.toolHandlers, name)");
        expect(code).toContain('typeof handler !== "function"');
    });

    it("fails invalid exports and produces safe filenames", () => {
        const plan = createPreset("empty");
        plan.inventory = "coding-defaults";
        expect(() => generateSdkCode(plan)).toThrow();
        plan.name = "../Example harness /";
        expect(downloadName(plan, "json")).toBe("example-harness.json");
    });
});
