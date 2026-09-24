// Copyright (c) Microsoft Corporation. All rights reserved.
import { describe, expect, it } from "vitest";
import { createPreset } from "../domain/presets";
import { hostingRung, hostingRungs, planHostingRung, rungNodes } from "./hosting";
import { connectionLabelBounds, connectionPoints, DIAGRAM_WIDTH, hostingDiagrams } from "./hosting-diagrams";
import type { DiagramBounds, DiagramPoint } from "./hosting-diagrams";
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

describe("hosting architecture layouts", () => {
    function overlaps([x, y, width, height]: DiagramBounds, [a, b, w, h]: DiagramBounds) {
        return x < a + w && x + width > a && y < b + h && y + height > b;
    }

    function crossesNode([x, y]: DiagramPoint, [a, b]: DiagramPoint, bounds: DiagramBounds) {
        const [left, top, width, height] = bounds;
        if (x === a)
            return x > left && x < left + width && Math.min(y, b) < top + height && Math.max(y, b) > top;
        return y > top && y < top + height && Math.min(x, a) < left + width && Math.max(x, a) > left;
    }

    for (const rung of hostingRungs) {
        const layout = hostingDiagrams[rung.id];
        it(`places every ${rung.title} component inside its hosting boundary without overlaps`, () => {
            expect(layout.nodes.map((node) => node.id).sort()).toEqual(
                rungNodes(rung)
                    .map((node) => node.id)
                    .sort(),
            );
            expect(new Set(layout.boundaries.map((boundary) => boundary.id)).size).toBe(
                layout.boundaries.length,
            );
            for (const [index, node] of layout.nodes.entries()) {
                const [x, y, width, height] = node.bounds;
                const boundary = layout.boundaries.find((entry) => entry.id === node.boundary);
                expect(boundary, node.id).toBeDefined();
                const [bx, by, bw, bh] = boundary!.bounds;
                expect(x, node.id).toBeGreaterThanOrEqual(bx);
                expect(y, node.id).toBeGreaterThanOrEqual(by);
                expect(x + width, node.id).toBeLessThanOrEqual(bx + bw);
                expect(y + height, node.id).toBeLessThanOrEqual(by + bh);
                expect(width).toBeGreaterThan(0);
                expect(height).toBeGreaterThan(0);
                for (const other of layout.nodes.slice(index + 1))
                    expect(overlaps(node.bounds, other.bounds), `${node.id} overlaps ${other.id}`).toBe(
                        false,
                    );
            }
        });

        it(`routes ${rung.title} connections between real components without crossing boxes`, () => {
            const connected = new Set<string>();
            for (const edge of layout.connections) {
                connected.add(edge.from[0]);
                connected.add(edge.to[0]);
                const points = connectionPoints(layout, edge);
                expect(points.length).toBeGreaterThanOrEqual(2);
                for (const [index, point] of points.entries()) {
                    expect(point[0]).toBeGreaterThanOrEqual(0);
                    expect(point[0]).toBeLessThanOrEqual(DIAGRAM_WIDTH);
                    expect(point[1]).toBeGreaterThanOrEqual(0);
                    expect(point[1]).toBeLessThanOrEqual(layout.height);
                    const next = points[index + 1];
                    if (!next) continue;
                    expect(point[0] === next[0] || point[1] === next[1], edge.label).toBe(true);
                    for (const node of layout.nodes) {
                        if (node.id === edge.from[0] || node.id === edge.to[0]) continue;
                        expect(
                            crossesNode(point, next, node.bounds),
                            `${edge.label} crosses ${node.id}`,
                        ).toBe(false);
                    }
                }
                for (const node of layout.nodes)
                    expect(
                        overlaps(connectionLabelBounds(edge), node.bounds),
                        `${edge.label} label overlaps ${node.id}`,
                    ).toBe(false);
            }
            expect([...connected].sort()).toEqual(layout.nodes.map((node) => node.id).sort());
        });
    }

    it("anchors connections on component ports and rejects missing components", () => {
        const layout = hostingDiagrams.personal;
        const edge = layout.connections[0]!;
        expect(connectionPoints(layout, edge)).toEqual([
            [260, 220],
            [386, 220],
        ]);
        expect(() => connectionPoints(layout, { ...edge, from: ["missing", "right"] })).toThrow(RangeError);
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
