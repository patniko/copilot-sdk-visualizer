// Copyright (c) Microsoft Corporation. All rights reserved.
import { afterAll, beforeAll, expect, it } from "vitest";
import path from "node:path";
import { CONTEXT_TOGGLE_KEYS, contextToggleHelp } from "../src/content/context-help";
import { parsePlan } from "../src/domain/plan";
import { STORAGE_KEY } from "../src/domain/storage";
import { startBrowserHarness } from "./browser-harness";
import type { BrowserHarness } from "./browser-harness";

let harness: BrowserHarness | undefined;
beforeAll(async () => {
    harness = await startBrowserHarness();
});
afterAll(async () => {
    await harness?.close();
});

it("explains every context switch without toggling it, and restores keyboard focus", async () => {
    if (!harness) throw new Error("The browser harness did not start.");
    const { page, context, errors, external } = await harness.open();
    let failure: { error: unknown } | undefined;
    try {
        await page
            .getByRole("navigation", { name: "Harness workflow" })
            .getByRole("button", { name: /^Context & packs\b/ })
            .click();
        await expect
            .poll(() =>
                page.locator("#editor-heading").evaluate((element) => document.activeElement === element),
            )
            .toBe(true);
        for (const key of CONTEXT_TOGGLE_KEYS) {
            const help = contextToggleHelp[key];
            const button = page.getByRole("button", { name: `Explain ${help.title}`, exact: true });
            const before = await page.evaluate((storageKey) => localStorage.getItem(storageKey), STORAGE_KEY);
            await button.focus();
            await page.keyboard.press("Enter");
            const popover = page.getByRole("dialog", { name: help.title, exact: true });
            await popover.waitFor();
            await popover.getByText("When on", { exact: true }).waitFor();
            await expect
                .poll(async () => {
                    const box = await popover.boundingBox();
                    return Boolean(box && box.y >= 0 && box.y + box.height <= 1101);
                })
                .toBe(true);
            expect(await popover.getByText("When on", { exact: true }).isVisible()).toBe(true);
            expect(await popover.getByText("When off", { exact: true }).isVisible()).toBe(true);
            expect(await popover.getByText(help.example, { exact: true }).isVisible()).toBe(true);
            expect(await popover.getByText(`${help.option}: false`, { exact: true }).isVisible()).toBe(true);
            expect(
                await popover.locator('a[href^="https://github.com/"]').count(),
                help.title,
            ).toBeGreaterThan(0);
            expect(await page.evaluate((storageKey) => localStorage.getItem(storageKey), STORAGE_KEY)).toBe(
                before,
            );
            await page.keyboard.press("Escape");
            await expect
                .poll(() => button.evaluate((element) => document.activeElement === element))
                .toBe(true);

            await page.getByText(help.title, { exact: true }).click();
            await expect
                .poll(async () => {
                    const text = await page.evaluate(
                        (storageKey) => localStorage.getItem(storageKey),
                        STORAGE_KEY,
                    );
                    return text ? parsePlan(text).context[key] : undefined;
                })
                .toBe(true);
            const toggle = page.getByRole("switch", { name: help.title, exact: true });
            await toggle.focus();
            await page.keyboard.press("Space");
            await expect.poll(() => toggle.isChecked()).toBe(false);
            await page.getByText(help.title, { exact: true }).click();
            await button.click();
            await popover.getByText(`${help.option}: true`, { exact: true }).waitFor();
            await popover.getByRole("button", { name: "Close setting help", exact: true }).click();
            await popover.waitFor({ state: "hidden" });
            await expect
                .poll(() => button.evaluate((element) => document.activeElement === element))
                .toBe(true);
        }

        await page.setViewportSize({ width: 390, height: 844 });
        await page.getByRole("button", { name: "Explain Host Git operations", exact: true }).click();
        const popover = page.getByRole("dialog", { name: "Host Git operations", exact: true });
        const bounds = await popover.boundingBox();
        expect(bounds).not.toBeNull();
        expect(bounds?.x ?? -1).toBeGreaterThanOrEqual(0);
        expect((bounds?.x ?? 0) + (bounds?.width ?? 0)).toBeLessThanOrEqual(391);
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
        await page.screenshot({
            path: path.resolve(".test-artifacts/browser/context-help-mobile.png"),
            fullPage: true,
        });
        expect(errors).toEqual([]);
        expect(external).toEqual([]);
    } catch (error) {
        failure = { error };
    }
    try {
        await context.close();
    } catch (error) {
        failure = {
            error: failure
                ? new AggregateError([failure.error, error], "Context help check and cleanup failed.")
                : error,
        };
    }
    if (failure) throw failure.error;
});
