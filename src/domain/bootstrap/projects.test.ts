// Copyright (c) Microsoft Corporation. All rights reserved.
import { describe, expect, it } from "vitest";
import { createPreset } from "../presets";
import { buildBootstrapProject } from "./index";
import { parsePlan } from "../plan";
import { LANGUAGE_IDS, RUNTIME_KINDS } from "../target";
import { createBootstrapArchive } from "./archive";
import { unzipSync } from "fflate";

describe("integrated language project contracts", () => {
    it.each(LANGUAGE_IDS)(
        "defers missing provider endpoints to %s host code, not an export blocker",
        (language) => {
            const bindings = {
                typescript: { file: "src/host.ts", guard: "extensions.providerEndpoint?.trim()" },
                python: { file: "host.py", guard: "not PROVIDER_ENDPOINT.strip()" },
                go: { file: "host.go", guard: "strings.TrimSpace(ProviderEndpoint)" },
                csharp: { file: "Host.cs", guard: "ProviderEndpoint?.Trim()" },
                java: {
                    file: "src/main/java/harness/HostExtensions.java",
                    guard: "PROVIDER_ENDPOINT.isBlank()",
                },
                rust: { file: "src/host.rs", guard: "PROVIDER_ENDPOINT.trim()" },
            };
            for (const runtime of RUNTIME_KINDS)
                for (const provider of ["openai", "azure", "anthropic"] as const)
                    for (const endpoint of ["", " \t ", "https://inference.example.com/v1"]) {
                        const plan = createPreset("empty");
                        plan.target.language = language;
                        plan.target.runtime = runtime;
                        plan.model.provider = provider;
                        plan.model.endpoint = endpoint;
                        const result = buildBootstrapProject(plan);
                        if (!result.ok) throw new Error(JSON.stringify(result.blockers));
                        const files = new Map(result.project.files.map((file) => [file.path, file.content]));
                        const requirement = result.project.requirements.find(
                            (item) => item.id === "provider-endpoint",
                        );
                        expect(Boolean(requirement)).toBe(!endpoint.trim());
                        if (!endpoint.trim()) {
                            expect(requirement).toMatchObject({
                                kind: "host-code",
                                file: bindings[language].file,
                            });
                            expect(files.get(bindings[language].file)).toContain(bindings[language].guard);
                            expect(files.get(bindings[language].file)?.toLowerCase()).toContain(
                                "provider endpoint string",
                            );
                        }
                        expect(parsePlan(files.get("harness-plan.json") ?? "")).toEqual(plan);
                    }
            const copilot = createPreset("empty");
            copilot.target.language = language;
            const result = buildBootstrapProject(copilot);
            if (!result.ok) throw new Error(JSON.stringify(result.blockers));
            expect(result.project.requirements.map((item) => item.id)).not.toContain("provider-endpoint");
        },
    );

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

    it.each(["typescript", "python", "go", "csharp", "java", "rust"] as const)(
        "keeps S2S secrets at the %s runtime boundary for every placement",
        (language) => {
            const clientFiles = {
                typescript: "src/harness.ts",
                python: "agent.py",
                go: "main.go",
                csharp: "Program.cs",
                java: "src/main/java/harness/Configuration.java",
                rust: "src/config.rs",
            };
            const managedInjection = {
                typescript: "env:",
                python: 'client_options["env"]',
                go: "options.Env",
                csharp: "options.Environment",
                java: "options.setEnvironment",
                rust: "options.with_env",
            };
            for (const runtime of RUNTIME_KINDS) {
                const plan = createPreset("empty");
                plan.identity = "s2s-installation";
                plan.target.language = language;
                plan.target.runtime = runtime;
                const result = buildBootstrapProject(plan);
                expect(result.ok, `${language}/${runtime}`).toBe(true);
                if (!result.ok) throw new Error(JSON.stringify(result.blockers));
                const files = new Map(result.project.files.map((file) => [file.path, file.content]));
                const all = result.project.files.map((file) => file.content).join("\n");
                const code = result.project.files
                    .filter((file) => /\.(?:ts|py|go|cs|java|rs)$/.test(file.path))
                    .map((file) => file.content)
                    .join("\n");
                const client = files.get(clientFiles[language]) ?? "";
                const env = files.get(".env.example") ?? "";
                expect(all).not.toContain("GITHUB_TOKEN_EXPIRES_AT");
                expect(code).not.toMatch(
                    /gitHubTokenProvider|github_token_provider|GitHubTokenProvider|GitHubEnvironmentProvider|AcquireGitHubToken|acquireGitHubToken/,
                );
                expect(parsePlan(files.get("harness-plan.json") ?? "").identity).toBe("s2s-installation");
                if (runtime === "managed") {
                    expect(env).toContain("COPILOT_GITHUB_TOKEN=");
                    expect(client).toContain("COPILOT_GITHUB_TOKEN");
                    expect(client).toContain(managedInjection[language]);
                } else if (runtime === "inprocess") {
                    expect(env).toContain("COPILOT_GITHUB_TOKEN=");
                    expect(client).toContain("COPILOT_GITHUB_TOKEN");
                    expect(client).not.toContain(managedInjection[language]);
                } else {
                    expect(env).not.toContain("COPILOT_GITHUB_TOKEN=");
                    expect(client).not.toContain(managedInjection[language]);
                    expect(all).toContain("COPILOT_GITHUB_TOKEN");
                    expect(files.get("README.md")).toContain("connecting client");
                }
                expect(all).toContain("one-hour");
                expect(all).toContain("permissions.copilot_requests=write");
            }
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
