// Copyright (c) Microsoft Corporation. All rights reserved.
import { readFile, writeFile } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const upstream = process.argv[2];
if (!upstream) throw new Error("Usage: node script/capture-prompt-reference.mjs <runtime-repository>");
const root = path.resolve(upstream);
const revision = execFileSync("git", ["-C", root, "rev-parse", "HEAD"], { encoding: "utf8" }).trim();
const paths = {
    fragments: "src/runtime/src/prompts/agent_system.rs",
    assembler: "src/runtime/src/prompts/agent_system_message.rs",
    templates: "src/runtime/src/prompt_text_base/system_templates.rs",
};
const contents = Object.fromEntries(
    await Promise.all(
        Object.entries(paths).map(async ([key, file]) => [
            key,
            await readFile(path.join(root, file), "utf8"),
        ]),
    ),
);
const decode = (literal) => JSON.parse(literal.replace(/\\\r?\n\s*/g, ""));
function constant(file, name) {
    const source = contents[file];
    const raw = source.match(new RegExp(`\\bconst\\s+${name}\\s*:\\s*&str\\s*=\\s*r(#+)"([\\s\\S]*?)"\\1;`));
    if (raw) return raw[2].trim();
    const normal = source.match(
        new RegExp(`\\bconst\\s+${name}\\s*:\\s*&str\\s*=\\s*("(?:\\\\.|[^"\\\\])*")\\s*;`),
    );
    if (!normal) throw new Error(`Cannot find prompt constant ${name}.`);
    return decode(normal[1]).trim();
}
const link = (file, lines) =>
    `https://github.com/github/copilot-agent-runtime/blob/${revision}/${paths[file]}#${lines}`;
const identity = constant("assembler", "DEFAULT_IDENTITY_STATEMENT");
const tone = `# Tone and style\n${constant("fragments", "DEFAULT_TONE_AND_STYLE_INSTRUCTIONS")}`;
const efficiencyFunction = contents.fragments
    .split("pub fn tool_efficiency(")[1]
    ?.split("#[allow(dead_code")[0];
if (!efficiencyFunction) throw new Error("Cannot locate the tool-efficiency source.");
const formats = [...efficiencyFunction.matchAll(/format!\(\s*("(?:\\.|[^"\\])*")/gs)];
const efficiencyFormat = formats.at(-1)?.[1];
if (!efficiencyFormat) throw new Error("Cannot locate the tool-efficiency format string.");
const sections = [
    {
        id: "preamble",
        title: "Agent preamble",
        kind: "literal",
        content: identity,
        note: "Exact model-agnostic product identity constant. This is a repository reference, not this assistant's live prompt.",
        source: link("assembler", "L59-L65"),
    },
    {
        id: "identity",
        title: "Identity group",
        kind: "assembly",
        content: `${identity}\n\n{{interaction_mode}}\n\n${tone}\n\n{{search_and_delegation}}\n\n{{tool_efficiency}}\n\n{{version_information}}\n\n{{model_information}}\n\n${constant("assembler", "IDENTITY_TASK_INSTRUCTIONS")}`,
        note: "Assembly reference for the group. Braced markers stand for runtime inputs, not SDK expansion macros. The identity group contains preamble, tone, and tool_efficiency plus non-addressable mode/search/version/model/task members; environment_context is separate.",
        source: link("assembler", "L558-L623"),
        members: ["preamble", "tone", "tool_efficiency"],
    },
    {
        id: "tone",
        title: "Default tone and style",
        kind: "literal",
        content: tone,
        note: "Rendered from the generic fallback constant. Model-specific profiles can replace this text; the builder does not resolve a live model.",
        source: link("fragments", "L151-L166"),
    },
    {
        id: "tool_efficiency",
        title: "Tool-use efficiency",
        kind: "template",
        content: decode(efficiencyFormat),
        note: "Actual format text, with unresolved Rust-format slots. The runtime selects tool names and delegation guidance from the active inventory.",
        source: link("fragments", "L264-L320"),
    },
    {
        id: "environment_context",
        title: "Environment context",
        kind: "dynamic",
        content:
            "<environment_context>\n{{working_directory}}\n{{repository_and_git_root}}\n{{operating_system}}\n{{available_tool_names}}\n{{platform_specific_guidance}}\n</environment_context>",
        note: "Illustrative structure, not a captured user's environment. Values are assembled from the future host/session; no local workspace or credentials are read by this web app.",
        source: link("assembler", "L807-L853"),
    },
    {
        id: "code_change_rules",
        title: "Code-change guidance",
        kind: "fragment",
        content: `<rules_for_code_changes>\n${constant("templates", "CODING_RULES_PREAMBLE")}\n${constant("templates", "CODING_RULES_DEFAULT_VALIDATION")}\n{{model_or_host_additional_rules}}\n</rules_for_code_changes>\n\n<linting_building_testing>\n${constant("fragments", "LINTING_BUILDING_TESTING")}\n</linting_building_testing>\n\n${constant("fragments", "ECOSYSTEM_TOOL_INSTRUCTIONS")}`,
        note: "Source fragments from the default assembly; additional rules and model-specific tuning are runtime inputs. Braced markers are explanatory placeholders.",
        source: link("assembler", "L858-L877"),
    },
    {
        id: "guidelines",
        title: "Task guidance",
        kind: "dynamic",
        content:
            "{{capability_specific_guidance}}\n\n<tips_and_tricks>\n{{tips_selected_for_available_tools}}\n* Do not create markdown files for planning, notes, or tracking unless explicitly requested; session artifacts may go in the session workspace.\n</tips_and_tricks>",
        note: "The runtime conditionally adds collaboration, documentation, execution-subagent, and tool-specific tips. This is an assembly outline, not a complete resolved section.",
        source: link("assembler", "L878-L908"),
    },
    {
        id: "safety",
        title: "Environment limitations",
        kind: "dynamic",
        content:
            "{{sandbox_or_host_environment_limitations}}\n\n<prohibited_actions>\n{{runtime_safety_and_data_handling_guidance}}\n</prohibited_actions>",
        note: "The host's sandbox and environment determine this section. Inspect the linked repository template for its static rules. It is not a live instruction dump, and changing prompt text does not change enforced host/organization policy.",
        source: link("templates", "L35-L63"),
    },
    {
        id: "tool_instructions",
        title: "Tool instruction group",
        kind: "assembly",
        content: `${constant("templates", "DEFAULT_TOOL_INSTRUCTIONS_INTRO")}\n\n<tools>\n{{instructions_for_each_configured_tool}}\n</tools>`,
        note: "A group containing the static introduction and generated per-tool bodies. The actual contents depend on the active tool catalog, model, and host.",
        source: link("assembler", "L611-L622"),
    },
    {
        id: "custom_instructions",
        title: "Host / project instructions",
        kind: "dynamic",
        content: "{{organization_repository_and_host_instruction_content}}",
        note: "This section is populated from configured/discovered instruction sources. The reference intentionally includes no personal, repository-local, or tenant content.",
        source: link("assembler", "L930-L932"),
    },
    {
        id: "runtime_instructions",
        title: "Runtime-added instructions",
        kind: "dynamic",
        content: "{{mode_memory_model_mcp_agent_and_extension_guidance}}",
        note: "The runtime composes this from materialized session inputs and enabled capabilities. The builder cannot reproduce it faithfully without the chosen runtime/model/session.",
        source: link("assembler", "L934-L936"),
    },
    {
        id: "last_instructions",
        title: "Final guidance",
        kind: "fragment",
        content: `${constant("assembler", "PERSISTENCE_QUALITY_AND_PERSISTENCE")}\n\n${constant("assembler", "RESPOND_CONCISELY")}\n\n{{model_specific_and_subagent_guidance}}`,
        note: "Excerpts of default final guidance; model and configured-subagent additions vary. This is not the final cache-block or wire ordering.",
        source: link("assembler", "L43-L52"),
    },
];
const output = {
    $comment: "Copyright (c) Microsoft Corporation. All rights reserved.",
    revision,
    context:
        "Model-agnostic repository reference. Literal defaults, source fragments, and dynamic assembly outlines are labeled separately. Not a resolved session prompt.",
    sections,
};
const destination = fileURLToPath(new URL("../src/content/builtin-prompts.json", import.meta.url));
await writeFile(destination, JSON.stringify(output, null, 2) + "\n");
console.log(`Captured ${sections.length} prompt references at ${revision.slice(0, 8)}.`);
