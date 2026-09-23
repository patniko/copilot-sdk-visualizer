// Copyright (c) Microsoft Corporation. All rights reserved.
import { readFile } from "node:fs/promises";
import path from "node:path";
import { afterAll, beforeAll, expect, it } from "vitest";
import type { Page } from "playwright";
import { parsePlan } from "../src/domain/plan";
import type { HarnessPlan } from "../src/domain/plan";
import { createPreset } from "../src/domain/presets";
import { STORAGE_KEY } from "../src/domain/storage";
import { reference } from "../src/content/reference";
import { copilotModelCatalog } from "../src/content/models";
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
        const dialog = page.getByRole("dialog", { name: "Export plan, code & CLI instructions" });
        const code = await dialog
            .getByRole("textbox", { name: "SDK TypeScript integration sketch" })
            .inputValue();
        expect(code).toContain("overridesBuiltInTool: true");
        expect(code).toContain('toolHandler(host, "view")');
        expect(code).not.toContain("approveAll");
        await dialog.getByRole("tab", { name: "Copilot CLI" }).click();
        const instructions = await dialog
            .getByRole("textbox", { name: "Copilot CLI integration instructions" })
            .inputValue();
        expect(instructions).toContain("repository currently open in this Copilot CLI session");
        expect(instructions).toContain("Tenant evidence harness");
        expect(instructions).toContain("view: Read authorized tenant documents.");
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
        expect(
            await page
                .getByRole("heading", { name: "What is a harness, and how do you build one?" })
                .isVisible(),
        ).toBe(true);
        expect(await page.getByRole("button", { name: "Apply Copilot", exact: true }).count()).toBe(0);
        await navigate(page, /^Base Profile\b/);
        expect(await page.getByRole("heading", { name: "Compose the behavior." }).isVisible()).toBe(true);
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

it("collapses the desktop navigation and restores the preference on reload", async () => {
    await exercise("collapsed-navigation", async (page) => {
        const workspace = page.locator(".hb-workspace");
        await page.getByRole("button", { name: "Collapse navigation", exact: true }).click();
        await expect
            .poll(() => workspace.evaluate((element) => element.classList.contains("hb-sidebar-collapsed")))
            .toBe(true);
        expect(await page.getByRole("button", { name: "Expand navigation", exact: true }).isVisible()).toBe(
            true,
        );
        await navigate(page, /^Tools\b/);
        expect(await page.getByRole("heading", { name: "Same tool. Your implementation." }).isVisible()).toBe(
            true,
        );

        await page.reload({ waitUntil: "domcontentloaded" });
        expect(await page.getByRole("button", { name: "Expand navigation", exact: true }).isVisible()).toBe(
            true,
        );
        await page.getByRole("button", { name: "Expand navigation", exact: true }).click();
        await expect
            .poll(() => workspace.evaluate((element) => element.classList.contains("hb-sidebar-collapsed")))
            .toBe(false);
    });
});

it("collapses the live plan and restores the preference on reload", async () => {
    await exercise("collapsed-live-plan", async (page) => {
        const workspace = page.locator(".hb-workspace");
        await page.getByRole("button", { name: "Collapse live plan", exact: true }).click();
        await expect
            .poll(() => workspace.evaluate((element) => element.classList.contains("hb-plan-collapsed")))
            .toBe(true);
        expect(await page.getByRole("button", { name: "Expand live plan", exact: true }).isVisible()).toBe(
            true,
        );

        await page.reload({ waitUntil: "domcontentloaded" });
        expect(await page.getByRole("button", { name: "Expand live plan", exact: true }).isVisible()).toBe(
            true,
        );
        await page.getByRole("button", { name: "Expand live plan", exact: true }).click();
        await expect
            .poll(() => workspace.evaluate((element) => element.classList.contains("hb-plan-collapsed")))
            .toBe(false);
    });
});

it("keeps advanced runtime details out of the demo UI", async () => {
    await exercise("advanced-hidden", async (page) => {
        expect(
            await page
                .getByRole("navigation", { name: "Harness workflow" })
                .getByRole("button", { name: /^Advanced\b/ })
                .count(),
        ).toBe(0);

        await navigate(page, /^Learn \/ reference\b/);
        await page.getByRole("tab", { name: /Map to SDK docs/ }).click();
        expect(await page.getByText("Advanced runtime surfaces", { exact: true }).count()).toBe(0);

        await page.evaluate(() => {
            window.location.hash = "#advanced";
        });
        await page.reload({ waitUntil: "domcontentloaded" });
        expect(await page.getByRole("heading", { name: "Understand the harness." }).isVisible()).toBe(true);
    });
});

it("selects Copilot catalog models and preserves the choice through undo, reload, and export", async () => {
    const initial = createPreset("minimal");
    initial.model.provider = "copilot";
    initial.model.id = "";
    await exercise(
        "copilot-model-catalog",
        async (page) => {
            await navigate(page, /^Models & identity\b/);
            const model = page.getByRole("combobox", { name: "Model ID", exact: true });
            expect(await page.getByRole("textbox", { name: "Model ID", exact: true }).count()).toBe(0);
            expect(
                await model
                    .locator("option")
                    .evaluateAll((options) => options.map((option) => option.getAttribute("value"))),
            ).toEqual(["", ...copilotModelCatalog.modelIds]);
            expect(await model.inputValue()).toBe("");
            await model.selectOption("gpt-6-astra");
            await expect.poll(async () => (await savedPlan(page)).model.id).toBe("gpt-6-astra");
            await page.getByRole("button", { name: "Undo", exact: true }).click();
            await expect.poll(() => model.inputValue()).toBe("");
            await page.getByRole("button", { name: "Redo", exact: true }).click();
            await expect.poll(() => model.inputValue()).toBe("gpt-6-astra");
            await page.reload({ waitUntil: "domcontentloaded" });
            await navigate(page, /^Models & identity\b/);
            expect(await model.inputValue()).toBe("gpt-6-astra");

            await page.getByRole("button", { name: "Export", exact: true }).click();
            const dialog = page.getByRole("dialog", { name: "Export plan, code & CLI instructions" });
            expect(
                await dialog.getByRole("textbox", { name: "SDK TypeScript integration sketch" }).inputValue(),
            ).toContain('model: "gpt-6-astra"');
            await dialog.getByRole("tab", { name: "Plan JSON" }).click();
            expect(
                parsePlan(await dialog.getByRole("textbox", { name: "Exported plan JSON" }).inputValue())
                    .model.id,
            ).toBe("gpt-6-astra");
            await page.keyboard.press("Escape");
            await model.selectOption("");
            await expect.poll(async () => (await savedPlan(page)).model.id).toBe("");
        },
        JSON.stringify(initial),
    );
});

it("retains unlisted Copilot IDs and leaves BYOK model entry free-form", async () => {
    const initial = createPreset("minimal");
    initial.model.provider = "copilot";
    initial.model.id = "future-copilot-model";
    await exercise(
        "copilot-model-retained",
        async (page) => {
            await navigate(page, /^Models & identity\b/);
            const model = page.getByRole("combobox", { name: "Model ID", exact: true });
            expect(await model.inputValue()).toBe(initial.model.id);
            expect(await model.locator("option:checked").textContent()).toContain("not in bundled catalog");
            expect((await savedPlan(page)).model.id).toBe(initial.model.id);
            const access = page.getByRole("group", { name: "Inference access", exact: true });
            await access.getByText("Bring your own inference", { exact: true }).click();
            const providerModel = page.getByRole("textbox", { name: "Model ID", exact: true });
            expect(await providerModel.inputValue()).toBe(initial.model.id);
            await providerModel.fill("my-provider/deployment");
            await access.getByText("GitHub Copilot account", { exact: true }).click();
            expect(await model.inputValue()).toBe("my-provider/deployment");
            expect(await model.locator("option:checked").textContent()).toContain("not in bundled catalog");
            await model.selectOption("claude-sonnet-5");
            await expect.poll(async () => (await savedPlan(page)).model.id).toBe("claude-sonnet-5");
            expect(await model.locator('option[value="my-provider/deployment"]').count()).toBe(0);
            await access.getByText("Bring your own inference", { exact: true }).click();
            expect(await providerModel.inputValue()).toBe("claude-sonnet-5");
        },
        JSON.stringify(initial),
    );
});

it("allows blank provider endpoints while preserving save, reload, and export", async () => {
    await exercise("deferred-provider-endpoint", async (page) => {
        await navigate(page, /^Models & identity\b/);
        await page
            .getByRole("group", { name: "Inference access", exact: true })
            .getByText("Bring your own inference", { exact: true })
            .click();
        const endpoint = page.getByRole("textbox", { name: "Provider endpoint", exact: true });
        await endpoint.fill("");
        expect(await endpoint.getAttribute("aria-invalid")).toBe("false");
        await expect.poll(async () => (await savedPlan(page)).model.provider).toBe("openai");
        expect((await savedPlan(page)).model.endpoint).toBe("");
        expect(await page.getByRole("button", { name: "Export", exact: true }).isEnabled()).toBe(true);
        await page.reload({ waitUntil: "domcontentloaded" });
        await navigate(page, /^Models & identity\b/);
        expect(await endpoint.inputValue()).toBe("");
        expect(await endpoint.getAttribute("aria-invalid")).toBe("false");
        await page.getByRole("button", { name: "Export", exact: true }).click();
        const dialog = page.getByRole("dialog", { name: "Export plan, code & CLI instructions" });
        expect(
            await dialog.getByRole("textbox", { name: "SDK TypeScript integration sketch" }).inputValue(),
        ).toContain('baseUrl: required(host.providerEndpoint?.trim(), "provider endpoint")');
        await page.keyboard.press("Escape");
        await navigate(page, /^Build & run\b/);
        expect(await page.getByRole("button", { name: "Download ZIP", exact: true }).isEnabled()).toBe(true);
        await navigate(page, /^Models & identity\b/);
        await endpoint.fill("not-an-endpoint");
        expect(await endpoint.getAttribute("aria-invalid")).toBe("true");
        expect(await page.getByRole("button", { name: "Export", exact: true }).isDisabled()).toBe(true);
        await endpoint.fill("");
        expect(await endpoint.getAttribute("aria-invalid")).toBe("false");
        expect(await page.getByRole("button", { name: "Export", exact: true }).isEnabled()).toBe(true);
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
        await page
            .getByRole("group", { name: "Inference access", exact: true })
            .getByText("Bring your own inference", { exact: true })
            .click();
        await page.getByRole("textbox", { name: "Provider endpoint", exact: true }).fill("not-an-endpoint");
        await page
            .getByRole("group", { name: "Inference access", exact: true })
            .getByText("GitHub Copilot account", { exact: true })
            .click();
        await page.getByRole("textbox", { name: "Retained provider endpoint", exact: true }).fill("");
        await expect
            .poll(() => page.getByRole("button", { name: "Export", exact: true }).isEnabled())
            .toBe(true);
        await page
            .getByRole("group", { name: "Inference access", exact: true })
            .getByText("Bring your own inference", { exact: true })
            .click();
        await page.getByLabel("Provider type", { exact: true }).selectOption("azure");
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
            .getByText("Bearer-token callback", { exact: true })
            .click();
        await expect.poll(async () => (await savedPlan(page)).model.credential).toBe("bearer-callback");

        await navigate(page, /^Policy & state\b/);
        await page
            .getByRole("group", { name: "Permission handling", exact: true })
            .getByText("Explicit allow all", { exact: true })
            .click();
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
        expect(plan.policy.permissionMode).toBe("allow-all");
        expect(
            await page.getByText("Every runtime permission prompt will be approved", { exact: true }).count(),
        ).toBe(1);
        expect(plan.policy.preToolHook).toBe(true);
        expect(plan.session.largeOutput).toBe(true);
        expect(plan.evaluation).toBe("Every answer cites an authorized document.");
        expect(
            await page.getByRole("button", { name: /Large results may still write temporary files/ }).count(),
        ).toBe(1);
    });
});

it("configures the eligible GitHub App S2S route without storing or exporting credentials", async () => {
    await exercise("s2s-installation-auth", async (page) => {
        await navigate(page, /^Models & identity\b/);
        await page
            .getByRole("group", { name: "GitHub credential ownership", exact: true })
            .getByText("GitHub App service identity", { exact: true })
            .click();
        await expect.poll(async () => (await savedPlan(page)).identity).toBe("s2s-installation");
        expect(
            await page.getByText("Selection configures generation only", { exact: true }).isVisible(),
        ).toBe(true);
        const checklist = page.getByRole("note", { name: "GitHub App setup checklist" });
        expect(await checklist.getByText(/Copilot Requests: Read & write/).isVisible()).toBe(true);
        expect(await checklist.getByText(/All repositories/).isVisible()).toBe(true);
        expect(await checklist.getByText(/repository_ids/).isVisible()).toBe(true);
        expect(await checklist.getByText(/one hour/).isVisible()).toBe(true);
        expect(
            await checklist
                .getByRole("link", { name: /server-to-server authentication guide/ })
                .getAttribute("href"),
        ).toBe("https://docs.github.com/en/copilot/how-tos/copilot-sdk/auth/server-to-server-tokens");

        await page.getByRole("button", { name: "Export", exact: true }).click();
        const dialog = page.getByRole("dialog", { name: "Export plan, code & CLI instructions" });
        const code = await dialog
            .getByRole("textbox", { name: "SDK TypeScript integration sketch" })
            .inputValue();
        expect(code).toContain("COPILOT_GITHUB_TOKEN");
        expect(code).toContain("useLoggedInUser: false");
        expect(code).not.toContain("gitHubTokenProvider");
        expect(code).not.toContain("GITHUB_TOKEN_EXPIRES_AT");
        await dialog.getByRole("tab", { name: "Plan JSON" }).click();
        const output = await dialog.getByRole("textbox", { name: "Exported plan JSON" }).inputValue();
        expect(parsePlan(output).identity).toBe("s2s-installation");
        expect(output).not.toMatch(/privateKey|installationToken|jwt|expiresAt/i);
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

it("preserves corrupt data until explicit recovery and exposes searchable guidance", async () => {
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
                .poll(() =>
                    page.getByText(`1 of ${reference.controls.length} controls`, { exact: true }).isVisible(),
                )
                .toBe(true);
            const control = page.getByRole("button", { name: /^overridesBuiltInTool/ });
            await control.click();
            const guidance = page.getByRole("dialog");
            expect(await guidance.locator('a[href*="/blob/"]').count()).toBe(0);
            expect(await guidance.getByText(/\b[a-f0-9]{40}\b/i).count()).toBe(0);
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
            /^Base Profile\b/,
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
        const dialog = page.getByRole("dialog", { name: "Export plan, code & CLI instructions" });
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
