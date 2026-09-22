// Copyright (c) Microsoft Corporation. All rights reserved.
import type { HarnessPlan } from "../plan";
import { projectName } from "./common";
import {
    JAVA_RUST_SDK_REVISION,
    javaRustChecks,
    javaRustConfiguration,
    javaRustRequirements,
    javaRustServerFiles,
    javaRustSources,
} from "./java-rust-shared";
import { RUST_CONFIG, RUST_HOST, RUST_MAIN, RUST_SESSION_FS } from "./rust-templates";
import type { BootstrapBlocker, LanguageAdapter } from "./types";

function renderRustSource(source: string, plan: HarnessPlan): string {
    const s2s = plan.model.provider === "copilot" && plan.identity === "s2s-installation";
    if (!s2s)
        return source
            .replace(
                /[ \t]*\/\/ __S2S_RUNTIME_ENV_START__\n[\s\S]*?[ \t]*\/\/ __S2S_RUNTIME_ENV_END__\n?/g,
                "",
            )
            .replace(
                /[ \t]*\/\/ __S2S_LOCAL_PREFLIGHT_START__\n[\s\S]*?[ \t]*\/\/ __S2S_LOCAL_PREFLIGHT_END__\n?/g,
                "",
            )
            .replaceAll(/^\s*\/\/ __[A-Z_]+_(?:START|END)__\n/gm, "");
    const runtimeEnvironment =
        plan.target.runtime === "managed"
            ? `            let token = required_env("COPILOT_GITHUB_TOKEN")?;
            options = options.with_env([("COPILOT_GITHUB_TOKEN", token)]);
`
            : plan.target.runtime === "inprocess"
              ? `            required_env("COPILOT_GITHUB_TOKEN")?;
`
              : "";
    return source
        .replace(
            /[ \t]*\/\/ __S2S_RUNTIME_ENV_START__\n[\s\S]*?[ \t]*\/\/ __S2S_RUNTIME_ENV_END__\n?/g,
            runtimeEnvironment,
        )
        .replace(
            /[ \t]*\/\/ __S2S_LOCAL_PREFLIGHT_START__\n([\s\S]*?)[ \t]*\/\/ __S2S_LOCAL_PREFLIGHT_END__\n?/g,
            plan.target.runtime === "external" ? "" : "$1",
        )
        .replace(
            /[ \t]*\/\/ __GITHUB_TOKEN_PROVIDER_START__\n[\s\S]*?[ \t]*\/\/ __GITHUB_TOKEN_PROVIDER_END__\n?/g,
            "",
        )
        .replace(
            /[ \t]*\/\/ __COPILOT_IDENTITY_(?:PREFLIGHT|BINDING)_START__\n[\s\S]*?[ \t]*\/\/ __COPILOT_IDENTITY_(?:PREFLIGHT|BINDING)_END__\n?/g,
            "",
        );
}

function checkRust(plan: HarnessPlan): BootstrapBlocker[] {
    const blockers = javaRustChecks(plan, "rust");
    if (plan.session.storage === "virtual" && !plan.session.baseDirectory.trim()) {
        blockers.push({
            id: "rust-session-fs-state-path",
            title: "Give the virtual filesystem an explicit state path",
            detail: "Set session.baseDirectory to the state path inside your SessionFs provider. The SDK requires a nonempty session_state_path; this must not silently fall back to host-local storage.",
            fields: ["session.baseDirectory"],
            sources: javaRustSources(plan),
        });
    }
    if (
        plan.session.storage === "virtual" &&
        [plan.session.baseDirectory, plan.context.workspace].some((path) => /^[A-Za-z]:|\\/.test(path))
    ) {
        blockers.push({
            id: "rust-session-fs-conventions",
            title: "The generated virtual filesystem uses POSIX path conventions",
            detail: "Use POSIX logical workspace/state paths, or extend this adapter and the host provider to select SessionFsConventions::Windows. Windows-shaped paths cannot be passed faithfully to the POSIX provider recipe.",
            fields: ["session.baseDirectory", "context.workspace"],
            sources: javaRustSources(plan),
        });
    }
    return blockers;
}

export const rustAdapter: LanguageAdapter = {
    language: "rust",
    label: "Rust",
    check: checkRust,
    generate(plan) {
        const blockers = checkRust(plan);
        if (blockers.length) throw new Error(blockers.map((blocker) => blocker.detail).join("\n"));
        const manual =
            plan.target.runtime === "external" ||
            (plan.target.runtime === "managed" && Boolean(plan.target.cliPath.trim()));
        const features = plan.target.runtime === "inprocess" ? ', features = ["bundled-in-process"]' : "";
        const requirements = javaRustRequirements(plan, "src/host.rs");
        requirements.push({
            id: "rust-source-toolchain",
            title: "Provide Rust 1.94.0 and access to the pinned SDK Git source",
            detail: `rust-toolchain.toml pins 1.94.0. Cargo uses github/copilot-sdk at ${JAVA_RUST_SDK_REVISION}, not an assumed crates.io release. Source builds may download the compatible runtime bundle; review target-platform availability and capture Cargo.lock for reproducible deployment.`,
            file: "Cargo.toml",
            kind: "runtime",
        });
        if (plan.session.storage === "virtual") {
            requirements.push({
                id: "rust-session-fs-contract",
                title: "Implement every required SessionFs operation",
                detail: "Implement src/session_fs.rs and mark SESSION_FS_IMPLEMENTED only after verifying read/write/append/exists/stat/mkdir/readdir/readdir_with_types/rm/rename, concurrent calls, persistence and error semantics. Paths are POSIX logical paths; an empty workspace uses the virtual root /. No SQLite capability is advertised: add SessionFsSqliteProvider, transactions and capabilities together if your workload requires them.",
                file: "src/session_fs.rs",
                kind: "host-code",
            });
        }
        return {
            files: [
                {
                    path: "Cargo.toml",
                    language: "toml",
                    content: `# Copyright (c) Microsoft Corporation. All rights reserved.
[package]
name = "${projectName(plan)}"
version = "0.1.0"
edition = "2024"
rust-version = "1.94.0"
publish = false

[dependencies]
github-copilot-sdk = { git = "https://github.com/github/copilot-sdk.git", rev = "${JAVA_RUST_SDK_REVISION}"${manual ? ", default-features = false" : ""}${features} }
anyhow = "1"
async-trait = "0.1"
indexmap = { version = "2", features = ["serde"] }
serde = { version = "1", features = ["derive"] }
serde_json = "1"
tokio = { version = "1", features = ["macros", "rt-multi-thread", "sync", "signal", "time"] }
`,
                },
                {
                    path: "rust-toolchain.toml",
                    content:
                        '# Copyright (c) Microsoft Corporation. All rights reserved.\n[toolchain]\nchannel = "1.94.0"\nprofile = "minimal"\ncomponents = ["rustfmt"]\n',
                    language: "toml",
                },
                ...(manual
                    ? [
                          {
                              path: ".cargo/config.toml",
                              content:
                                  '# Copyright (c) Microsoft Corporation. All rights reserved.\n[env]\nCOPILOT_SKIP_CLI_DOWNLOAD = { value = "1", force = true }\n',
                              language: "toml" as const,
                          },
                      ]
                    : []),
                {
                    path: "bootstrap-config.json",
                    content: JSON.stringify(javaRustConfiguration(plan), null, 2) + "\n",
                    language: "json",
                },
                { path: "src/main.rs", content: renderRustSource(RUST_MAIN, plan), language: "rust" },
                {
                    path: "src/config.rs",
                    content: renderRustSource(RUST_CONFIG, plan),
                    language: "rust",
                },
                { path: "src/host.rs", content: renderRustSource(RUST_HOST, plan), language: "rust" },
                {
                    path: "src/session_fs.rs",
                    content: renderRustSource(RUST_SESSION_FS, plan),
                    language: "rust",
                },
                ...javaRustServerFiles(plan),
            ],
            commands: {
                install: ["cargo build"],
                check: "cargo run -- --check",
                run: 'cargo run -- "Describe your task here"',
                ...(plan.target.runtime === "external"
                    ? { startRuntime: "bash start-runtime.sh --run" }
                    : {}),
            },
            requirements,
            notes: [
                "The Rust SDK source manifest is 0.0.0-dev; this project pins the inspected Git revision instead of inventing an exact published crate version. Rust 1.92 is too old. No Java installation or global toolchain changes are performed by the visualizer.",
                "A strict host-owned DTO reads bootstrap-config.json, then src/config.rs explicitly assigns every selected field to SDK builders/default-constructed types. SessionConfig itself is not deserializable and many SDK structs are non-exhaustive.",
                plan.policy.permissionMode === "host"
                    ? "The source JSON is embedded with include_str!; rebuild after editing it. Host permission handling, custom tools, hooks, and SessionFs fail preflight until their real integrations are implemented."
                    : "The source JSON is embedded with include_str!; rebuild after editing it. SessionConfig::approve_all_permissions() approves ordinary requests once; managed policy, content exclusion, downstream authorization, tool validity, and sandbox enablement remain authoritative, while enabled sandbox bypass can also be approved.",
                plan.model.provider === "copilot" && plan.identity === "s2s-installation"
                    ? plan.target.runtime === "external"
                        ? "GitHub App S2S identity is configured by start-runtime.sh on the separately operated runtime host. The Rust client does not receive or inject COPILOT_GITHUB_TOKEN and does not install a GitHub token provider."
                        : plan.target.runtime === "inprocess"
                          ? "GitHub App S2S identity requires COPILOT_GITHUB_TOKEN before the in-process runtime loads. Logged-in-user fallback is false and no GitHub token provider is generated."
                          : "GitHub App S2S identity copies COPILOT_GITHUB_TOKEN into the managed child environment with ClientOptions::with_env. Logged-in-user fallback is false and no GitHub token provider is generated."
                    : "GITHUB_TOKEN_EXPIRES_AT is an absolute UNIX timestamp. Every Copilot token-provider call recomputes its remaining lifetime. BYOK uses the selected provider credential route; downstream services need separate host-owned authorization.",
                "When observation is selected, the client prepares the session and starts draining its subscription before startup. Logs contain event types only; lag or unexpected observer failure aborts the workload rather than silently losing observations.",
                "Console input is serialized on a process-lifetime standard thread, not a Tokio blocking-pool task that can prevent shutdown while waiting for stdin. EOF or input errors signal the main task's abort path. Prompt/choice display is user interaction, not event logging.",
                "The main task handles Ctrl-C and host callback failures, aborts a failed turn, detaches the session, joins the event observer, then stops the client. Cleanup failures are added to the primary error chain. No-message completion is reported explicitly; terminal tools need not produce a final assistant message.",
                "The POSIX SessionFs interface is host code, not an OS sandbox or complete virtualization of shell/git/network effects. Its default functions deliberately fail, and it declares no SQLite capability.",
                "For in-process hosting, bundled-in-process is enabled and no process-only ClientOptions are set. COPILOT_CLI_PATH must select a matching package before startup; the loader finds the platform-native library, adjacent runtime.node, or prebuilds/<platform-arch>/runtime.node.",
                "External server settings are applied by start-runtime.sh on the server host, not by mutating an existing server through the client. Paths refer to that future host; --check neither starts nor contacts it.",
                `Rust API evidence at SDK ${JAVA_RUST_SDK_REVISION}: rust/Cargo.toml:1-34; rust/src/lib.rs:145-185,1118-1157,1230-1270; types.rs:1940-2298,4719-4777; session.rs:590-637,788-802; session_fs.rs:64-120,391-551; github_token.rs:31-114; provider_token.rs:27-110.`,
            ],
            sources: javaRustSources(plan),
        };
    },
};
