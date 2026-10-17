// Copyright (c) Microsoft Corporation. All rights reserved.
import { describe, expect, it } from "vitest";
import { unzipSync, strFromU8 } from "fflate";
import { createPreset } from "../presets";
import { buildBootstrapProject } from "./index";
import { createBootstrapArchive } from "./archive";
import { parsePlan } from "../plan";
import { COPILOT_CLI_VERSION, RUNTIME_SOURCE_REVISION } from "./revisions";

describe("complete TypeScript bootstrap project", () => {
    it.each(["managed", "external", "inprocess"] as const)(
        "packages an explicit %s connection and an actionable project",
        (runtime) => {
            const plan = createPreset("minimal");
            plan.target.runtime = runtime;
            const result = buildBootstrapProject(plan);
            expect(result.ok).toBe(true);
            if (!result.ok) throw new Error("Expected the TypeScript project.");
            const files = new Map(result.project.files.map((file) => [file.path, file.content]));
            expect(files.has("package.json")).toBe(true);
            expect(files.has("src/main.ts")).toBe(true);
            expect(files.has("src/host.ts")).toBe(true);
            expect(files.get("README.md")).toContain("Check the bootstrap before using a model");
            expect(files.get("src/main.ts")).toContain('process.argv.includes("--check")');
            expect(files.get("src/harness.ts")).toContain(
                runtime === "managed"
                    ? "RuntimeConnection.forStdio"
                    : runtime === "external"
                      ? "RuntimeConnection.forUri"
                      : "RuntimeConnection.forInProcess",
            );
            expect(files.get(".env.example")).toContain("GITHUB_TOKEN_EXPIRES_AT=");
            expect(files.get("setup-sdk.sh")).not.toContain("reset --hard");
            expect(files.get("package.json")).not.toContain('"@github/copilot-sdk": "0.0.0-dev"');
            const archive = unzipSync(createBootstrapArchive(result.project));
            const entry = archive[`${result.project.name}/harness-plan.json`];
            expect(entry).toBeDefined();
            if (!entry) throw new Error("Missing plan entry.");
            expect(parsePlan(strFromU8(entry))).toEqual(plan);
        },
    );

    it("keeps external server process settings out of client constructor options", () => {
        const plan = createPreset("copilot");
        plan.target.runtime = "external";
        const result = buildBootstrapProject(plan);
        if (!result.ok) throw new Error("Expected supported TypeScript.");
        const code = result.project.files.find((file) => file.path === "src/harness.ts")?.content ?? "";
        const constructor = code.split("new CopilotClient({")[1]?.split("});")[0] ?? "";
        expect(constructor).not.toContain("useLoggedInUser");
        expect(constructor).not.toContain("baseDirectory");
        expect(constructor).not.toContain("sessionIdleTimeoutSeconds");
        expect(result.project.notes.join("\n")).toContain("server-owned state");
    });

    it("requires host permission code by default and emits explicit allow-all only when selected", () => {
        const hostPlan = createPreset("empty");
        const hostResult = buildBootstrapProject(hostPlan);
        if (!hostResult.ok) throw new Error("Expected supported TypeScript.");
        const hostFiles = new Map(hostResult.project.files.map((file) => [file.path, file.content]));
        expect(hostFiles.get("src/host.ts")).toContain(
            'spec.permissionMode === "host" && !extensions.permissionPolicy',
        );
        expect(hostResult.project.requirements.find((item) => item.id === "permission-policy")).toMatchObject(
            {
                kind: "host-code",
            },
        );

        hostPlan.policy.permissionMode = "allow-all";
        const allowResult = buildBootstrapProject(hostPlan);
        if (!allowResult.ok) throw new Error("Expected supported TypeScript.");
        const allowFiles = new Map(allowResult.project.files.map((file) => [file.path, file.content]));
        expect(allowFiles.get("src/harness.ts")).toContain("onPermissionRequest: approveAll");
        expect(
            allowResult.project.requirements.find((item) => item.id === "permission-policy"),
        ).toMatchObject({
            kind: "review",
        });
    });

    it("builds the SDK from the runtime repository at the pinned CLI release", () => {
        const result = buildBootstrapProject(createPreset("minimal"));
        if (!result.ok) throw new Error("Expected supported TypeScript.");
        const files = new Map(result.project.files.map((file) => [file.path, file.content]));
        const setup = files.get("setup-sdk.sh") ?? "";
        expect(setup).toContain("https://github.com/github/copilot-agent-runtime.git");
        expect(setup).toContain(`SDK_REVISION=${RUNTIME_SOURCE_REVISION}`);
        expect(setup).toContain("sparse-checkout set --no-cone '/src/sdk/nodejs/'");
        expect(setup).toContain("'/third_party/build-tools/tsx-4.22.4/'");
        expect(setup).toContain(`node scripts/set-cli-version.js ${COPILOT_CLI_VERSION}`);
        expect(setup).toContain(
            "checkout --quiet -- src/sdk/nodejs/package.json src/sdk/nodejs/src/cliVersion.ts",
        );
        expect(setup.indexOf("set-cli-version")).toBeLessThan(setup.indexOf("run build"));
        expect(JSON.parse(files.get("package.json") ?? "{}").dependencies["@github/copilot-sdk"]).toBe(
            "file:.sdk-source/copilot-agent-runtime/src/sdk/nodejs",
        );
    });

    it("requires selected lifecycle hooks, handlers, and skill provider in host code", () => {
        const plan = createPreset("copilot");
        plan.policy.hooks = ["subagentStop", "userPromptSubmitted"];
        plan.policy.handlers = ["elicitation"];
        plan.context.skillProvider = true;
        plan.output.responseSchema = '{ "type": "object" }';
        const result = buildBootstrapProject(plan);
        if (!result.ok) throw new Error("Expected supported TypeScript.");
        const files = new Map(result.project.files.map((file) => [file.path, file.content]));
        const integration = JSON.parse(files.get("integration.json") ?? "{}");
        expect(integration.hooks).toEqual(["onSubagentStop", "onUserPromptSubmitted"]);
        expect(integration.handlers).toEqual(["onElicitationRequest"]);
        expect(integration.skillProvider).toBe(true);
        const host = files.get("src/host.ts") ?? "";
        expect(host).toContain("extensions.lifecycleHooks.${name}");
        expect(host).toContain("extensions.handlers.${name}");
        expect(host).toContain("extensions.skillProvider (real SkillProvider)");
        expect(files.get("src/main.ts")).toContain("sendAndWait({ prompt, responseSchema }");
        expect(files.get("HOST_INTEGRATION.md")).toContain("`onSubagentStop`");

        const plain = buildBootstrapProject(createPreset("copilot"));
        if (!plain.ok) throw new Error("Expected supported TypeScript.");
        const main = plain.project.files.find((file) => file.path === "src/main.ts")?.content ?? "";
        expect(main).toContain("sendAndWait({ prompt }");
        expect(main).not.toContain("responseSchema");
    });
});
