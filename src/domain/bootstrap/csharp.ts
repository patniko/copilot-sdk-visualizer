// Copyright (c) Microsoft Corporation. All rights reserved.
import type { HarnessPlan } from "../plan";
import { runtimeEndpoint } from "../target";
import { commonRequirements, sessionData } from "./common";
import { goCsharpToolData } from "./go-csharp-data";
import type { BootstrapBlocker, LanguageAdapter } from "./types";

const sdkRevision = "f45c46fd1812f8bed5b4cbc250f47177c83068f0";
const json = (value: unknown) => JSON.stringify(value, null, 2) + "\n";
const shellQuote = (value: string) => `'${value.replace(/'/g, "'\\''")}'`;

function renderCsharpSource(source: string, plan: HarnessPlan): string {
    const s2s = plan.model.provider === "copilot" && plan.identity === "s2s-installation";
    if (!s2s)
        return source
            .replace(
                /[ \t]*\/\/ __S2S_RUNTIME_ENV_START__\n[\s\S]*?[ \t]*\/\/ __S2S_RUNTIME_ENV_END__\n?/g,
                "",
            )
            .replaceAll(/^\s*\/\/ __[A-Z_]+_(?:START|END)__\n/gm, "");
    const runtimeEnvironment =
        plan.target.runtime === "managed"
            ? `            var token = Host.RequiredEnvironment("COPILOT_GITHUB_TOKEN");
            var environment = System.Environment.GetEnvironmentVariables()
                .Cast<DictionaryEntry>()
                .ToDictionary(
                    entry => (string)entry.Key,
                    entry => entry.Value?.ToString() ?? "");
            environment["COPILOT_GITHUB_TOKEN"] = token;
            options.Environment = environment;
`
            : plan.target.runtime === "inprocess"
              ? `            Host.RequiredEnvironment("COPILOT_GITHUB_TOKEN");
`
              : "";
    const identityPreflight =
        plan.target.runtime === "external"
            ? `            if (settings.Identity != "s2s-installation")
                problems.Add("- Unknown Copilot identity selection.");
`
            : `            if (settings.Identity == "s2s-installation")
                Check(() => RequiredEnvironment("COPILOT_GITHUB_TOKEN"));
            else
                problems.Add("- Unknown Copilot identity selection.");
`;
    const rendered = source
        .replace(
            /[ \t]*\/\/ __S2S_RUNTIME_ENV_START__\n[\s\S]*?[ \t]*\/\/ __S2S_RUNTIME_ENV_END__\n?/g,
            runtimeEnvironment,
        )
        .replace(
            /[ \t]*\/\/ __GITHUB_TOKEN_PROVIDER_START__\n[\s\S]*?[ \t]*\/\/ __GITHUB_TOKEN_PROVIDER_END__\n?/g,
            "",
        )
        .replace(
            /[ \t]*\/\/ __COPILOT_IDENTITY_PREFLIGHT_START__\n[\s\S]*?[ \t]*\/\/ __COPILOT_IDENTITY_PREFLIGHT_END__\n?/g,
            identityPreflight,
        )
        .replace(
            /[ \t]*\/\/ __COPILOT_IDENTITY_BINDING_START__\n[\s\S]*?[ \t]*\/\/ __COPILOT_IDENTITY_BINDING_END__\n?/g,
            "",
        );
    return source.includes("__GITHUB_TOKEN_PROVIDER_START__")
        ? rendered.replace("using System.Globalization;\n", "")
        : rendered;
}

function blockers(plan: HarnessPlan): BootstrapBlocker[] {
    const result: BootstrapBlocker[] = [];
    if (plan.target.runtime !== "managed" && plan.target.cliPath !== "")
        result.push({
            id: "csharp-cli-path",
            title: "CLI path is a managed-process setting",
            detail: "Clear cliPath. ForInProcess uses the host's COPILOT_CLI_PATH environment variable; an existing service owns its executable.",
            fields: ["target.cliPath", "target.runtime"],
            sources: ["sdk-inprocess-guide", "sdk-existing-runtime"],
        });
    if (plan.target.runtime !== "external" && plan.session.idleTimeoutSeconds > 2_147_483_647)
        result.push({
            id: "csharp-idle-timeout",
            title: "Idle timeout exceeds the .NET SDK integer range",
            detail: "CopilotClientOptions.SessionIdleTimeoutSeconds is an Int32. Choose at most 2147483647 seconds rather than truncating the selected value.",
            fields: ["session.idleTimeoutSeconds"],
            sources: ["sdk-idle-option"],
        });
    for (const [index, server] of plan.mcpServers.entries())
        for (const [toolIndex, tool] of server.tools.entries())
            if (tool.wireName !== `${server.name}-${tool.name}`)
                result.push({
                    id: `csharp-mcp-name-${index}-${toolIndex}`,
                    title: "MCP wire names cannot be aliased",
                    detail: `The SDK exposes ${server.name}-${tool.name}, not ${tool.wireName}. Change the planned wire name and any agent/root references.`,
                    fields: [`mcpServers.${index}.tools.${toolIndex}.wireName`],
                    sources: ["sdk-mcp", "sdk-filter-names"],
                });
    return result;
}

export const csharpAdapter: LanguageAdapter = {
    language: "csharp",
    label: "C# / .NET",
    check: blockers,
    generate(plan) {
        const unsupported = blockers(plan);
        if (unsupported.length) throw new Error(unsupported.map((item) => item.detail).join("\n"));
        const endpoint = plan.target.runtime === "external" ? runtimeEndpoint(plan.target) : undefined;
        const requirements = commonRequirements(plan, "Host.cs");
        requirements.push({
            id: "csharp-sdk-source",
            title: "Provision the pinned SDK source",
            detail: `Run bash setup-sdk.sh --run with Git and network access. It creates .sdk-source/copilot-sdk at ${sdkRevision} and refuses to reset, overwrite, or delete existing user content. The app uses a ProjectReference, not NuGet 0.0.0-dev.`,
            file: "setup-sdk.sh",
            kind: "runtime",
        });
        if (plan.model.provider === "copilot" && plan.identity === "host-token")
            requirements.push({
                id: "csharp-token-expiry",
                environmentVariable: "GITHUB_TOKEN_EXPIRES_AT",
                title: "Set GITHUB_TOKEN_EXPIRES_AT",
                detail: "Supply the token's actual expiration as UNIX seconds alongside GITHUB_TOKEN. Every acquisition computes a fresh positive remaining lifetime from that fixed expiration; expired values are rejected.",
                file: "Host.cs",
                kind: "environment",
            });
        if (endpoint)
            requirements.push({
                id: "csharp-connection-token",
                environmentVariable: "COPILOT_CONNECTION_TOKEN",
                title: "Set COPILOT_CONNECTION_TOKEN on the client and server",
                detail: "Provide the same non-empty connection secret to both processes. Keep it outside JSON and the server URL; it is separate from GitHub identity.",
                file: "Host.cs",
                kind: "environment",
            });
        else
            requirements.push({
                id: "csharp-runtime-entrypoint",
                environmentVariable: "COPILOT_CLI_PATH",
                title: "Provision the compatible runtime entrypoint",
                detail: "Set COPILOT_CLI_PATH, or the selected managed cliPath. Runtime downloads are disabled in this source-reference project so --check/build cannot silently acquire or start a runtime. Native hosting requires the matching native package.",
                file: "Host.cs",
                kind: "runtime",
            });
        return {
            files: [
                { path: "HarnessAgent.csproj", language: "xml", content: projectSource },
                { path: "Program.cs", language: "csharp", content: renderCsharpSource(programSource, plan) },
                { path: "Host.cs", language: "csharp", content: renderCsharpSource(hostSource, plan) },
                { path: "setup-sdk.sh", language: "text", content: setupSource },
                {
                    path: ".sdk-source/.gitignore",
                    language: "text",
                    content: "# Copyright (c) Microsoft Corporation. All rights reserved.\n*\n!.gitignore\n",
                },
                { path: "config/session.json", language: "json", content: json(sessionData(plan)) },
                { path: "config/tools.json", language: "json", content: goCsharpToolData(plan) },
                {
                    path: "config/host.json",
                    language: "json",
                    content: json({
                        runtime: plan.target.runtime,
                        serverAddress: endpoint?.address ?? "",
                        cliPath: plan.target.cliPath,
                        clientMode: plan.clientMode,
                        identity: plan.identity,
                        credential: plan.model.credential,
                        credentialEnv: plan.model.credentialEnv,
                        storage: plan.session.storage,
                        baseDirectory: plan.session.baseDirectory,
                        idleTimeoutSeconds: plan.session.idleTimeoutSeconds,
                        userInput: plan.tools.ask_user.action === "keep",
                        observer: plan.events.observer,
                        preToolHook: plan.policy.preToolHook,
                        postToolHook: plan.policy.postToolHook,
                    }),
                },
            ],
            commands: {
                install: ["bash setup-sdk.sh --run", "dotnet restore HarnessAgent.csproj"],
                check: "dotnet run --project HarnessAgent.csproj -- --check",
                run: 'dotnet run --project HarnessAgent.csproj -- "Describe the task you want the agent to perform."',
                ...(endpoint
                    ? {
                          startRuntime: [
                              'test -n "$COPILOT_CONNECTION_TOKEN" &&',
                              ...(plan.identity === "s2s-installation"
                                  ? ['test -n "$COPILOT_GITHUB_TOKEN" &&']
                                  : []),
                              ...(plan.session.storage === "local"
                                  ? [`COPILOT_HOME=${shellQuote(plan.session.baseDirectory)}`]
                                  : []),
                              `copilot-runtime --headless --no-auto-update --port ${endpoint.port}`,
                              ...(plan.identity === "s2s-installation" ? ["--no-auto-login"] : []),
                              ...(plan.session.idleTimeoutSeconds > 0
                                  ? [`--session-idle-timeout ${plan.session.idleTimeoutSeconds}`]
                                  : []),
                          ].join(" "),
                      }
                    : {}),
            },
            requirements,
            notes: [
                `Requires .NET SDK 10 and Git. The SDK is source-pinned at ${sdkRevision} in .sdk-source/copilot-sdk and referenced through dotnet/src/GitHub.Copilot.SDK.csproj. The snapshot's 0.0.0-dev version is not a nuget.org dependency. Source provisioning needs access to github/copilot-sdk; normal NuGet restore supplies its declared dependencies.`,
                "setup-sdk.sh is preview-only without --run. It verifies and reuses only a clean checkout at the exact SHA; a different revision, modified checkout, symlink, or non-repository destination is refused. It never resets, cleans, or deletes files. An interrupted initial provisioning is left for explicit review rather than overwritten on the next run.",
                "HarnessAgent.csproj targets net10.0, explicitly opts into experimental GHCP001 APIs, excludes SDK checkout sources from the app's compile glob, and disables automatic runtime downloads on the ProjectReference. The generated app requires an explicitly provisioned compatible runtime; the visualizer itself has no SDK/runtime dependency.",
                "config/session.json contains SDK data only. Its prompt section keys and type-discriminated MCP configurations deserialize with the SDK's converters. Tools and host callbacks are bound separately before creation; all configuration files are embedded, so rebuild after editing them.",
                "Each custom HostTool exposes the original JSON schema, not a reflected wrapper schema. CopilotTool.DefineTool supplies the SDK's exact override/terminal metadata, which the wrapper forwards unchanged. Register handlers in Host.ToolHandlers and validate authority and arguments before executing them. SkipPermission is never enabled.",
                "Register selected pre/post hooks and SessionFilesystemFactory in Host.cs. Both --check and normal startup fail on missing host integrations; the invocation paths also throw rather than returning successful placeholder results. The default permission callback rejects every effect and must be reviewed separately.",
                plan.model.provider === "copilot" && plan.identity === "s2s-installation"
                    ? plan.target.runtime === "external"
                        ? "GitHub App S2S identity is configured on the separately operated runtime with COPILOT_GITHUB_TOKEN and --no-auto-login. The connecting .NET client neither reads nor injects that token and does not install a per-session token callback."
                        : plan.target.runtime === "inprocess"
                          ? "GitHub App S2S identity requires COPILOT_GITHUB_TOKEN in the host environment before ForInProcess loads the runtime. UseLoggedInUser is false and no per-session token callback is generated."
                          : "GitHub App S2S identity copies the trusted host's COPILOT_GITHUB_TOKEN into CopilotClientOptions.Environment for the managed child. UseLoggedInUser is false and no per-session token callback is generated."
                    : "Host-token identity uses the per-session GitHubTokenProvider with GITHUB_TOKEN and GITHUB_TOKEN_EXPIRES_AT (actual absolute UNIX seconds). Every acquisition recomputes remaining lifetime and rejects expiry. BYOK API keys use the selected credentialEnv; bearer callbacks read MODEL_BEARER_TOKEN on every request. Replace these environment adapters with scoped identity acquisition and caching where needed.",
                "For existing runtimes, the client never sets client-level GitHubToken or UseLoggedInUser. Server identity, process startup, base directory, idle policy, and shutdown remain server-owned. Apply the selected local base directory/nonzero idle timeout with the server command; zero keeps the runtime default. Session-scoped callbacks are still attached normally. The sample command is for loopback development; secure remote routing or a tunnel separately. A connection token does not add TLS or tenant authorization.",
                "ForInProcess() uses COPILOT_CLI_PATH and a compatible copilot_runtime.dll, libcopilot_runtime.dylib, libcopilot_runtime.so, or runtime.node package. Native libraries are process-global and experimental; do not replace a loaded version. No client-level environment, working-directory, or telemetry override is emitted.",
                "Virtual storage requires a SessionFsProvider subclass overriding ReadFileAsync, WriteFileAsync, AppendFileAsync, ExistsAsync, StatAsync, MakeDirectoryAsync, ReadDirectoryAsync, ReadDirectoryWithTypesAsync, RemoveAsync, and RenameAsync, then a session-scoped factory registration. POSIX logical paths use the selected workspace (or /) and baseDirectory (or /session-state). SQLite is not advertised; implement ISessionFsSqliteProvider/ISessionFsSqliteTransactionProvider before opting into SQL.",
                "Local preflight never constructs a client, connects, loads a native runtime, or calls a model. Source provisioning and NuGet/build work are separate setup steps. The observer emits event types only; assistant content is printed only as the final application result. Idle completion without an assistant message is explicitly reported.",
                "Working-directory, skills, plugins, discovery, file-hook, and Git controls address the runtime host's filesystem. A subprocess and a session filesystem provider are not general filesystem, network, or tenant sandboxes.",
                `Language API anchors: copilot-sdk@${sdkRevision}/dotnet/src/Types.cs:116,580,2041,2341,2364,3268; CopilotTool.cs:43,143; GitHubTokenProvider.cs:21; Session.cs:375; SessionFsProvider.cs:129.`,
            ],
            sources: [
                plan.target.runtime === "managed"
                    ? "sdk-managed-runtime"
                    : plan.target.runtime === "external"
                      ? "sdk-existing-runtime"
                      : "sdk-inprocess-guide",
                "sdk-tools",
                "sdk-permissions",
                "sdk-hooks",
                "sdk-auth",
                "sdk-providers",
                "sdk-storage-binding",
                "sdk-session-config",
            ],
        };
    },
};

const projectSource = `<!-- Copyright (c) Microsoft Corporation. All rights reserved. -->
<Project Sdk="Microsoft.NET.Sdk">
  <PropertyGroup>
    <OutputType>Exe</OutputType>
    <TargetFramework>net10.0</TargetFramework>
    <ImplicitUsings>enable</ImplicitUsings>
    <Nullable>enable</Nullable>
    <NoWarn>$(NoWarn);GHCP001</NoWarn>
    <CopilotSkipCliDownload>true</CopilotSkipCliDownload>
    <DefaultItemExcludes>$(DefaultItemExcludes);.sdk-source/**</DefaultItemExcludes>
  </PropertyGroup>
  <ItemGroup>
    <Compile Remove=".sdk-source/**" />
    <ProjectReference Include=".sdk-source/copilot-sdk/dotnet/src/GitHub.Copilot.SDK.csproj"
                      AdditionalProperties="CopilotSkipCliDownload=true" />
    <EmbeddedResource Include="config/session.json" LogicalName="Harness.session.json" />
    <EmbeddedResource Include="config/host.json" LogicalName="Harness.host.json" />
    <EmbeddedResource Include="config/tools.json" LogicalName="Harness.tools.json" />
  </ItemGroup>
  <Target Name="RequirePinnedSdk" BeforeTargets="PrepareForBuild"
          Condition="!Exists('.sdk-source/copilot-sdk/dotnet/src/GitHub.Copilot.SDK.csproj')">
    <Error Text="Run bash setup-sdk.sh --run to provision the pinned SDK source." />
  </Target>
</Project>
`;

const setupSource = `#!/usr/bin/env bash
# Copyright (c) Microsoft Corporation. All rights reserved.
set -euo pipefail

usage() {
    cat <<'HELP'
Usage: bash setup-sdk.sh [--run | --help]

Without --run, verify an existing pinned checkout or preview provisioning.
--run creates a NEW .sdk-source/copilot-sdk checkout at the fixed SDK SHA.
Existing files, modified checkouts, and different revisions are never overwritten.
Requires Git and network access to https://github.com/github/copilot-sdk.
This script does not start the runtime or call a model.
HELP
}

run=false
if [ "$#" -gt 1 ]; then usage >&2; exit 2; fi
if [ "$#" -eq 1 ]; then
    case "$1" in
        --run) run=true ;;
        --help|-h) usage; exit 0 ;;
        *) usage >&2; exit 2 ;;
    esac
fi
root=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd -P)
parent="$root/.sdk-source"
destination="$parent/copilot-sdk"
revision="${sdkRevision}"

fail() { printf '%s\\n' "$1" >&2; exit 1; }
command -v git >/dev/null || fail "Git is required."
if [ -L "$parent" ] || [ -L "$destination" ]; then
    fail "Refusing a symlinked SDK source destination."
fi
if [ -e "$destination" ]; then
    [ -d "$destination/.git" ] || fail "Existing SDK destination is not a standalone Git checkout; leaving it untouched."
    repositoryRoot=$(git -C "$destination" rev-parse --show-toplevel)
    repositoryRoot=$(CDPATH= cd -- "$repositoryRoot" && pwd -P)
    [ "$repositoryRoot" = "$destination" ] ||
        fail "SDK destination is not its own repository; leaving it untouched."
    [ "$(git -C "$destination" rev-parse HEAD)" = "$revision" ] ||
        fail "Existing SDK checkout has a different revision; leaving it untouched."
    [ -z "$(git -C "$destination" status --porcelain --untracked-files=normal)" ] ||
        fail "Existing SDK checkout contains changes; leaving it untouched."
    printf 'Verified pinned SDK at %s\\n' "$destination"
    exit 0
fi
if [ "$run" != true ]; then
    printf 'Would provision SDK %s at %s. Pass --run to proceed.\\n' "$revision" "$destination"
    exit 0
fi
mkdir -p "$parent"
mkdir "$destination"
git -C "$destination" init --quiet
git -C "$destination" remote add origin https://github.com/github/copilot-sdk.git
git -C "$destination" fetch --quiet --depth 1 origin "$revision"
git -C "$destination" checkout --quiet --detach "$revision"
[ "$(git -C "$destination" rev-parse HEAD)" = "$revision" ] ||
    fail "SDK revision verification failed; no files were removed."
printf 'Provisioned pinned SDK at %s\\n' "$destination"
`;

const programSource = String.raw`// Copyright (c) Microsoft Corporation. All rights reserved.
using System.Collections;
using System.Text.Json;
using System.Text.Json.Serialization;
using GitHub.Copilot;
using GitHub.Copilot.Rpc;

namespace Harness;

internal sealed class HostSettings
{
    public string Runtime { get; init; } = "";
    public string ServerAddress { get; init; } = "";
    public string CliPath { get; init; } = "";
    public string ClientMode { get; init; } = "";
    public string Identity { get; init; } = "";
    public string Credential { get; init; } = "";
    public string CredentialEnv { get; init; } = "";
    public string Storage { get; init; } = "";
    public string BaseDirectory { get; init; } = "";
    public long IdleTimeoutSeconds { get; init; }
    public bool UserInput { get; init; }
    public bool Observer { get; init; }
    public bool PreToolHook { get; init; }
    public bool PostToolHook { get; init; }
}

internal sealed class ToolDefinition
{
    public required string Name { get; init; }
    public required string Description { get; init; }
    public required JsonElement Parameters { get; init; }
    public bool OverridesBuiltInTool { get; init; }
    public bool IsTerminal { get; init; }
    public bool SkipPermission { get; init; }
}

internal static class Program
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web)
    {
        UnmappedMemberHandling = JsonUnmappedMemberHandling.Disallow,
        AllowOutOfOrderMetadataProperties = true
    };

    private static T ReadConfiguration<T>(string name)
    {
        using var stream = typeof(Program).Assembly.GetManifestResourceStream("Harness." + name)
            ?? throw new InvalidOperationException("Missing embedded config: " + name);
        return JsonSerializer.Deserialize<T>(stream, JsonOptions)
            ?? throw new InvalidOperationException("Empty config: " + name);
    }

    private static CopilotClientOptions ClientOptions(HostSettings settings, SessionConfig config)
    {
        var options = new CopilotClientOptions
        {
            Mode = settings.ClientMode switch
            {
                "empty" => CopilotClientMode.Empty,
                "copilot-cli" => CopilotClientMode.CopilotCli,
                _ => throw new InvalidOperationException("Unknown client mode.")
            },
            Connection = settings.Runtime switch
            {
                "managed" => RuntimeConnection.ForStdio(Host.RuntimeEntrypoint(settings)),
                "external" => RuntimeConnection.ForUri(
                    settings.ServerAddress, Host.RequiredEnvironment("COPILOT_CONNECTION_TOKEN")),
                "inprocess" => RuntimeConnection.ForInProcess(),
                _ => throw new InvalidOperationException("Unknown runtime selection.")
            }
        };
        if (settings.Runtime != "external")
        {
            options.UseLoggedInUser = config.Provider is null && settings.Identity == "developer";
            // __S2S_RUNTIME_ENV_START__
            if (config.Provider is null && settings.Identity == "s2s-installation")
            {
                var token = Host.RequiredEnvironment("COPILOT_GITHUB_TOKEN");
                if (settings.Runtime == "managed")
                {
                    var environment = System.Environment.GetEnvironmentVariables()
                        .Cast<DictionaryEntry>()
                        .ToDictionary(
                            entry => (string)entry.Key,
                            entry => entry.Value?.ToString() ?? "");
                    environment["COPILOT_GITHUB_TOKEN"] = token;
                    options.Environment = environment;
                }
            }
            // __S2S_RUNTIME_ENV_END__
            options.SessionIdleTimeoutSeconds = checked((int)settings.IdleTimeoutSeconds);
            if (settings.Storage == "local")
                options.BaseDirectory = settings.BaseDirectory;
        }
        if (settings.Storage == "virtual")
        {
            options.SessionFs = new SessionFsConfig
            {
                InitialWorkingDirectory = string.IsNullOrEmpty(config.WorkingDirectory)
                    ? "/" : config.WorkingDirectory,
                SessionStatePath = string.IsNullOrEmpty(settings.BaseDirectory)
                    ? "/session-state" : settings.BaseDirectory,
                Conventions = SessionFsSetProviderConventions.Posix
            };
        }
        return options;
    }

    public static async Task<int> Main(string[] args)
    {
        try
        {
            if (args.Length == 1 && args[0] is "--help" or "-h")
            {
                Console.WriteLine("Usage: dotnet run --project HarnessAgent.csproj -- [--check | \"Your prompt\"]");
                return 0;
            }
            var check = args.Length == 1 && args[0] == "--check";
            if (args.Contains("--check") && !check)
                throw new ArgumentException("--check must be used alone; it never sends a prompt.");
            var settings = ReadConfiguration<HostSettings>("host.json");
            var config = ReadConfiguration<SessionConfig>("session.json");
            var tools = ReadConfiguration<ToolDefinition[]>("tools.json");
            var problems = Host.Preflight(settings, config, tools);
            if (problems.Count != 0)
                throw new InvalidOperationException("Preflight failed:\n" + string.Join("\n", problems));
            if (check)
            {
                Console.WriteLine("Local preflight passed. No runtime was started and no model was called.");
                return 0;
            }
            var prompt = string.Join(" ", args);
            if (string.IsNullOrWhiteSpace(prompt))
                throw new ArgumentException("Provide a user prompt, or use --check for local preflight.");

            using var cancellation = new CancellationTokenSource();
            ConsoleCancelEventHandler cancel = (_, evt) =>
            {
                evt.Cancel = true;
                cancellation.Cancel();
            };
            Console.CancelKeyPress += cancel;
            try
            {
                Host.Bind(settings, config, tools, cancellation.Token);
                await using var client = new CopilotClient(ClientOptions(settings, config));
                await client.StartAsync(cancellation.Token);
                await using var session = await client.CreateSessionAsync(config, cancellation.Token);
                AssistantMessageEvent? response;
                try
                {
                    response = await session.SendAndWaitAsync(
                        new MessageOptions { Prompt = prompt },
                        TimeSpan.FromMinutes(5), cancellation.Token);
                }
                catch (Exception error) when (error is OperationCanceledException or TimeoutException)
                {
                    using var abortTimeout = new CancellationTokenSource(TimeSpan.FromSeconds(10));
                    try
                    {
                        await session.AbortAsync(abortTimeout.Token);
                    }
                    catch (Exception abortError)
                    {
                        throw new AggregateException("Turn cancellation and abort failed.", error, abortError);
                    }
                    throw;
                }
                if (response is null)
                {
                    Console.Error.WriteLine(
                        "Turn reached idle without an assistant message; a terminal tool may have completed it.");
                    return 0;
                }
                Console.WriteLine(response.Data.Content);
                return 0;
            }
            finally
            {
                Console.CancelKeyPress -= cancel;
            }
        }
        catch (Exception error)
        {
            Console.Error.WriteLine(error.Message);
            return 1;
        }
    }
}
`;

const hostSource = String.raw`// Copyright (c) Microsoft Corporation. All rights reserved.
using System.Globalization;
using System.Runtime.InteropServices;
using System.Text.Json;
using GitHub.Copilot;
using GitHub.Copilot.Rpc;
using Microsoft.Extensions.AI;

namespace Harness;

internal static class Host
{
    // Register real implementations before starting the client. Preflight rejects missing bindings.
    public static readonly Dictionary<string, Func<AIFunctionArguments, CancellationToken, ValueTask<object?>>>
        ToolHandlers = new(StringComparer.Ordinal);
    public static Func<PreToolUseHookInput, HookInvocation, Task<PreToolUseHookOutput?>>? PreToolHook { get; set; }
    public static Func<PostToolUseHookInput, HookInvocation, Task<PostToolUseHookOutput?>>? PostToolHook { get; set; }
    public static Func<CopilotSession, SessionFsProvider>? SessionFilesystemFactory { get; set; }
    private static readonly SemaphoreSlim ConsoleGate = new(1, 1);

    public static string RequiredEnvironment(string name)
    {
        var value = Environment.GetEnvironmentVariable(name);
        if (string.IsNullOrWhiteSpace(value))
            throw new InvalidOperationException($"Set {name} in the process environment.");
        return value;
    }

    // __GITHUB_TOKEN_PROVIDER_START__
    private static GitHubTokenProviderResult ReadGitHubToken()
    {
        var token = RequiredEnvironment("GITHUB_TOKEN");
        var raw = RequiredEnvironment("GITHUB_TOKEN_EXPIRES_AT");
        if (!long.TryParse(raw, NumberStyles.Integer, CultureInfo.InvariantCulture, out var expiresAt))
            throw new InvalidOperationException(
                "GITHUB_TOKEN_EXPIRES_AT must be an integer UNIX timestamp in seconds.");
        var now = DateTimeOffset.UtcNow.ToUnixTimeSeconds();
        if (expiresAt <= now)
            throw new InvalidOperationException(
                "GITHUB_TOKEN has expired; replace both token and its actual expiration.");
        return GitHubTokenProviderResult.FromToken(new GitHubToken
        {
            AccessToken = token,
            ExpiresIn = expiresAt - now
        });
    }

    private static Task<GitHubTokenProviderResult> AcquireGitHubToken(GitHubTokenProviderArgs _)
        => Task.FromResult(ReadGitHubToken());
    // __GITHUB_TOKEN_PROVIDER_END__

    private static Task<string> AcquireBearerToken(ProviderTokenArgs _)
        // Replace with scoped managed-identity acquisition and caching for production.
        => Task.FromResult(RequiredEnvironment("MODEL_BEARER_TOKEN"));

    private static Task<PermissionDecision> DenyPermission(PermissionRequest _, PermissionInvocation __)
        => Task.FromResult(PermissionDecision.Reject("Denied by the host's default permission policy."));

    private static async Task<UserInputResponse> ReadConsole(
        UserInputRequest request, CancellationToken cancellationToken)
    {
        await ConsoleGate.WaitAsync(cancellationToken);
        try
        {
            var freeform = request.AllowFreeform != false;
            if ((request.Choices?.Count ?? 0) == 0 && !freeform)
                throw new InvalidOperationException("Agent supplied neither choices nor freeform input.");
            Console.Error.WriteLine(request.Question);
            foreach (var choice in request.Choices ?? Array.Empty<string>())
                Console.Error.WriteLine(" - " + choice);
            while (true)
            {
                Console.Error.Write("> ");
                var answer = await Console.In.ReadLineAsync(cancellationToken)
                    ?? throw new EndOfStreamException("Console input closed.");
                var isChoice = request.Choices?.Contains(answer, StringComparer.Ordinal) == true;
                if (isChoice || freeform)
                    return new UserInputResponse { Answer = answer, WasFreeform = !isChoice };
                Console.Error.WriteLine("Enter an exact offered choice.");
            }
        }
        finally
        {
            ConsoleGate.Release();
        }
    }

    private static string FindExecutable(string path)
    {
        if (File.Exists(path))
            return Path.GetFullPath(path);
        if (!Path.IsPathRooted(path) && !path.Contains('/') && !path.Contains('\\'))
        {
            var extensions = OperatingSystem.IsWindows()
                ? (Environment.GetEnvironmentVariable("PATHEXT") ?? ".EXE;.CMD;.BAT").Split(';')
                : new[] { "" };
            foreach (var directory in (Environment.GetEnvironmentVariable("PATH") ?? "").Split(Path.PathSeparator))
            {
                if (string.IsNullOrEmpty(directory)) continue;
                foreach (var extension in extensions.Prepend(""))
                {
                    var candidate = Path.Combine(directory, path + extension);
                    if (File.Exists(candidate))
                        return Path.GetFullPath(candidate);
                }
            }
        }
        throw new FileNotFoundException("Runtime executable was not found. Provision the selected runtime.");
    }

    public static string RuntimeEntrypoint(HostSettings settings)
    {
        var path = settings.Runtime == "inprocess" || string.IsNullOrWhiteSpace(settings.CliPath)
            ? RequiredEnvironment("COPILOT_CLI_PATH") : settings.CliPath;
        path = settings.Runtime == "inprocess" ? Path.GetFullPath(path) : FindExecutable(path);
        if (!File.Exists(path))
            throw new FileNotFoundException("Runtime entrypoint must be an existing regular file.");
        if (settings.Runtime == "managed")
        {
            if (path.EndsWith(".js", StringComparison.OrdinalIgnoreCase))
                _ = FindExecutable("node");
            return path;
        }
        var (library, platform) = OperatingSystem.IsWindows()
            ? ("copilot_runtime.dll", "win32")
            : OperatingSystem.IsMacOS()
                ? ("libcopilot_runtime.dylib", "darwin")
                : OperatingSystem.IsLinux()
                    ? ("libcopilot_runtime.so", "linux")
                    : throw new PlatformNotSupportedException("Unsupported native runtime operating system.");
        var arch = RuntimeInformation.ProcessArchitecture switch
        {
            Architecture.X64 => "x64",
            Architecture.Arm64 => "arm64",
            _ => throw new PlatformNotSupportedException("Native hosting needs a matching x64 or arm64 bundle.")
        };
        var directory = Path.GetDirectoryName(path)!;
        var candidates = new List<string>
        {
            Path.Combine(directory, library),
            Path.Combine(directory, "runtime.node"),
            Path.Combine(directory, "prebuilds", platform + "-" + arch, "runtime.node")
        };
        if (platform == "linux")
            candidates.Add(Path.Combine(directory, "prebuilds", "linuxmusl-" + arch, "runtime.node"));
        if (!candidates.Any(candidate => File.Exists(candidate) && new FileInfo(candidate).Length > 0))
            throw new FileNotFoundException(
                "Native library is missing beside COPILOT_CLI_PATH; provision the matching OS/architecture/libc package.");
        return path;
    }

    public static List<string> Preflight(HostSettings settings, SessionConfig config, ToolDefinition[] tools)
    {
        var problems = new List<string>();
        void Check(Action action)
        {
            try { action(); }
            catch (Exception error) { problems.Add("- " + error.Message); }
        }
        if (settings.ClientMode is not ("empty" or "copilot-cli"))
            problems.Add("- Unknown client mode.");
        if (settings.Storage is not ("local" or "virtual"))
            problems.Add("- Unknown storage selection.");
        if (settings.Storage == "local" && string.IsNullOrWhiteSpace(settings.BaseDirectory))
            problems.Add("- Local storage requires baseDirectory.");
        if (settings.IdleTimeoutSeconds < 0
            || (settings.Runtime != "external" && settings.IdleTimeoutSeconds > int.MaxValue))
            problems.Add("- Client idleTimeoutSeconds must fit a nonnegative Int32; external server values must be nonnegative.");
        if (settings.Runtime != "managed" && settings.CliPath.Length != 0)
            problems.Add("- cliPath is only valid with a managed child.");
        switch (settings.Runtime)
        {
            case "external":
                if (!Uri.TryCreate("tcp://" + settings.ServerAddress, UriKind.Absolute, out var endpoint)
                    || endpoint.Host.Length == 0 || endpoint.Port is < 1 or > 65535
                    || endpoint.UserInfo.Length != 0 || endpoint.Query.Length != 0
                    || endpoint.Fragment.Length != 0 || endpoint.AbsolutePath is not ("" or "/"))
                    problems.Add("- External serverAddress must be a canonical host:port.");
                Check(() => RequiredEnvironment("COPILOT_CONNECTION_TOKEN"));
                break;
            case "managed":
            case "inprocess":
                Check(() => RuntimeEntrypoint(settings));
                break;
            default:
                problems.Add("- Unknown runtime selection.");
                break;
        }
        if (string.IsNullOrWhiteSpace(config.Model))
            Check(() => config.Model = RequiredEnvironment("COPILOT_MODEL").Trim());
        if (config.Provider is null)
        {
            // __COPILOT_IDENTITY_PREFLIGHT_START__
            if (settings.Identity == "host-token")
                Check(() => ReadGitHubToken());
            else if (settings.Identity != "developer")
                problems.Add("- Unknown Copilot identity selection.");
            // __COPILOT_IDENTITY_PREFLIGHT_END__
        }
        else if (settings.Credential == "api-key")
            Check(() => RequiredEnvironment(settings.CredentialEnv));
        else if (settings.Credential == "bearer-callback")
            Check(() => RequiredEnvironment("MODEL_BEARER_TOKEN"));
        else
            problems.Add("- Unknown BYOK credential selection.");
        foreach (var tool in tools)
        {
            if (!ToolHandlers.ContainsKey(tool.Name))
                problems.Add($"- Implement and register ToolHandlers[\"{tool.Name}\"] in Host.cs.");
            if (tool.Parameters.ValueKind != JsonValueKind.Object
                || !tool.Parameters.TryGetProperty("type", out var type)
                || type.ValueKind != JsonValueKind.String || type.GetString() != "object")
                problems.Add($"- Tool {tool.Name} requires its original object JSON schema.");
            if (tool.SkipPermission)
                problems.Add($"- Tool {tool.Name} must not skip the host permission policy.");
        }
        if (settings.PreToolHook && PreToolHook is null)
            problems.Add("- Implement and register PreToolHook in Host.cs.");
        if (settings.PostToolHook && PostToolHook is null)
            problems.Add("- Implement and register PostToolHook in Host.cs.");
        if (settings.Storage == "virtual" && SessionFilesystemFactory is null)
            problems.Add("- Implement and register SessionFilesystemFactory in Host.cs.");
        return problems;
    }

    public static void Bind(
        HostSettings settings, SessionConfig config, ToolDefinition[] tools, CancellationToken cancellationToken)
    {
        config.OnPermissionRequest = DenyPermission;
        if (settings.UserInput)
            config.OnUserInputRequest = (request, _) => ReadConsole(request, cancellationToken);
        if (settings.Observer)
            config.OnEvent = evt => Console.Error.WriteLine("event=" + evt.Type);
        // __COPILOT_IDENTITY_BINDING_START__
        if (config.Provider is null && settings.Identity == "host-token")
            config.GitHubTokenProvider = AcquireGitHubToken;
        // __COPILOT_IDENTITY_BINDING_END__
        if (config.Provider is not null)
        {
            if (settings.Credential == "bearer-callback")
                config.Provider.BearerTokenProvider = AcquireBearerToken;
            else
                config.Provider.ApiKey = RequiredEnvironment(settings.CredentialEnv);
        }
        config.Tools = tools.Select(tool => (AIFunctionDeclaration)new HostTool(tool)).ToList();
        if (settings.PreToolHook || settings.PostToolHook)
        {
            config.Hooks = new SessionHooks();
            if (settings.PreToolHook)
                config.Hooks.OnPreToolUse = (input, invocation) => PreToolHook is { } handler
                    ? handler(input, invocation)
                    : throw new NotImplementedException("Selected pre-tool hook is not implemented.");
            if (settings.PostToolHook)
                config.Hooks.OnPostToolUse = (input, invocation) => PostToolHook is { } handler
                    ? handler(input, invocation)
                    : throw new NotImplementedException("Selected post-tool hook is not implemented.");
        }
        if (settings.Storage == "virtual")
            config.CreateSessionFsProvider = session => SessionFilesystemFactory is { } factory
                ? factory(session)
                : throw new NotImplementedException("Selected session filesystem provider is not implemented.");
    }

    private sealed class HostTool : AIFunction
    {
        private readonly AIFunction metadata;
        private readonly JsonElement schema;

        public HostTool(ToolDefinition definition)
        {
            schema = definition.Parameters.Clone();
            metadata = CopilotTool.DefineTool(
                (Func<object?>)(() => throw new NotImplementedException("Metadata-only tool delegate must not execute.")),
                toolOptions: new CopilotToolOptions
                {
                    OverridesBuiltInTool = definition.OverridesBuiltInTool,
                    IsTerminal = definition.IsTerminal,
                    SkipPermission = false
                },
                factoryOptions: new AIFunctionFactoryOptions
                {
                    Name = definition.Name,
                    Description = definition.Description
                });
        }

        public override string Name => metadata.Name;
        public override string Description => metadata.Description;
        public override JsonElement JsonSchema => schema;
        public override IReadOnlyDictionary<string, object?> AdditionalProperties => metadata.AdditionalProperties;

        protected override ValueTask<object?> InvokeCoreAsync(
            AIFunctionArguments arguments, CancellationToken cancellationToken)
        {
            if (!ToolHandlers.TryGetValue(Name, out var handler))
                throw new NotImplementedException($"Host tool {Name} is not implemented.");
            return handler(arguments, cancellationToken);
        }
    }
}
`;
