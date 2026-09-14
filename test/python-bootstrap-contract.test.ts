// Copyright (c) Microsoft Corporation. All rights reserved.
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { describe, expect, it } from "vitest";
import { BUILTIN_NAMES } from "../src/domain/plan";
import { createPreset } from "../src/domain/presets";
import { buildBootstrapProject } from "../src/domain/bootstrap";

describe("complete Python bootstrap", () => {
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
});
