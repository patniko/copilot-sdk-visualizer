// Copyright (c) Microsoft Corporation. All rights reserved.
export { RUST_HOST, RUST_SESSION_FS } from "./rust-host-templates";

export const RUST_MAIN = String.raw`// Copyright (c) Microsoft Corporation. All rights reserved.
mod config;
mod host;
mod session_fs;

use std::time::Duration;

use anyhow::{Context, Result, anyhow, bail};
use github_copilot_sdk::subscription::RecvErrorKind;
use github_copilot_sdk::{Client, EventSubscription, MessageOptions, SessionEvent};
use tokio::sync::oneshot;
use tokio::task::JoinHandle;

use crate::config::Configuration;
use crate::host::Host;

enum Completion {
    Message(String),
    NoMessage,
}

fn completion(event: Option<SessionEvent>) -> Result<Completion> {
    let Some(event) = event else {
        return Ok(Completion::NoMessage);
    };
    let text = event.data.get("content").and_then(|value| value.as_str())
        .context("The final assistant event has no text content")?;
    Ok(Completion::Message(text.to_owned()))
}

fn with_cleanup<T>(primary: Result<T>, cleanup: Result<()>, stage: &str) -> Result<T> {
    match (primary, cleanup) {
        (Ok(value), Ok(())) => Ok(value),
        (Err(error), Ok(())) => Err(error),
        (Ok(_), Err(error)) => Err(error.context(format!("Cleanup failed: {stage}"))),
        (Err(primary), Err(cleanup)) => {
            Err(primary.context(format!("Cleanup also failed ({stage}): {cleanup:#}")))
        }
    }
}

struct Observer {
    stop: oneshot::Sender<()>,
    task: JoinHandle<Result<()>>,
}

impl Observer {
    fn start(mut events: EventSubscription, host: Host) -> Self {
        let (stop, mut cancelled) = oneshot::channel();
        let task = tokio::spawn(async move {
            loop {
                tokio::select! {
                    _ = &mut cancelled => return Ok(()),
                    event = events.recv() => match event {
                        Ok(event) => eprintln!("[event] {}", event.event_type),
                        Err(error) if matches!(error.kind(), RecvErrorKind::Closed) => return Ok(()),
                        Err(error) => {
                            host.fail(format!("Event observer failed: {error}"));
                            return Err(error.into());
                        }
                    }
                }
            }
        });
        Self { stop, task }
    }

    async fn finish(self) -> Result<()> {
        // A stopped task may have closed the signal receiver; its joined result is authoritative.
        let _ = self.stop.send(());
        self.task.await.context("The event observer task failed")?
    }
}

async fn run_session(client: &Client, configuration: &Configuration, host: &Host, prompt: String) -> Result<Completion> {
    let prepared = client.prepare_session(configuration.session_config(host)?)?;
    let observer = if configuration.observer {
        Some(Observer::start(prepared.subscribe(), host.clone()))
    } else {
        None
    };
    let started = tokio::select! {
        biased;
        error = host.failure() => Err(error),
        signal = tokio::signal::ctrl_c() => match signal {
            Ok(()) => Err(anyhow!("Interrupted while starting the session")),
            Err(error) => Err(error.into()),
        },
        result = prepared.start() => result.map_err(anyhow::Error::from),
    };
    let primary = match started {
        Err(error) => Err(error),
        Ok(session) => {
            let primary = tokio::select! {
                biased;
                error = host.failure() => Err(error),
                signal = tokio::signal::ctrl_c() => match signal {
                    Ok(()) => Err(anyhow!("Interrupted")),
                    Err(error) => Err(error.into()),
                },
                response = session.send_and_wait(
                    MessageOptions::new(prompt).with_wait_timeout(Duration::from_secs(120)),
                ) => response.map_err(anyhow::Error::from).and_then(completion),
            };
            let primary = with_cleanup(primary, host.ensure_healthy(), "host callback");
            let primary = if primary.is_err() {
                with_cleanup(primary, session.abort().await.map_err(anyhow::Error::from), "abort")
            } else {
                primary
            };
            with_cleanup(primary, session.disconnect().await.map_err(anyhow::Error::from), "session detach")
        }
    };
    match observer {
        Some(observer) => with_cleanup(primary, observer.finish().await, "event observer"),
        None => primary,
    }
}

#[tokio::main]
async fn main() -> Result<()> {
    let args: Vec<String> = std::env::args().skip(1).collect();
    let check = args.len() == 1 && args[0] == "--check";
    if !check && (args.is_empty() || args.first().is_some_and(|arg| arg == "--check")) {
        bail!("Usage: agent-starter --check | <prompt>");
    }
    let configuration = Configuration::read()?;
    let issues = configuration.preflight();
    if !issues.is_empty() {
        bail!("Preflight failed:\n - {}", issues.join("\n - "));
    }
    if check {
        println!("Preflight passed. No runtime was started and no model was contacted.");
        return Ok(());
    }

    let host = Host::new()?;
    let client = Client::start(configuration.client_options()?).await?;
    let primary = run_session(&client, &configuration, &host, args.join(" ")).await;
    let stopped = client.stop().await.map_err(|error| anyhow!("Runtime shutdown failed: {error:?}"));
    match with_cleanup(primary, stopped, "client shutdown")? {
        Completion::Message(text) => println!("{text}"),
        Completion::NoMessage => println!("Turn completed without an assistant message."),
    }
    Ok(())
}
`;

export const RUST_CONFIG = String.raw`// Copyright (c) Microsoft Corporation. All rights reserved.
use std::collections::HashMap;
use std::path::PathBuf;
use std::sync::Arc;

use anyhow::{Context, Result, anyhow, bail};
use github_copilot_sdk::session_fs::{SessionFsConfig, SessionFsConventions};
use github_copilot_sdk::{
    ClientMode, ClientOptions, CliProgram, CustomAgentConfig, DefaultAgentConfig,
    InfiniteSessionConfig, LargeToolOutputConfig, McpHttpServerConfig, McpServerConfig,
    ProviderConfig, SectionOverride, SessionConfig, SystemMessageConfig, Tool, Transport,
};
use indexmap::IndexMap;
use serde::Deserialize;
use serde_json::Value;

use crate::host::{
    self, Host, HostTool, ModelBearerProvider, required_env,
};
// __GITHUB_TOKEN_PROVIDER_START__
use crate::host::GitHubEnvironmentProvider;
// __GITHUB_TOKEN_PROVIDER_END__
use crate::session_fs::HostSessionFs;

#[derive(Deserialize)]
#[serde(rename_all = "kebab-case")]
enum Identity { HostToken, Developer, S2sInstallation }

#[derive(Deserialize)]
#[serde(rename_all = "kebab-case")]
enum Credential { ApiKey, BearerCallback }

#[derive(Deserialize)]
#[serde(rename_all = "lowercase")]
enum Runtime { Managed, External, Inprocess }

#[derive(Deserialize)]
#[serde(rename_all = "kebab-case")]
enum Mode { Empty, CopilotCli }

#[derive(Deserialize)]
#[serde(rename_all = "lowercase")]
enum Storage { Local, Virtual }

#[derive(Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
struct ClientData {
    runtime: Runtime,
    mode: Mode,
    cli_path: String,
    host: String,
    port: u16,
    address: String,
    base_directory: String,
    idle_timeout_seconds: u64,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
struct PromptData {
    mode: String,
    content: String,
    sections: Option<HashMap<String, SectionData>>,
}

#[derive(Deserialize)]
#[serde(deny_unknown_fields)]
struct SectionData {
    action: String,
    content: Option<String>,
}

#[derive(Deserialize)]
#[serde(deny_unknown_fields)]
struct McpData {
    #[serde(rename = "type")]
    transport: String,
    url: String,
    tools: Vec<String>,
}

#[derive(Deserialize)]
#[serde(deny_unknown_fields)]
struct AgentData {
    name: String,
    description: String,
    prompt: String,
    model: Option<String>,
    tools: Vec<String>,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
struct RootAgentData { excluded_tools: Vec<String> }

#[derive(Deserialize)]
#[serde(deny_unknown_fields)]
struct Toggle { enabled: bool }

#[derive(Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
struct ProviderData {
    #[serde(rename = "type")]
    provider_type: String,
    base_url: String,
    wire_api: Option<String>,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
struct ToolData {
    name: String,
    description: String,
    parameters: IndexMap<String, Value>,
    overrides_built_in_tool: bool,
    is_terminal: bool,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
struct SessionData {
    model: Option<String>,
    reasoning_effort: Option<String>,
    context_tier: Option<String>,
    system_message: PromptData,
    available_tools: Option<Vec<String>>,
    excluded_tools: Vec<String>,
    working_directory: Option<PathBuf>,
    enable_config_discovery: bool,
    enable_skills: bool,
    enable_file_hooks: bool,
    enable_host_git_operations: bool,
    skill_directories: Vec<PathBuf>,
    plugin_directories: Vec<PathBuf>,
    mcp_servers: IndexMap<String, McpData>,
    custom_agents: Vec<AgentData>,
    agent: Option<String>,
    default_agent: Option<RootAgentData>,
    infinite_sessions: Toggle,
    large_output: Toggle,
    streaming: bool,
    provider: Option<ProviderData>,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub(crate) struct Configuration {
    client: ClientData,
    storage: Storage,
    identity: Identity,
    credential: Credential,
    credential_env: String,
    pub(crate) observer: bool,
    pre_tool_hook: bool,
    post_tool_hook: bool,
    session: SessionData,
    tools: Vec<ToolData>,
}

impl Configuration {
    pub(crate) fn read() -> Result<Self> {
        serde_json::from_str(include_str!("../bootstrap-config.json"))
            .context("Invalid bootstrap-config.json; unmapped fields are rejected")
    }

    pub(crate) fn preflight(&self) -> Vec<String> {
        let mut issues = Vec::new();
        if self.session.model.is_none() {
            if let Err(error) = required_env("COPILOT_MODEL") { issues.push(error.to_string()); }
        }
        // __COPILOT_IDENTITY_PREFLIGHT_START__
        if self.session.provider.is_none() && matches!(self.identity, Identity::HostToken) {
            if let Err(error) = host::github_environment_token() { issues.push(error.to_string()); }
        }
        // __COPILOT_IDENTITY_PREFLIGHT_END__
        // __S2S_LOCAL_PREFLIGHT_START__
        if self.session.provider.is_none() && matches!(self.identity, Identity::S2sInstallation) {
            if let Err(error) = required_env("COPILOT_GITHUB_TOKEN") { issues.push(error.to_string()); }
        }
        // __S2S_LOCAL_PREFLIGHT_END__
        if let Some(provider) = &self.session.provider {
            if provider.base_url.trim().is_empty() {
                if let Err(error) = host::provider_endpoint() { issues.push(error.to_string()); }
            }
            let result = match self.credential {
                Credential::ApiKey => required_env(&self.credential_env),
                Credential::BearerCallback => host::raw_bearer_token(),
            };
            if let Err(error) = result { issues.push(error.to_string()); }
        }
        if matches!(self.client.runtime, Runtime::External) {
            if let Err(error) = required_env("COPILOT_CONNECTION_TOKEN") { issues.push(error.to_string()); }
            if self.client.host.is_empty() || self.client.port == 0 || self.client.address.is_empty() {
                issues.push("Provide the existing runtime's TCP host and port".into());
            }
            eprintln!("Preflight is local only: apply start-runtime.sh on the server host before connecting.");
        } else {
            if matches!(self.storage, Storage::Local) {
                for (path, label) in self.session.working_directory.iter().map(|path| (path, "workspace"))
                    .chain(self.session.skill_directories.iter().map(|path| (path, "skill directory")))
                    .chain(self.session.plugin_directories.iter().map(|path| (path, "plugin directory")))
                {
                    if !path.is_dir() {
                        issues.push(format!("Provide the selected {label} on the runtime host: {}", path.display()));
                    }
                }
            }
            if matches!(self.client.runtime, Runtime::Managed) && !self.client.cli_path.trim().is_empty()
                && !PathBuf::from(&self.client.cli_path).is_file()
            {
                issues.push("Managed cliPath must name a compatible runtime wrapper on this host".into());
            }
        }
        if !matches!(self.client.runtime, Runtime::Managed) && !self.client.cli_path.trim().is_empty() {
            issues.push("cliPath is only supported by the managed transport".into());
        }
        if self.client.base_directory.trim().is_empty() {
            issues.push("Provide the selected local or virtual session state directory".into());
        }
        for tool in &self.tools {
            if !host::implemented_tools().contains(&tool.name.as_str()) {
                issues.push(format!("HOST TODO: implement tool {} in src/host.rs", tool.name));
            }
        }
        if self.pre_tool_hook && !host::PRE_TOOL_IMPLEMENTED {
            issues.push("HOST TODO: implement the pre-tool policy hook in src/host.rs".into());
        }
        if self.post_tool_hook && !host::POST_TOOL_IMPLEMENTED {
            issues.push("HOST TODO: implement the post-tool inspection/redaction hook in src/host.rs".into());
        }
        if matches!(self.storage, Storage::Virtual) && !host::SESSION_FS_IMPLEMENTED {
            issues.push("HOST TODO: implement the POSIX SessionFs provider in src/session_fs.rs".into());
        }
        issues
    }

    pub(crate) fn client_options(&self) -> Result<ClientOptions> {
        let mut options = ClientOptions::new();
        options.mode = match self.client.mode { Mode::Empty => ClientMode::Empty, Mode::CopilotCli => ClientMode::CopilotCli };
        if !matches!(self.client.runtime, Runtime::External) {
            options.use_logged_in_user = Some(self.session.provider.is_none() && matches!(self.identity, Identity::Developer));
            options.session_idle_timeout_seconds = Some(self.client.idle_timeout_seconds);
            // __S2S_RUNTIME_ENV_START__
            if self.session.provider.is_none() && matches!(self.identity, Identity::S2sInstallation) {
                let token = required_env("COPILOT_GITHUB_TOKEN")?;
                if matches!(self.client.runtime, Runtime::Managed) {
                    options = options.with_env([("COPILOT_GITHUB_TOKEN", token)]);
                }
            }
            // __S2S_RUNTIME_ENV_END__
        }
        options.transport = match self.client.runtime {
            Runtime::Managed => {
                if !self.client.cli_path.trim().is_empty() {
                    options.program = CliProgram::Path(PathBuf::from(&self.client.cli_path));
                }
                Transport::Stdio
            }
            Runtime::External => Transport::External {
                host: self.client.host.clone(),
                port: self.client.port,
                connection_token: Some(required_env("COPILOT_CONNECTION_TOKEN")?),
            },
            Runtime::Inprocess => Transport::InProcess,
        };
        match self.storage {
            Storage::Local => {
                if !matches!(self.client.runtime, Runtime::External) {
                    options.base_directory = Some(PathBuf::from(&self.client.base_directory));
                }
            }
            Storage::Virtual => {
                let initial_cwd = match &self.session.working_directory {
                    Some(path) => path.to_str().context("Virtual workspace path must be UTF-8")?.to_owned(),
                    None => "/".to_owned(),
                };
                options.session_fs = Some(SessionFsConfig::new(
                    initial_cwd, self.client.base_directory.clone(), SessionFsConventions::Posix,
                ));
            }
        }
        Ok(options)
    }

    pub(crate) fn session_config(&self, host: &Host) -> Result<SessionConfig> {
        let data = &self.session;
        let mut config = SessionConfig::default().deny_all_permissions();
        config.model = Some(match &data.model {
            Some(model) => model.clone(),
            None => required_env("COPILOT_MODEL")?,
        });
        config.reasoning_effort = data.reasoning_effort.clone();
        config.context_tier = data.context_tier.clone();
        let mut prompt = SystemMessageConfig::new()
            .with_mode(data.system_message.mode.clone())
            .with_content(data.system_message.content.clone());
        if let Some(sections) = &data.system_message.sections {
            let mut overrides = HashMap::new();
            for (name, section) in sections {
                let mut value = SectionOverride::default();
                value.action = Some(section.action.clone());
                value.content = section.content.clone();
                overrides.insert(name.clone(), value);
            }
            prompt = prompt.with_sections(overrides);
        }
        config.system_message = Some(prompt);
        config.available_tools = data.available_tools.clone();
        config.excluded_tools = Some(data.excluded_tools.clone());
        config.working_directory = data.working_directory.clone();
        config.enable_config_discovery = Some(data.enable_config_discovery);
        config.enable_skills = Some(data.enable_skills);
        config.enable_file_hooks = Some(data.enable_file_hooks);
        config.enable_host_git_operations = Some(data.enable_host_git_operations);
        config.skill_directories = Some(data.skill_directories.clone());
        config.plugin_directories = Some(data.plugin_directories.clone());
        config.streaming = Some(data.streaming);
        let mut infinite = InfiniteSessionConfig::default();
        infinite.enabled = Some(data.infinite_sessions.enabled);
        config.infinite_sessions = Some(infinite);
        let mut output = LargeToolOutputConfig::default();
        output.enabled = Some(data.large_output.enabled);
        config.large_output = Some(output);

        let mut servers = IndexMap::new();
        for (name, server) in &data.mcp_servers {
            if server.transport != "http" { bail!("Regenerate the adapter for this MCP transport"); }
            let mut http = McpHttpServerConfig::default();
            http.url = server.url.clone();
            http.tools = Some(server.tools.clone());
            servers.insert(name.clone(), McpServerConfig::Http(http));
        }
        config.mcp_servers = Some(servers);
        let mut agents = Vec::new();
        for agent in &data.custom_agents {
            let mut value = CustomAgentConfig::default();
            value.name = agent.name.clone();
            value.description = Some(agent.description.clone());
            value.prompt = agent.prompt.clone();
            value.model = agent.model.clone();
            value.tools = Some(agent.tools.clone());
            agents.push(value);
        }
        config.custom_agents = Some(agents);
        config.agent = data.agent.clone();
        if let Some(root) = &data.default_agent {
            let mut value = DefaultAgentConfig::default();
            value.excluded_tools = Some(root.excluded_tools.clone());
            config.default_agent = Some(value);
        }
        let mut tools = Vec::new();
        for tool in &self.tools {
            tools.push(Tool::new(tool.name.clone())
                .with_description(tool.description.clone())
                .with_parameters(serde_json::to_value(&tool.parameters)?)
                .with_overrides_built_in_tool(tool.overrides_built_in_tool)
                .with_is_terminal(tool.is_terminal)
                .with_handler(Arc::new(HostTool::new(tool.name.clone(), host.clone()))));
        }
        config.tools = Some(tools);
        config = config.with_user_input_handler(Arc::new(host.clone()));
        // __COPILOT_IDENTITY_BINDING_START__
        if self.session.provider.is_none() && matches!(self.identity, Identity::HostToken) {
            config = config.with_github_token_provider(Arc::new(GitHubEnvironmentProvider));
        }
        // __COPILOT_IDENTITY_BINDING_END__
        if self.pre_tool_hook || self.post_tool_hook {
            config = config.with_hooks(Arc::new(host.hooks(self.pre_tool_hook, self.post_tool_hook)));
        }
        if matches!(self.storage, Storage::Virtual) {
            config = config.with_session_fs_provider(Arc::new(HostSessionFs));
        }
        if let Some(data) = &data.provider {
            let mut provider = ProviderConfig::default();
            provider.provider_type = Some(data.provider_type.clone());
            provider.base_url = if data.base_url.trim().is_empty() {
                host::provider_endpoint()?
            } else {
                data.base_url.clone()
            };
            provider.wire_api = data.wire_api.clone();
            match self.credential {
                Credential::ApiKey => provider.api_key = Some(required_env(&self.credential_env)?),
                Credential::BearerCallback => {
                    provider = provider.with_bearer_token_provider(Arc::new(ModelBearerProvider));
                }
            }
            config.provider = Some(provider);
        }
        if config.model.as_ref().is_none_or(|model| model.trim().is_empty()) {
            return Err(anyhow!("Select a model or set COPILOT_MODEL"));
        }
        Ok(config)
    }
}
`;
