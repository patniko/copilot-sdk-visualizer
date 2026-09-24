// Copyright (c) Microsoft Corporation. All rights reserved.
import { describe, expect, it } from "vitest";
import { createPreset } from "../domain/presets";
import { hostingRung, hostingRungs, planHostingRung, rungNodes } from "./hosting";
import { sdkDocsForView } from "./sdk-docs";

function planWith(runtime: "managed" | "external" | "inprocess", serverUrl = "127.0.0.1:4321") {
    const plan = createPreset("minimal");
    plan.target = { ...plan.target, runtime, serverUrl };
    return plan;
}

describe("hosting content", () => {
    it("orders the four options and keeps ids unique", () => {
        expect(hostingRungs.map((rung) => rung.id)).toEqual(["personal", "container", "cloud", "production"]);
        expect(hostingRungs.map((rung) => rung.step)).toEqual([1, 2, 3, 4]);
        expect(hostingRung("cloud").title).toBe("Managed cloud session");
        expect(() => hostingRung("nope" as never)).toThrow(RangeError);
    });

    it("gives every option an architecture whose components all have an explainer", () => {
        for (const rung of hostingRungs) {
            expect(rung.zones.length).toBeGreaterThanOrEqual(2);
            const nodes = rungNodes(rung);
            expect(new Set(nodes.map((node) => node.id)).size).toBe(nodes.length);
            for (const node of nodes) {
                expect(node.name && node.role && node.purpose && node.watchOut).toBeTruthy();
                expect(node.seams.length).toBeGreaterThan(0);
            }
        }
    });

    it("draws production with gateways, a private runtime, controlled exits, and trust services", () => {
        const ids = rungNodes(hostingRung("production")).map((node) => node.id);
        for (const id of [
            "gateway",
            "backend",
            "runtime",
            "sandbox",
            "egress",
            "inference",
            "secrets",
            "audit",
        ])
            expect(ids).toContain(id);
        expect(hostingRung("production").band?.nodes.length).toBeGreaterThan(0);
    });

    it("never suggests binding the runtime on every interface or baking tokens into images", () => {
        const text = JSON.stringify(hostingRungs);
        expect(text).not.toMatch(/ghp_|github_pat_/);
        expect(rungNodes(hostingRung("container")).find((node) => node.id === "runtime")?.seams).toContain(
            "-p 127.0.0.1:4321:4321",
        );
    });

    it("is cross-linked from the SDK docs map", () => {
        expect(sdkDocsForView("deploy")?.links.some((link) => /backend-services/.test(link.url))).toBe(true);
    });
});

describe("planHostingRung", () => {
    it("maps SDK-managed and in-process runtimes to the personal assistant", () => {
        expect(planHostingRung(planWith("managed")).id).toBe("personal");
        expect(planHostingRung(planWith("inprocess")).id).toBe("personal");
    });

    it("maps loopback runtime services to a local container", () => {
        expect(planHostingRung(planWith("external", "127.0.0.1:4321")).id).toBe("container");
        expect(planHostingRung(planWith("external", "localhost:4321")).id).toBe("container");
        expect(planHostingRung(planWith("external", "tcp://[::1]:4321")).id).toBe("container");
    });

    it("maps remote runtime services to a production service", () => {
        const match = planHostingRung(planWith("external", "copilot-runtime.internal:4321"));
        expect(match.id).toBe("production");
        expect(match.reason).toContain("copilot-runtime.internal:4321");
    });
});
