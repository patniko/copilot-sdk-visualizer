// Copyright (c) Microsoft Corporation. All rights reserved.
import { describe, expect, it } from "vitest";
import { contextToggleHelp } from "./context-help";
import { toggleHelp, valueHelp } from "./setting-help";
import { createPreset } from "../domain/presets";
import { createCustomTool } from "../domain/plan";
import { generateSdkCode } from "../domain/export";
import { sessionData } from "../domain/bootstrap/common";

describe("shared educational help", () => {
    it("marks GitHub App identity as coming soon and feature-flagged", () => {
        const identity = valueHelp.identity.details.find((detail) => detail.value === "s2s-installation");
        expect(identity?.title).toContain("coming soon");
        expect(identity?.text).toContain("behind a feature flag");
        expect(identity?.text).toContain("GitHub enablement for your account or organization");
    });

    it("provides behavior, examples, boundaries, and provenance for every explanation", () => {
        for (const help of [
            ...Object.values(contextToggleHelp),
            ...Object.values(toggleHelp),
            ...Object.values(valueHelp),
        ]) {
            expect(help.title.length).toBeGreaterThan(3);
            expect(help.summary.length).toBeGreaterThan(20);
            expect(help.example.length).toBeGreaterThan(20);
            expect(help.boundary.length).toBeGreaterThan(20);
            expect(help.sources.length).toBeGreaterThan(0);
            for (const source of help.sources) {
                expect(source.label.length).toBeGreaterThan(3);
                expect(source.url).toBeUndefined();
            }
            if ("details" in help) {
                expect(help.scope).not.toBe("");
                expect(help.details.length).toBeGreaterThan(0);
            } else {
                expect(help.enabled.length).toBeGreaterThan(20);
                expect(help.disabled.length).toBeGreaterThan(20);
            }
        }
    });

    it("distinguishes callback bindings from boolean SDK options", () => {
        const plan = createPreset("minimal");
        for (const enabled of [false, true]) {
            plan.policy.preToolHook = enabled;
            plan.policy.postToolHook = enabled;
            plan.events.observer = enabled;
            const code = generateSdkCode(plan);
            expect(code.includes("onPreToolUse: required(")).toBe(enabled);
            expect(code.includes("onPostToolUse: required(")).toBe(enabled);
            expect(code.includes("onEvent: required(")).toBe(enabled);
            expect(code).not.toContain("onPreToolUse: true");
        }
        expect(toggleHelp.preToolHook.valueLabels.enabled).toContain("callback");
        expect(toggleHelp.observer.disabled).toContain("subscribe later");
        expect(toggleHelp.postToolHook.boundary).toContain("onPostToolUseFailure");
    });

    it("matches the actual state, output, and terminal-tool settings", () => {
        const plan = createPreset("empty");
        plan.customTools = [createCustomTool("tool", "submit_result")];
        const tool = plan.customTools[0];
        if (!tool) throw new Error("Missing fixture tool.");
        for (const enabled of [false, true]) {
            plan.session.infinite = enabled;
            plan.session.largeOutput = enabled;
            plan.events.streaming = enabled;
            tool.terminal = enabled;
            const session = sessionData(plan);
            expect(session.infiniteSessions.enabled).toBe(enabled);
            expect(session.largeOutput.enabled).toBe(enabled);
            expect(session.streaming).toBe(enabled);
            expect(generateSdkCode(plan).includes("isTerminal: true")).toBe(enabled);
        }
        expect(toggleHelp.largeOutput.boundary).toContain("temporary filesystem");
        expect(toggleHelp.terminal.boundary).toContain("does not stop the client process");
    });

    it("does not present host notes, startup settings, or model preferences as guarantees", () => {
        expect(valueHelp.idle.boundary).toContain("sendAndWait");
        expect(valueHelp.evaluation.scope).toContain("Host-owned");
        expect(valueHelp.storage.boundary).toContain("not universal");
        expect(valueHelp.agentModel.boundary).toContain("not a fail-if-unavailable guarantee");
        expect(valueHelp.runtime.boundary).toContain("not a sandbox");
        expect(valueHelp.rootExclusions.summary).toContain("retaining them for subagent use");
    });
});
