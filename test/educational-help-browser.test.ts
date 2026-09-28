// Copyright (c) Microsoft Corporation. All rights reserved.
import path from "node:path";
import { afterAll, beforeAll, expect, it } from "vitest";
import type { Page } from "playwright";
import { createPreset } from "../src/domain/presets";
import { createAgent, createCustomTool, createMcpServer } from "../src/domain/plan";
import { STORAGE_KEY } from "../src/domain/storage";
import { contextToggleHelp } from "../src/content/context-help";
import { toggleHelp } from "../src/content/setting-help";
import { startBrowserHarness } from "./browser-harness";
import type { BrowserHarness } from "./browser-harness";

let harness: BrowserHarness | undefined;
beforeAll(async () => {
    harness = await startBrowserHarness();
});
afterAll(async () => {
    await harness?.close();
});

async function visit(page: Page, prefix: RegExp) {
    await page
        .getByRole("navigation", { name: "Harness workflow" })
        .getByRole("button", { name: prefix })
        .click();
    // Navigation transfers focus on the next animation frame, before help can take it.
    await expect
        .poll(() => page.locator("#editor-heading").evaluate((element) => document.activeElement === element))
        .toBe(true);
}

async function inspectHelp(page: Page, title: string, heading: string) {
    const trigger = page.getByRole("button", { name: `Explain ${title}`, exact: true }).first();
    const saved = await page.evaluate((key) => localStorage.getItem(key), STORAGE_KEY);
    await trigger.focus();
    await page.keyboard.press("Enter");
    const popup = page.getByRole("dialog", { name: title, exact: true });
    await popup.getByText(heading, { exact: true }).waitFor();
    await expect
        .poll(async () => {
            const box = await popup.boundingBox();
            const height = page.viewportSize()?.height ?? 1100;
            return Boolean(box && box.y >= 0 && box.y + box.height <= height + 1);
        })
        .toBe(true);
    expect(await popup.getByText("What this does not control", { exact: true }).isVisible()).toBe(true);
    expect(await page.evaluate((key) => localStorage.getItem(key), STORAGE_KEY)).toBe(saved);
    await page.keyboard.press("Escape");
    await popup.waitFor({ state: "hidden" });
    await expect.poll(() => trigger.evaluate((element) => document.activeElement === element)).toBe(true);
}

async function withApp(name: string, action: (page: Page) => Promise<void>) {
    if (!harness) throw new Error("Missing browser harness.");
    const plan = createPreset("minimal");
    plan.session.storage = "local";
    plan.prompt.mode = "customize";
    plan.prompt.sections = [{ name: "tone", action: "replace", content: "Be clear." }];
    plan.customTools = [createCustomTool("tool")];
    plan.mcpServers = [createMcpServer("mcp")];
    plan.agents = [createAgent("agent")];
    plan.model.provider = "openai";
    plan.model.endpoint = "https://example.com/v1";
    const { page, context, errors, external } = await harness.open(JSON.stringify(plan));
    let failure: { error: unknown } | undefined;
    try {
        await action(page);
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
            failure = {
                error: new AggregateError([error, capture], "Help assertion and screenshot failed."),
            };
        }
    }
    try {
        await context.close();
    } catch (cleanup) {
        failure = {
            error: failure
                ? new AggregateError([failure.error, cleanup], "Help assertion and cleanup failed.")
                : cleanup,
        };
    }
    if (failure) throw failure.error;
}

it("gives every Policy & state switch consistent on/off and host-boundary help", async () => {
    await withApp("policy-educational-help", async (page) => {
        await visit(page, /^Policy & state\b/);
        const titles = [
            toggleHelp.preToolHook.title,
            toggleHelp.postToolHook.title,
            contextToggleHelp.fileHooks.title,
            toggleHelp.infinite.title,
            toggleHelp.largeOutput.title,
            toggleHelp.streaming.title,
            toggleHelp.observer.title,
        ];
        expect(await page.getByRole("switch").count()).toBe(titles.length);
        for (const title of titles) await inspectHelp(page, title, "When on");
        await inspectHelp(page, "Session storage", "Local directory");
        await inspectHelp(page, "Idle cleanup timeout", "Zero");
        await inspectHelp(page, "Workload evaluation criteria", "Where it goes");
        await page.getByText("Pre-tool policy hook", { exact: true }).click();
        await page.getByRole("button", { name: "Explain Pre-tool policy hook", exact: true }).click();
        const popup = page.getByRole("dialog", { name: "Pre-tool policy hook", exact: true });
        await popup.getByText("Host callback required", { exact: true }).waitFor();
        expect(await popup.getByText("hooks.onPreToolUse", { exact: true }).isVisible()).toBe(true);
        expect(await popup.getByText("hooks.onPreToolUse: true", { exact: true }).count()).toBe(0);
        await page.keyboard.press("Escape");
        await popup.waitFor({ state: "hidden" });
    });
});

it("uses the same help interaction for choices and inputs in every configuration editor", async () => {
    await withApp("cross-editor-educational-help", async (page) => {
        const cases: { view: RegExp; title: string; heading: string }[] = [
            { view: /^Base Profile\b/, title: "SDK client baseline", heading: "Empty" },
            { view: /^Prompt\b/, title: "System message mode", heading: "Customize" },
            { view: /^Prompt\b/, title: "Section action", heading: "Preserve" },
            { view: /^Tools\b/, title: "Tool inventory", heading: "Explicit" },
            { view: /^Tools\b/, title: "Tool parameter schema", heading: "Shape versus implementation" },
            { view: /^Tools\b/, title: "Terminal tool", heading: "When on" },
            { view: /^Tools\b/, title: "Canonical runtime wire name", heading: "Use discovered names" },
            {
                view: /^Context & packs\b/,
                title: "Project working directory",
                heading: "Local versus service",
            },
            { view: /^Context & packs\b/, title: "Plugin directories", heading: "Explicit opt-in" },
            { view: /^Agents\b/, title: "Agent model preference", heading: "Fallback behavior" },
            { view: /^Agents\b/, title: "Root-only tool exclusions", heading: "Direction matters" },
            {
                view: /^Models & identity\b/,
                title: "Inference access",
                heading: "Managed versus bring your own",
            },
            { view: /^Models & identity\b/, title: "Reasoning effort", heading: "Model default" },
            {
                view: /^Models & identity\b/,
                title: "Provider credential source",
                heading: "Environment variable",
            },
            { view: /^Build & run\b/, title: "Runtime placement", heading: "Managed child" },
            { view: /^Build & run\b/, title: "Bootstrap language", heading: "Compatibility" },
        ];
        for (const example of cases) {
            await visit(page, example.view);
            if (example.title === "SDK client baseline")
                await page.getByText("Advanced: SDK client baseline").click();
            if (example.title === "Tool parameter schema" || example.title === "Terminal tool") {
                await page
                    .getByRole("tablist", { name: "Tool configuration areas", exact: true })
                    .getByRole("tab", { name: /Custom tools/ })
                    .click();
                const advanced = page.locator("details.hb-tool-advanced-config").first();
                if (!(await advanced.evaluate((element) => element.hasAttribute("open"))))
                    await advanced.locator("summary").click();
            }
            if (example.title === "Canonical runtime wire name") {
                await page
                    .getByRole("tablist", { name: "Tool configuration areas", exact: true })
                    .getByRole("tab", { name: /MCP servers/ })
                    .click();
                const server = page.locator("details.hb-mcp-server-card").first();
                if (!(await server.evaluate((element) => element.hasAttribute("open"))))
                    await server.locator("summary").click();
            }
            await inspectHelp(page, example.title, example.heading);
        }
        await page.setViewportSize({ width: 390, height: 844 });
        for (const view of [
            /^Overview\b/,
            /^Base Profile\b/,
            /^Prompt\b/,
            /^Tools\b/,
            /^Context & packs\b/,
            /^Agents\b/,
            /^Models & identity\b/,
            /^Policy & state\b/,
            /^Build & run\b/,
        ]) {
            await visit(page, view);
            expect(
                await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
                String(view),
            ).toBe(true);
        }
        await visit(page, /^Policy & state\b/);
        await inspectHelp(page, "Session storage", "Local directory");
    });
});
