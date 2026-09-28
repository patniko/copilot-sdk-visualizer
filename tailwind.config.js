// Copyright (c) Microsoft Corporation. All rights reserved.
/** @type {import('tailwindcss').Config} */
export default {
    content: ["./index.html", "./src/**/*.{ts,tsx}"],
    corePlugins: { preflight: false },
    theme: {
        extend: {
            colors: {
                canvas: "var(--cp-bg)",
                surface: "var(--cp-surface)",
                ink: "var(--cp-text)",
                muted: "var(--cp-text-muted)",
                accent: "var(--cp-accent)",
            },
        },
    },
    plugins: [],
};
