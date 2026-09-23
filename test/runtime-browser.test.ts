// Copyright (c) Microsoft Corporation. All rights reserved.
import path from "node:path";
import { afterAll, beforeAll, expect, it } from "vitest";
import type { Page } from "playwright";
import { runtimeCapabilities, turnWalkthrough } from "../src/content/runtime-map";
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

async function saved(page: Page) {
    return page.evaluate((key) => localStorage.getItem(key), STORAGE_KEY);
}

async function openRuntime(page: Page) {
    await page
        .getByRole("navigation", { name: "Harness workflow" })
        .getByRole("button", { name: /^Runtime\b/ })
        .click();
    await page.getByRole("heading", { name: "Meet the engine behind your harness." }).waitFor();
    await expect.poll(() => page.evaluate(() => document.activeElement?.id)).toBe("editor-heading");
}

it("explores every capability and the configurator without modifying the draft", async () => {
    const { page, context, errors, external } = await harness.open();
    try {
        const original = await saved(page);
        const overviewTheme = await page.locator(".harness-builder").evaluate((element) => {
            const style = getComputedStyle(element);
            return ["--cp-bg", "--cp-surface", "--cp-border", "--cp-text", "--cp-accent"].map((name) =>
                style.getPropertyValue(name).trim(),
            );
        });
        await page.getByRole("button", { name: "Explore the runtime", exact: true }).click();
        expect(
            await page.locator(".harness-builder").evaluate((element) => {
                const style = getComputedStyle(element);
                return ["--cp-bg", "--cp-surface", "--cp-border", "--cp-text", "--cp-accent"].map((name) =>
                    style.getPropertyValue(name).trim(),
                );
            }),
        ).toEqual(overviewTheme);
        const map = page.getByRole("group", { name: "Runtime capability topology" });
        const detail = page.locator("#runtime-capability-detail");
        const mapSurface = page.locator(".rt-map-surface");
        const mapBox = await mapSurface.boundingBox();
        expect(mapBox).not.toBeNull();
        expect(mapBox!.y).toBeLessThan(420);
        expect(Math.min(mapBox!.y + mapBox!.height, 1100) - Math.max(mapBox!.y, 0)).toBeGreaterThan(500);
        expect(await map.getByRole("button").count()).toBe(runtimeCapabilities.length);
        expect(await page.getByRole("textbox", { name: "Draft name" }).count()).toBe(0);
        expect(await page.locator(".hb-inspector").count()).toBe(0);
        for (const capability of runtimeCapabilities) {
            await map.getByRole("button", { name: `Explore ${capability.name}`, exact: true }).click();
            expect(
                await detail.getByRole("heading", { name: capability.name, exact: true }).isVisible(),
            ).toBe(true);
            expect(await detail.getByText(capability.boundary, { exact: true }).isVisible()).toBe(true);
            expect(await map.getByRole("button", { pressed: true }).count()).toBe(1);
            expect(await detail.getByText("Inspect source evidence", { exact: true }).count()).toBe(0);
        }
        await map.getByRole("button", { name: "Explore Plugins", exact: true }).click();
        expect(
            await map
                .locator('[data-active="true"]')
                .evaluateAll((nodes) => nodes.map((node) => node.getAttribute("data-capability")).sort()),
        ).toEqual(["agents", "loop", "mcp", "plugins", "policy", "skills"]);
        await map.getByRole("button", { name: "Explore Skills", exact: true }).click();
        expect(await detail.getByRole("heading", { name: "Skills", exact: true }).isVisible()).toBe(true);
        expect(await detail.getByText("Related SDK surfaces · not a config recipe").count()).toBe(0);
        expect(await detail.getByText("Connect the ideas", { exact: true }).count()).toBe(0);
        expect(await detail.getByRole("button").count()).toBe(0);
        await page.getByRole("button", { name: "Configure your harness", exact: true }).click();
        await page.getByRole("heading", { name: "Compose the behavior." }).waitFor();
        expect(await saved(page)).toBe(original);
        await page.goBack();
        await page.getByRole("heading", { name: "Meet the engine behind your harness." }).waitFor();
        await page.reload();
        await page.getByRole("heading", { name: "Meet the engine behind your harness." }).waitFor();
        expect(new URL(page.url()).hash).toBe("#runtime");
        await page.getByRole("link", { name: "Skip to editor" }).focus();
        await page.keyboard.press("Enter");
        expect(await map.isVisible()).toBe(true);
        expect(new URL(page.url()).hash).toBe("#runtime");
        expect(await page.evaluate(() => document.activeElement?.id)).toBe("builder-main");
        expect(await saved(page)).toBe(original);
        expect(errors).toEqual([]);
        expect(external).toEqual([]);
    } finally {
        await context.close();
    }
});

it("steps through an explicitly illustrative turn and supports keyboard selection", async () => {
    const { page, context, errors, external } = await harness.open();
    try {
        const original = await saved(page);
        await openRuntime(page);
        await page.getByRole("button", { name: "Trace a turn", exact: true }).click();
        const walkthrough = page.getByRole("region", { name: "Illustrative turn walkthrough" });
        expect(
            await page.getByText("Illustrative path · no agent is running", { exact: true }).isVisible(),
        ).toBe(true);
        expect(await page.getByRole("button", { name: "Previous step" }).isDisabled()).toBe(true);
        for (const [index, step] of turnWalkthrough.entries()) {
            expect(await page.locator("#runtime-turn-detail").innerText()).toContain(step.description);
            const active = await page
                .locator('.rt-node[data-active="true"]')
                .evaluateAll((nodes) => nodes.map((node) => node.getAttribute("data-capability")).sort());
            expect(active).toEqual([...step.active].sort());
            expect(await page.locator('.rt-steps [aria-current="step"]').textContent()).toContain(step.title);
            if (index < turnWalkthrough.length - 1) {
                await page.getByRole("button", { name: "Next step" }).click();
            }
        }
        await page.getByRole("button", { name: "Previous step" }).click();
        expect(await page.locator("#runtime-turn-detail").innerText()).toContain(
            turnWalkthrough[4]?.description,
        );
        await page.getByRole("button", { name: "Restart", exact: true }).click();
        expect(await page.getByRole("button", { name: "Previous step" }).isDisabled()).toBe(true);
        await page
            .locator(".rt-steps")
            .getByRole("button", { name: /Continue/ })
            .click();
        await page.getByRole("button", { name: "Back to exploration" }).click();
        expect(await walkthrough.count()).toBe(0);
        const skill = page.getByRole("button", { name: "Explore Skills", exact: true });
        await skill.focus();
        await page.keyboard.press("Enter");
        expect(await skill.getAttribute("aria-pressed")).toBe("true");
        expect(await saved(page)).toBe(original);
        expect(errors).toEqual([]);
        expect(external).toEqual([]);
    } finally {
        await context.close();
    }
});

it("fits desktop and mobile in both themes, and remains readable with a corrupt saved draft", async () => {
    const { page, context, errors, external } = await harness.open("{not valid");
    try {
        await openRuntime(page);
        expect(
            await page.getByText("Your saved draft needs explicit recovery", { exact: true }).isVisible(),
        ).toBe(true);
        for (const width of [1600, 1280, 900, 390, 320]) {
            await page.setViewportSize({ width, height: 1100 });
            for (const theme of ["light", "dark"]) {
                const targetTheme = theme === "dark" ? "Switch to dark theme" : "Switch to light theme";
                const toggle = page.getByRole("button", { name: targetTheme, exact: true });
                if (await toggle.count()) await toggle.click();
                expect(await page.evaluate(() => document.documentElement.dataset.theme)).toBe(theme);
                expect(
                    await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
                ).toBe(true);
                const nodes = page.locator(".rt-node");
                for (const button of await nodes.all()) {
                    const box = await button.boundingBox();
                    expect(box).not.toBeNull();
                    expect(box!.width).toBeGreaterThanOrEqual(44);
                    expect(box!.height).toBeGreaterThanOrEqual(44);
                }
                await page.getByRole("button", { name: "Explore Plugins", exact: true }).click();
                expect(
                    await page
                        .locator(".rt-connection-active")
                        .first()
                        .evaluate((element) => getComputedStyle(element).animationName),
                ).toBe("none");
                await page.getByRole("button", { name: "Trace a turn", exact: true }).click();
                expect(
                    await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
                ).toBe(true);
                await page.getByRole("button", { name: "Explore", exact: true }).click();
                await page.screenshot({
                    path: path.resolve(`.test-artifacts/browser/runtime-${width}-${theme}.png`),
                    fullPage: true,
                });
            }
        }
        expect(await saved(page)).toBe("{not valid");
        expect(errors).toEqual([]);
        expect(external).toEqual([]);
    } finally {
        await context.close();
    }
});
