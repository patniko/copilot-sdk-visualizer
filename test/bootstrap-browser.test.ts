// Copyright (c) Microsoft Corporation. All rights reserved.
import { readFile } from "node:fs/promises";
import path from "node:path";
import { unzipSync, strFromU8 } from "fflate";
import { afterAll, beforeAll, expect, it } from "vitest";
import { createPreset } from "../src/domain/presets";
import { parsePlan } from "../src/domain/plan";
import { STORAGE_KEY } from "../src/domain/storage";
import { startBrowserHarness } from "./browser-harness";
import type { BrowserHarness } from "./browser-harness";
import type { Page } from "playwright";
import { LANGUAGES } from "../src/domain/target";

let harness: BrowserHarness | undefined;
beforeAll(async () => {
    harness = await startBrowserHarness();
});
afterAll(async () => {
    await harness?.close();
});

async function usePage(name: string, run: (page: Page) => Promise<void>, saved?: string) {
    if (!harness) throw new Error("Missing browser harness.");
    const { page, context, errors, external } = await harness.open(saved);
    let failure: { error: unknown } | undefined;
    try {
        await run(page);
        expect(errors).toEqual([]);
        expect(external).toEqual([]);
        await page.screenshot({ path: path.resolve(`.test-artifacts/browser/${name}.png`), fullPage: true });
    } catch (error) {
        failure = { error };
        try {
            await page.screenshot({
                path: path.resolve(`.test-artifacts/browser/${name}-failure.png`),
                fullPage: true,
            });
        } catch (capture) {
            failure = { error: new AggregateError([error, capture], "Browser check and screenshot failed.") };
        }
    }
    try {
        await context.close();
    } catch (cleanup) {
        failure = {
            error: failure
                ? new AggregateError([failure.error, cleanup], "Browser check and cleanup failed.")
                : cleanup,
        };
    }
    if (failure) throw failure.error;
}

async function stored(page: Page) {
    const value = await page.evaluate((key) => localStorage.getItem(key), STORAGE_KEY);
    if (!value) throw new Error("Saved draft missing.");
    return parsePlan(value);
}

it("migrates existing drafts and makes a real runtime-specific bootstrap ZIP", async () => {
    const { target: _target, ...legacyFields } = createPreset("empty");
    const legacy = { ...legacyFields, name: "Existing host plan", schemaVersion: 1 };
    await usePage(
        "runtime-bootstrap",
        async (page) => {
            expect(await page.getByRole("textbox", { name: "Draft name" }).inputValue()).toBe(
                "Existing host plan",
            );
            await page
                .getByRole("navigation", { name: "Harness workflow" })
                .getByRole("button", { name: /^Build & run\b/ })
                .click();
            await page
                .getByRole("group", { name: "Runtime placement", exact: true })
                .getByText("Native in-process runtime", { exact: true })
                .click();
            await expect.poll(async () => (await stored(page)).target.runtime).toBe("inprocess");
            expect(await page.getByRole("textbox", { name: "Contents of README.md" }).inputValue()).toContain(
                "Install the project dependencies",
            );
            await page.getByRole("tab", { name: "Install & run", exact: true }).click();
            expect(await page.getByText("npm run check", { exact: true }).count()).toBeGreaterThan(0);
            await page.getByRole("tab", { name: "Project files", exact: true }).click();
            const promise = page.waitForEvent("download");
            await page.getByRole("button", { name: "Download ZIP", exact: true }).click();
            const download = await promise;
            const filename = path.resolve(".test-artifacts/browser/bootstrap.zip");
            await download.saveAs(filename);
            const entries = unzipSync(await readFile(filename));
            const harnessEntry = Object.entries(entries).find(([entry]) => entry.endsWith("/src/harness.ts"));
            const readmeEntry = Object.entries(entries).find(([entry]) => entry.endsWith("/README.md"));
            expect(harnessEntry).toBeDefined();
            expect(readmeEntry).toBeDefined();
            if (!harnessEntry || !readmeEntry)
                throw new Error("The complete project is missing required files.");
            expect(strFromU8(harnessEntry[1])).toContain("RuntimeConnection.forInProcess");
            expect(strFromU8(readmeEntry[1])).toContain("experimental");

            await page
                .getByRole("group", { name: "Runtime placement", exact: true })
                .getByText("Existing runtime service", { exact: true })
                .click();
            await page
                .getByRole("textbox", { name: "Existing runtime endpoint", exact: true })
                .fill("tcp://127.0.0.1:4567");
            await expect.poll(async () => (await stored(page)).target.serverUrl).toBe("tcp://127.0.0.1:4567");
            await page
                .getByRole("navigation", { name: "Harness workflow" })
                .getByRole("button", { name: /^Base Profile\b/ })
                .click();
            await page.getByRole("button", { name: "Apply Copilot", exact: true }).click();
            await page
                .getByRole("dialog", { name: "Apply Copilot?" })
                .getByRole("button", { name: "Apply Copilot", exact: true })
                .click();
            expect((await stored(page)).target.runtime).toBe("external");
            expect((await stored(page)).target.serverUrl).toBe("tcp://127.0.0.1:4567");
        },
        JSON.stringify(legacy),
    );
});

it("explains the complete runtime-input set instead of displaying unexplained macro syntax", async () => {
    await usePage("prompt-input-explanations", async (page) => {
        await page
            .getByRole("navigation", { name: "Harness workflow" })
            .getByRole("button", { name: /^Prompt\b/ })
            .click();
        await page.locator(".hb-prompt-reference-disclosure > summary").click();
        await page.getByLabel("Built-in prompt section", { exact: true }).selectOption("safety");
        const reference = await page
            .getByRole("textbox", { name: "safety captured source reference", exact: true })
            .inputValue();
        expect(reference).toContain("[Runtime supplies: Sandbox and host boundaries]");
        expect(reference).not.toContain("{{sandbox_or_host_environment_limitations}}");
        const inputs = page.getByRole("region", { name: "safety runtime inputs" });
        await inputs.getByText("Sandbox and host boundaries", { exact: true }).click();
        expect(
            await inputs
                .getByText("Host sandbox state and runtime environment policy", { exact: true })
                .isVisible(),
        ).toBe(true);
        await page.getByText("All 24 explained runtime inputs", { exact: true }).click();
        await page.getByRole("searchbox", { name: "Search runtime inputs", exact: true }).fill("sandbox");
        expect(await page.getByText("1 of 24 runtime inputs", { exact: true }).isVisible()).toBe(true);
        await page.setViewportSize({ width: 390, height: 844 });
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    });
});

it("provides every language's files and explains Java's virtual-storage boundary", async () => {
    await usePage("language-bootstrap-files", async (page) => {
        await page
            .getByRole("navigation", { name: "Harness workflow" })
            .getByRole("button", { name: /^Build & run\b/ })
            .click();
        for (const language of LANGUAGES) {
            await page
                .getByRole("group", { name: "Bootstrap language", exact: true })
                .getByText(language.label, { exact: true })
                .click();
            await expect.poll(async () => (await stored(page)).target.language).toBe(language.id);
            if (language.id === "java") {
                expect(
                    await page
                        .getByRole("heading", {
                            name: "Resolve these choices before scaffolding",
                            exact: true,
                        })
                        .isVisible(),
                ).toBe(true);
                expect(await page.getByRole("button", { name: "Download ZIP", exact: true }).count()).toBe(0);
            } else {
                await expect
                    .poll(() => page.getByRole("button", { name: "Download ZIP", exact: true }).isVisible())
                    .toBe(true);
                expect(
                    await page
                        .getByRole("textbox", { name: "Contents of README.md", exact: true })
                        .inputValue(),
                ).toContain(language.label);
            }
        }
        await page
            .getByRole("navigation", { name: "Harness workflow" })
            .getByRole("button", { name: /^Policy & state\b/ })
            .click();
        await page
            .getByRole("group", { name: "Session storage", exact: true })
            .getByText("Local state directory", { exact: true })
            .click();
        await page
            .getByRole("navigation", { name: "Harness workflow" })
            .getByRole("button", { name: /^Build & run\b/ })
            .click();
        await page
            .getByRole("group", { name: "Bootstrap language", exact: true })
            .getByText("Java", { exact: true })
            .click();
        await expect
            .poll(() => page.getByRole("button", { name: "Download ZIP", exact: true }).isVisible())
            .toBe(true);
        expect(
            await page.getByRole("textbox", { name: "Contents of README.md", exact: true }).inputValue(),
        ).toContain("Maven");
    });
});

it("focuses tool planning on user-facing capabilities while preserving hidden settings", async () => {
    const plan = createPreset("minimal");
    await usePage(
        "focused-tool-catalog",
        async (page) => {
            await page
                .getByRole("navigation", { name: "Harness workflow" })
                .getByRole("button", { name: /^Tools\b/ })
                .click();
            const original = await stored(page);
            expect(
                await page.getByRole("list", { name: "Visible built-in tools" }).getByRole("button").count(),
            ).toBe(18);
            expect(await page.getByText("catalog_search", { exact: true }).count()).toBe(0);
            expect(await page.getByText("task_complete", { exact: true }).count()).toBe(0);
            expect(await page.getByText("generic_tool_search", { exact: true }).count()).toBe(0);
            expect(
                await page.getByText("1 specialized tool setting is retained", { exact: true }).isVisible(),
            ).toBe(true);

            await page
                .getByRole("group", { name: "Built-in tool view", exact: true })
                .getByText("Advanced capabilities", { exact: true })
                .click();
            expect(
                await page.getByRole("list", { name: "Visible built-in tools" }).getByRole("button").count(),
            ).toBe(8);
            await page.getByRole("button", { name: /tool_search_tool/ }).click();
            const specialized = page.getByRole("group", { name: "tool_search_tool action", exact: true });
            expect(await specialized.getByRole("radio", { name: "Override", exact: true }).isEnabled()).toBe(
                true,
            );
            expect(await stored(page)).toEqual(original);

            await page
                .getByRole("tablist", { name: "Tool configuration areas", exact: true })
                .getByRole("tab", { name: "Reference", exact: true })
                .click();
            expect(await page.getByText("33", { exact: true }).isVisible()).toBe(true);
            expect(await page.getByText("Internal descriptors hidden", { exact: true }).isVisible()).toBe(
                true,
            );
            expect(await stored(page)).toEqual(original);
            await page.setViewportSize({ width: 390, height: 844 });
            expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
        },
        JSON.stringify(plan),
    );
});
