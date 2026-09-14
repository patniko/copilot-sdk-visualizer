// Copyright (c) Microsoft Corporation. All rights reserved.
import { describe, expect, it } from "vitest";
import { reference } from "./reference";
import { SDK_DOCS_HOME, SDK_DOC_MAP, SDK_GETTING_STARTED, sdkDocsForView } from "./sdk-docs";

describe("reference source integrity", () => {
    it("resolves every control, axis, and gap source id", () => {
        for (const control of reference.controls) {
            expect(reference.sources[control.source], `${control.name} → ${control.source}`).toBeDefined();
        }
        for (const axis of reference.axes) {
            for (const source of axis.sources) expect(reference.sources[source], source).toBeDefined();
        }
        for (const gap of reference.gaps) {
            for (const source of gap.sources) expect(reference.sources[source], source).toBeDefined();
        }
    });

    it("gives every source with a url an absolute https link", () => {
        for (const [id, source] of Object.entries(reference.sources)) {
            if (source.url) expect(source.url, id).toMatch(/^https:\/\//);
        }
    });
});

describe("SDK docs map", () => {
    it("covers each builder view once with valid https links", () => {
        const views = SDK_DOC_MAP.map((group) => group.view);
        expect(new Set(views).size).toBe(views.length);
        for (const group of SDK_DOC_MAP) {
            expect(group.links.length).toBeGreaterThan(0);
            for (const link of group.links) {
                expect(link.url, link.label).toMatch(/^https:\/\/github\.com\/github\/copilot-sdk\/blob\//);
                expect(link.note.length).toBeGreaterThan(0);
            }
        }
    });

    it("exposes home and getting-started entry points and a lookup helper", () => {
        expect(SDK_DOCS_HOME).toMatch(/^https:\/\//);
        expect(SDK_GETTING_STARTED).toMatch(/^https:\/\//);
        expect(sdkDocsForView("bootstrap")?.links.some((link) => /bundled-cli/.test(link.url))).toBe(true);
        expect(sdkDocsForView("overview")?.view).toBe("overview");
    });
});
