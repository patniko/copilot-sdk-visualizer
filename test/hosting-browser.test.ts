// Copyright (c) Microsoft Corporation. All rights reserved.
import { afterAll, beforeAll, expect, it } from "vitest";
import { hostingRungs, rungNodes } from "../src/content/hosting";
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
            const last = nodes.at(-1)!;
            await diagram.getByRole("button", { name: new RegExp(last.name.replace(/[+&]/g, ".")) }).click();
            expect(await detail.getByRole("heading", { name: last.name, exact: true }).isVisible()).toBe(
                true,
            );
            expect(await detail.getByText(last.purpose).isVisible()).toBe(true);
        }

        expect(await page.evaluate((key) => localStorage.getItem(key), STORAGE_KEY)).toBe(original);
        expect(errors).toEqual([]);
        expect(external).toEqual([]);
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
