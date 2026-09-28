// Copyright (c) Microsoft Corporation. All rights reserved.
import { describe, expect, it } from "vitest";
import { createPreset } from "./presets";
import { HarnessPlanSchema, parsePlan } from "./plan";
import { defaultTarget, runtimeEndpoint } from "./target";
import { loadDraft, STORAGE_KEY } from "./storage";
import { analyzePlan } from "./analysis";

describe("runtime target and legacy draft migration", () => {
    it("migrates a version 1 draft without changing its existing decisions", () => {
        const current = createPreset("copilot");
        current.name = "Existing edited draft";
        current.tools.view.action = "override";
        current.prompt.content = "Keep this exact host guidance.";
        const { target: _target, ...fields } = current;
        const legacy = { ...fields, schemaVersion: 1 };
        const migrated = parsePlan(JSON.stringify(legacy));
        expect(migrated).toEqual({ ...current, target: defaultTarget() });
        expect(migrated.schemaVersion).toBe(2);
    });

    it("keeps the saved legacy bytes intact until a user change", () => {
        const { target: _target, ...fields } = createPreset("minimal");
        const saved = JSON.stringify({ ...fields, schemaVersion: 1 });
        const writes: string[] = [];
        const loaded = loadDraft(() => ({
            getItem: (key) => (key === STORAGE_KEY ? saved : null),
            setItem: (_key, value) => {
                writes.push(value);
            },
        }));
        expect(loaded.blocked).toBe(false);
        expect(loaded.plan.target.runtime).toBe("managed");
        expect(writes).toEqual([]);
    });

    it("rejects ambiguous version 1 target data rather than overwriting it", () => {
        const plan = createPreset("empty");
        expect(() => parsePlan(JSON.stringify({ ...plan, schemaVersion: 1 }))).toThrow(/version 1/);
    });

    it("validates credential-free TCP endpoints and preserves IPv6 correctly", () => {
        const plan = createPreset("empty");
        plan.target.runtime = "external";
        plan.target.serverUrl = "tcp://[::1]:4321";
        expect(runtimeEndpoint(plan.target)).toEqual({ host: "::1", port: 4321, address: "[::1]:4321" });
        for (const url of [
            "https://example.com",
            "host",
            "host:99999",
            "tcp://user:secret@host:4321",
            "host:4321?token=value",
        ]) {
            plan.target.serverUrl = url;
            expect(HarnessPlanSchema.safeParse(plan).success, url).toBe(false);
        }
    });

    it("explains the boundary of each deployment choice", () => {
        const next = createPreset("minimal");
        next.target = { ...defaultTarget(), language: "python", runtime: "inprocess" };
        expect(analyzePlan(next).map((decision) => decision.id)).toContain("inprocess-runtime");
        next.target.runtime = "external";
        expect(analyzePlan(next).map((decision) => decision.id)).toContain("external-runtime");
    });
});
