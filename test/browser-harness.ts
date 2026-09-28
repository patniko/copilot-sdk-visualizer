// Copyright (c) Microsoft Corporation. All rights reserved.
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright";
import type { Browser, BrowserContext, Page } from "playwright";
import { preview } from "vite";
import type { PreviewServer } from "vite";
import { STORAGE_KEY } from "../src/domain/storage";
import { createPreset } from "../src/domain/presets";

export interface BrowserHarness {
    url: string;
    open(
        saved?: string,
    ): Promise<{ page: Page; context: BrowserContext; errors: string[]; external: string[] }>;
    close(): Promise<void>;
}

export async function startBrowserHarness(): Promise<BrowserHarness> {
    let server: PreviewServer | undefined;
    let browser: Browser | undefined;
    async function close() {
        const failures: unknown[] = [];
        if (browser) {
            try {
                await browser.close();
            } catch (error) {
                failures.push(error);
            }
        }
        if (server) {
            const current = server;
            try {
                await new Promise<void>((resolve, reject) =>
                    current.httpServer.close((error) => (error ? reject(error) : resolve())),
                );
            } catch (error) {
                failures.push(error);
            }
        }
        if (failures.length) throw new AggregateError(failures, "Browser harness cleanup failed.");
    }
    try {
        server = await preview({
            preview: { host: "127.0.0.1", port: 0, strictPort: true },
            logLevel: "error",
        });
        const address = server.httpServer.address();
        if (!address || typeof address === "string")
            throw new Error("The preview server did not bind a TCP port.");
        const url = `http://127.0.0.1:${address.port}`;
        browser = await chromium.launch({
            channel: process.env.PLAYWRIGHT_CHANNEL || "chrome",
            headless: true,
        });
        const activeBrowser = browser;
        await mkdir(path.resolve(".test-artifacts/browser"), { recursive: true });
        return {
            url,
            async open(saved = JSON.stringify(createPreset("minimal"))) {
                const context = await activeBrowser.newContext({
                    viewport: { width: 1600, height: 1100 },
                    reducedMotion: "reduce",
                    colorScheme: "light",
                });
                const page = await context.newPage();
                const errors: string[] = [];
                const external: string[] = [];
                page.on("pageerror", (error) => errors.push(error.message));
                page.on("console", (message) => {
                    if (message.type() === "error") errors.push(message.text());
                });
                await context.route(/^https?:/, async (route) => {
                    if (new URL(route.request().url()).origin !== url) {
                        external.push(route.request().url());
                        await route.abort("blockedbyclient");
                    } else {
                        await route.continue();
                    }
                });
                await context.addInitScript(
                    ({ key, value }) => {
                        if (localStorage.getItem(key) === null) localStorage.setItem(key, value);
                    },
                    { key: STORAGE_KEY, value: saved },
                );
                try {
                    await page.goto(url, { waitUntil: "domcontentloaded" });
                    await page.getByRole("heading", { name: "Harness Builder", exact: true }).waitFor();
                    return { page, context, errors, external };
                } catch (error) {
                    try {
                        await context.close();
                    } catch (cleanupError) {
                        throw new AggregateError(
                            [error, cleanupError],
                            "Opening the app and context cleanup failed.",
                        );
                    }
                    throw error;
                }
            },
            close,
        };
    } catch (error) {
        try {
            await close();
        } catch (cleanupError) {
            throw new AggregateError([error, cleanupError], "Browser harness startup and cleanup failed.");
        }
        throw error;
    }
}
