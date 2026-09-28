// Copyright (c) Microsoft Corporation. All rights reserved.
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const REVISION = "efebfd34dfa68830b11f49302fd88d12950df2e4";
const PREFIX = "src/runtime/src/";
const REGISTRY = `${PREFIX}tools/registry.rs`;
const INITIALIZATION = `${PREFIX}session/tool_initialization.rs`;
const INVOKER = `${PREFIX}tools/session_tool_invoker.rs`;
const SERIALIZERS = `${PREFIX}session/session_serializers.rs`;
const ALIASES = `${PREFIX}tools_base/aliases.rs`;
const CATALOG = `${PREFIX}tools/session_catalog.rs`;
const OUTPUT = fileURLToPath(new URL("../src/content/tool-catalog.json", import.meta.url));

function usage() {
    process.stdout.write(
        "Usage: node script/capture-tool-catalog.mjs [--run | --check] <runtime-checkout>\n\n" +
            "Reads committed descriptor and policy sources at the pinned revision using git.\n" +
            "Default: inspect and print a summary without writing files.\n" +
            "--run: write only src/content/tool-catalog.json.\n" +
            "--check: compare the committed-source extraction with the existing snapshot.\n" +
            "No native addon, sessions, authentication, tools, or network requests are invoked.\n" +
            "No environment variables are required.\n",
    );
}

const args = process.argv.slice(2);
if (args.includes("--help")) {
    usage();
    process.exit(0);
}
const run = args.includes("--run");
const check = args.includes("--check");
const positional = args.filter((argument) => !argument.startsWith("--"));
assert(!(run && check), "Choose --run or --check, not both.");
assert(args.every((argument) => !argument.startsWith("--") || ["--run", "--check"].includes(argument)));
assert.equal(positional.length, 1, "Supply the runtime checkout; see --help.");
const root = path.resolve(positional[0]);

function git(...arguments_) {
    return execFileSync("git", arguments_, {
        cwd: root,
        encoding: "utf8",
        maxBuffer: 16 * 1024 * 1024,
        stdio: ["ignore", "pipe", "pipe"],
    });
}

assert.equal(git("rev-parse", `${REVISION}^{commit}`).trim(), REVISION);
const tracked = new Set(
    git("ls-tree", "-r", "--name-only", REVISION, "--", "src/runtime/src").trim().split("\n"),
);
const cache = new Map();

function source(file) {
    if (!cache.has(file)) {
        const text = git("show", `${REVISION}:${file}`);
        cache.set(file, { text, tokens: tokenize(text), constants: undefined });
    }
    return cache.get(file);
}

function anchor(file, start, end = start) {
    return `https://github.com/github/copilot-agent-runtime/blob/${REVISION}/${file}#L${start}-L${end}`;
}

function sourceAnchor(file, begin, end) {
    const text = source(file).text;
    return anchor(file, text.slice(0, begin).split("\n").length, text.slice(0, end).split("\n").length);
}

function decodeString(literal) {
    const raw = literal.match(/^r(#+)?"([\s\S]*)"\1$/);
    if (raw) return raw[2];
    return literal
        .slice(1, -1)
        .replace(/\\\r?\n\s*/g, "")
        .replace(/\\(?:u\{([0-9a-fA-F_]+)\}|x([0-9a-fA-F]{2})|([\\nrt0"']))/g, (_, unicode, hex, simple) => {
            if (unicode) return String.fromCodePoint(Number.parseInt(unicode.replaceAll("_", ""), 16));
            if (hex) return String.fromCodePoint(Number.parseInt(hex, 16));
            return { "\\": "\\", n: "\n", r: "\r", t: "\t", 0: "\0", '"': '"', "'": "'" }[simple];
        });
}

// A bounded lexical reader, not a Rust interpreter. Only static strings, arrays,
// tuples, concat!, include_str!, and constant references are evaluated.
function tokenize(text) {
    const tokens = [];
    let offset = 0;
    while (offset < text.length) {
        const rest = text.slice(offset);
        const whitespace = rest.match(/^\s+/);
        if (whitespace) {
            offset += whitespace[0].length;
            continue;
        }
        if (rest.startsWith("//")) {
            const end = text.indexOf("\n", offset);
            offset = end < 0 ? text.length : end + 1;
            continue;
        }
        if (rest.startsWith("/*")) {
            let depth = 1;
            offset += 2;
            while (depth && offset < text.length) {
                if (text.startsWith("/*", offset)) {
                    depth++;
                    offset += 2;
                } else if (text.startsWith("*/", offset)) {
                    depth--;
                    offset += 2;
                } else offset++;
            }
            assert.equal(depth, 0, "Unterminated Rust comment.");
            continue;
        }
        const raw = rest.match(/^r(#+)?"/);
        if (raw) {
            const terminator = `"${raw[1] ?? ""}`;
            const end = text.indexOf(terminator, offset + raw[0].length);
            assert(end >= 0, "Unterminated Rust raw string.");
            const finish = end + terminator.length;
            tokens.push({ value: text.slice(offset, finish), kind: "string", start: offset, end: finish });
            offset = finish;
            continue;
        }
        const literal = rest.match(/^"(?:\\[\s\S]|[^"\\])*"/);
        const character = rest.match(/^b?'(?:\\(?:u\{[^}]+\}|x[0-9a-fA-F]{2}|[\s\S])|[^'\\\n])'/);
        const word = rest.match(/^(?:'[A-Za-z_]\w*|[A-Za-z_]\w*|\d+(?:\.\d+)?)/);
        const value = literal?.[0] ?? character?.[0] ?? word?.[0] ?? rest[0];
        tokens.push({
            value,
            kind: literal ? "string" : character ? "character" : word ? "word" : "punctuation",
            start: offset,
            end: offset + value.length,
        });
        offset += value.length;
    }
    return tokens;
}

function closing(tokens, start) {
    const pairs = { "(": ")", "[": "]", "{": "}" };
    const stack = [];
    for (let index = start; index < tokens.length; index++) {
        const token = tokens[index];
        if (token.kind !== "punctuation") continue;
        if (pairs[token.value]) stack.push(pairs[token.value]);
        else if ([")", "]", "}"].includes(token.value)) {
            assert.equal(stack.pop(), token.value, "Unbalanced Rust delimiter.");
            if (!stack.length) return index;
        }
    }
    throw new Error("Unterminated Rust expression.");
}

function split(tokens, separator = ",") {
    const pieces = [];
    let start = 0;
    for (let index = 0; index < tokens.length; index++) {
        const token = tokens[index];
        if (token.kind !== "punctuation") continue;
        if (["(", "[", "{"].includes(token.value)) index = closing(tokens, index);
        else if (token.value === separator) {
            if (index > start) pieces.push(tokens.slice(start, index));
            start = index + 1;
        }
    }
    if (start < tokens.length) pieces.push(tokens.slice(start));
    return pieces;
}

function constants(file) {
    const entry = source(file);
    if (entry.constants) return entry.constants;
    const result = new Map();
    const tokens = entry.tokens;
    for (let index = 0; index < tokens.length - 3; index++) {
        if (!["const", "static"].includes(tokens[index].value)) continue;
        const name = tokens[index + 1].value;
        if (!/^[A-Z][A-Z0-9_]*$/.test(name) || tokens[index + 2].value !== ":") continue;
        let equals = index + 3;
        while (equals < tokens.length && !["=", ";", "{"].includes(tokens[equals].value)) equals++;
        if (tokens[equals]?.value !== "=") continue;
        let end = equals + 1;
        for (; end < tokens.length; end++) {
            if (tokens[end].kind !== "punctuation") continue;
            if (["(", "[", "{"].includes(tokens[end].value)) end = closing(tokens, end);
            else if (tokens[end].value === ";") break;
        }
        result.set(name, {
            tokens: tokens.slice(equals + 1, end),
            start: tokens[index].start,
            end: tokens[end].end,
        });
    }
    entry.constants = result;
    return result;
}

const symbolFiles = new Map([
    [`${PREFIX}tools/file_edit.rs:STR_REPLACE_EDITOR_NAME`, ALIASES],
    [`${PREFIX}lsp/integration.rs:crate::tool`, `${PREFIX}tools_base/lsp.rs`],
    [`${CATALOG}:lsp_tool`, `${PREFIX}tools_base/lsp.rs`],
]);
const evaluationSources = new Set();

function resolveSymbol(file, reference) {
    const parts = reference.split("::");
    const name = parts.pop();
    if (!parts.length) return { file: symbolFiles.get(`${file}:${name}`) ?? file, name };
    const qualifier = parts.join("::");
    const mapped = symbolFiles.get(`${file}:${qualifier}`);
    if (mapped) return { file: mapped, name };
    const module = parts.at(-1);
    const candidates = [
        `${path.posix.dirname(file)}/${module}.rs`,
        `${path.posix.dirname(file)}/${module}/mod.rs`,
        `${PREFIX}tools/${module}.rs`,
        `${PREFIX}tools_base/${module}.rs`,
    ];
    const target = candidates.find((candidate) => tracked.has(candidate));
    return target ? { file: symbolFiles.get(`${target}:${name}`) ?? target, name } : undefined;
}

function evaluate(tokens, file, seen = new Set()) {
    if (!tokens?.length) return undefined;
    if (tokens[0].value === "&") return evaluate(tokens.slice(1), file, seen);
    if (tokens.length === 1 && tokens[0].kind === "string") return decodeString(tokens[0].value);
    if (tokens.length === 1 && tokens[0].value === "None") return null;
    const expression = tokens.map((token) => token.value).join("");
    if (/\.(?:to_owned|to_string)\(\)$/.test(expression)) return evaluate(tokens.slice(0, -4), file, seen);
    if (tokens[0].value === "Some" && tokens[1]?.value === "(")
        return evaluate(tokens.slice(2, -1), file, seen);
    if (tokens[0].value === "concat" && tokens[1]?.value === "!") {
        const values = split(tokens.slice(3, -1)).map((part) => evaluate(part, file, seen));
        return values.every((value) => typeof value === "string") ? values.join("") : undefined;
    }
    if (tokens[0].value === "include_str" && tokens[1]?.value === "!") {
        const relative = evaluate(tokens.slice(3, -1), file, seen);
        if (typeof relative !== "string") return undefined;
        const target = path.posix.normalize(path.posix.join(path.posix.dirname(file), relative));
        assert(!target.startsWith("../"), "include_str! escaped the source repository.");
        return source(target).text;
    }
    if (["[", "("].includes(tokens[0].value) && closing(tokens, 0) === tokens.length - 1) {
        const values = split(tokens.slice(1, -1)).map((part) => evaluate(part, file, seen));
        return values.every((value) => value !== undefined) ? values : undefined;
    }
    if (!/^(?:[A-Za-z_]\w*::)*[A-Z][A-Z0-9_]*$/.test(expression)) return undefined;
    const symbol = resolveSymbol(file, expression);
    if (!symbol) return undefined;
    const key = `${symbol.file}:${symbol.name}`;
    assert(!seen.has(key), `Constant-reference cycle: ${key}`);
    const declaration = constants(symbol.file).get(symbol.name);
    if (!declaration) return undefined;
    evaluationSources.add(sourceAnchor(symbol.file, declaration.start, declaration.end));
    return evaluate(declaration.tokens, symbol.file, new Set([...seen, key]));
}

function constant(file, name) {
    const declaration = constants(file).get(name);
    assert(declaration, `Missing committed constant ${file}:${name}`);
    const value = evaluate(declaration.tokens, file);
    assert.notEqual(value, undefined, `Unsupported committed constant ${file}:${name}`);
    return { value, source: sourceAnchor(file, declaration.start, declaration.end) };
}

const records = new Map();
function record(name, description, title, inputKind, sources) {
    assert.match(name, /^[a-z][a-z0-9_]*$/, `Unexpected descriptor name: ${name}`);
    const previous = records.get(name);
    const nonEmpty = (value) => (typeof value === "string" && value.trim().length > 0 ? value : undefined);
    records.set(name, {
        name,
        description: nonEmpty(previous?.description) ?? nonEmpty(description),
        title: nonEmpty(previous?.title) ?? nonEmpty(title),
        inputKind: previous?.inputKind ?? inputKind ?? "json-object",
        sources: [...new Set([...(previous?.sources ?? []), ...sources])],
    });
}

function fields(tokens) {
    return new Map(
        split(tokens)
            .filter((piece) => piece[1]?.value === ":")
            .map((piece) => [piece[0].value, piece.slice(2)]),
    );
}

const descriptorTypes = new Set([
    "ToolDescriptor",
    "OwnedToolDescriptor",
    "BuiltinToolDescriptor",
    "OwnedSessionToolDescriptor",
]);
const discoveredFiles = git(
    "grep",
    "-l",
    "-E",
    "(ToolDescriptor|OwnedSessionToolDescriptor|OwnedToolDescriptor|BuiltinToolDescriptor)[[:space:]]*(\\{|::)",
    REVISION,
    "--",
    "src/runtime/src",
)
    .trim()
    .split("\n")
    .map((entry) => entry.slice(REVISION.length + 1))
    .filter(
        (file) => file.endsWith(".rs") && !/(?:\/tests(?:\/|\.)|_tests\.rs$|\/test_support\/)/.test(file),
    );

for (const file of [...new Set([REGISTRY, ...discoveredFiles])]) {
    const tokens = source(file).tokens;
    for (let index = 0; index < tokens.length; index++) {
        if (!descriptorTypes.has(tokens[index].value)) continue;
        if (tokens[index + 1]?.value === "{" && tokens[index - 1]?.value !== "struct") {
            const end = closing(tokens, index + 1);
            const entry = fields(tokens.slice(index + 2, end));
            evaluationSources.clear();
            const name = evaluate(entry.get("name"), file);
            if (typeof name !== "string") continue;
            record(
                name,
                evaluate(entry.get("description"), file),
                evaluate(entry.get("title"), file),
                evaluate(entry.get("tool_type"), file) === "custom" ? "custom-grammar" : "json-object",
                [sourceAnchor(file, tokens[index].start, tokens[end].end), ...evaluationSources],
            );
        }
        if (
            tokens
                .slice(index + 1, index + 5)
                .map((token) => token.value)
                .join("") === "::function("
        ) {
            const end = closing(tokens, index + 4);
            const arguments_ = split(tokens.slice(index + 5, end));
            evaluationSources.clear();
            const name = evaluate(arguments_[0], file);
            if (typeof name !== "string") continue;
            record(name, evaluate(arguments_[1], file), undefined, "json-object", [
                sourceAnchor(file, tokens[index].start, tokens[end].end),
                ...evaluationSources,
            ]);
        }
    }
}

const compatFile = `${PREFIX}tools/search_agent_compat.rs`;
for (const prefix of ["READ_FILE", "GREP_SEARCH", "FILE_SEARCH", "SEMANTIC_SEARCH"]) {
    const name = constant(compatFile, `${prefix}_NAME`);
    const description = constant(compatFile, `${prefix}_DESCRIPTION`);
    record(name.value, description.value, undefined, "json-object", [name.source, description.source]);
}

const memoryFile = `${PREFIX}tools/memory.rs`;
for (const prefix of ["STORE", "VOTE"]) {
    const name = constant(memoryFile, `${prefix}_MEMORY_NAME`);
    const description = constant(memoryFile, `RUNTIME_${prefix}_MEMORY_TOOL_DESCRIPTION`);
    record(name.value, description.value, undefined, "json-object", [
        name.source,
        description.source,
        anchor(CATALOG, 1290, 1328),
    ]);
}

const grepSymbol = resolveSymbol(REGISTRY, "grep::RG_NAME");
assert(grepSymbol, "The registry's grep module must resolve.");
const grepAlias = constant(grepSymbol.file, grepSymbol.name);
record(grepAlias.value, records.get("grep")?.description, undefined, "json-object", [
    grepAlias.source,
    anchor(INITIALIZATION, 301, 307),
]);

const shellFamilyTokens = source(REGISTRY).tokens;
for (let index = 0; index < shellFamilyTokens.length; index++) {
    if (
        shellFamilyTokens[index].value !== "RuntimeShellConfig" ||
        shellFamilyTokens[index + 1]?.value !== "{"
    )
        continue;
    const end = closing(shellFamilyTokens, index + 1);
    const entry = fields(shellFamilyTokens.slice(index + 2, end));
    const family = evaluate(entry.get("shell_type"), REGISTRY);
    if (!["bash", "powershell"].includes(family)) continue;
    const display = evaluate(entry.get("display_name"), REGISTRY);
    for (const [field, label, description] of [
        [
            "shell_tool_name",
            `Run ${display} commands`,
            `Runs a ${display} command on the host; supports foreground and background command sessions.`,
        ],
        [
            "read_shell_tool_name",
            `Read ${display} output`,
            `Reads accumulated output from a running ${display} command session.`,
        ],
        [
            "stop_shell_tool_name",
            `Stop ${display} command`,
            `Stops a running ${display} command by terminating its process tree.`,
        ],
        [
            "list_shells_tool_name",
            `List ${display} sessions`,
            `Lists active ${display} command sessions and their status.`,
        ],
    ]) {
        const name = evaluate(entry.get(field), REGISTRY);
        assert.equal(typeof name, "string");
        record(name, description, label, "json-object", [
            sourceAnchor(REGISTRY, shellFamilyTokens[index].start, shellFamilyTokens[end].end),
            anchor(`${PREFIX}tools/shell_tools.rs`, 947, 1128),
        ]);
    }
}

const extensionFile = `${PREFIX}extensions/tools.rs`;
const extensionTokens = source(extensionFile).tokens;
for (let index = 0; index < extensionTokens.length - 2; index++) {
    if (extensionTokens[index].kind !== "string" || decodeString(extensionTokens[index].value) !== "name")
        continue;
    const name = evaluate([extensionTokens[index + 2]], extensionFile);
    if (!["extensions_manage", "extensions_reload"].includes(name)) continue;
    const begin = index - 1;
    if (extensionTokens[begin].value !== "{") continue;
    const end = closing(extensionTokens, begin);
    const entry = new Map(
        split(extensionTokens.slice(begin + 1, end))
            .filter((piece) => piece[0]?.kind === "string" && piece[1]?.value === ":")
            .map((piece) => [decodeString(piece[0].value), piece.slice(2)]),
    );
    record(
        name,
        evaluate(entry.get("description"), extensionFile),
        evaluate(entry.get("title"), extensionFile),
        "json-object",
        [sourceAnchor(extensionFile, extensionTokens[begin].start, extensionTokens[end].end)],
    );
}

// Dynamic descriptions need session services, an agent roster, or macro
// expansion. These are explicit source-backed summaries, never native signatures.
const summaries = new Map([
    [
        "task",
        [
            "Delegate work to a configured built-in or custom subagent. The available agent list and native schema are assembled per session.",
            INITIALIZATION,
            899,
            941,
        ],
    ],
    [
        "skill",
        [
            "Load an available skill into the conversation. The native description incorporates the session's model-invocable skill catalog.",
            INITIALIZATION,
            1140,
            1171,
        ],
    ],
    [
        "read_agent",
        [
            "Read a background agent's status and results. Waiting behavior and guidance depend on session notification capabilities.",
            `${PREFIX}tools/agent_tools.rs`,
            1,
            80,
        ],
    ],
    [
        "str_replace_editor",
        [
            "View and edit files with the combined string-replacement editor selected for replace-style models.",
            `${PREFIX}tools/file_edit.rs`,
            65,
            125,
        ],
    ],
    [
        "sql",
        [
            "Query and update the session SQLite database; some configurations also expose local cross-session history through this tool.",
            `${PREFIX}tools/storage_tools.rs`,
            1,
            100,
        ],
    ],
    [
        "session_store_sql",
        [
            "Query cross-session history. Available local, personal-cloud, organization, and repository scopes depend on session capabilities and configuration.",
            `${PREFIX}tools/session_store_sql.rs`,
            1,
            90,
        ],
    ],
    [
        "report_progress",
        [
            "Report pull-request-agent progress and publish the corresponding repository changes; the descriptor varies with push-only configuration.",
            `${PREFIX}tools/report_progress.rs`,
            1,
            100,
        ],
    ],
    [
        "send_inbox",
        [
            "Send relevant context into the session inbox for the main agent to read later, with a concise summary and full content.",
            `${PREFIX}tools/inbox.rs`,
            45,
            64,
        ],
    ],
    [
        "factories_manage",
        [
            "Manage registered agent factories: discover definitions, inspect runs and resumable work, and, when enabled, author session-scoped JavaScript factories.",
            `${PREFIX}tools/factories_manage.rs`,
            16,
            23,
        ],
    ],
]);
for (const [name, [description, file, start, end]] of summaries) {
    if (records.has(name)) record(name, description, undefined, undefined, [anchor(file, start, end)]);
}

function policy(
    names,
    defaultStatus,
    workspace,
    defaultReason,
    file = INITIALIZATION,
    start = 206,
    end = 298,
) {
    return names
        .split(" ")
        .map((name) => [name, { defaultStatus, workspace, defaultReason, source: anchor(file, start, end) }]);
}

const policies = new Map([
    ...policy(
        "glob",
        "baseline-enabled",
        true,
        "Literal baseline gate: glob is included before the session's later tool/agent filters.",
    ),
    ...policy(
        "grep view create edit",
        "baseline-enabled",
        true,
        "Enabled for the reference profile's split editing style. Other models select rg/apply_patch or the combined str_replace_editor instead; later allow/exclude and agent filters still apply.",
    ),
    ...policy(
        "web_fetch",
        "baseline-enabled",
        false,
        "Literal online gate: included when the session is not offline. Network access is not a project-file capability; permission and policy checks remain separate.",
    ),
    ...policy(
        "rg apply_patch str_replace_editor",
        "conditional",
        true,
        "Model-dependent editing/search alternative, not an additional always-on editor. Apply-patch style selects rg and apply_patch; replace style selects str_replace_editor and omits standalone view/create/edit.",
        INITIALIZATION,
        206,
        219,
    ),
    ...policy(
        "bash read_bash stop_bash list_bash",
        "platform-specific",
        true,
        "Non-Windows shell family; selected on the macOS/Linux reference platform before later filters. The Windows family uses powershell/read_powershell/stop_powershell/list_powershell.",
        REGISTRY,
        1068,
        1086,
    ),
    ...policy(
        "powershell read_powershell stop_powershell list_powershell",
        "platform-specific",
        true,
        "Windows shell family, not simultaneously a default on the non-Windows reference platform. Shell selection aliases expand only to currently available platform tools.",
        REGISTRY,
        1087,
        1101,
    ),
    ...policy(
        "ask_user",
        "conditional",
        false,
        "Requires ask-user capability plus a structured ask-user surface or user-input listener. The ask_user_2 implementation changes the schema under the same canonical ask_user name.",
    ),
    ...policy(
        "skill",
        "conditional",
        true,
        "Requires a non-empty model-invocable skill catalog. Workspace flag is conservative: disk-backed skill discovery/loading can read local assets, while a host-provided skill may be text-only.",
    ),
    ...policy(
        "catalog_search",
        "conditional",
        false,
        "Requires a trusted discovery skill in the model-invocable catalog. Reserved: external tools are explicitly forbidden from defining or overriding catalog_search.",
    ),
    ...policy(
        "fetch_copilot_cli_documentation",
        "conditional",
        false,
        "Requires cli-documentation capability; it is not automatically present in every runtime host.",
    ),
    ...policy(
        "sql",
        "conditional",
        false,
        "Requires a session database. It operates on session/history storage, not arbitrary project files; workspace:false does not mean storage-free.",
    ),
    ...policy(
        "session_store_sql",
        "conditional",
        false,
        "Requires session-store capability and cloud-session-store enablement. Supported local/org/repo scopes and backend availability are conditional; not a project-file tool.",
    ),
    ...policy(
        "task_complete",
        "conditional",
        false,
        "Offered in autopilot, or when plan-mode cache-stability treatment arms it. Retained tools may be no-ops outside their active mode; ordinary interactive mode does not imply availability.",
    ),
    ...policy(
        "exit_plan_mode",
        "conditional",
        false,
        "Requires active plan mode, plan-mode capability, and a responder; cache-stability treatment can retain the descriptor outside plan mode without invoking approval.",
    ),
    ...policy(
        "task",
        "conditional",
        true,
        "Requires at least one visible dispatchable agent after model, agent-policy, and depth filtering. Workspace flag is conservative: delegated agents may use project files or host shells.",
        INITIALIZATION,
        899,
        941,
    ),
    ...policy(
        "read_agent list_agents",
        "conditional",
        false,
        "Requires agent-management availability, which can come from task agents, existing tasks, custom agents, LSP, factories, sibling communication, or MCP tasks. Uses task/session state rather than project files.",
    ),
    ...policy(
        "write_agent",
        "conditional",
        true,
        "Requires agent-management availability. Workspace flag is conservative: sending a turn can wake an agent that then uses native file/shell tools.",
    ),
    ...policy(
        "search_code_subagent",
        "conditional",
        true,
        "Requires online mode, allowed search-subagent filters, an eligible resolved model, and the appropriate request context. May search local project code and use a remote model.",
        INITIALIZATION,
        1263,
        1275,
    ),
    ...policy(
        "execution_subagent",
        "conditional",
        true,
        "Requires online mode, the execution-subagent feature/experiment, and session/model availability. Delegates host command execution; not a universal default.",
        INITIALIZATION,
        982,
        1035,
    ),
    ...policy(
        "run_factory factories_manage",
        "conditional",
        true,
        "Requires factory availability, including session capabilities/feature and quota policy. Factories can launch agents; authoring can write session-scoped JavaScript on the host.",
    ),
    ...policy(
        "list_canvas_capabilities",
        "conditional",
        false,
        "Requires canvas-renderer capability. Lists host-provided canvas metadata; it does not itself operate on project files.",
    ),
    ...policy(
        "open_canvas invoke_canvas_action",
        "conditional",
        true,
        "Requires canvas-renderer capability and applicable registered canvases/actions. Workspace flag is conservative: provider callbacks are opaque and can perform host effects; it is not a claim that every canvas needs files.",
    ),
    ...policy(
        "manage_schedule",
        "conditional",
        true,
        "Requires manage-schedule enablement. Workspace flag is conservative: scheduled prompts may later run native file/shell-capable agent work.",
    ),
    ...policy(
        "read_inbox",
        "conditional",
        false,
        "Requires sidekick agents. Reads session inbox state rather than project files.",
    ),
    ...policy(
        "send_inbox",
        "internal",
        false,
        "Literal agent-definition request only; the '*' coding request does not admit this non-standard sidekick tool.",
    ),
    ...policy(
        "read_memories",
        "internal",
        false,
        "Requires an available memory service and a literal agent-definition request. Root-owned memory mutations are separate tools.",
    ),
    ...policy(
        "context_board",
        "internal",
        false,
        "Requires dynamic-context availability and a literal agent-definition request; not a wildcard-enabled coding tool.",
    ),
    ...policy(
        "read_file grep_search file_search semantic_search",
        "internal",
        true,
        "Constrained search-agent tools materialized only for literal requests, not ordinary parent coding defaults. Preserve these names: their schemas/behavior differ from view/grep/glob and remote code-search tools.",
        INITIALIZATION,
        1120,
        1138,
    ),
    ...policy(
        "create_pull_request reply_to_comment",
        "internal",
        true,
        "PR-agent-specific tool; requires an explicit by-name request, never the ordinary '*' coding wildcard. Its native workflow can inspect or publish repository work.",
    ),
    ...policy(
        "report_progress",
        "internal",
        true,
        "PR-agent-specific descriptor, materialized only by a literal request. Its push-only/pull-request behavior depends on repository settings.",
        INITIALIZATION,
        1175,
        1185,
    ),
    ...policy(
        "report_dreaming_artifact",
        "internal",
        false,
        "Requires the linked tool-handlers leaf and a literal Dreaming-job request. Delivers a progress artifact, not a project-file operation.",
        INITIALIZATION,
        1187,
        1192,
    ),
    ...policy(
        "store_memory vote_memory",
        "conditional",
        false,
        "Requires memory capability, an available memory service, and root-owned mutation eligibility; voting has its own enablement. Storage may be remote or local, but these are not arbitrary project-file APIs.",
        CATALOG,
        1290,
        1328,
    ),
    ...policy(
        "lexical_code_search semantic_code_search",
        "conditional",
        true,
        "Requires the corresponding Blackbird settings/experiment and online eligibility. Repository/authentication context is resolved at execution; workspace flag conservatively marks repository-context dependence.",
        INITIALIZATION,
        1194,
        1221,
    ),
    ...policy(
        "lsp",
        "conditional",
        true,
        "Requires the shipped LSP leaf and available session LSP configurations. It can read project code and launch language-server processes.",
        INITIALIZATION,
        1247,
        1262,
    ),
    ...policy(
        "tool_search_tool",
        "conditional",
        false,
        "Specialized tool-search surface selected by model/provider, search settings, experiments, and deferred catalog availability. Explicit native overrides are supported through the specialized client_tool_search_override path; generic-client search is a distinct branch.",
        `${PREFIX}session/session_external_tools.rs`,
        135,
        171,
    ),
    ...policy(
        "generic_tool_search",
        "internal",
        false,
        "Internal descriptor variant for generic client tool search, gated by GENERIC_CLIENT_TOOL_SEARCH. It is not another always-on public search function; model-facing search is normalized separately.",
        REGISTRY,
        971,
        1000,
    ),
    ...policy(
        "update_todo",
        "conditional",
        false,
        "Compiled descriptor, selected by the runtime request/factory and final agent-policy path. It is not a dedicated operation in the legacy tool_assembly_plan; do not infer a universal coding default from registry membership.",
        REGISTRY,
        238,
        275,
    ),
    ...policy(
        "extensions_manage extensions_reload",
        "conditional",
        true,
        "Fixed runtime extension-management tools require an active extension service with management tools enabled. They can read/write extension files or restart host subprocesses; dynamically contributed extension tools are outside this static catalog.",
        extensionFile,
        90,
        174,
    ),
]);

const lookupNames = new Set();
for (const [name, entry] of records) {
    if (entry.sources.some((url) => url.includes("/tools/registry.rs#"))) lookupNames.add(name);
}
for (const name of [
    "lexical_code_search",
    "semantic_code_search",
    "read_file",
    "grep_search",
    "file_search",
    "semantic_search",
    "rg",
    "lsp",
    "task",
]) {
    lookupNames.add(name);
}
// Shell descriptors were expanded from the same immutable platform configs the
// override recognizer checks. Fixed management/leaf-only tools are not assumed.
for (const family of ["bash", "powershell"]) {
    for (const prefix of ["", "read_", "stop_", "list_"]) lookupNames.add(`${prefix}${family}`);
}

const aliasEntries = constant(ALIASES, "ALIAS_ENTRIES");
assert(Array.isArray(aliasEntries.value));
const aliases = [...new Map(aliasEntries.value).entries()].map(([name, targets]) => ({
    name,
    targets,
    kind: "selection-alias-not-a-separate-descriptor",
    sources: [aliasEntries.source],
}));

function synopsis(description) {
    const paragraph = description
        .trim()
        .split(/\n\s*\n/)[0]
        .replace(/\s+/g, " ");
    if (paragraph.length <= 560) return paragraph;
    const sentence = paragraph.slice(0, 550).match(/^([\s\S]*[.!?])(?:\s|$)/)?.[1];
    return sentence ?? `${paragraph.slice(0, 550).replace(/\s+\S*$/, "")}...`;
}

function illustrativeParameters(name) {
    return JSON.stringify(
        {
            $comment: `Illustrative CUSTOM OVERRIDE schema for ${name}; NOT the runtime's native tool signature. The host override must implement this input contract.`,
            type: "object",
            properties: {
                input: {
                    type: "string",
                    description: "Input interpreted by your custom override implementation.",
                },
            },
            required: ["input"],
            additionalProperties: false,
        },
        null,
        2,
    );
}

const missingPolicies = [...records.keys()].filter((name) => !policies.has(name));
const missingDescriptors = [...policies.keys()].filter((name) => !records.has(name));
const missingDescriptions = [...records.values()].filter((entry) => typeof entry.description !== "string");
assert.deepEqual(missingPolicies, [], `Unclassified descriptors: ${missingPolicies.join(", ")}`);
assert.deepEqual(
    missingDescriptors,
    [],
    `Policy names without descriptors: ${missingDescriptors.join(", ")}`,
);
assert.deepEqual(
    missingDescriptions.map((entry) => entry.name),
    [],
    "Unresolved native descriptions need explicit source-backed summaries.",
);

const tools = [...records.values()]
    .sort((left, right) => left.name.localeCompare(right.name, "en"))
    .map((entry) => {
        const classification = policies.get(entry.name);
        const overrideable = entry.name !== "catalog_search" && lookupNames.has(entry.name);
        let defaultReason = classification.defaultReason;
        if (!overrideable && entry.name !== "catalog_search") {
            defaultReason +=
                " Not positively recognized by the native built-in override dispatcher; this snapshot does not promise an override for this fixed surface.";
        }
        return {
            name: entry.name,
            label:
                entry.title ??
                entry.name
                    .split("_")
                    .map((word) => word[0].toUpperCase() + word.slice(1))
                    .join(" "),
            description: synopsis(entry.description),
            group: classification.workspace ? "Workspace" : "Session",
            workspace: classification.workspace,
            parameters: illustrativeParameters(entry.name),
            inputKind: entry.name === "tool_search_tool" ? "specialized-json" : entry.inputKind,
            overrideable,
            defaultStatus: classification.defaultStatus,
            defaultReason,
            sources: [
                ...new Set([
                    ...entry.sources,
                    classification.source,
                    anchor(INVOKER, 2834, 2875),
                    ...(entry.name === "catalog_search" ? [anchor(SERIALIZERS, 4480, 4503)] : []),
                ]),
            ],
        };
    });

const catalog = {
    revision: REVISION,
    context: {
        copyright: "Copyright (c) Microsoft Corporation. All rights reserved.",
        repository: "github/copilot-agent-runtime",
        method: "Static extraction from pinned Git objects: native descriptor constructors and function factories, registry lookup-only tools, both immutable shell configurations, fixed extension-management definitions, memory and LSP/Dreaming leaf registrations, plus model-facing rg. Dynamic descriptions use explicitly source-backed summaries.",
        nativeAddonInvoked: false,
        sessionsCreated: false,
        networkRequests: false,
        sourceFileCount: cache.size,
        referenceProfile: {
            label: "Illustrative online, local, top-level coding baseline; not a universal product default",
            platform: "macOS/Linux (Windows descriptors are included separately)",
            editingStyle: "split: non-OpenAI/default model branch",
            agentMode: "interactive, no prior armed plan/autopilot mode",
            requestedTools: ["*"],
            availableTools: "unset",
            excludedTools: "unset",
            customAgent: "none",
            optionalCapabilitiesAndExperiments: "not assumed; conditional entries explain their own gates",
            scope: "Pre-permission advertised native selection. Execution permissions, sandboxing, model eligibility, feature policy, and host registrations remain authoritative.",
        },
        defaultStatusDefinitions: {
            "baseline-enabled":
                "The literal composition gate includes the tool under the stated profile, before later tool/agent filters. Not a promise across hosts or models.",
            conditional:
                "Requires model, capability, service, policy, experiment, agent request, or mode conditions; compiled does not mean default-on.",
            "platform-specific":
                "One platform's shell family; baseline on its corresponding platform, not all platforms simultaneously.",
            internal:
                "Shipped descriptor for a literal/internal/specialized context, not an ordinary coding default.",
        },
        inheritedCoding:
            "Leave runtime selection intact: do not turn this inventory into an availableTools allowlist and do not force every catalog member on. Keeping a tool means preserving the runtime's own model/platform/capability/experiment choices.",
        parametersSemantics:
            "Every parameters string is an intentionally small JSON object schema for an ILLUSTRATIVE CUSTOM OVERRIDE. It is not the native input signature, including for grammar-based tools. No native schemas are claimed by these examples.",
        inputKindDefinitions: {
            "json-object":
                "The extracted native descriptor uses a function-style input; the exact schema can vary by session.",
            "custom-grammar":
                "The extracted native descriptor uses custom/grammar input rather than a JSON function signature.",
            "specialized-json":
                "Tool-search has specialized composition/dispatch despite JSON-shaped callback input; it is overrideable.",
        },
        workspaceSemantics:
            "True marks direct native project/host file-shell operations or conservatively flagged delegated/opaque host effects for workspace-free warnings. False does not mean no network, storage, permission checks, or incidental filesystem I/O. Session-owned state is distinguished from arbitrary project/host-file access. Per-tool defaultReason explains conservative or storage-only cases.",
        overrideSemantics:
            "True requires positive membership in the native built-in override recognizer (including its specialized tool-search path), except explicitly reserved catalog_search. It does not enable a disabled tool or bypass permissions. False for other fixed leaf/management surfaces is conservative: this snapshot does not infer support from name-collision acceptance alone.",
        aliases,
        aliasSemantics:
            "Selection aliases are not extra native descriptors. Targets match only tools actually available; duplicate alias definitions are last-wins. Historical targets such as search and the projected MCP web_search name do not manufacture new built-in catalog members.",
        variants: [
            "ask_user_2 is a structured schema/description variant under canonical ask_user, not an additional model-facing tool name.",
            "grep and rg share the content-search implementation; editing style determines the offered name.",
            "generic_tool_search is a compiled internal descriptor variant; tool_search_tool is the specialized model-facing/client-override surface.",
            "SQL, session history, task/agent, memory, shell, and skill descriptions/schemas are specialized from session facts.",
        ],
        excludedSurfaces: [
            "Dynamic MCP tools, including GitHub MCP/provider-projected web_search; they are not enumerated as static native descriptors.",
            "Dynamically contributed extension/plugin tools, custom external tools, and custom-agent registrations.",
            "Provider/transport orchestration envelopes with no native descriptor constructor in the pinned registry surfaces.",
            "Selection aliases are preserved in context.aliases, not duplicated as invented tool descriptors.",
        ],
        limitations: [
            "A static reference profile cannot prove a particular authenticated host's live enabled set. No sessions, authentication, experiments, or model/network calls were used.",
            "Both platform shell families and linked leaf descriptors are included; membership is source-backed, not a claim that every build links every leaf.",
            "Native dynamic descriptions are summarized rather than evaluating session services. Illustrative override inputs intentionally do not reproduce native schemas.",
            "update_todo is in the core registry but not a dedicated operation of the legacy tool_assembly_plan; it remains conditional rather than advertised as a universal default.",
            "The source-bound capture reader evaluates only static Rust expressions. It fails on new descriptor names lacking policy or unresolved descriptions rather than silently curating a smaller catalog.",
        ],
        sources: [
            anchor(REGISTRY, 238, 275),
            anchor(REGISTRY, 500, 550),
            anchor(INITIALIZATION, 206, 298),
            anchor(INITIALIZATION, 335, 355),
            anchor(INITIALIZATION, 1090, 1138),
            anchor(INITIALIZATION, 1175, 1275),
            anchor(CATALOG, 1230, 1518),
            anchor(`${PREFIX}feature_hooks.rs`, 623, 650),
            anchor("src/native/runtime/src/lib.rs", 90, 110),
            anchor(`${PREFIX}shared_api/server.rs`, 2207, 2240),
            anchor(`${PREFIX}session/session_settings_tools.rs`, 410, 451),
            anchor(ALIASES, 105, 169),
        ],
    },
    tools,
};

assert(tools.length > 9, "An exhaustive catalog must not regress to the curated nine tools.");
assert.equal(new Set(tools.map((tool) => tool.name)).size, tools.length);
assert.equal(tools.find((tool) => tool.name === "catalog_search")?.overrideable, false);
assert.equal(tools.find((tool) => tool.name === "tool_search_tool")?.overrideable, true);
for (const tool of tools) {
    assert.equal(JSON.parse(tool.parameters).type, "object");
    assert(
        tool.description.length > 0 && tool.description.length <= 600,
        `Invalid description for ${tool.name}`,
    );
    assert(
        tool.sources.length > 0 &&
            tool.sources.every((url) => url.includes(`/blob/${REVISION}/`) && /#L\d+-L\d+$/.test(url)),
    );
}
const sourceUrls = new Set([
    ...catalog.context.sources,
    ...catalog.context.aliases.flatMap((alias) => alias.sources),
    ...tools.flatMap((tool) => tool.sources),
]);
for (const url of sourceUrls) {
    const match = url.match(/\/blob\/([a-f0-9]{40})\/(.+)#L(\d+)-L(\d+)$/);
    assert(match && match[1] === REVISION, `Unpinned source: ${url}`);
    const [, , file, start, end] = match;
    const lineCount = source(file).text.trimEnd().split("\n").length;
    assert(
        Number(start) >= 1 && Number(end) >= Number(start) && Number(end) <= lineCount,
        `Invalid source range ${file}:${start}-${end}; file has ${lineCount} lines.`,
    );
}
catalog.context.sourceFileCount = cache.size;
if (check)
    assert.deepEqual(JSON.parse(readFileSync(OUTPUT, "utf8")), catalog, "Static snapshot is out of date.");
if (run) writeFileSync(OUTPUT, `${JSON.stringify(catalog, null, 4)}\n`);
process.stdout.write(
    `${JSON.stringify(
        {
            revision: REVISION,
            count: tools.length,
            statuses: Object.fromEntries(
                Object.keys(catalog.context.defaultStatusDefinitions).map((status) => [
                    status,
                    tools.filter((tool) => tool.defaultStatus === status).length,
                ]),
            ),
            aliases: aliases.length,
            output: run ? OUTPUT : check ? "snapshot matches" : "preview only",
            names: tools.map((tool) => tool.name),
        },
        null,
        2,
    )}\n`,
);
