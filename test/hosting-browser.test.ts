// Copyright (c) Microsoft Corporation. All rights reserved.
import { afterAll, beforeAll, expect, it } from "vitest";
import { hostingRungs, rungNodes } from "../src/content/hosting";
import { hostingDiagrams } from "../src/content/hosting-diagrams";
import { createPreset } from "../src/domain/presets";
import { STORAGE_KEY } from "../src/domain/storage";
import { startBrowserHarness } from "./browser-harness";
import type { BrowserHarness } from "./browser-harness";

let harness: BrowserHarness;
beforeAll(async () => {
    harness = await startBrowserHarness();
});
afterAll(async () => {
    await harness?.close();
});

it("selects a hosting option and explains each architecture component without modifying the draft", async () => {
    const { page, context, errors, external } = await harness.open();
    try {
        const original = await page.evaluate((key) => localStorage.getItem(key), STORAGE_KEY);
        const nav = page.getByRole("navigation", { name: "Harness workflow" });
        const labels = await nav
            .getByRole("button")
            .evaluateAll((buttons) => buttons.map((button) => button.querySelector("strong")?.textContent));
        expect(labels.indexOf("Host & deploy")).toBe(labels.indexOf("Build & run") + 1);

        await nav.getByRole("button", { name: /^Host & deploy\b/ }).click();
        await expect.poll(() => page.evaluate(() => window.location.hash)).toBe("#deploy");

        const options = page.getByRole("group", { name: "Hosting options" });
        await options.waitFor();
        expect(await options.getByRole("button").count()).toBe(hostingRungs.length);
        const personal = options.getByRole("button", { name: /Personal assistant/ });
        expect(await personal.getAttribute("aria-pressed")).toBe("true");
        expect(await personal.getByText("Your plan", { exact: true }).isVisible()).toBe(true);

        const detail = page.locator("#hosting-node-detail");
        for (const rung of hostingRungs) {
            await options.getByRole("button", { name: new RegExp(rung.title) }).click();
            expect(await options.getByRole("button", { pressed: true }).count()).toBe(1);
            const diagram = page.getByRole("group", { name: `${rung.title} architecture` });
            const nodes = rungNodes(rung);
            expect(await diagram.getByRole("button").count()).toBe(nodes.length);
            for (const node of nodes) {
                await diagram.getByRole("button", { name: node.name, exact: true }).click();
                expect(await detail.getByRole("heading", { name: node.name, exact: true }).isVisible()).toBe(
                    true,
                );
                expect(await detail.getByText(node.purpose, { exact: true }).isVisible()).toBe(true);
                expect(await diagram.getByRole("button", { pressed: true }).count()).toBe(1);
                const connected = hostingDiagrams[rung.id].connections.filter(
                    (edge) => edge.from[0] === node.id || edge.to[0] === node.id,
                );
                expect(await diagram.locator('.hg-connection[data-active="true"]').count()).toBe(
                    connected.length,
                );
            }
        }

        await options.getByRole("button", { name: /Personal assistant/ }).click();
        const diagram = page.getByRole("group", { name: "Personal assistant architecture" });
        expect(
            await diagram
                .getByRole("button", { name: "Remote sessions", exact: true })
                .getAttribute("aria-pressed"),
        ).toBe("true");
        const runtime = diagram.getByRole("button", { name: "Copilot runtime", exact: true });
        await runtime.focus();
        await page.keyboard.press("Enter");
        expect(await runtime.getAttribute("aria-pressed")).toBe("true");
        expect(await detail.getByRole("heading", { name: "Copilot runtime", exact: true }).isVisible()).toBe(
            true,
        );

        expect(await page.evaluate((key) => localStorage.getItem(key), STORAGE_KEY)).toBe(original);
        expect(errors).toEqual([]);
        expect(external).toEqual([]);
    } finally {
        await context.close();
    }
});

it("keeps architecture labels legible and the page contained in desktop, dark, and mobile layouts", async () => {
    const { page, context, errors } = await harness.open();
    try {
        await page.goto(`${harness.url}/#deploy`);
        const options = page.getByRole("group", { name: "Hosting options" });
        await options.waitFor();
        for (const [name, width, dark] of [
            ["desktop", 1600, false],
            ["dark", 1440, true],
            ["mobile", 390, false],
        ] as const) {
            await page.setViewportSize({ width, height: 1100 });
            await page.evaluate(
                (theme) => {
                    document.documentElement.dataset.theme = theme;
                },
                dark ? "dark" : "light",
            );
            for (const rung of hostingRungs) {
                await options.getByRole("button", { name: new RegExp(rung.title) }).click();
                const diagram = page.getByRole("group", { name: `${rung.title} architecture` });
                expect(
                    await diagram.locator(".hg-map-viewport").evaluate((element) => element.scrollLeft),
                ).toBe(0);
                const overflow = await diagram.locator(".hg-node").evaluateAll((buttons) =>
                    buttons.flatMap((button) => {
                        const box = button.getBoundingClientRect();
                        return [...button.querySelectorAll("strong, small, .hg-node-icon")].flatMap(
                            (child) => {
                                const text = child.getBoundingClientRect();
                                return text.left < box.left ||
                                    text.right > box.right ||
                                    text.top < box.top ||
                                    text.bottom > box.bottom
                                    ? [`${button.getAttribute("aria-label")}: ${child.textContent}`]
                                    : [];
                            },
                        );
                    }),
                );
                expect(overflow, `${name}: ${rung.id}`).toEqual([]);
                const boundaryOverflow = await diagram.locator(".hg-boundary").evaluateAll((groups) =>
                    groups.flatMap((group) => {
                        const box = group.querySelector("rect")!.getBoundingClientRect();
                        return [...group.querySelectorAll("text")].flatMap((label) => {
                            const text = label.getBoundingClientRect();
                            return text.left < box.left || text.right > box.right ? [label.textContent] : [];
                        });
                    }),
                );
                expect(boundaryOverflow, `${name}: ${rung.id} boundary labels`).toEqual([]);
                expect(
                    await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
                ).toBe(true);
                await diagram.screenshot({ path: `.test-artifacts/browser/hosting-${rung.id}-${name}.png` });
                if (rung.id === "production")
                    await page.locator(".hg-guide").screenshot({
                        path: `.test-artifacts/browser/hosting-page-${name}.png`,
                    });
                if (width < 760) {
                    const last = rungNodes(rung).at(-1)!;
                    await diagram.getByRole("button", { name: last.name, exact: true }).click();
                    expect(
                        await page
                            .locator("#hosting-node-detail")
                            .getByRole("heading", { name: last.name, exact: true })
                            .isVisible(),
                    ).toBe(true);
                }
            }
        }
        expect(errors).toEqual([]);
    } finally {
        await context.close();
    }
});

it("matches a remote runtime service to the production option", async () => {
    const plan = createPreset("minimal");
    plan.target = { ...plan.target, runtime: "external", serverUrl: "copilot-runtime.internal:4321" };
    const { page, context, errors } = await harness.open(JSON.stringify(plan));
    try {
        await page.goto(`${harness.url}/#deploy`);
        const options = page.getByRole("group", { name: "Hosting options" });
        await options.waitFor();
        const production = options.getByRole("button", { name: /Your production service/ });
        expect(await production.getAttribute("aria-pressed")).toBe("true");
        expect(await page.getByText(/copilot-runtime\.internal:4321/).isVisible()).toBe(true);
        expect(errors).toEqual([]);
    } finally {
        await context.close();
    }
});
