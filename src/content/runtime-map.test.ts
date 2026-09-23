// Copyright (c) Microsoft Corporation. All rights reserved.
import { describe, expect, it } from "vitest";
import { getSource } from "./reference";
import { capabilitySides, runtimeCapabilities, runtimeCapability, turnWalkthrough } from "./runtime-map";
import { sdkDocsForView } from "./sdk-docs";

describe("runtime capability map", () => {
    it("places every capability exactly once in the topology", () => {
        const placed = ["loop", ...capabilitySides.left, ...capabilitySides.right];
        expect(new Set(placed).size).toBe(placed.length);
        expect(placed.toSorted()).toEqual(runtimeCapabilities.map((entry) => entry.id).toSorted());
        expect(capabilitySides.left).toHaveLength(5);
        expect(capabilitySides.right).toHaveLength(5);
    });

    it("grounds every capability in maintained references, ownership, and a real destination", () => {
        expect(new Set(runtimeCapabilities.map((entry) => entry.id)).size).toBe(runtimeCapabilities.length);
        for (const capability of runtimeCapabilities) {
            expect(capability.provides).toHaveLength(2);
            expect(capability.owns).toHaveLength(2);
            expect(capability.boundary.length).toBeGreaterThan(40);
            expect(capability.sources.length).toBeGreaterThan(0);
            expect(sdkDocsForView(capability.view)).toBeDefined();
            for (const source of capability.sources) {
                expect(getSource(source).label.length).toBeGreaterThan(3);
            }
            for (const id of capability.related) {
                expect(id).not.toBe(capability.id);
                expect(runtimeCapability(id)).toBeDefined();
            }
        }
    });

    it("keeps walkthrough focus and highlighted nodes consistent", () => {
        expect(turnWalkthrough.map((entry) => entry.title)).toEqual([
            "Configure",
            "Assemble",
            "Infer",
            "Authorize",
            "Execute",
            "Continue",
        ]);
        for (const step of turnWalkthrough) {
            expect(step.active).toContain(step.focus);
            expect(step.active).toContain("loop");
            expect(new Set(step.active).size).toBe(step.active.length);
            for (const id of step.active) expect(runtimeCapability(id)).toBeDefined();
        }
    });

    it("uses public SDK field names instead of plausible but nonexistent options", () => {
        const controls = runtimeCapabilities.flatMap((capability) => capability.controls);
        for (const unsupported of [
            "disabledPlugins",
            "excludeTools",
            "largeToolOutput",
            "bearerTokenProvider",
        ]) {
            expect(controls).not.toContain(unsupported);
        }
        expect(runtimeCapability("context").controls).toContain("largeOutput");
        expect(runtimeCapability("agents").controls).toContain("defaultAgent.excludedTools");
        expect(runtimeCapability("auth").controls).toContain("provider.bearerTokenProvider");
        expect(sdkDocsForView("runtime")).toBeDefined();
    });
});
