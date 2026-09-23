// Copyright (c) Microsoft Corporation. All rights reserved.
import type { HarnessPlan } from "../plan";
import { runtimeEndpoint } from "../target";
import { commonRequirements, sessionData } from "./common";
import { goCsharpToolData } from "./go-csharp-data";
import type { BootstrapBlocker, LanguageAdapter } from "./types";

const sdkRevision = "f45c46fd1812f8bed5b4cbc250f47177c83068f0";
const json = (value: unknown) => JSON.stringify(value, null, 2) + "\n";
const shellQuote = (value: string) => `'${value.replace(/'/g, "'\\''")}'`;

function renderGoSource(source: string, plan: HarnessPlan): string {
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
            ? `		token, err := requiredEnv("COPILOT_GITHUB_TOKEN")
		if err != nil {
			return nil, err
		}
		options.Env = append(os.Environ(), "COPILOT_GITHUB_TOKEN="+token)
`
            : plan.target.runtime === "inprocess"
              ? `		if _, err := requiredEnv("COPILOT_GITHUB_TOKEN"); err != nil {
			return nil, err
		}
`
              : "";
    const identityPreflight =
        plan.target.runtime === "external"
            ? `		switch settings.Identity {
		case "s2s-installation":
		default:
			add(errors.New("unknown Copilot identity selection"))
		}
`
            : `		switch settings.Identity {
		case "s2s-installation":
			_, err := requiredEnv("COPILOT_GITHUB_TOKEN")
			add(err)
		default:
			add(errors.New("unknown Copilot identity selection"))
		}
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
    return source.includes("__GITHUB_TOKEN_PROVIDER_START__") ? rendered.replace('\t"time"\n', "") : rendered;
}

function blockers(plan: HarnessPlan): BootstrapBlocker[] {
    const result: BootstrapBlocker[] = [];
    if (plan.target.runtime !== "managed" && plan.target.cliPath !== "")
        result.push({
            id: "go-cli-path",
            title: "CLI path is a managed-process setting",
            detail: "Clear cliPath. Native hosting uses the host's COPILOT_CLI_PATH environment variable; an existing service owns its executable.",
            fields: ["target.cliPath", "target.runtime"],
            sources: ["sdk-inprocess-guide", "sdk-existing-runtime"],
        });
    for (const [index, server] of plan.mcpServers.entries())
        for (const [toolIndex, tool] of server.tools.entries())
            if (tool.wireName !== `${server.name}-${tool.name}`)
                result.push({
                    id: `go-mcp-name-${index}-${toolIndex}`,
                    title: "MCP wire names cannot be aliased",
                    detail: `The SDK exposes ${server.name}-${tool.name}, not ${tool.wireName}. Change the planned wire name and any agent/root references.`,
                    fields: [`mcpServers.${index}.tools.${toolIndex}.wireName`],
                    sources: ["sdk-mcp", "sdk-filter-names"],
                });
    return result;
}

export const goAdapter: LanguageAdapter = {
    language: "go",
    label: "Go",
    check: blockers,
    generate(plan) {
        const unsupported = blockers(plan);
        if (unsupported.length) throw new Error(unsupported.map((item) => item.detail).join("\n"));
        const endpoint = plan.target.runtime === "external" ? runtimeEndpoint(plan.target) : undefined;
        const run = `go run${plan.target.runtime === "inprocess" ? " -tags copilot_inprocess" : ""} .`;
        const requirements = commonRequirements(plan, "host.go");
        if (plan.model.provider === "copilot" && plan.identity === "host-token")
            requirements.push({
                id: "go-token-expiry",
                environmentVariable: "GITHUB_TOKEN_EXPIRES_AT",
                title: "Set GITHUB_TOKEN_EXPIRES_AT",
                detail: "Supply the token's actual expiration as UNIX seconds alongside GITHUB_TOKEN. Every acquisition recomputes the remaining lifetime and rejects expired or malformed values.",
                file: "host.go",
                kind: "environment",
            });
        if (endpoint)
            requirements.push({
                id: "go-connection-token",
                environmentVariable: "COPILOT_CONNECTION_TOKEN",
                title: "Set COPILOT_CONNECTION_TOKEN on the client and server",
                detail: "Use the same non-empty connection secret for the separately operated TCP server. This is not a GitHub credential; do not put it in the endpoint or JSON.",
                file: "host.go",
                kind: "environment",
            });
        else
            requirements.push({
                id: "go-runtime-entrypoint",
                environmentVariable: "COPILOT_CLI_PATH",
                title: "Provision the compatible runtime entrypoint",
                detail: "This source-pinned starter does not bundle a runtime. Set COPILOT_CLI_PATH, or use the managed cliPath selected in the plan. Native hosting needs the matching native library and copilot_inprocess build tag.",
                file: "host.go",
                kind: "runtime",
            });
        return {
            files: [
                {
                    path: "go.mod",
                    language: "text",
                    content:
                        "// Copyright (c) Microsoft Corporation. All rights reserved.\nmodule example.com/copilot-harness\n\ngo 1.24.0\n",
                },
                { path: "main.go", language: "go", content: renderGoSource(mainSource, plan) },
                { path: "host.go", language: "go", content: renderGoSource(hostSource, plan) },
                {
                    path: "native_enabled.go",
                    language: "go",
                    content:
                        "//go:build copilot_inprocess\n\n// Copyright (c) Microsoft Corporation. All rights reserved.\npackage main\n\nconst nativeEnabled = true\n",
                },
                {
                    path: "native_disabled.go",
                    language: "go",
                    content:
                        "//go:build !copilot_inprocess\n\n// Copyright (c) Microsoft Corporation. All rights reserved.\npackage main\n\nconst nativeEnabled = false\n",
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
                        permissionMode: plan.policy.permissionMode,
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
                install: [`go get github.com/github/copilot-sdk/go@${sdkRevision}`],
                check: `${run} --check`,
                run: `${run} -- "Describe the task you want the agent to perform."`,
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
                `Requires Go 1.24+. The SDK source pin is ${sdkRevision}; the nearest published Go tag does not establish compatibility. The install command records the resolved pseudo-version and checksums in go.mod/go.sum.`,
                "config/session.json preserves the selected SDK data. config/tools.json preserves arbitrary object schemas, override flags, and terminal flags. Go materializes the interface-typed MCP map explicitly, then attaches callbacks before creating the session. Configuration is embedded at build time; rebuild after editing it.",
                plan.policy.permissionMode === "host"
                    ? "Register PermissionPolicy, real tool handlers, selected pre/post hooks, and a session filesystem factory in host.go. Preflight and normal startup reject missing registrations."
                    : "The generated host explicitly binds copilot.PermissionHandler.ApproveAll. It approves ordinary requests once; managed policy, content exclusion, downstream authorization, tool validity, and sandbox enablement still apply, while enabled sandbox bypass can also be approved.",
                plan.model.provider === "copilot" && plan.identity === "s2s-installation"
                    ? plan.target.runtime === "external"
                        ? "GitHub App S2S identity is configured on the separately operated runtime with COPILOT_GITHUB_TOKEN and --no-auto-login. The connecting Go client neither reads nor injects that token and does not install a per-session token callback."
                        : plan.target.runtime === "inprocess"
                          ? "GitHub App S2S identity requires COPILOT_GITHUB_TOKEN in the host environment before InProcessConnection loads the runtime. Logged-in-user fallback is false and no per-session token callback is generated."
                          : "GitHub App S2S identity copies the trusted host's COPILOT_GITHUB_TOKEN into ClientOptions.Env for the managed child. Logged-in-user fallback is false and no per-session token callback is generated."
                    : "Host-token identity uses per-session GitHubTokenProvider, GITHUB_TOKEN, and GITHUB_TOKEN_EXPIRES_AT. Expiration must be the original absolute UNIX timestamp, never a freshly invented lifetime. Replace the environment acquisition adapter with your identity service when appropriate.",
                "BYOK API keys use the selected credentialEnv; bearer callbacks acquire MODEL_BEARER_TOKEN on every request. Replace that environment adapter with scoped managed-identity acquisition and caching for production. GitHub identity settings apply only when the selected model provider is Copilot.",
                "The --check path only parses embedded configuration, checks local files/environment, and reports missing host code. It never constructs a client, loads the native runtime, connects to the service, or sends a model request. Go compilation/dependency resolution is separate from that preflight.",
                "Existing-runtime identity and process lifecycle belong to the server. The client never sets logged-in-user or client GitHub-token options for URI connections. Apply the selected local base directory and nonzero idle timeout with the separately run server command; zero leaves the runtime's idle default unchanged. The sample command runs on the server host and is for loopback development; secure remote routing or a tunnel separately. A connection token does not add TLS or tenant authorization.",
                "Native hosting uses InProcessConnection{} and -tags copilot_inprocess on a supported OS/architecture. Set COPILOT_CLI_PATH to a compatible package entrypoint with copilot_runtime.dll, libcopilot_runtime.dylib, libcopilot_runtime.so, or the matching runtime.node. Per-client environment/cwd/telemetry overrides are not used. One native runtime version may be loaded per process.",
                "Session working directories, skills, plugins, discovered configuration, file hooks, and Git context refer to the runtime host's filesystem. A subprocess, an SDK mode, permission callbacks, and session storage are not an OS or tenant sandbox.",
                "Virtual storage requires copilot.SessionFSProvider: ReadFile, WriteFile, AppendFile, Exists, Stat, MakeDirectory, ReadDirectory, ReadDirectoryWithTypes, Remove, and Rename. The factory is session-scoped; POSIX virtual paths use the selected workspace (or /) and baseDirectory (or /session-state). SQLite is not advertised; implement SessionFSSqliteProvider and SessionFSSqliteTransactionProvider before opting into SQL capabilities.",
                "The observer logs event types only, never prompts, tool arguments/results, credentials, or assistant content. The final assistant content is printed once as the application result; an idle turn without an assistant message is explicitly reported, including terminal-tool completion.",
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

const mainSource = String.raw`// Copyright (c) Microsoft Corporation. All rights reserved.
package main

import (
	"bytes"
	"context"
	"embed"
	"encoding/json"
	"errors"
	"flag"
	"fmt"
	"io"
	"os"
	"os/signal"
	"strings"
	"time"

	copilot "github.com/github/copilot-sdk/go"
	"github.com/github/copilot-sdk/go/rpc"
)

//go:embed config/session.json config/host.json config/tools.json
var configuration embed.FS

type HostSettings struct {
	Runtime, ServerAddress, CliPath, ClientMode, Identity string
	Credential, CredentialEnv, PermissionMode             string
	Storage, BaseDirectory                                string
	IdleTimeoutSeconds                                    int64
	UserInput, Observer, PreToolHook, PostToolHook        bool
}

func decodeJSON(data []byte, value any) error {
	decoder := json.NewDecoder(bytes.NewReader(data))
	decoder.DisallowUnknownFields()
	decoder.UseNumber()
	if err := decoder.Decode(value); err != nil {
		return err
	}
	var extra any
	if err := decoder.Decode(&extra); err != io.EOF {
		return errors.New("expected exactly one JSON value")
	}
	return nil
}

func readConfig(path string, value any) error {
	data, err := configuration.ReadFile(path)
	if err != nil {
		return err
	}
	if err := decodeJSON(data, value); err != nil {
		return fmt.Errorf("%s: %w", path, err)
	}
	return nil
}

func loadSession() (*copilot.SessionConfig, error) {
	var data map[string]json.RawMessage
	if err := readConfig("config/session.json", &data); err != nil {
		return nil, err
	}
	serversJSON := data["mcpServers"]
	delete(data, "mcpServers")
	encoded, err := json.Marshal(data)
	if err != nil {
		return nil, err
	}
	var config copilot.SessionConfig
	if err := decodeJSON(encoded, &config); err != nil {
		return nil, fmt.Errorf("session config: %w", err)
	}
	var servers map[string]struct {
		Type, URL string
		Tools     []string
	}
	if err := decodeJSON(serversJSON, &servers); err != nil {
		return nil, fmt.Errorf("MCP config: %w", err)
	}
	config.MCPServers = make(map[string]copilot.MCPServerConfig, len(servers))
	for name, server := range servers {
		if server.Type != "http" {
			return nil, fmt.Errorf("MCP server %s: this generated plan requires type http", name)
		}
		config.MCPServers[name] = copilot.MCPHTTPServerConfig{URL: server.URL, Tools: server.Tools}
	}
	return &config, nil
}

func clientOptions(settings HostSettings, config *copilot.SessionConfig) (*copilot.ClientOptions, error) {
	options := &copilot.ClientOptions{}
	switch settings.ClientMode {
	case "empty":
		options.Mode = copilot.ModeEmpty
	case "copilot-cli":
		options.Mode = copilot.ModeCopilotCli
	default:
		return nil, errors.New("unknown client mode")
	}
	switch settings.Runtime {
	case "external":
		token, err := requiredEnv("COPILOT_CONNECTION_TOKEN")
		if err != nil {
			return nil, err
		}
		options.Connection = copilot.URIConnection{
			URL: settings.ServerAddress, ConnectionToken: token,
		}
	case "managed", "inprocess":
		if settings.Runtime == "inprocess" {
			options.Connection = copilot.InProcessConnection{}
		} else {
			path, err := runtimeEntrypoint(settings)
			if err != nil {
				return nil, err
			}
			options.Connection = copilot.StdioConnection{Path: path}
		}
		options.UseLoggedInUser = copilot.Bool(config.Provider == nil && settings.Identity == "developer")
		// __S2S_RUNTIME_ENV_START__
		if config.Provider == nil && settings.Identity == "s2s-installation" {
			token, err := requiredEnv("COPILOT_GITHUB_TOKEN")
			if err != nil {
				return nil, err
			}
			if settings.Runtime == "managed" {
				options.Env = append(os.Environ(), "COPILOT_GITHUB_TOKEN="+token)
			}
		}
		// __S2S_RUNTIME_ENV_END__
		options.SessionIdleTimeoutSeconds = int(settings.IdleTimeoutSeconds)
		if settings.Storage == "local" {
			options.BaseDirectory = settings.BaseDirectory
		}
	default:
		return nil, errors.New("unknown runtime selection")
	}
	if settings.Storage == "virtual" {
		cwd, state := config.WorkingDirectory, settings.BaseDirectory
		if cwd == "" {
			cwd = "/"
		}
		if state == "" {
			state = "/session-state"
		}
		options.SessionFS = &copilot.SessionFSConfig{
			InitialWorkingDirectory: cwd, SessionStatePath: state,
			Conventions: rpc.SessionFSSetProviderConventionsPosix,
		}
	}
	return options, nil
}

func main() {
	if err := run(); err != nil {
		fmt.Fprintln(os.Stderr, err)
		os.Exit(1)
	}
}

func run() (result error) {
	flags := flag.NewFlagSet("agent", flag.ContinueOnError)
	check := flags.Bool("check", false, "local preflight only; never start a runtime or model")
	timeout := flags.Duration("timeout", 5*time.Minute, "turn timeout")
	if err := flags.Parse(os.Args[1:]); err != nil {
		if errors.Is(err, flag.ErrHelp) {
			return nil
		}
		return err
	}
	if *timeout <= 0 {
		return errors.New("--timeout must be positive")
	}
	var settings HostSettings
	var tools []copilot.Tool
	if err := readConfig("config/host.json", &settings); err != nil {
		return err
	}
	if err := readConfig("config/tools.json", &tools); err != nil {
		return err
	}
	config, err := loadSession()
	if err != nil {
		return err
	}
	if problems := preflight(settings, config, tools); len(problems) > 0 {
		return fmt.Errorf("preflight failed:\n%s", strings.Join(problems, "\n"))
	}
	if *check {
		fmt.Println("Local preflight passed. No runtime was started and no model was called.")
		return nil
	}
	prompt := strings.Join(flags.Args(), " ")
	if strings.TrimSpace(prompt) == "" {
		return errors.New("usage: go run . [--check] [--timeout 5m] -- \"Your prompt\"")
	}
	if err := bindHost(settings, config, tools); err != nil {
		return err
	}
	options, err := clientOptions(settings, config)
	if err != nil {
		return err
	}
	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt)
	defer stop()
	ctx, cancel := context.WithTimeout(ctx, *timeout)
	defer cancel()
	client := copilot.NewClient(options)
	defer func() { result = errors.Join(result, client.Stop()) }()
	if err := client.Start(ctx); err != nil {
		return err
	}
	session, err := client.CreateSession(ctx, config)
	if err != nil {
		return err
	}
	defer func() { result = errors.Join(result, session.Disconnect()) }()
	response, err := session.SendAndWait(ctx, copilot.MessageOptions{Prompt: prompt})
	if err != nil {
		if ctx.Err() != nil {
			abortCtx, abortCancel := context.WithTimeout(context.Background(), 10*time.Second)
			defer abortCancel()
			err = errors.Join(err, session.Abort(abortCtx))
		}
		return err
	}
	if response == nil {
		fmt.Fprintln(os.Stderr, "Turn reached idle without an assistant message; a terminal tool may have completed it.")
		return nil
	}
	message, ok := response.Data.(*copilot.AssistantMessageData)
	if !ok || message == nil {
		return errors.New("unexpected final assistant event")
	}
	fmt.Println(message.Content)
	return nil
}
`;

const hostSource = String.raw`// Copyright (c) Microsoft Corporation. All rights reserved.
package main

import (
	"bufio"
	"errors"
	"fmt"
	"io"
	"net"
	"os"
	"os/exec"
	"path/filepath"
	"runtime"
	"strconv"
	"strings"
	"sync"
	"time"

	copilot "github.com/github/copilot-sdk/go"
	"github.com/github/copilot-sdk/go/rpc"
)

// Register implementations here before starting the client. Missing bindings fail preflight.
var ToolHandlers = map[string]copilot.ToolHandler{}
var PermissionPolicy func(copilot.PermissionRequest, copilot.PermissionInvocation) (rpc.PermissionDecision, error)
var PreToolHook copilot.PreToolUseHandler
var PostToolHook copilot.PostToolUseHandler
var SessionFilesystemFactory func(*copilot.Session) copilot.SessionFSProvider
var ProviderEndpoint string

func requiredProviderEndpoint() (string, error) {
	value := strings.TrimSpace(ProviderEndpoint)
	if value == "" {
		return "", errors.New("provide the provider endpoint string in host.go ProviderEndpoint")
	}
	return value, nil
}

func requiredEnv(name string) (string, error) {
	value := os.Getenv(name)
	if strings.TrimSpace(value) == "" {
		return "", fmt.Errorf("set %s in the process environment", name)
	}
	return value, nil
}

// __GITHUB_TOKEN_PROVIDER_START__
func acquireGitHubToken(_ copilot.GitHubTokenProviderArgs) (*copilot.GitHubTokenProviderResult, error) {
	token, err := requiredEnv("GITHUB_TOKEN")
	if err != nil {
		return nil, err
	}
	raw, err := requiredEnv("GITHUB_TOKEN_EXPIRES_AT")
	if err != nil {
		return nil, err
	}
	expiresAt, err := strconv.ParseInt(raw, 10, 64)
	if err != nil {
		return nil, errors.New("GITHUB_TOKEN_EXPIRES_AT must be an integer UNIX timestamp in seconds")
	}
	now := time.Now().Unix()
	if expiresAt <= now {
		return nil, errors.New("GITHUB_TOKEN has expired; replace both token and its actual expiration")
	}
	return copilot.GitHubTokenResult(&copilot.GitHubToken{
		AccessToken: token, ExpiresIn: expiresAt - now,
	}), nil
}
// __GITHUB_TOKEN_PROVIDER_END__

func acquireBearerToken(_ copilot.ProviderTokenArgs) (string, error) {
	// Replace with scoped managed-identity acquisition and caching when selected for production.
	return requiredEnv("MODEL_BEARER_TOKEN")
}

var consoleLock sync.Mutex
var consoleInput = bufio.NewScanner(os.Stdin)

func consoleUserInput(request copilot.UserInputRequest, _ copilot.UserInputInvocation) (copilot.UserInputResponse, error) {
	consoleLock.Lock()
	defer consoleLock.Unlock()
	freeform := request.AllowFreeform == nil || *request.AllowFreeform
	if len(request.Choices) == 0 && !freeform {
		return copilot.UserInputResponse{}, errors.New("agent supplied neither choices nor freeform input")
	}
	fmt.Fprintln(os.Stderr, request.Question)
	for _, choice := range request.Choices {
		fmt.Fprintf(os.Stderr, " - %s\n", choice)
	}
	for {
		fmt.Fprint(os.Stderr, "> ")
		if !consoleInput.Scan() {
			if err := consoleInput.Err(); err != nil {
				return copilot.UserInputResponse{}, fmt.Errorf("console input: %w", err)
			}
			return copilot.UserInputResponse{}, io.EOF
		}
		answer := consoleInput.Text()
		for _, choice := range request.Choices {
			if answer == choice {
				return copilot.UserInputResponse{Answer: answer, WasFreeform: false}, nil
			}
		}
		if freeform {
			return copilot.UserInputResponse{Answer: answer, WasFreeform: true}, nil
		}
		fmt.Fprintln(os.Stderr, "Enter an exact offered choice.")
	}
}

func runtimeEntrypoint(settings HostSettings) (string, error) {
	path := settings.CliPath
	if settings.Runtime == "inprocess" || strings.TrimSpace(path) == "" {
		path = os.Getenv("COPILOT_CLI_PATH")
	}
	if strings.TrimSpace(path) == "" {
		return "", errors.New("provision a compatible runtime and set COPILOT_CLI_PATH (or the managed cliPath)")
	}
	var err error
	if settings.Runtime == "managed" && !strings.HasSuffix(path, ".js") {
		path, err = exec.LookPath(path)
	} else {
		path, err = filepath.Abs(path)
	}
	if err != nil {
		return "", fmt.Errorf("runtime entrypoint: %w", err)
	}
	info, err := os.Stat(path)
	if err != nil {
		return "", fmt.Errorf("runtime entrypoint: %w", err)
	}
	if !info.Mode().IsRegular() {
		return "", errors.New("runtime entrypoint must be a regular file")
	}
	if settings.Runtime == "managed" && strings.HasSuffix(path, ".js") {
		if _, err := exec.LookPath("node"); err != nil {
			return "", errors.New("the selected JavaScript runtime entrypoint requires node on PATH")
		}
	}
	if settings.Runtime == "inprocess" {
		if !nativeEnabled {
			return "", errors.New("native hosting requires go run/build -tags copilot_inprocess")
		}
		library, platform := "", ""
		switch runtime.GOOS {
		case "darwin":
			library, platform = "libcopilot_runtime.dylib", "darwin"
		case "linux":
			library, platform = "libcopilot_runtime.so", "linux"
		case "windows":
			library, platform = "copilot_runtime.dll", "win32"
		default:
			return "", errors.New("unsupported native runtime operating system")
		}
		arch := map[string]string{"amd64": "x64", "arm64": "arm64"}[runtime.GOARCH]
		if arch == "" {
			return "", errors.New("native runtime requires a matching x64 or arm64 bundle")
		}
		directory := filepath.Dir(path)
		candidates := []string{
			filepath.Join(directory, library), filepath.Join(directory, "runtime.node"),
			filepath.Join(directory, "prebuilds", platform+"-"+arch, "runtime.node"),
		}
		if platform == "linux" {
			candidates = append(candidates, filepath.Join(directory, "prebuilds", "linuxmusl-"+arch, "runtime.node"))
		}
		for _, candidate := range candidates {
			if info, err := os.Stat(candidate); err == nil && info.Mode().IsRegular() && info.Size() > 0 {
				return path, nil
			}
		}
		return "", errors.New("native library is missing beside COPILOT_CLI_PATH; provision the matching OS/architecture/libc runtime package")
	}
	return path, nil
}

func preflight(settings HostSettings, config *copilot.SessionConfig, tools []copilot.Tool) []string {
	var problems []string
	add := func(err error) {
		if err != nil {
			problems = append(problems, "- "+err.Error())
		}
	}
	if settings.ClientMode != "empty" && settings.ClientMode != "copilot-cli" {
		add(errors.New("unknown client mode"))
	}
	if settings.Storage != "local" && settings.Storage != "virtual" {
		add(errors.New("unknown storage selection"))
	}
	if settings.PermissionMode == "host" && PermissionPolicy == nil {
		add(errors.New("implement and register PermissionPolicy in host.go"))
	} else if settings.PermissionMode != "host" && settings.PermissionMode != "allow-all" {
		add(errors.New("unknown permission mode"))
	}
	if settings.Storage == "local" && strings.TrimSpace(settings.BaseDirectory) == "" {
		add(errors.New("local storage requires baseDirectory"))
	}
	if settings.IdleTimeoutSeconds < 0 || int64(int(settings.IdleTimeoutSeconds)) != settings.IdleTimeoutSeconds {
		add(errors.New("idleTimeoutSeconds is out of range for this Go target"))
	}
	if settings.Runtime != "managed" && settings.CliPath != "" {
		add(errors.New("cliPath is only valid with a managed child"))
	}
	switch settings.Runtime {
	case "external":
		host, port, err := net.SplitHostPort(settings.ServerAddress)
		if err != nil || host == "" {
			add(errors.New("external serverAddress must be a canonical host:port"))
		}
		number, err := strconv.Atoi(port)
		if err != nil || number < 1 || number > 65535 {
			add(errors.New("external server port is invalid"))
		}
		_, err = requiredEnv("COPILOT_CONNECTION_TOKEN")
		add(err)
	case "managed", "inprocess":
		_, err := runtimeEntrypoint(settings)
		add(err)
	default:
		add(errors.New("unknown runtime selection"))
	}
	if strings.TrimSpace(config.Model) == "" {
		model, err := requiredEnv("COPILOT_MODEL")
		add(err)
		config.Model = strings.TrimSpace(model)
	}
	if config.Provider == nil {
		// __COPILOT_IDENTITY_PREFLIGHT_START__
		switch settings.Identity {
		case "host-token":
			_, err := acquireGitHubToken(copilot.GitHubTokenProviderArgs{})
			add(err)
		case "developer":
		default:
			add(errors.New("unknown Copilot identity selection"))
		}
		// __COPILOT_IDENTITY_PREFLIGHT_END__
	} else {
		if strings.TrimSpace(config.Provider.BaseURL) == "" {
			_, err := requiredProviderEndpoint()
			add(err)
		}
		switch settings.Credential {
		case "api-key":
			_, err := requiredEnv(settings.CredentialEnv)
			add(err)
		case "bearer-callback":
			_, err := acquireBearerToken(copilot.ProviderTokenArgs{})
			add(err)
		default:
			add(errors.New("unknown BYOK credential selection"))
		}
	}
	for _, tool := range tools {
		if ToolHandlers[tool.Name] == nil {
			add(fmt.Errorf("implement and register ToolHandlers[%q] in host.go", tool.Name))
		}
		if tool.Parameters == nil || tool.Parameters["type"] != "object" {
			add(fmt.Errorf("tool %s requires its original object JSON schema", tool.Name))
		}
		if tool.SkipPermission {
			add(fmt.Errorf("tool %s must not skip the host permission policy", tool.Name))
		}
	}
	if settings.PreToolHook && PreToolHook == nil {
		add(errors.New("implement and register PreToolHook in host.go"))
	}
	if settings.PostToolHook && PostToolHook == nil {
		add(errors.New("implement and register PostToolHook in host.go"))
	}
	if settings.Storage == "virtual" && SessionFilesystemFactory == nil {
		add(errors.New("implement and register SessionFilesystemFactory in host.go"))
	}
	return problems
}

func bindHost(settings HostSettings, config *copilot.SessionConfig, tools []copilot.Tool) error {
	if settings.PermissionMode == "host" {
		if PermissionPolicy == nil {
			return errors.New("selected host permission policy is not implemented")
		}
		config.OnPermissionRequest = PermissionPolicy
	} else {
		config.OnPermissionRequest = copilot.PermissionHandler.ApproveAll
	}
	if settings.UserInput {
		config.OnUserInputRequest = consoleUserInput
	}
	if settings.Observer {
		config.OnEvent = func(event copilot.SessionEvent) {
			fmt.Fprintf(os.Stderr, "event=%s\n", event.Type())
		}
	}
	// __COPILOT_IDENTITY_BINDING_START__
	if config.Provider == nil && settings.Identity == "host-token" {
		config.GitHubTokenProvider = acquireGitHubToken
	}
	// __COPILOT_IDENTITY_BINDING_END__
	if config.Provider != nil {
		if strings.TrimSpace(config.Provider.BaseURL) == "" {
			endpoint, err := requiredProviderEndpoint()
			if err != nil {
				return err
			}
			config.Provider.BaseURL = endpoint
		}
		if settings.Credential == "bearer-callback" {
			config.Provider.BearerTokenProvider = acquireBearerToken
		} else {
			key, err := requiredEnv(settings.CredentialEnv)
			if err != nil {
				return err
			}
			config.Provider.APIKey = key
		}
	}
	for i := range tools {
		name := tools[i].Name
		tools[i].Handler = func(invocation copilot.ToolInvocation) (copilot.ToolResult, error) {
			handler := ToolHandlers[name]
			if handler == nil {
				return copilot.ToolResult{}, fmt.Errorf("host tool %s is not implemented", name)
			}
			return handler(invocation)
		}
	}
	config.Tools = tools
	if settings.PreToolHook || settings.PostToolHook {
		config.Hooks = &copilot.SessionHooks{}
		if settings.PreToolHook {
			config.Hooks.OnPreToolUse = func(input copilot.PreToolUseHookInput, invocation copilot.HookInvocation) (*copilot.PreToolUseHookOutput, error) {
				if PreToolHook == nil {
					return nil, errors.New("selected pre-tool hook is not implemented")
				}
				return PreToolHook(input, invocation)
			}
		}
		if settings.PostToolHook {
			config.Hooks.OnPostToolUse = func(input copilot.PostToolUseHookInput, invocation copilot.HookInvocation) (*copilot.PostToolUseHookOutput, error) {
				if PostToolHook == nil {
					return nil, errors.New("selected post-tool hook is not implemented")
				}
				return PostToolHook(input, invocation)
			}
		}
	}
	if settings.Storage == "virtual" {
		config.CreateSessionFSProvider = func(session *copilot.Session) copilot.SessionFSProvider {
			if SessionFilesystemFactory == nil {
				panic("selected session filesystem provider is not implemented")
			}
			return SessionFilesystemFactory(session)
		}
	}
	return nil
}
`;
