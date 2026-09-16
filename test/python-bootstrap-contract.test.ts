// Copyright (c) Microsoft Corporation. All rights reserved.
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { describe, expect, it } from "vitest";
import { BUILTIN_NAMES } from "../src/domain/plan";
import { createPreset } from "../src/domain/presets";
import { buildBootstrapProject } from "../src/domain/bootstrap";

describe("complete Python bootstrap", () => {
    it("fails deferred endpoints until a host string is provided, without starting the SDK", async () => {
        const plan = createPreset("empty");
        plan.target.language = "python";
        plan.model.provider = "openai";
        plan.model.id = "fixture-model";
        plan.model.endpoint = "";
        const result = buildBootstrapProject(plan);
        if (!result.ok) throw new Error(JSON.stringify(result.blockers));
        const root = path.resolve(".test-artifacts/python-bootstrap/deferred-endpoint");
        for (const file of result.project.files) {
            const target = path.join(root, file.path);
            await mkdir(path.dirname(target), { recursive: true });
            await writeFile(target, file.content);
        }
        const checked = spawnSync(
            "python3",
            [
                "-c",
                `
import sys, types, agent, host
tools = types.ModuleType("copilot.tools")
tools.Tool = object
sys.modules["copilot.tools"] = tools
data = agent.load_configuration()
for value in [None, "", "   "]:
    host.PROVIDER_ENDPOINT = value
    assert host.integration_blockers(data["plan"], data["tools"]) == [
        "Provide the provider endpoint string in host.py PROVIDER_ENDPOINT."
    ]
    try:
        agent.session_options(data)
    except NotImplementedError as error:
        assert "provider endpoint string" in str(error)
    else:
        raise AssertionError("Missing provider endpoint was accepted")
host.PROVIDER_ENDPOINT = "https://inference.example.test/v1"
assert host.integration_blockers(data["plan"], data["tools"]) == []
assert agent.session_options(data)["provider"]["base_url"] == host.PROVIDER_ENDPOINT
assert data["session"]["provider"]["base_url"] == ""
`,
            ],
            {
                cwd: root,
                env: { PATH: process.env.PATH ?? "", MODEL_API_KEY: "endpoint-fixture-only" },
                encoding: "utf8",
            },
        );
        expect(checked.status, checked.stderr).toBe(0);
    });

    it.each(["managed", "external", "inprocess"] as const)(
        "loads the complete %s configuration without an SDK or model call",
        async (runtime) => {
            const plan = createPreset("empty");
            plan.target.language = "python";
            plan.target.runtime = runtime;
            plan.target.cliPath = "/retained/managed-only/runtime";
            plan.model.endpoint = "https://retained-provider.example/v1";
            const result = buildBootstrapProject(plan);
            if (!result.ok) throw new Error(JSON.stringify(result.blockers));
            const root = path.resolve(".test-artifacts/python-bootstrap", runtime);
            for (const file of result.project.files) {
                const target = path.join(root, file.path);
                await mkdir(path.dirname(target), { recursive: true });
                await writeFile(target, file.content);
                if (file.path.endsWith(".py")) {
                    const syntax = spawnSync(
                        "python3",
                        ["-c", "import ast,sys; ast.parse(sys.stdin.read())"],
                        { input: file.content, encoding: "utf8" },
                    );
                    expect(syntax.status, syntax.stderr).toBe(0);
                }
                if (file.path.endsWith(".sh")) {
                    const syntax = spawnSync("bash", ["-n", target], { encoding: "utf8" });
                    expect(syntax.status, syntax.stderr).toBe(0);
                }
            }
            const loaded = spawnSync(
                "python3",
                ["-c", "import agent; data=agent.load_configuration(); print(len(data['plan']['tools']))"],
                { cwd: root, encoding: "utf8" },
            );
            expect(loaded.status, loaded.stderr).toBe(0);
            expect(loaded.stdout.trim()).toBe(String(BUILTIN_NAMES.length));
            const expiry = spawnSync(
                "python3",
                [
                    "-c",
                    "import os,time,host; os.environ['GITHUB_TOKEN_EXPIRES_AT']=str(int(time.time())+1800); print(host.github_remaining_lifetime()>0)",
                ],
                { cwd: root, encoding: "utf8" },
            );
            expect(expiry.status, expiry.stderr).toBe(0);
            expect(expiry.stdout.trim()).toBe("True");
        },
    );

    it.each(["managed", "external", "inprocess"] as const)(
        "keeps S2S authentication at the %s runtime boundary",
        async (runtime) => {
            const plan = createPreset("empty");
            plan.identity = "s2s-installation";
            plan.target.language = "python";
            plan.target.runtime = runtime;
            const result = buildBootstrapProject(plan);
            if (!result.ok) throw new Error(JSON.stringify(result.blockers));
            const files = new Map(result.project.files.map((file) => [file.path, file.content]));
            const agent = files.get("agent.py") ?? "";
            for (const file of result.project.files.filter((file) => file.path.endsWith(".py"))) {
                const syntax = spawnSync("python3", ["-c", "import ast,sys; ast.parse(sys.stdin.read())"], {
                    input: file.content,
                    encoding: "utf8",
                });
                expect(syntax.status, `${file.path}: ${syntax.stderr}`).toBe(0);
            }
            expect(agent).not.toContain("github_token_provider");
            expect(files.get("host.py")).not.toContain("GITHUB_TOKEN_EXPIRES_AT");
            if (runtime === "managed") {
                expect(agent).toContain('client_options["env"]');
                expect(agent).toContain("COPILOT_GITHUB_TOKEN");
            } else if (runtime === "inprocess") {
                expect(agent).not.toContain('client_options["env"]');
                expect(agent).toContain('required_environment("COPILOT_GITHUB_TOKEN")');
            } else {
                expect(agent).not.toContain("COPILOT_GITHUB_TOKEN");
                expect(files.get(".env.example")).not.toContain("COPILOT_GITHUB_TOKEN=");
                expect(result.project.commands.startRuntime).toContain("COPILOT_GITHUB_TOKEN");
            }
        },
    );
});
