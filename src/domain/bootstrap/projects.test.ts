// Copyright (c) Microsoft Corporation. All rights reserved.
import { describe, expect, it } from "vitest";
import { createPreset } from "../presets";
import { buildBootstrapProject } from "./index";
import { parsePlan } from "../plan";
import { LANGUAGE_IDS, RUNTIME_KINDS } from "../target";
import { createBootstrapArchive } from "./archive";
import { unzipSync } from "fflate";

describe("integrated language project contracts", () => {
    it("packages all eighteen language/runtime combinations for a supported local-state plan", () => {
        const manifests = {
            typescript: "package.json",
            python: "requirements.txt",
            go: "go.mod",
            csharp: "HarnessAgent.csproj",
            java: "pom.xml",
            rust: "Cargo.toml",
        };
        for (const language of LANGUAGE_IDS)
            for (const runtime of RUNTIME_KINDS) {
                const plan = createPreset("empty");
                plan.target.language = language;
                plan.target.runtime = runtime;
                const result = buildBootstrapProject(plan);
                expect(result.ok, `${language}/${runtime}`).toBe(true);
                if (!result.ok) throw new Error(JSON.stringify(result.blockers));
                const paths = result.project.files.map((file) => file.path);
                expect(paths, `${language}/${runtime}`).toContain(manifests[language]);
                expect(paths).toContain("README.md");
                expect(paths).toContain("harness-plan.json");
                expect(result.project.files.some((file) => file.content.includes("__SDK_COMMIT__"))).toBe(
                    false,
                );
                const zipped = unzipSync(createBootstrapArchive(result.project));
                expect(Object.keys(zipped)).toHaveLength(paths.length);
            }
    });
    it.each(["typescript", "python", "go", "csharp", "java", "rust"] as const)(
        "returns a complete %s project with exact environment names",
        (language) => {
            const plan = createPreset("empty");
            plan.target.language = language;
            plan.target.runtime = "external";
            const result = buildBootstrapProject(plan);
            expect(result.ok).toBe(true);
            if (!result.ok) throw new Error(JSON.stringify(result.blockers));
            const files = new Map(result.project.files.map((file) => [file.path, file.content]));
            const env = files.get(".env.example") ?? "";
            for (const requirement of result.project.requirements) {
                if (requirement.environmentVariable)
                    expect(env).toContain(`${requirement.environmentVariable}=`);
                expect(files.has(requirement.file), `Missing integration file ${requirement.file}`).toBe(
                    true,
                );
            }
            expect(env).toContain("GITHUB_TOKEN_EXPIRES_AT=");
            expect(env).toContain("COPILOT_CONNECTION_TOKEN=");
            expect(parsePlan(files.get("harness-plan.json") ?? "")).toEqual(plan);
            if (language === "typescript") {
                expect(JSON.parse(files.get("package.json") ?? "{}").scripts.check).toContain("--check");
            } else {
                expect(result.project.commands.check).toContain("--check");
            }
            expect(result.project.commands.run).not.toContain("--check");
        },
    );

    it("preserves an inactive managed path without passing it to another transport", () => {
        const plan = createPreset("empty");
        plan.target.language = "go";
        plan.target.runtime = "inprocess";
        plan.target.cliPath = "/retained/child/runtime";
        const result = buildBootstrapProject(plan);
        expect(result.ok).toBe(true);
        if (!result.ok) throw new Error("Expected a valid active native target.");
        const files = new Map(result.project.files.map((file) => [file.path, file.content]));
        expect(JSON.parse(files.get("config/host.json") ?? "{}").cliPath).toBe("");
        expect(parsePlan(files.get("harness-plan.json") ?? "").target.cliPath).toBe(
            "/retained/child/runtime",
        );
    });

    it("blocks Java virtual storage rather than silently using disk", () => {
        const plan = createPreset("minimal");
        plan.target.language = "java";
        const result = buildBootstrapProject(plan);
        expect(result.ok).toBe(false);
        if (result.ok) throw new Error("Java's missing SessionFs surface must not be hidden.");
        expect(result.blockers.some((blocker) => blocker.fields.includes("session.storage"))).toBe(true);
    });

    it.each(["typescript", "python", "go", "csharp", "java", "rust"] as const)(
        "keeps BYOK credential ownership consistent for %s",
        (language) => {
            const plan = createPreset("empty");
            plan.target.language = language;
            plan.model.provider = "openai";
            plan.model.endpoint = "https://example.com/v1";
            const result = buildBootstrapProject(plan);
            if (!result.ok) throw new Error(JSON.stringify(result.blockers));
            const env = result.project.files.find((file) => file.path === ".env.example")?.content ?? "";
            expect(env).toContain("MODEL_API_KEY=");
            expect(env).not.toContain("GITHUB_TOKEN=");
        },
    );
});
