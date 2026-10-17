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

    it("names the session keys that schema v3 options actually export", () => {
        const plan = createPreset("minimal");
        plan.context.onDemandInstructions = true;
        plan.context.refreshCustomInstructions = true;
        plan.policy.managed.load = true;
        plan.policy.managed.enforceModelDefaults = true;
        plan.session.interactiveUser = true;
        plan.session.sessionStore = true;
        plan.session.fileChangeTracking = true;
        plan.context.agentDirectories = ["./agents"];
        plan.context.hookDirectories = ["./hooks"];
        plan.context.instructionDirectories = ["./instructions"];
        plan.context.additionalDirectories = ["../shared"];
        plan.context.includedBuiltinSkills = ["skill-one"];
        plan.excludedBuiltinAgents = ["builtin-one"];
        const data: Record<string, unknown> = sessionData(plan);
        for (const help of [
            toggleHelp.onDemandInstructions,
            toggleHelp.refreshCustomInstructions,
            toggleHelp.managedLoad,
            toggleHelp.enforceModelDefaults,
            toggleHelp.interactiveUser,
            toggleHelp.sessionStore,
            toggleHelp.fileChangeTracking,
        ])
            expect(data[help.option], help.title).toBe(true);
        for (const help of [
            valueHelp.agentDirectories,
            valueHelp.hookDirectories,
            valueHelp.instructionDirectories,
            valueHelp.additionalDirectories,
            valueHelp.includedBuiltinSkills,
            valueHelp.excludedBuiltinAgents,
        ])
            expect(Array.isArray(data[help.option]), help.title).toBe(true);
        plan.events.subAgentStreaming = false;
        expect(
            sessionData(plan)[toggleHelp.subAgentStreaming.option as "includeSubAgentStreamingEvents"],
        ).toBe(false);
    });

    it("labels experimental options and keeps GitHub-internal surfaces out of help", () => {
        for (const help of [toggleHelp.skillProvider, toggleHelp.imageGeneration])
            expect(help.scope).toContain("Experimental");
        expect(toggleHelp.disableAssisted.boundary).toContain("experimental");
        expect(toggleHelp.skillProvider.boundary).toContain("resume");
        expect(toggleHelp.imageGeneration.boundary).toContain("bring-your-own");
        const text = JSON.stringify([toggleHelp, valueHelp]);
        for (const internal of [
            "github_sql",
            "GitHubCacheStore",
            "session_artifacts",
            "session_history",
            "get_context_remaining",
            "new_context",
            "catalog_select",
            "factories",
        ])
            expect(text).not.toContain(internal);
    });
});
