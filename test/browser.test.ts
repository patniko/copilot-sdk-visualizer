// Copyright (c) Microsoft Corporation. All rights reserved.
import { readFile } from "node:fs/promises";
import path from "node:path";
import { afterAll, beforeAll, expect, it } from "vitest";
import type { Page } from "playwright";
import { parsePlan } from "../src/domain/plan";
import type { HarnessPlan } from "../src/domain/plan";
import { createPreset } from "../src/domain/presets";
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

async function savedPlan(page: Page): Promise<HarnessPlan> {
    const text = await page.evaluate((key) => localStorage.getItem(key), STORAGE_KEY);
    if (!text) throw new Error("The saved plan is missing.");
    return parsePlan(text);
}

async function navigate(page: Page, name: RegExp) {
    await page.getByRole("navigation", { name: "Harness workflow" }).getByRole("button", { name }).click();
}

async function exercise(name: string, action: (page: Page) => Promise<void>, saved?: string) {
    if (!harness) throw new Error("The browser harness is not started.");
    const { page, context, errors, external } = await harness.open(saved);
    let failure: unknown;
    let failed = false;
    try {
        await action(page);
        expect(errors, "Unexpected browser errors").toEqual([]);
        expect(external, "The app attempted a non-local network request").toEqual([]);
        await page.screenshot({ path: path.resolve(`.test-artifacts/browser/${name}.png`), fullPage: true });
    } catch (error) {
        failed = true;
        failure = error;
        try {
            await page.screenshot({
                path: path.resolve(`.test-artifacts/browser/${name}-failure.png`),
                fullPage: true,
            });
        } catch (captureError) {
            failure = new AggregateError(
                [error, captureError],
                "Browser assertion and diagnostic capture failed.",
            );
        }
    }
    try {
        await context.close();
    } catch (cleanupError) {
        failure = failed
            ? new AggregateError([failure, cleanupError], "Browser assertion and cleanup failed.")
            : cleanupError;
        failed = true;
    }
    if (failed) throw failure;
}

it("edits a real override, preserves invalid drafts, exports it, and restores it on reload", async () => {
    await exercise("override-and-export", async (page) => {
        await page.getByRole("textbox", { name: "Draft name" }).fill("Tenant evidence harness");
        await navigate(page, /^Tools\b/);
        await page
            .getByRole("group", { name: "view action", exact: true })
            .getByText("Override", { exact: true })
            .click();
        await expect.poll(async () => (await savedPlan(page)).tools.view.action).toBe("override");
        await page
            .getByRole("textbox", { name: "view override description", exact: true })
            .fill("Read authorized tenant documents.");
        const parameters = page.getByRole("textbox", {
            name: "view override parameters (JSON)",
            exact: true,
        });
        const prior = await savedPlan(page);
        await parameters.fill("{");
        await expect
            .poll(() => page.getByRole("button", { name: "Export", exact: true }).isDisabled())
            .toBe(true);
        expect(await savedPlan(page)).toEqual(prior);
        await page.getByRole("button", { name: "Undo", exact: true }).click();
        await expect
            .poll(() => page.getByRole("button", { name: "Export", exact: true }).isEnabled())
            .toBe(true);

        await page.getByRole("button", { name: "Export", exact: true }).click();
        const dialog = page.getByRole("dialog", { name: "Export plan & TypeScript sketch" });
        const code = await dialog
            .getByRole("textbox", { name: "SDK TypeScript integration sketch" })
            .inputValue();
        expect(code).toContain("overridesBuiltInTool: true");
        expect(code).toContain('toolHandler(host, "view")');
        expect(code).not.toContain("approveAll");
        await dialog.getByRole("tab", { name: "Plan JSON" }).click();
        const output = await dialog.getByRole("textbox", { name: "Exported plan JSON" }).inputValue();
        expect(parsePlan(output)).toEqual(prior);
        const downloadPromise = page.waitForEvent("download");
        await dialog.getByRole("button", { name: "Download", exact: true }).click();
        const download = await downloadPromise;
        const filename = path.resolve(".test-artifacts/browser/exported.plan.json");
        await download.saveAs(filename);
        expect(parsePlan(await readFile(filename, "utf8"))).toEqual(prior);
        await page.keyboard.press("Escape");
        await page.reload({ waitUntil: "domcontentloaded" });
        await expect
            .poll(() => page.getByRole("textbox", { name: "Draft name" }).inputValue())
            .toBe("Tenant evidence harness");
        await navigate(page, /^Tools\b/);
        expect(
            await page.getByRole("textbox", { name: "view override description", exact: true }).inputValue(),
        ).toBe("Read authorized tenant documents.");
    });
});

it("applies and undoes actual profile and scenario decisions", async () => {
    await exercise("profiles-and-scenarios", async (page) => {
        await page.getByRole("textbox", { name: "Draft name" }).fill("Keep my draft");
        await page.getByRole("button", { name: "Apply Copilot", exact: true }).click();
        const confirmation = page.getByRole("dialog", { name: "Apply Copilot?" });
        await confirmation.getByRole("button", { name: "Apply Copilot", exact: true }).click();
        await expect.poll(async () => (await savedPlan(page)).inventory).toBe("coding-defaults");
        await page.getByRole("button", { name: "Undo", exact: true }).click();
        await expect.poll(async () => (await savedPlan(page)).name).toBe("Keep my draft");
        await page.getByRole("button", { name: "Redo", exact: true }).click();
        await expect.poll(async () => (await savedPlan(page)).preset).toBe("copilot");

        await page.getByRole("button", { name: "Apply No project workspace", exact: true }).click();
        await expect.poll(async () => (await savedPlan(page)).clientMode).toBe("empty");
        const workspaceFree = await savedPlan(page);
        expect(workspaceFree.context.workspace).toBe("");
        expect(workspaceFree.session.storage).toBe("virtual");
        expect(workspaceFree.tools.bash.action).toBe("remove");
        await page.getByRole("button", { name: "Apply Tenant document assistant", exact: true }).click();
        await page
            .getByRole("dialog", { name: "Apply Tenant document assistant?" })
            .getByRole("button", { name: "Apply Tenant document assistant", exact: true })
            .click();
        await expect.poll(async () => (await savedPlan(page)).tools.view.action).toBe("override");
        expect((await savedPlan(page)).prompt.content).toContain("tenant's authorized documents");
    });
});

it("connects prompt, provider, identity, and state editors to the exported plan", async () => {
    await exercise("prompt-model-policy", async (page) => {
        await navigate(page, /^Prompt\b/);
        await page
            .getByRole("group", { name: "System message mode", exact: true })
            .getByText("Customize", { exact: true })
            .click();
        await page.getByRole("button", { name: "Add section", exact: true }).click();
        await page.getByLabel("Section name", { exact: true }).selectOption("tone");
        await page.getByLabel("Section action", { exact: true }).selectOption("replace");
        await page
            .getByRole("textbox", { name: "Section content", exact: true })
            .fill("Be concise and cite evidence.");
        await expect
            .poll(async () => (await savedPlan(page)).prompt.sections[0]?.content)
            .toBe("Be concise and cite evidence.");

        await navigate(page, /^Models & identity\b/);
        await page.getByLabel("Model provider", { exact: true }).selectOption("openai");
        await page.getByRole("textbox", { name: "Provider endpoint", exact: true }).fill("not-an-endpoint");
        await page.getByLabel("Model provider", { exact: true }).selectOption("copilot");
        await page.getByRole("textbox", { name: "Retained provider endpoint", exact: true }).fill("");
        await expect
            .poll(() => page.getByRole("button", { name: "Export", exact: true }).isEnabled())
            .toBe(true);
        await page.getByLabel("Model provider", { exact: true }).selectOption("azure");
        await page
            .getByRole("textbox", { name: "Provider endpoint", exact: true })
            .fill("https://example.openai.azure.com/openai/v1");
        await page.getByRole("textbox", { name: "Model ID", exact: true }).fill("host-reviewed-model");
        await page
            .getByRole("textbox", { name: "API-key environment variable name", exact: true })
            .fill("TEST_MODEL_KEY");
        await expect.poll(async () => (await savedPlan(page)).model.credentialEnv).toBe("TEST_MODEL_KEY");
        await page
            .getByRole("group", { name: "Provider credential source", exact: true })
            .getByText("Experimental host integration", { exact: true })
            .click();
        await expect.poll(async () => (await savedPlan(page)).model.credential).toBe("bearer-callback");

        await navigate(page, /^Policy & state\b/);
        await page.getByText("Pre-tool policy hook", { exact: true }).click();
        await page.getByText("Large-output handling", { exact: true }).click();
        await page
            .getByRole("spinbutton", { name: "Idle cleanup timeout (seconds)", exact: true })
            .fill("172800");
        await page
            .getByRole("textbox", { name: "Workload evaluation criteria", exact: true })
            .fill("Every answer cites an authorized document.");
        await expect.poll(async () => (await savedPlan(page)).session.idleTimeoutSeconds).toBe(172800);
        const plan = await savedPlan(page);
        expect(plan.policy.preToolHook).toBe(true);
        expect(plan.session.largeOutput).toBe(true);
        expect(plan.evaluation).toBe("Every answer cites an authorized document.");
        expect(
            await page.getByRole("button", { name: /Large results may still write temporary files/ }).count(),
        ).toBe(1);
    });
});

it("keeps editable identities stable across custom tools, MCP names, and agent renames", async () => {
    await exercise("tools-mcp-agents", async (page) => {
        await navigate(page, /^Tools\b/);
        await page.getByRole("button", { name: "Add custom tool", exact: true }).click();
        const name = page.getByRole("textbox", { name: "Custom tool name", exact: true });
        const id = (await savedPlan(page)).customTools[0]?.id;
        await name.fill("lookup_customer");
        await name.pressSequentially("_record");
        expect(await name.inputValue()).toBe("lookup_customer_record");
        expect((await savedPlan(page)).customTools[0]?.id).toBe(id);

        await page.getByRole("button", { name: "Add MCP server", exact: true }).click();
        await page
            .getByRole("textbox", { name: "Canonical runtime wire name", exact: true })
            .fill("verified-runtime-search");
        await expect
            .poll(async () => (await savedPlan(page)).mcpServers[0]?.tools[0]?.wireName)
            .toBe("verified-runtime-search");
        await navigate(page, /^Context & packs\b/);
        await page
            .getByRole("textbox", { name: "Plugin directories", exact: true })
            .fill("/approved/domain-pack");
        await expect
            .poll(async () => (await savedPlan(page)).context.pluginDirectories)
            .toEqual(["/approved/domain-pack"]);

        await navigate(page, /^Agents\b/);
        await page.getByRole("button", { name: "Add agent", exact: true }).click();
        await page.getByLabel("Selected root agent", { exact: true }).selectOption("reviewer");
        await page.getByRole("textbox", { name: "Agent name", exact: true }).fill("domain-reviewer");
        await expect.poll(async () => (await savedPlan(page)).selectedAgent).toBe("domain-reviewer");
        await page
            .getByRole("textbox", { name: "Agent allowed tool names", exact: true })
            .fill("lookup_customer_record");
        await page
            .getByRole("textbox", { name: "Root-only excluded tools", exact: true })
            .fill("lookup_customer_record");
        await expect
            .poll(async () => (await savedPlan(page)).agents[0]?.tools)
            .toEqual(["lookup_customer_record"]);
        await page.getByRole("button", { name: "Remove agent domain-reviewer", exact: true }).click();
        await expect.poll(async () => (await savedPlan(page)).selectedAgent).toBe("");
    });
});

it("preserves corrupt data until explicit recovery and exposes searchable evidence", async () => {
    const corrupt = '{"schemaVersion":99}';
    await exercise(
        "recovery-and-evidence",
        async (page) => {
            expect(await page.getByRole("textbox", { name: "Draft name" }).isDisabled()).toBe(true);
            expect(await page.evaluate((key) => localStorage.getItem(key), STORAGE_KEY)).toBe(corrupt);
            await page.getByRole("button", { name: "Import", exact: true }).click();
            const dialog = page.getByRole("dialog", { name: "Import a harness plan" });
            await dialog.getByRole("textbox", { name: "Plan JSON", exact: true }).fill("{bad}");
            await dialog.getByRole("button", { name: "Import plan", exact: true }).click();
            expect(await dialog.getByText("Plan not imported", { exact: true }).isVisible()).toBe(true);
            expect(await page.evaluate((key) => localStorage.getItem(key), STORAGE_KEY)).toBe(corrupt);
            const imported = createPreset("empty");
            imported.name = "Recovered local draft";
            await dialog.getByLabel("Choose a plan JSON file", { exact: true }).setInputFiles({
                name: "recovered.plan.json",
                mimeType: "application/json",
                buffer: Buffer.from(JSON.stringify(imported)),
            });
            await expect
                .poll(() => dialog.getByRole("button", { name: "Import plan", exact: true }).isEnabled())
                .toBe(true);
            await dialog.getByRole("button", { name: "Import plan", exact: true }).click();
            await expect.poll(async () => (await savedPlan(page)).name).toBe("Recovered local draft");
            expect(await page.getByRole("textbox", { name: "Draft name" }).isEnabled()).toBe(true);

            await navigate(page, /^Learn \/ reference\b/);
            await page
                .getByRole("searchbox", { name: "Search configuration catalog", exact: true })
                .fill("overridesBuiltInTool");
            await expect
                .poll(() => page.getByText("1 of 53 controls", { exact: true }).isVisible())
                .toBe(true);
            const control = page.getByRole("button", { name: /^overridesBuiltInTool/ });
            await control.click();
            expect(
                await page.getByRole("dialog").locator('a[href^="https://github.com/"]').count(),
            ).toBeGreaterThan(0);
            await page.keyboard.press("Escape");
            await expect
                .poll(() => control.evaluate((element) => document.activeElement === element))
                .toBe(true);
            await page.getByRole("tab", { name: /Boundaries & gaps/ }).click();
            expect(await page.getByRole("button", { name: /Serve skills directly from a CMS/ }).count()).toBe(
                1,
            );
        },
        corrupt,
    );
});

it("keeps all editors and export dialogs usable on a narrow screen", async () => {
    await exercise("mobile", async (page) => {
        await page.setViewportSize({ width: 390, height: 844 });
        for (const label of [
            /^Overview\b/,
            /^Prompt\b/,
            /^Tools\b/,
            /^Context & packs\b/,
            /^Agents\b/,
            /^Models & identity\b/,
            /^Policy & state\b/,
            /^Build & run\b/,
            /^Learn \/ reference\b/,
        ]) {
            await navigate(page, label);
            const widths = await page.evaluate(() => ({
                document: document.documentElement.scrollWidth,
                viewport: innerWidth,
            }));
            expect(
                widths.document,
                `Horizontal overflow in ${label}: ${JSON.stringify(widths)}`,
            ).toBeLessThanOrEqual(widths.viewport);
        }
        await page.getByRole("button", { name: "Switch to dark theme", exact: true }).click();
        expect(await page.locator("html").getAttribute("data-theme")).toBe("dark");
        await page.getByRole("button", { name: "Export", exact: true }).click();
        const dialog = page.getByRole("dialog", { name: "Export plan & TypeScript sketch" });
        expect(await dialog.isVisible()).toBe(true);
        expect(
            await page.getByRole("textbox", { name: "SDK TypeScript integration sketch" }).isVisible(),
        ).toBe(true);
        const bounds = await dialog.boundingBox();
        expect(bounds).not.toBeNull();
        expect((bounds?.x ?? 0) + (bounds?.width ?? 0)).toBeLessThanOrEqual(391);
        await page.keyboard.press("Escape");
        await expect
            .poll(() =>
                page
                    .getByRole("button", { name: "Export", exact: true })
                    .evaluate((element) => document.activeElement === element),
            )
            .toBe(true);
    });
});
