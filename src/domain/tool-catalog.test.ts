// Copyright (c) Microsoft Corporation. All rights reserved.
import { describe, expect, it } from "vitest";
import { BUILTIN_NAMES, BUILTIN_SPECS, TOOL_CATALOG_REVISION, toolCatalog } from "../content/builtin-tools";
import privateToolCatalog from "../content/tool-catalog.json";
import { parsePlan } from "./plan";
import { createPreset } from "./presets";
import { exportPlan, generateSdkCode } from "./export";
import { buildBootstrapProject } from "./bootstrap";

const originalNames = [
    "view",
    "apply_patch",
    "grep",
    "glob",
    "bash",
    "ask_user",
    "task_complete",
    "task",
    "skill",
] as const;

describe("complete built-in catalog and draft migration", () => {
    it("covers the full extracted descriptor set, aliases, and qualified defaults", () => {
        expect(BUILTIN_NAMES).toHaveLength(59);
        expect(new Set(BUILTIN_NAMES).size).toBe(59);
        expect(toolCatalog.context.aliases).toHaveLength(33);
        expect(
            BUILTIN_NAMES.filter((name) => BUILTIN_SPECS[name].defaultStatus === "baseline-enabled"),
        ).toEqual(["create", "edit", "glob", "grep", "view", "web_fetch"]);
        expect(
            BUILTIN_NAMES.filter((name) => BUILTIN_SPECS[name].defaultStatus === "platform-specific"),
        ).toHaveLength(8);
        expect(BUILTIN_SPECS.catalog_search.overrideable).toBe(false);
        expect(BUILTIN_SPECS.tool_search_tool.overrideable).toBe(true);
        for (const tool of toolCatalog.tools) {
            expect(tool.defaultReason.length).toBeGreaterThan(20);
            expect(
                privateToolCatalog.tools.find((entry) => entry.name === tool.name)?.sources.length,
            ).toBeGreaterThan(0);
            expect(JSON.parse(tool.parameters).type).toBe("object");
        }
    });

    it.each(["minimal", "copilot"] as const)(
        "preserves an old nine-tool %s draft's effective inventory",
        (preset) => {
            const current = createPreset(preset);
            current.tools.view.action = "override";
            const { target: _target, toolCatalogRevision: _catalog, ...fields } = current;
            const old = {
                ...fields,
                schemaVersion: 1,
                tools: Object.fromEntries(originalNames.map((name) => [name, current.tools[name]])),
            };
            const migrated = parsePlan(JSON.stringify(old));
            expect(migrated.toolCatalogRevision).toBe(TOOL_CATALOG_REVISION);
            expect(Object.keys(migrated.tools)).toHaveLength(59);
            for (const name of originalNames) expect(migrated.tools[name]).toEqual(current.tools[name]);
            for (const name of BUILTIN_NAMES) {
                if (originalNames.some((original) => original === name)) continue;
                expect(migrated.tools[name].action).toBe(preset === "copilot" ? "keep" : "remove");
            }
            const code = generateSdkCode(migrated);
            expect(code.includes("availableTools:")).toBe(preset === "minimal");
        },
    );

    it("rejects incomplete tagged catalogs rather than silently inventing missing choices", () => {
        const plan = createPreset("empty");
        const { lsp: _lsp, ...tools } = plan.tools;
        expect(() => parsePlan(JSON.stringify({ ...plan, tools }))).toThrow();
    });

    it("retains legacy unverified overrides but prevents misleading runnable exports", () => {
        const plan = createPreset("empty");
        plan.tools.catalog_search.action = "override";
        expect(parsePlan(exportPlan(plan)).tools.catalog_search.action).toBe("override");
        expect(() => generateSdkCode(plan)).toThrow(/reserved/);
        const result = buildBootstrapProject(plan);
        expect(result.ok).toBe(false);
        if (result.ok) throw new Error("A reserved override must not produce a bootstrap.");
        expect(result.blockers.some((blocker) => blocker.id === "unverified-override-catalog_search")).toBe(
            true,
        );
    });
});
