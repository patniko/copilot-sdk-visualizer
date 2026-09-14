// Copyright (c) Microsoft Corporation. All rights reserved.
import { defineConfig } from "vitest/config";

export default defineConfig({
    test: {
        projects: [
            { test: { name: "unit", environment: "node", include: ["src/**/*.test.ts"] } },
            {
                test: {
                    name: "browser",
                    environment: "node",
                    include: ["test/browser.test.ts", "test/bootstrap-browser.test.ts"],
                    testTimeout: 60_000,
                    hookTimeout: 60_000,
                    retry: 0,
                },
            },
            {
                test: {
                    name: "contract",
                    environment: "node",
                    include: ["test/*contract.test.ts"],
                    testTimeout: 60_000,
                    retry: 0,
                },
            },
        ],
    },
});
