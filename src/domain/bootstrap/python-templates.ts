// Copyright (c) Microsoft Corporation. All rights reserved.

export const pythonHost = String.raw`# Copyright (c) Microsoft Corporation. All rights reserved.
"""Application-owned integrations. Importing this module never imports the SDK."""
import asyncio
import inspect
import json
import math
import os
import sys
import time

# Register real handlers here: name -> callable(ToolInvocation) -> ToolResult/awaitable.
TOOL_HANDLERS = {}
PRE_TOOL_HOOK = None
POST_TOOL_HOOK = None
SESSION_FS_FACTORY = None
_console_lock = asyncio.Lock()


def required_environment(name):
    value = os.environ.get(name)
    if not value or not value.strip():
        raise ValueError(f"Set {name} in the process environment; no secret is stored in the plan.")
    return value


def github_remaining_lifetime():
    try:
        expires_at = float(required_environment("GITHUB_TOKEN_EXPIRES_AT"))
    except ValueError as error:
        raise ValueError("GITHUB_TOKEN_EXPIRES_AT must be an absolute UNIX expiry in seconds.") from error
    if not math.isfinite(expires_at):
        raise ValueError("GITHUB_TOKEN_EXPIRES_AT must be finite.")
    remaining = math.floor(expires_at - time.time())
    if remaining <= 0:
        raise ValueError(
            "GITHUB_TOKEN_EXPIRES_AT must be the token's real future expiry. "
            "Refresh credentials in host.py; do not reset or invent the expiry."
        )
    return remaining


async def github_token_provider(args):
    """Starter only: production should acquire credentials for args['host']/['session_id']."""
    token = required_environment("GITHUB_TOKEN")
    return {"kind": "token", "accessToken": token, "expiresIn": github_remaining_lifetime()}


async def bearer_token_provider(args):
    """Starter only: replace with provider/session-scoped acquisition and caching."""
    return required_environment("MODEL_BEARER_TOKEN")


def on_permission_request(request, invocation):
    """Default-deny. Replace only after implementing identity/resource/approval policy."""
    from copilot.generated.rpc import PermissionDecisionReject
    return PermissionDecisionReject(feedback="Denied by the bootstrap's default host policy.")


async def console_user_input(request, invocation):
    if not sys.stdin.isatty():
        raise RuntimeError("Console user input requires a TTY. Implement a host UI in host.py.")
    async with _console_lock:
        choices = request.get("choices", [])
        print(request["question"])
        for index, choice in enumerate(choices, 1):
            print(f"{index}. {choice}")
        answer = await asyncio.to_thread(input, "> ")
        if answer not in choices and answer.isdecimal():
            index = int(answer) - 1
            if 0 <= index < len(choices):
                answer = choices[index]
        was_freeform = answer not in choices
        if was_freeform and request.get("allowFreeform", True) is False:
            raise ValueError("Choose one of the offered answers; freeform input is disabled.")
        return {"answer": answer, "wasFreeform": was_freeform}


def metadata_observer(event):
    """Log envelope metadata, never prompt text, tool arguments, or credentials."""
    metadata = {"event": type(event.data).__name__}
    event_id = getattr(event, "id", None)
    if isinstance(event_id, str):
        metadata["id"] = event_id
    timestamp = getattr(event, "timestamp", None)
    if timestamp is not None:
        metadata["timestamp"] = str(timestamp)
    print(json.dumps(metadata, ensure_ascii=True), file=sys.stderr)


def make_tool_handler(name):
    async def execute(invocation):
        handler = TOOL_HANDLERS.get(name)
        if not callable(handler):
            raise NotImplementedError(f"Implement TOOL_HANDLERS[{name!r}] in host.py.")
        result = handler(invocation)
        if inspect.isawaitable(result):
            result = await result
        from copilot.tools import ToolResult
        if not isinstance(result, ToolResult):
            raise TypeError(f"{name} must return copilot.tools.ToolResult, not an arbitrary dictionary.")
        if result.result_type not in {"success", "failure", "rejected", "denied", "timeout"}:
            raise ValueError(f"{name} returned an unsupported result_type.")
        return result
    return execute


async def on_pre_tool_use(data, invocation):
    if not callable(PRE_TOOL_HOOK):
        raise NotImplementedError("Implement PRE_TOOL_HOOK in host.py; a selected hook is not a no-op.")
    result = PRE_TOOL_HOOK(data, invocation)
    return await result if inspect.isawaitable(result) else result


async def on_post_tool_use(data, invocation):
    if not callable(POST_TOOL_HOOK):
        raise NotImplementedError("Implement POST_TOOL_HOOK in host.py; a selected hook is not a no-op.")
    result = POST_TOOL_HOOK(data, invocation)
    return await result if inspect.isawaitable(result) else result


def create_session_fs_handler(session):
    """Return a real synchronous factory result, not an awaitable or no-op store."""
    if not callable(SESSION_FS_FACTORY):
        raise NotImplementedError("Implement SESSION_FS_FACTORY in host.py.")
    from copilot.session_fs_provider import SessionFsProvider
    provider = SESSION_FS_FACTORY(session)
    if not isinstance(provider, SessionFsProvider):
        raise TypeError("SESSION_FS_FACTORY must return a SessionFsProvider subclass.")
    return provider


def environment_blockers(plan):
    names = []
    if not plan["model"]["id"].strip():
        names.append("COPILOT_MODEL")
    if plan["model"]["provider"] == "copilot":
        if plan["identity"] == "host-token":
            names.append("GITHUB_TOKEN")
    else:
        names.append(
            plan["model"]["credentialEnv"]
            if plan["model"]["credential"] == "api-key"
            else "MODEL_BEARER_TOKEN"
        )
    blockers = []
    for name in names:
        try:
            required_environment(name)
        except ValueError as error:
            blockers.append(str(error))
    if plan["model"]["provider"] == "copilot" and plan["identity"] == "host-token":
        try:
            github_remaining_lifetime()
        except ValueError as error:
            blockers.append(str(error))
    return blockers


def integration_blockers(plan, tools):
    blockers = [
        f"Implement TOOL_HANDLERS[{tool['name']!r}] in host.py."
        for tool in tools if not callable(TOOL_HANDLERS.get(tool["name"]))
    ]
    if plan["policy"]["preToolHook"] and not callable(PRE_TOOL_HOOK):
        blockers.append("Implement PRE_TOOL_HOOK in host.py.")
    if plan["policy"]["postToolHook"] and not callable(POST_TOOL_HOOK):
        blockers.append("Implement POST_TOOL_HOOK in host.py.")
    if plan["session"]["storage"] == "virtual" and not callable(SESSION_FS_FACTORY):
        blockers.append("Implement SESSION_FS_FACTORY in host.py.")
    return blockers
`;

export const pythonAgent = String.raw`# Copyright (c) Microsoft Corporation. All rights reserved.
"""Generated Python CLI. --check is stdlib-only and never starts a runtime/model."""
import argparse
import asyncio
import importlib.metadata
import json
import math
import os
from pathlib import Path
import sys
from urllib.parse import urlsplit
from urllib.request import url2pathname

import host

ROOT = Path(__file__).resolve().parent
SDK_COMMIT = "__SDK_COMMIT__"
RUNTIME_VERSION = "__RUNTIME_VERSION__"
SESSION_FIELDS = frozenset(__SESSION_FIELDS__)
TOOL_FIELDS = frozenset(__TOOL_FIELDS__)


def exact_fields(value, allowed, label, required=()):
    if not isinstance(value, dict):
        raise ValueError(f"{label} must be an object.")
    unknown = set(value) - set(allowed)
    missing = set(required) - set(value)
    if unknown or missing:
        raise ValueError(f"{label}: unknown fields {sorted(unknown)}, missing fields {sorted(missing)}.")


def read_json(path):
    with path.open(encoding="utf-8") as stream:
        return json.load(stream)


def validate_plan(plan):
    groups = {
        "target": {"language", "runtime", "serverUrl", "cliPath"},
        "prompt": {"mode", "content", "sections"},
        "context": {"workspace", "discovery", "skills", "fileHooks", "hostGit", "skillDirectories", "pluginDirectories"},
        "policy": {"preToolHook", "postToolHook"},
        "model": {"id", "provider", "endpoint", "wireApi", "credential", "credentialEnv", "reasoningEffort", "contextTier"},
        "session": {"storage", "baseDirectory", "idleTimeoutSeconds", "infinite", "largeOutput"},
        "events": {"streaming", "observer"},
    }
    fields = {
        "schemaVersion", "toolCatalogRevision", "target", "name", "preset", "clientMode", "inventory", "prompt",
        "tools", "customTools", "mcpServers", "agents", "selectedAgent", "rootExcludedTools",
        "context", "policy", "model", "identity", "session", "events", "evaluation",
    }
    exact_fields(plan, fields, "plan", fields)
    if plan["schemaVersion"] != 2 or plan["target"]["language"] != "python":
        raise ValueError("This project requires a version 2 Python harness plan.")
    for name, keys in groups.items():
        exact_fields(plan[name], keys, f"plan.{name}", keys)
    if plan["target"]["runtime"] not in {"managed", "external", "inprocess"}:
        raise ValueError("Unsupported runtime selection; regenerate the bootstrap.")
    if plan["clientMode"] not in {"empty", "copilot-cli"}:
        raise ValueError("Unsupported client mode.")
    if plan["inventory"] not in {"explicit", "coding-defaults"}:
        raise ValueError("Unsupported tool inventory.")
    if plan["clientMode"] == "empty" and plan["inventory"] != "explicit":
        raise ValueError("Empty mode requires an explicit tool inventory.")
    if plan["session"]["storage"] not in {"local", "virtual"}:
        raise ValueError("Unsupported storage selection.")
    if plan["session"]["storage"] == "local" and not plan["session"]["baseDirectory"].strip():
        raise ValueError("Local storage requires an explicit baseDirectory.")
    for group, names in {
        "context": ("discovery", "skills", "fileHooks", "hostGit"),
        "policy": ("preToolHook", "postToolHook"),
        "session": ("infinite", "largeOutput"),
        "events": ("streaming", "observer"),
    }.items():
        for name in names:
            if type(plan[group][name]) is not bool:
                raise ValueError(f"plan.{group}.{name} must be a boolean.")
    idle_timeout = plan["session"]["idleTimeoutSeconds"]
    if type(idle_timeout) is not int or idle_timeout < 0:
        raise ValueError("idleTimeoutSeconds must be a non-negative integer.")
    if plan["identity"] not in {"host-token", "developer"}:
        raise ValueError("Unsupported identity selection.")
    if plan["model"]["provider"] not in {"copilot", "openai", "azure", "anthropic"}:
        raise ValueError("Unsupported model provider.")
    if plan["model"]["credential"] not in {"api-key", "bearer-callback"}:
        raise ValueError("Unsupported provider credential selection.")
    builtins = frozenset(__BUILTIN_NAMES__)
    exact_fields(plan["tools"], builtins, "plan.tools", builtins)
    for name, value in plan["tools"].items():
        exact_fields(value, {"action", "description", "parameters"}, f"plan.tools.{name}", {"action", "description", "parameters"})
        if value["action"] not in {"keep", "override", "remove"}:
            raise ValueError(f"Unknown action for {name}.")
    for name, keys in {
        "customTools": {"id", "name", "description", "parameters", "terminal"},
        "mcpServers": {"id", "name", "url", "tools"},
        "agents": {"id", "name", "description", "prompt", "model", "tools"},
    }.items():
        for value in plan[name]:
            exact_fields(value, keys, f"plan.{name}", keys)
    for server in plan["mcpServers"]:
        for tool in server["tools"]:
            exact_fields(tool, {"name", "wireName"}, "MCP tool", {"name", "wireName"})
    for section in plan["prompt"]["sections"]:
        exact_fields(section, {"name", "action", "content"}, "prompt section", {"name", "action", "content"})


def load_configuration():
    data = read_json(ROOT / "python-bootstrap.json")
    expected = {"schemaVersion", "sdkCommit", "runtimeVersion", "plan", "externalAddress", "session", "tools"}
    exact_fields(data, expected, "python-bootstrap.json", expected)
    if data["schemaVersion"] != 1 or data["sdkCommit"] != SDK_COMMIT or data["runtimeVersion"] != RUNTIME_VERSION:
        raise ValueError("Unexpected bootstrap/SDK/runtime snapshot; regenerate this project.")
    plan = read_json(ROOT / "harness-plan.json")
    validate_plan(plan)
    # Preserve the original file; compare and execute only active transport/provider settings.
    plan = json.loads(json.dumps(plan))
    if plan["target"]["runtime"] != "managed":
        plan["target"]["cliPath"] = ""
    if plan["model"]["provider"] == "copilot":
        plan["model"]["endpoint"] = ""
    if data["plan"] != plan:
        raise ValueError("harness-plan.json and python-bootstrap.json disagree. Regenerate after changing the plan.")
    session = data["session"]
    optional = {"model", "reasoning_effort", "context_tier", "available_tools", "working_directory", "agent", "default_agent", "provider"}
    required = set(SESSION_FIELDS) - optional
    for field, selected in {
        "model": bool(plan["model"]["id"].strip()),
        "reasoning_effort": plan["model"]["reasoningEffort"] != "default",
        "context_tier": plan["model"]["contextTier"] != "default",
        "working_directory": bool(plan["context"]["workspace"].strip()),
        "agent": bool(plan["selectedAgent"]),
        "default_agent": bool(plan["rootExcludedTools"]),
        "provider": plan["model"]["provider"] != "copilot",
    }.items():
        if selected:
            required.add(field)
    exact_fields(session, SESSION_FIELDS, "session", required)
    for field in (
        "enable_config_discovery", "enable_skills", "enable_file_hooks",
        "enable_host_git_operations", "streaming",
    ):
        if type(session[field]) is not bool:
            raise ValueError(f"session.{field} must be a boolean.")
    if plan["inventory"] == "explicit" and "available_tools" not in session:
        raise ValueError("The explicit available_tools selection is missing.")
    for field in ("available_tools", "excluded_tools"):
        if field in session and (not isinstance(session[field], list) or "*" in session[field]):
            raise ValueError(f"{field} must be a list of exact or source-qualified names, not bare '*'.")
    exact_fields(session["system_message"], {"mode", "content", "sections"}, "system_message", {"mode", "content"})
    message = session["system_message"]
    if message["mode"] not in {"append", "replace", "customize"}:
        raise ValueError("Unsupported prompt mode.")
    if message["mode"] != "customize" and "sections" in message:
        raise ValueError("Only customize mode accepts prompt sections.")
    sections = {
        "preamble", "identity", "tone", "tool_efficiency", "environment_context",
        "code_change_rules", "guidelines", "safety", "tool_instructions",
        "custom_instructions", "runtime_instructions", "last_instructions",
    }
    for name, section in message.get("sections", {}).items():
        if name not in sections:
            raise ValueError(f"Unsupported prompt section: {name}")
        exact_fields(section, {"action", "content"}, f"section {name}", {"action"})
        if section["action"] not in {"replace", "append", "prepend", "remove", "preserve"}:
            raise ValueError(f"Unsupported action for section {name}.")
    for name, server in session["mcp_servers"].items():
        exact_fields(server, {"type", "url", "tools"}, f"mcp_servers.{name}", {"type", "url", "tools"})
    for agent in session["custom_agents"]:
        exact_fields(agent, {"name", "description", "prompt", "model", "tools"}, "custom agent", {"name", "description", "prompt", "tools"})
    if "default_agent" in session:
        exact_fields(session["default_agent"], {"excluded_tools"}, "default_agent", {"excluded_tools"})
    for key in ("infinite_sessions", "large_output"):
        exact_fields(session[key], {"enabled"}, key, {"enabled"})
        if type(session[key]["enabled"]) is not bool:
            raise ValueError(f"{key}.enabled must be a boolean.")
    if "provider" in session:
        exact_fields(session["provider"], {"type", "base_url", "wire_api"}, "provider", {"type", "base_url"})
    for tool in data["tools"]:
        exact_fields(tool, TOOL_FIELDS, "tool", TOOL_FIELDS)
        if not isinstance(tool["parameters"], dict) or tool["parameters"].get("type") != "object":
            raise ValueError(f"Tool {tool['name']} needs an object JSON Schema.")
    if plan["target"]["runtime"] == "external":
        url = urlsplit("tcp://" + data["externalAddress"])
        if not url.hostname or not url.port or url.username or url.password or url.path or url.query or url.fragment:
            raise ValueError("Invalid canonical external runtime address.")
    elif data["externalAddress"] is not None:
        raise ValueError("An external address was supplied for a local runtime.")
    return data


def project_path(value):
    path = Path(value).expanduser()
    return path.resolve() if path.is_absolute() else (ROOT / path).resolve()


def runtime_directory(kind):
    return ROOT / ".sdk-source" / f"runtime-{RUNTIME_VERSION}-{kind}"


def runtime_entrypoint(plan):
    explicit = plan["target"]["cliPath"].strip() or os.environ.get("COPILOT_CLI_PATH", "")
    if explicit:
        return project_path(explicit)
    marker = runtime_directory(plan["target"]["runtime"]) / "runtime-path.json"
    if not marker.is_file():
        raise ValueError("No local runtime was provisioned. Run bash setup-sdk.sh --run or set COPILOT_CLI_PATH.")
    record = read_json(marker)
    exact_fields(record, {"sdkCommit", "runtimeVersion", "path"}, "runtime path record", {"sdkCommit", "runtimeVersion", "path"})
    if record["sdkCommit"] != SDK_COMMIT or record["runtimeVersion"] != RUNTIME_VERSION:
        raise ValueError("The provisioned runtime record belongs to another snapshot.")
    path = Path(record["path"]).resolve()
    if not path.is_relative_to(marker.parent.resolve()):
        raise ValueError("The provisioned runtime path escaped its project-owned cache.")
    return path


def native_libraries(entrypoint):
    # File inspection only: never dlopen a library during preflight.
    parent = entrypoint.parent
    names = ("runtime.node", "libruntime_native.so", "libruntime_native.dylib", "runtime_native.dll")
    candidates = [parent / name for name in names]
    candidates.extend(parent.glob("prebuilds/*/runtime.node"))
    return [path for path in candidates if path.is_file() and path.stat().st_size]


def preflight(data):
    plan = data["plan"]
    problems = []
    if sys.version_info < (3, 11):
        problems.append("Python 3.11 or newer is required.")
    try:
        distribution = importlib.metadata.distribution("github-copilot-sdk")
        direct_url = distribution.read_text("direct_url.json")
        if not direct_url:
            problems.append("Install this project's source-pinned SDK with bash setup-sdk.sh --run.")
        else:
            location = urlsplit(json.loads(direct_url).get("url", ""))
            installed_from = (
                Path(url2pathname(("//" + location.netloc if location.netloc else "") + location.path)).resolve()
                if location.scheme == "file" else None
            )
            expected_source = (ROOT / ".sdk-source" / "copilot-sdk" / "python").resolve()
            if installed_from != expected_source:
                problems.append("The installed SDK is not from this project's pinned checkout; run setup-sdk.sh.")
    except importlib.metadata.PackageNotFoundError:
        problems.append("The Python SDK is not installed. Run bash setup-sdk.sh --run.")
    head = ROOT / ".sdk-source" / "copilot-sdk" / ".git" / "HEAD"
    if not head.is_file() or head.read_text(encoding="utf-8").strip() != SDK_COMMIT:
        problems.append("The SDK checkout must remain detached at the exported commit. setup-sdk.sh will not reset existing files.")
    problems.extend(host.environment_blockers(plan))
    problems.extend(host.integration_blockers(plan, data["tools"]))
    if plan["target"]["runtime"] != "external":
        try:
            path = runtime_entrypoint(plan)
            if not path.is_file():
                problems.append(f"Runtime entrypoint does not exist: {path}")
            elif not path.stat().st_size:
                problems.append(f"Runtime entrypoint is empty: {path}")
            elif os.name != "nt" and not os.access(path, os.X_OK):
                problems.append(f"Runtime entrypoint is not executable: {path}")
            if plan["target"]["runtime"] == "inprocess" and not native_libraries(path):
                problems.append("No adjacent native runtime library was found. Provision with --in-process or supply a compatible bundle.")
        except (ValueError, OSError) as error:
            problems.append(str(error))
    return problems


def session_options(data):
    plan = data["plan"]
    # Copy JSON data before binding executable host callbacks; never mutate the saved plan.
    options = json.loads(json.dumps(data["session"]))
    if "model" not in options:
        options["model"] = host.required_environment("COPILOT_MODEL")
    from copilot.tools import Tool
    options["tools"] = [
        Tool(**definition, handler=host.make_tool_handler(definition["name"]))
        for definition in data["tools"]
    ]
    options["on_permission_request"] = host.on_permission_request
    if plan["tools"]["ask_user"]["action"] == "keep":
        options["on_user_input_request"] = host.console_user_input
    hooks = {}
    if plan["policy"]["preToolHook"]:
        hooks["on_pre_tool_use"] = host.on_pre_tool_use
    if plan["policy"]["postToolHook"]:
        hooks["on_post_tool_use"] = host.on_post_tool_use
    if hooks:
        options["hooks"] = hooks
    if plan["events"]["observer"]:
        options["on_event"] = host.metadata_observer
    if plan["session"]["storage"] == "virtual":
        options["create_session_fs_handler"] = host.create_session_fs_handler
    if plan["model"]["provider"] == "copilot":
        if plan["identity"] == "host-token":
            options["github_token_provider"] = host.github_token_provider
    elif plan["model"]["credential"] == "api-key":
        options["provider"]["api_key"] = host.required_environment(plan["model"]["credentialEnv"])
    else:
        options["provider"]["bearer_token_provider"] = host.bearer_token_provider
    return options


async def run_agent(data, prompt, timeout):
    from copilot import CopilotClient, RuntimeConnection
    from copilot.session_events import AssistantMessageData
    plan = data["plan"]
    kind = plan["target"]["runtime"]
    client_options = {"mode": plan["clientMode"]}
    if kind == "external":
        connection = RuntimeConnection.for_uri(
            data["externalAddress"],
            connection_token=os.environ.get("COPILOT_CONNECTION_TOKEN"),
        )
    else:
        path = runtime_entrypoint(plan)
        if kind == "managed":
            connection = RuntimeConnection.for_stdio(path=str(path))
        else:
            os.environ["COPILOT_CLI_PATH"] = str(path)
            connection = RuntimeConnection.for_inprocess()
        client_options["session_idle_timeout_seconds"] = plan["session"]["idleTimeoutSeconds"]
        client_options["use_logged_in_user"] = (
            plan["model"]["provider"] == "copilot" and plan["identity"] == "developer"
        )
        if plan["session"]["storage"] == "local":
            client_options["base_directory"] = str(project_path(plan["session"]["baseDirectory"]))
    if plan["session"]["storage"] == "virtual":
        client_options["session_fs"] = {
            "initial_working_directory": plan["context"]["workspace"] or "/workspace",
            "session_state_path": "/session-state",
            "conventions": "posix",
            "capabilities": {"sqlite": False},
        }
    client = None
    session = None
    primary = None
    try:
        client = CopilotClient(connection=connection, **client_options)
        await client.start()
        session = await client.create_session(**session_options(data))
        response = await session.send_and_wait(prompt, timeout=timeout)
        if response is None:
            print("[complete] Runtime is idle; no final assistant message was emitted. Terminal-tool completion is supported.")
        elif isinstance(response.data, AssistantMessageData):
            print(response.data.content)
        else:
            raise TypeError("send_and_wait returned an unexpected final event type.")
    except BaseException as error:
        primary = error
        raise
    finally:
        failures = []
        operations = []
        if session is not None:
            if primary is not None:
                operations.append(("abort", session.abort))
            operations.append(("disconnect", session.disconnect))
        if client is not None:
            operations.append(("stop", client.stop))
        for label, operation in operations:
            try:
                await operation()
            except BaseException as error:
                error.add_note(f"During Python bootstrap cleanup: {label}")
                failures.append(error)
        if failures:
            if primary is not None:
                for error in failures:
                    primary.add_note(f"Cleanup also failed: {type(error).__name__}: {error}")
            else:
                raise BaseExceptionGroup("Python bootstrap cleanup failed", failures)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--check", action="store_true", help="Local preflight only; never starts a runtime or model.")
    parser.add_argument("--prompt", default="Say hello and explain your scope.")
    parser.add_argument("--timeout", type=float, default=60.0, help="Wait timeout in seconds.")
    args = parser.parse_args()
    if not math.isfinite(args.timeout) or args.timeout <= 0:
        parser.error("--timeout must be a positive finite number of seconds.")
    try:
        data = load_configuration()
        problems = preflight(data)
    except (ValueError, TypeError, KeyError, OSError) as error:
        print(f"Preflight failed: {error}", file=sys.stderr)
        return 1
    if problems:
        print("Preflight blockers:", file=sys.stderr)
        for problem in problems:
            print(f"- {problem}", file=sys.stderr)
        return 1
    if args.check:
        print("Preflight passed: local checks only; no SDK client, runtime, or model was started.")
        if data["plan"]["target"]["runtime"] == "external":
            print("External server reachability, credentials, state directory, and idle policy were not queried.")
        return 0
    os.chdir(ROOT)
    asyncio.run(run_agent(data, args.prompt, args.timeout))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
`;

export const pythonProvision = String.raw`# Copyright (c) Microsoft Corporation. All rights reserved.
"""Explicit setup only. Downloads a runtime artifact, never starts it."""
import argparse
import json
import os
from pathlib import Path
import subprocess
import sys
import tempfile

ROOT = Path(__file__).resolve().parent
SDK_COMMIT = "__SDK_COMMIT__"
RUNTIME_VERSION = "__RUNTIME_VERSION__"


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--run", action="store_true", help="Opt in to runtime artifact download.")
    args = parser.parse_args()
    if not args.run:
        parser.print_help()
        return 0
    with (ROOT / "python-bootstrap.json").open(encoding="utf-8") as stream:
        data = json.load(stream)
    if data["sdkCommit"] != SDK_COMMIT or data["runtimeVersion"] != RUNTIME_VERSION:
        raise ValueError("Unexpected source/runtime pin; regenerate the project.")
    target = data["plan"]["target"]
    kind = target["runtime"]
    if kind == "external":
        print("External runtime: operate the separately configured server; no local runtime is downloaded.")
        return 0
    if kind not in {"managed", "inprocess"}:
        raise ValueError("Unknown runtime kind.")
    if target["cliPath"].strip() or os.environ.get("COPILOT_CLI_PATH"):
        print("An explicit runtime path is configured. Run --check to inspect it without starting it.")
        return 0
    parent = ROOT / ".sdk-source"
    cache = parent / f"runtime-{RUNTIME_VERSION}-{kind}"
    marker = cache / "runtime-path.json"
    owner = cache / "bootstrap-owner.json"
    ownership = {"sdkCommit": SDK_COMMIT, "runtimeVersion": RUNTIME_VERSION, "kind": kind}
    if parent.is_symlink() or cache.is_symlink() or marker.is_symlink() or owner.is_symlink():
        raise ValueError("Refusing to provision through a symlink.")
    if cache.exists():
        if not owner.is_file():
            raise ValueError(f"Refusing to write into unowned runtime files in {cache}. Inspect them manually.")
        with owner.open(encoding="utf-8") as stream:
            if json.load(stream) != ownership:
                raise ValueError("Existing runtime cache belongs to another bootstrap.")
    else:
        cache.mkdir(parents=True, exist_ok=False)
        with owner.open("x", encoding="utf-8") as stream:
            json.dump(ownership, stream, indent=2)
            stream.write("\n")
    if marker.exists():
        with marker.open(encoding="utf-8") as stream:
            record = json.load(stream)
        path = Path(record["path"]).resolve()
        if record["sdkCommit"] != SDK_COMMIT or record["runtimeVersion"] != RUNTIME_VERSION:
            raise ValueError("Existing runtime files belong to another snapshot.")
        if not path.is_relative_to(cache.resolve()) or not path.is_file() or not path.with_name("runtime.node").is_file():
            raise ValueError("Existing runtime cache is incomplete; refusing to replace it.")
        print(f"Keeping the existing verified-version runtime cache: {cache}")
        return 0
    # A failed download is left intact; a later opt-in setup uses a new directory.
    attempt = Path(tempfile.mkdtemp(prefix="download-", dir=cache))
    environment = dict(os.environ)
    environment["COPILOT_CLI_EXTRACT_DIR"] = str(attempt)
    command = [sys.executable, "-m", "copilot", "download-runtime", "--version", RUNTIME_VERSION]
    if kind == "inprocess":
        command.append("--in-process")
    result = subprocess.run(command, env=environment, check=True, text=True, stdout=subprocess.PIPE)
    print(result.stdout, end="")
    prefix = "Runtime cached at: "
    reported = [line[len(prefix):] for line in result.stdout.splitlines() if line.startswith(prefix)]
    if len(reported) != 1:
        raise ValueError("The pinned SDK did not report exactly one runtime entrypoint.")
    path = Path(reported[0]).resolve()
    if not path.is_relative_to(cache.resolve()) or not path.is_file() or not path.with_name("runtime.node").is_file():
        raise ValueError("Runtime provisioning did not produce the expected executable/native-library pair.")
    with marker.open("x", encoding="utf-8") as stream:
        json.dump({"sdkCommit": SDK_COMMIT, "runtimeVersion": RUNTIME_VERSION, "path": str(path)}, stream, indent=2)
        stream.write("\n")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
`;

export const pythonSetup = String.raw`#!/usr/bin/env bash
# Copyright (c) Microsoft Corporation. All rights reserved.
set -euo pipefail

usage() {
    printf '%s\n' \
        'Usage: bash setup-sdk.sh [--run] [--python python3.11]' \
        'Default: preview only. --run fetches the exact SDK and installs a project-owned venv.' \
        'Requires Git, Bash, Python 3.11+, and package/release download access.' \
        'COPILOT_CLI_PATH may provide an existing compatible local runtime.' \
        'No existing checkout is reset or deleted. An unowned/existing venv is rejected.'
}

RUN=0
PYTHON=python3
while [ "$#" -gt 0 ]; do
    case "$1" in
        --run) RUN=1; shift ;;
        --python)
            if [ "$#" -lt 2 ]; then usage >&2; exit 2; fi
            PYTHON="$2"; shift 2 ;;
        --help|-h) usage; exit 0 ;;
        *) usage >&2; exit 2 ;;
    esac
done
if [ "$RUN" != 1 ]; then usage; exit 0; fi

ROOT=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
SDK_PARENT="$ROOT/.sdk-source"
CHECKOUT="$SDK_PARENT/copilot-sdk"
VENV="$ROOT/.venv"
MARKER="$VENV/.copilot-python-bootstrap"
SDK_COMMIT=__SDK_COMMIT__
"$PYTHON" -c 'import sys; sys.version_info >= (3, 11) or sys.exit("Python 3.11+ is required")'
command -v git >/dev/null

if [ -L "$SDK_PARENT" ] || [ -L "$CHECKOUT" ] || [ -L "$VENV" ] || [ -L "$MARKER" ]; then
    printf '%s\n' 'Refusing to use symlinked SDK/virtual-environment paths.' >&2
    exit 1
fi
if [ -e "$VENV" ] && { [ ! -f "$MARKER" ] || [ "$(cat "$MARKER")" != "$SDK_COMMIT" ]; }; then
    printf '%s\n' 'The existing .venv is not owned by this bootstrap. It will not be overwritten.' >&2
    exit 1
fi
if [ -e "$CHECKOUT" ]; then
    if [ ! -d "$CHECKOUT/.git" ] || [ -L "$CHECKOUT/.git" ] || [ "$(cat "$CHECKOUT/.git/HEAD")" != "$SDK_COMMIT" ] || [ "$(git -C "$CHECKOUT" rev-parse HEAD)" != "$SDK_COMMIT" ]; then
        printf '%s\n' 'Existing SDK checkout is not detached at the expected commit. Refusing to reset or overwrite it.' >&2
        exit 1
    fi
    if [ -n "$(git -C "$CHECKOUT" status --porcelain --untracked-files=normal)" ]; then
        printf '%s\n' 'Existing SDK checkout has changes. Inspect it manually; setup will not discard them.' >&2
        exit 1
    fi
else
    mkdir -p -- "$SDK_PARENT"
    git init --quiet "$CHECKOUT"
    git -C "$CHECKOUT" remote add origin https://github.com/github/copilot-sdk.git
    git -C "$CHECKOUT" fetch --no-tags --depth=1 origin "$SDK_COMMIT"
    git -C "$CHECKOUT" checkout --detach "$SDK_COMMIT"
fi
if [ ! -e "$VENV" ]; then
    "$PYTHON" -m venv "$VENV"
    printf '%s\n' "$SDK_COMMIT" > "$MARKER"
fi
if [ -x "$VENV/bin/python" ]; then
    VENV_PYTHON="$VENV/bin/python"
elif [ -x "$VENV/Scripts/python.exe" ]; then
    VENV_PYTHON="$VENV/Scripts/python.exe"
else
    printf '%s\n' 'The project virtual environment has no Python executable; refusing to recreate it.' >&2
    exit 1
fi
cd -- "$ROOT"
"$VENV_PYTHON" -m pip install -r requirements.txt
"$VENV_PYTHON" provision_runtime.py --run
printf '%s\n' 'Setup complete. Set required environment values, implement host.py integrations, then run bash run-agent.sh --check.'
`;

export const pythonRunner = String.raw`#!/usr/bin/env bash
# Copyright (c) Microsoft Corporation. All rights reserved.
set -euo pipefail
ROOT=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
if [ -x "$ROOT/.venv/bin/python" ]; then
    PYTHON="$ROOT/.venv/bin/python"
elif [ -x "$ROOT/.venv/Scripts/python.exe" ]; then
    PYTHON="$ROOT/.venv/Scripts/python.exe"
else
    printf '%s\n' 'Run bash setup-sdk.sh --run first, or use Python 3.11+ directly for a dependency-free preflight.' >&2
    exit 1
fi
cd -- "$ROOT"
exec "$PYTHON" agent.py "$@"
`;
