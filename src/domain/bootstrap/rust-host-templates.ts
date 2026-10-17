// Copyright (c) Microsoft Corporation. All rights reserved.
import type { HostHandler, LifecycleHook } from "../plan";

const RUST_HOOKS: Record<LifecycleHook, { method: string; type: string }> = {
    preMcpToolCall: { method: "on_pre_mcp_tool_call", type: "PreMcpToolCall" },
    userPromptSubmitted: { method: "on_user_prompt_submitted", type: "UserPromptSubmitted" },
    userPromptTransformed: { method: "on_user_prompt_transformed", type: "UserPromptTransformed" },
    sessionStart: { method: "on_session_start", type: "SessionStart" },
    sessionEnd: { method: "on_session_end", type: "SessionEnd" },
    errorOccurred: { method: "on_error_occurred", type: "ErrorOccurred" },
    agentStop: { method: "on_agent_stop", type: "AgentStop" },
    subagentStart: { method: "on_subagent_start", type: "SubagentStart" },
    subagentStop: { method: "on_subagent_stop", type: "SubagentStop" },
};

function rustHookOverrides(): string {
    return Object.entries(RUST_HOOKS)
        .map(([name, hook]) => {
            const output = `github_copilot_sdk::hooks::${hook.type}Output`;
            // A selected prompt hook blocks the prompt; other hooks have no refusal output.
            const result =
                name === "userPromptSubmitted"
                    ? `let mut output = ${output}::default();
        output.decision = Some("block".into());
        output.reason = Some("Unimplemented host prompt policy".into());
        Some(output)`
                    : "None";
            return `    // <opt:hook-${name}>

    async fn ${hook.method}(&self, _input: github_copilot_sdk::hooks::${hook.type}Input, _context: HookContext) -> Option<${output}> {
        if !self.selected("${name}") { return None; }
        self.host.fail("HOST TODO: implement the selected ${name} hook".into());
        ${result}
    }
    // </opt:hook-${name}>
`;
        })
        .join("");
}

const RUST_HANDLERS: Record<HostHandler, { signature: string; result: string }> = {
    elicitation: {
        signature: `impl github_copilot_sdk::handler::ElicitationHandler for Host {
    async fn handle(
        &self,
        _session_id: SessionId,
        _request_id: RequestId,
        _request: github_copilot_sdk::ElicitationRequest,
    ) -> github_copilot_sdk::ElicitationResult {`,
        result: `github_copilot_sdk::ElicitationResult { action: "cancel".into(), content: None }`,
    },
    exitPlanMode: {
        signature: `impl github_copilot_sdk::handler::ExitPlanModeHandler for Host {
    async fn handle(
        &self,
        _session_id: SessionId,
        _data: github_copilot_sdk::ExitPlanModeData,
    ) -> github_copilot_sdk::handler::ExitPlanModeResult {`,
        result: `github_copilot_sdk::handler::ExitPlanModeResult {
            approved: false,
            selected_action: None,
            feedback: Some("Unimplemented host plan approval".into()),
        }`,
    },
    autoModeSwitch: {
        signature: `impl github_copilot_sdk::handler::AutoModeSwitchHandler for Host {
    async fn handle(
        &self,
        _session_id: SessionId,
        _error_code: Option<String>,
        _retry_after_seconds: Option<f64>,
    ) -> github_copilot_sdk::handler::AutoModeSwitchResponse {`,
        result: "github_copilot_sdk::handler::AutoModeSwitchResponse::No",
    },
    mcpAuth: {
        signature: `impl github_copilot_sdk::handler::McpAuthHandler for Host {
    async fn handle(
        &self,
        _session_id: SessionId,
        _request_id: RequestId,
        _request: github_copilot_sdk::handler::McpAuthRequest,
    ) -> github_copilot_sdk::handler::McpAuthResult {`,
        result: "github_copilot_sdk::handler::McpAuthResult::Cancelled",
    },
};

function rustHandlerImpls(): string {
    return Object.entries(RUST_HANDLERS)
        .map(
            ([name, handler]) => `// <opt:handler-${name}>

#[async_trait]
${handler.signature}
        self.fail("HOST TODO: implement the selected ${name} handler".into());
        ${handler.result}
    }
}
// </opt:handler-${name}>
`,
        )
        .join("");
}

export const RUST_HOST = String.raw`// Copyright (c) Microsoft Corporation. All rights reserved.
use std::io::{self, BufRead, Write};
use std::sync::mpsc;
use std::thread;
// __GITHUB_TOKEN_PROVIDER_START__
use std::time::{SystemTime, UNIX_EPOCH};
// __GITHUB_TOKEN_PROVIDER_END__

use anyhow::{Context, Result, anyhow, bail};
use async_trait::async_trait;
use github_copilot_sdk::handler::{
    PermissionHandler, PermissionResult, UserInputHandler, UserInputResponse,
};
use github_copilot_sdk::hooks::{
    HookContext, PostToolUseInput, PostToolUseOutput, PreToolUseInput, PreToolUseOutput,
    SessionHooks,
};
use github_copilot_sdk::tool::ToolHandler;
use github_copilot_sdk::{
    BearerTokenError, BearerTokenProvider, Error as SdkError, ErrorKind, PermissionRequestData,
    ProviderTokenArgs, RequestId, SessionId, ToolInvocation, ToolResult,
};
// __GITHUB_TOKEN_PROVIDER_START__
use github_copilot_sdk::{
    GitHubToken, GitHubTokenProvider, GitHubTokenProviderArgs, GitHubTokenProviderResult,
};
// __GITHUB_TOKEN_PROVIDER_END__
use tokio::sync::{oneshot, watch};

// Mark an integration ready only after replacing its failing implementation.
pub(crate) fn implemented_tools() -> &'static [&'static str] { &[] }
pub(crate) const PERMISSION_POLICY_IMPLEMENTED: bool = false;
pub(crate) const PRE_TOOL_IMPLEMENTED: bool = false;
pub(crate) const POST_TOOL_IMPLEMENTED: bool = false;
pub(crate) fn implemented_hooks() -> &'static [&'static str] { &[] }
pub(crate) fn implemented_handlers() -> &'static [&'static str] { &[] }
pub(crate) const SKILL_PROVIDER_IMPLEMENTED: bool = false;
pub(crate) const SESSION_FS_IMPLEMENTED: bool = false;
pub(crate) const PROVIDER_ENDPOINT: &str = "";

pub(crate) struct HostPermissionHandler {
    host: Host,
}

#[async_trait]
impl PermissionHandler for HostPermissionHandler {
    async fn handle(
        &self,
        _session_id: SessionId,
        _request_id: RequestId,
        _data: PermissionRequestData,
    ) -> PermissionResult {
        self.host.fail("HOST TODO: implement the selected host permission policy".into());
        PermissionResult::user_not_available()
    }
}

pub(crate) fn provider_endpoint() -> Result<String> {
    let value = PROVIDER_ENDPOINT.trim();
    if value.is_empty() {
        bail!("Provide the provider endpoint string in src/host.rs PROVIDER_ENDPOINT.");
    }
    Ok(value.to_owned())
}

pub(crate) fn required_env(name: &str) -> Result<String> {
    let value = std::env::var(name).map_err(|_| anyhow!("Set {name} in the process environment"))?;
    if value.trim().is_empty() { bail!("Set a nonempty {name} in the process environment"); }
    Ok(value)
}

// __GITHUB_TOKEN_PROVIDER_START__
pub(crate) fn github_environment_token() -> Result<GitHubTokenProviderResult> {
    let token = required_env("GITHUB_TOKEN")?;
    let expires_at: i64 = required_env("GITHUB_TOKEN_EXPIRES_AT")?
        .parse().context("GITHUB_TOKEN_EXPIRES_AT must be a UNIX timestamp in seconds")?;
    let now: i64 = SystemTime::now().duration_since(UNIX_EPOCH)
        .context("The system clock is before the UNIX epoch")?
        .as_secs().try_into().context("The system clock is out of range")?;
    let remaining = expires_at.checked_sub(now).context("The token expiry is out of range")?;
    if remaining <= 0 { bail!("GITHUB_TOKEN is expired; obtain a new token and its actual expiry"); }
    Ok(GitHubTokenProviderResult::Token(GitHubToken::new(token, remaining)))
}

pub(crate) struct GitHubEnvironmentProvider;

#[async_trait]
impl GitHubTokenProvider for GitHubEnvironmentProvider {
    async fn get_token(&self, _args: GitHubTokenProviderArgs) -> std::result::Result<GitHubTokenProviderResult, SdkError> {
        github_environment_token().map_err(|error| SdkError::with_message(ErrorKind::InvalidConfig, error.to_string()))
    }
}
// __GITHUB_TOKEN_PROVIDER_END__

pub(crate) fn raw_bearer_token() -> Result<String> {
    let token = required_env("MODEL_BEARER_TOKEN")?;
    if token.get(..7).is_some_and(|prefix| prefix.eq_ignore_ascii_case("Bearer ")) {
        bail!("MODEL_BEARER_TOKEN must not include a Bearer prefix");
    }
    Ok(token)
}

pub(crate) struct ModelBearerProvider;

#[async_trait]
impl BearerTokenProvider for ModelBearerProvider {
    async fn get_token(&self, _args: ProviderTokenArgs) -> std::result::Result<String, BearerTokenError> {
        raw_bearer_token().map_err(|error| BearerTokenError::message(error.to_string()))
    }
}

struct ConsoleRequest {
    question: String,
    choices: Vec<String>,
    allow_freeform: bool,
    reply: oneshot::Sender<io::Result<UserInputResponse>>,
}

#[derive(Clone)]
pub(crate) struct Host {
    console: mpsc::Sender<ConsoleRequest>,
    failures: watch::Sender<Option<String>>,
}

impl Host {
    pub(crate) fn permission_handler(&self) -> HostPermissionHandler {
        HostPermissionHandler { host: self.clone() }
    }

    pub(crate) fn new() -> Result<Self> {
        let (console, requests) = mpsc::channel::<ConsoleRequest>();
        // Stdin cannot be cancelled portably. This serialized thread lives until process exit
        // rather than pinning Tokio's blocking pool and preventing runtime shutdown.
        let _console_thread = thread::Builder::new().name("harness-console".into()).spawn(move || {
            let stdin = io::stdin();
            let mut input = stdin.lock();
            for request in requests {
                let response = read_console(&mut input, &request);
                // A cancelled agent turn may have dropped its answer receiver.
                let _ = request.reply.send(response);
            }
        }).context("Could not start the console input thread")?;
        let (failures, _) = watch::channel(None);
        Ok(Self { console, failures })
    }

    pub(crate) fn fail(&self, message: String) {
        self.failures.send_if_modified(|failure| {
            if failure.is_some() {
                false
            } else {
                *failure = Some(message);
                true
            }
        });
    }

    pub(crate) fn ensure_healthy(&self) -> Result<()> {
        if let Some(message) = self.failures.borrow().as_ref() { bail!("{message}"); }
        Ok(())
    }

    pub(crate) async fn failure(&self) -> anyhow::Error {
        let mut failures = self.failures.subscribe();
        loop {
            let failure = failures.borrow_and_update().clone();
            if let Some(message) = failure { return anyhow!(message); }
            if let Err(error) = failures.changed().await {
                return anyhow!("The host failure channel closed: {error}");
            }
        }
    }

    pub(crate) fn hooks(&self, pre: bool, post: bool, _lifecycle: &[String]) -> HostHooks {
        HostHooks {
            host: self.clone(),
            pre,
            post,
            // <opt:lifecycle-hooks>
            lifecycle: _lifecycle.to_vec(),
            // </opt:lifecycle-hooks>
        }
    }
    // <opt:skill-provider>

    pub(crate) fn skill_provider(&self) -> HostSkillProvider {
        HostSkillProvider { host: self.clone() }
    }
    // </opt:skill-provider>
}

fn read_console(input: &mut impl BufRead, request: &ConsoleRequest) -> io::Result<UserInputResponse> {
    if request.choices.is_empty() && !request.allow_freeform {
        return Err(io::Error::new(io::ErrorKind::InvalidInput,
            "The runtime requested input without choices or permission for freeform input"));
    }
    {
        let mut output = io::stderr().lock();
        writeln!(output, "{}", request.question)?;
        for (index, choice) in request.choices.iter().enumerate() {
            writeln!(output, "{}. {choice}", index + 1)?;
        }
    }
    loop {
        {
            let mut output = io::stderr().lock();
            write!(output, "> ")?;
            output.flush()?;
        }
        let mut answer = String::new();
        if input.read_line(&mut answer)? == 0 {
            return Err(io::Error::new(io::ErrorKind::UnexpectedEof,
                "Console input ended before an answer was provided"));
        }
        let answer = answer.trim_end_matches(['\r', '\n']).to_owned();
        for (index, choice) in request.choices.iter().enumerate() {
            if &answer == choice || answer.trim() == (index + 1).to_string() {
                return Ok(UserInputResponse { answer: choice.clone(), was_freeform: false });
            }
        }
        if request.allow_freeform {
            return Ok(UserInputResponse { answer, was_freeform: true });
        }
        writeln!(io::stderr().lock(), "Choose one of the offered answers; freeform input is disabled.")?;
    }
}

#[async_trait]
impl UserInputHandler for Host {
    async fn handle(
        &self,
        _session_id: SessionId,
        question: String,
        choices: Option<Vec<String>>,
        allow_freeform: Option<bool>,
    ) -> Option<UserInputResponse> {
        let (reply, response) = oneshot::channel();
        let request = ConsoleRequest {
            question,
            choices: choices.unwrap_or_default(),
            allow_freeform: allow_freeform.unwrap_or(true),
            reply,
        };
        if self.console.send(request).is_err() {
            self.fail("The console input worker is unavailable".into());
            return None;
        }
        match response.await {
            Ok(Ok(answer)) => Some(answer),
            Ok(Err(error)) => {
                self.fail(format!("Console input failed: {error}"));
                None
            }
            Err(error) => {
                self.fail(format!("The console answer channel closed: {error}"));
                None
            }
        }
    }
}

pub(crate) struct HostTool {
    name: String,
    host: Host,
}

impl HostTool {
    pub(crate) fn new(name: String, host: Host) -> Self { Self { name, host } }
}

#[async_trait]
impl ToolHandler for HostTool {
    async fn call(&self, _invocation: ToolInvocation) -> std::result::Result<ToolResult, SdkError> {
        let message = format!("HOST TODO: implement and authorize tool {}", self.name);
        self.host.fail(message.clone());
        Err(SdkError::with_message(ErrorKind::InvalidConfig, message))
    }
}

pub(crate) struct HostHooks {
    host: Host,
    pre: bool,
    post: bool,
    // <opt:lifecycle-hooks>
    lifecycle: Vec<String>,
    // </opt:lifecycle-hooks>
}
// <opt:lifecycle-hooks>

impl HostHooks {
    fn selected(&self, hook: &str) -> bool {
        self.lifecycle.iter().any(|name| name == hook)
    }
}
// </opt:lifecycle-hooks>

#[async_trait]
impl SessionHooks for HostHooks {
    async fn on_pre_tool_use(&self, _input: PreToolUseInput, _context: HookContext) -> Option<PreToolUseOutput> {
        if !self.pre { return None; }
        self.host.fail("HOST TODO: implement the selected pre-tool policy".into());
        let mut output = PreToolUseOutput::default();
        output.permission_decision = Some("deny".into());
        output.permission_decision_reason = Some("Unimplemented host policy".into());
        Some(output)
    }

    async fn on_post_tool_use(&self, _input: PostToolUseInput, _context: HookContext) -> Option<PostToolUseOutput> {
        if !self.post { return None; }
        // This SDK callback has no Result return; its failure must reach the main abort path.
        self.host.fail("HOST TODO: implement the selected post-tool inspection/redaction".into());
        None
    }
${rustHookOverrides()}}
${rustHandlerImpls()}// <opt:skill-provider>

pub(crate) struct HostSkillProvider {
    host: Host,
}

#[async_trait]
impl github_copilot_sdk::SkillProvider for HostSkillProvider {
    async fn list_skills(&self) -> std::result::Result<Vec<github_copilot_sdk::SkillProviderDescriptor>, SdkError> {
        let message = "HOST TODO: list the host's skills".to_owned();
        self.host.fail(message.clone());
        Err(SdkError::with_message(ErrorKind::InvalidConfig, message))
    }

    async fn read_skill(&self, name: &str) -> std::result::Result<Option<String>, SdkError> {
        let message = format!("HOST TODO: read skill {name}");
        self.host.fail(message.clone());
        Err(SdkError::with_message(ErrorKind::InvalidConfig, message))
    }
}
// </opt:skill-provider>
`;

export const RUST_SESSION_FS = String.raw`// Copyright (c) Microsoft Corporation. All rights reserved.
use async_trait::async_trait;
use github_copilot_sdk::session_fs::{DirEntry, FileInfo, FsError, FsErrorKind, SessionFsProvider};

// Implement persistence and concurrency semantics before marking SESSION_FS_IMPLEMENTED in host.rs.
// Return real ENOENT/UNKNOWN errors. Add SQLite capabilities and its provider together if needed.
pub(crate) struct HostSessionFs;

fn unimplemented_operation(operation: &str) -> FsError {
    FsError::with_message(FsErrorKind::Other, format!("HOST TODO: implement SessionFs {operation}"))
}

#[async_trait]
impl SessionFsProvider for HostSessionFs {
    async fn read_file(&self, _path: &str) -> Result<String, FsError> {
        Err(unimplemented_operation("read_file"))
    }
    async fn write_file(&self, _path: &str, _content: &str, _mode: Option<i64>) -> Result<(), FsError> {
        Err(unimplemented_operation("write_file"))
    }
    async fn append_file(&self, _path: &str, _content: &str, _mode: Option<i64>) -> Result<(), FsError> {
        Err(unimplemented_operation("append_file"))
    }
    async fn exists(&self, _path: &str) -> Result<bool, FsError> {
        Err(unimplemented_operation("exists"))
    }
    async fn stat(&self, _path: &str) -> Result<FileInfo, FsError> {
        Err(unimplemented_operation("stat"))
    }
    async fn mkdir(&self, _path: &str, _recursive: bool, _mode: Option<i64>) -> Result<(), FsError> {
        Err(unimplemented_operation("mkdir"))
    }
    async fn readdir(&self, _path: &str) -> Result<Vec<String>, FsError> {
        Err(unimplemented_operation("readdir"))
    }
    async fn readdir_with_types(&self, _path: &str) -> Result<Vec<DirEntry>, FsError> {
        Err(unimplemented_operation("readdir_with_types"))
    }
    async fn rm(&self, _path: &str, _recursive: bool, _force: bool) -> Result<(), FsError> {
        Err(unimplemented_operation("rm"))
    }
    async fn rename(&self, _source: &str, _destination: &str) -> Result<(), FsError> {
        Err(unimplemented_operation("rename"))
    }
}
`;
