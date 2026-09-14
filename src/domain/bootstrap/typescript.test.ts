// Copyright (c) Microsoft Corporation. All rights reserved.
import { describe, expect, it } from "vitest";
import { unzipSync, strFromU8 } from "fflate";
import { createPreset } from "../presets";
import { buildBootstrapProject } from "./index";
import { createBootstrapArchive } from "./archive";
import { parsePlan } from "../plan";

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
});
