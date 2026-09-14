// Copyright (c) Microsoft Corporation. All rights reserved.
import { describe, expect, it } from "vitest";
import { CONTEXT_TOGGLE_KEYS, contextToggleHelp } from "./context-help";
import { createPreset } from "../domain/presets";
import { sessionData } from "../domain/bootstrap/common";

describe("context toggle help", () => {
    it.each(CONTEXT_TOGGLE_KEYS)("explains the actual on/off export for %s", (key) => {
        const help = contextToggleHelp[key];
        const plan = createPreset("minimal");
        plan.context[key] = true;
        expect(sessionData(plan)[help.option]).toBe(true);
        plan.context[key] = false;
        expect(sessionData(plan)[help.option]).toBe(false);
        expect(help.enabled.length).toBeGreaterThan(40);
        expect(help.disabled.length).toBeGreaterThan(40);
        expect(help.example.length).toBeGreaterThan(40);
        expect(help.boundary.length).toBeGreaterThan(40);
        expect(help.sources.every((source) => /\/blob\/[a-f0-9]{40}\//.test(source.url))).toBe(true);
    });

    it("keeps the distinction between discovery, capability loading, callbacks, and authority", () => {
        expect(contextToggleHelp.discovery.enabled).toContain("takes precedence");
        expect(contextToggleHelp.discovery.disabled).toContain("pluginDirectories");
        expect(contextToggleHelp.skills.disabled).toContain("No skills");
        expect(contextToggleHelp.skills.boundary).toContain("tool inventory");
        expect(contextToggleHelp.fileHooks.boundary).toContain("Policy & state");
        expect(contextToggleHelp.hostGit.boundary).toContain("commit/push");
        expect(contextToggleHelp.hostGit.boundary).toContain("shell");
    });
});
