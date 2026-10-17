// Copyright (c) Microsoft Corporation. All rights reserved.
import type { HostHandler, LifecycleHook } from "../plan";

/** Java SDK SessionHooks bindings. errorOccurred has no Java SessionHooks setter at the pinned revision. */
export const JAVA_HOOKS: Partial<Record<LifecycleHook, { setter: string; type: string; method: string }>> = {
    preMcpToolCall: { setter: "setOnPreMcpToolCall", type: "PreMcpToolCall", method: "preMcpToolCall" },
    userPromptSubmitted: {
        setter: "setOnUserPromptSubmitted",
        type: "UserPromptSubmitted",
        method: "userPromptSubmitted",
    },
    userPromptTransformed: {
        setter: "setOnUserPromptTransformed",
        type: "UserPromptTransformed",
        method: "userPromptTransformed",
    },
    sessionStart: { setter: "setOnSessionStart", type: "SessionStart", method: "sessionStart" },
    sessionEnd: { setter: "setOnSessionEnd", type: "SessionEnd", method: "sessionEnd" },
    agentStop: { setter: "setOnAgentStop", type: "AgentStop", method: "agentStop" },
    subagentStart: { setter: "setOnSubagentStart", type: "SubagentStart", method: "subagentStart" },
    subagentStop: { setter: "setOnSubagentStop", type: "SubagentStop", method: "subagentStop" },
};

const JAVA_HANDLERS: Record<HostHandler, { setter: string; result: string; parameters: string }> = {
    elicitation: {
        setter: "setOnElicitationRequest",
        result: "ElicitationResult",
        parameters: "ElicitationContext _context",
    },
    exitPlanMode: {
        setter: "setOnExitPlanMode",
        result: "ExitPlanModeResult",
        parameters: "ExitPlanModeRequest _request, ExitPlanModeInvocation _context",
    },
    autoModeSwitch: {
        setter: "setOnAutoModeSwitch",
        result: "AutoModeSwitchResponse",
        parameters: "AutoModeSwitchRequest _request, AutoModeSwitchInvocation _context",
    },
    mcpAuth: {
        setter: "setOnMcpAuthRequest",
        result: "McpAuthResult",
        parameters: "McpAuthRequest _request, McpAuthInvocation _context",
    },
};

function javaHookBindings(): string {
    const hooks = Object.entries(JAVA_HOOKS).map(
        ([name, hook]) =>
            `        // <opt:hook-${name}>\n        if (selectedHooks.contains("${name}")) lifecycle.${hook.setter}(host::${hook.method});\n        // </opt:hook-${name}>\n`,
    );
    return `        // <opt:lifecycle-hooks>
        var lifecycle = config.getHooks() == null ? new SessionHooks() : config.getHooks();
        var selectedHooks = data.has("hooks") ? strings(data, "hooks") : List.<String>of();
        // </opt:lifecycle-hooks>
${hooks.join("")}        // <opt:lifecycle-hooks>
        config.setHooks(lifecycle);
        // </opt:lifecycle-hooks>
`;
}

function javaHandlerBindings(): string {
    const handlers = Object.entries(JAVA_HANDLERS).map(
        ([name, handler]) =>
            `        // <opt:handler-${name}>\n        if (selectedHandlers.contains("${name}")) config.${handler.setter}(host::${name});\n        // </opt:handler-${name}>\n`,
    );
    return `        // <opt:handlers>
        var selectedHandlers = data.has("handlers") ? strings(data, "handlers") : List.<String>of();
        // </opt:handlers>
${handlers.join("")}`;
}

function javaHookStubs(): string {
    return Object.entries(JAVA_HOOKS)
        .map(
            ([name, hook]) => `    // <opt:hook-${name}>
    CompletableFuture<${hook.type}HookOutput> ${hook.method}(${hook.type}HookInput _input, HookInvocation _context) {
        return CompletableFuture.failedFuture(new UnsupportedOperationException("HOST TODO: implement the ${name} hook"));
    }

    // </opt:hook-${name}>
`,
        )
        .join("");
}

function javaHandlerStubs(): string {
    return Object.entries(JAVA_HANDLERS)
        .map(
            ([name, handler]) => `    // <opt:handler-${name}>
    CompletableFuture<${handler.result}> ${name}(${handler.parameters}) {
        return CompletableFuture.failedFuture(new UnsupportedOperationException("HOST TODO: implement the ${name} handler"));
    }

    // </opt:handler-${name}>
`,
        )
        .join("");
}
export const JAVA_MAIN = String.raw`// Copyright (c) Microsoft Corporation. All rights reserved.
package harness;

import com.github.copilot.AllowCopilotExperimental;
import com.github.copilot.CopilotClient;
import com.github.copilot.generated.rpc.SessionModelSetAllowedModelsParams;
import com.github.copilot.rpc.MessageOptions;

@AllowCopilotExperimental
public final class Main {
    private Main() {}

    private record StopClient(CopilotClient client) implements AutoCloseable {
        @Override
        public void close() throws Exception {
            client.stop().get();
        }
    }

    public static void main(String[] args) throws Exception {
        boolean check = args.length == 1 && "--check".equals(args[0]);
        if (!check && (args.length == 0 || "--check".equals(args[0]))) {
            throw new IllegalArgumentException("Usage: harness.Main --check | <prompt>");
        }
        Configuration configuration = Configuration.read();
        try (HostExtensions host = new HostExtensions(configuration)) {
            var issues = host.preflight();
            if (!issues.isEmpty()) {
                throw new IllegalStateException("Preflight failed:\n - " + String.join("\n - ", issues));
            }
            if (check) {
                System.out.println("Preflight passed. No runtime was started and no model was contacted.");
                return;
            }
            try (var client = new CopilotClient(configuration.clientOptions());
                    var _shutdown = new StopClient(client)) {
                client.start().get();
                try (var session = client.createSession(configuration.sessionConfig(host)).get()) {
                    var allowedModels = configuration.allowedModels();
                    if (!allowedModels.isEmpty()) {
                        // Java SessionConfig has no allowlist field; apply it before the first turn.
                        session.getRpc().model.setAllowedModels(
                            new SessionModelSetAllowedModelsParams(null, allowedModels)).get();
                    }
                    var options = new MessageOptions().setPrompt(String.join(" ", args));
                    var responseSchema = configuration.responseSchema();
                    if (responseSchema != null) options.setResponseSchema(responseSchema);
                    var message = session.sendAndWait(options, 120_000L).get();
                    if (message == null) {
                        System.out.println("Turn completed without an assistant message.");
                    } else if (message.getData() == null || message.getData().content() == null) {
                        throw new IllegalStateException("The final assistant event has no text content");
                    } else {
                        System.out.println(message.getData().content());
                    }
                }
            }
        }
    }
}
`;

export const JAVA_CONFIG = String.raw`// Copyright (c) Microsoft Corporation. All rights reserved.
package harness;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.github.copilot.AllowCopilotExperimental;
import com.github.copilot.SystemMessageMode;
import com.github.copilot.generated.rpc.DiagnosticLogLevel;
import com.github.copilot.generated.rpc.DiagnosticSourcesConfiguration;
import com.github.copilot.generated.rpc.DiagnosticsConfiguration;
import com.github.copilot.generated.rpc.McpDiagnosticSourceConfiguration;
import com.github.copilot.rpc.*;
import java.io.IOException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;

@AllowCopilotExperimental
final class Configuration {
    private static final ObjectMapper MAPPER = new ObjectMapper();
    final JsonNode data;
    final JsonNode client;
    final JsonNode session;

    private Configuration(JsonNode data) {
        this.data = data;
        this.client = required(data, "client");
        this.session = required(data, "session");
        fields(data, Set.of("client", "session", "tools", "storage", "identity", "credential",
            "credentialEnv", "permissionMode", "observer", "preToolHook", "postToolHook", "cliPathRuntime",
            "hooks", "handlers", "skillProvider", "allowedModels", "logLevel", "responseSchema"));
        fields(client, Set.of("runtime", "mode", "cliPath", "host", "port", "address",
            "baseDirectory", "idleTimeoutSeconds"));
        fields(session, Set.of("model", "reasoningEffort", "contextTier", "systemMessage",
            "availableTools", "excludedTools", "workingDirectory", "enableConfigDiscovery",
            "enableSkills", "enableFileHooks", "enableHostGitOperations", "skillDirectories",
            "pluginDirectories", "mcpServers", "customAgents", "agent", "defaultAgent",
            "infiniteSessions", "largeOutput", "streaming", "provider",
            "agentDirectories", "hookDirectories", "instructionDirectories", "additionalDirectories",
            "includedBuiltinSkills", "skipCustomInstructions", "enableOnDemandInstructionDiscovery",
            "refreshCustomInstructions", "organizationCustomInstructions", "enableManagedSettings",
            "enforceManagedModelDefaults", "managedSettings", "capi", "reasoningSummary",
            "imageGeneration", "toolSearch", "askUserVariant", "excludedBuiltinAgents", "name",
            "interactiveUser", "diagnostics", "enableSessionStore", "enableFileChangeTracking",
            "includeSubAgentStreamingEvents"));
        if (!"local".equals(text(data, "storage"))) {
            throw new IllegalArgumentException("Java SessionFs is unsupported; regenerate for local storage or Rust");
        }
        if (!Set.of("host-token", "developer", "s2s-installation").contains(text(data, "identity"))
                || !Set.of("api-key", "bearer-callback").contains(text(data, "credential"))
                || !Set.of("empty", "copilot-cli").contains(text(client, "mode"))
                || !Set.of("managed", "external", "inprocess").contains(text(client, "runtime"))) {
            throw new IllegalArgumentException("Unknown identity, credential, client mode, or runtime selection");
        }
        long idle = integer(client, "idleTimeoutSeconds");
        if (idle < 0 || idle > Integer.MAX_VALUE || text(client, "baseDirectory").isBlank()) {
            throw new IllegalArgumentException("Provide a state directory and an idle timeout between 0 and 2147483647");
        }
        if (!"managed".equals(text(client, "runtime")) && !text(client, "cliPath").isBlank()) {
            throw new IllegalArgumentException("cliPath is only supported for managed children");
        }
    }

    static Configuration read() throws IOException {
        try (var stream = Configuration.class.getResourceAsStream("/bootstrap-config.json")) {
            if (stream == null) throw new IOException("Missing bootstrap-config.json resource");
            return new Configuration(new ObjectMapper().readTree(stream));
        }
    }

    CopilotClientOptions clientOptions() {
        RuntimeConnection connection = switch (text(client, "runtime")) {
            case "managed" -> text(client, "cliPath").isBlank()
                ? RuntimeConnection.forStdio()
                : RuntimeConnection.forStdio(text(client, "cliPath"));
            case "external" -> RuntimeConnection.forUri(text(client, "address"))
                .setConnectionToken(HostExtensions.requiredEnv("COPILOT_CONNECTION_TOKEN"));
            case "inprocess" -> RuntimeConnection.forInProcess();
            default -> throw new IllegalArgumentException("Unknown runtime selection");
        };
        var options = new CopilotClientOptions()
            .setConnection(connection)
            .setMode(switch (text(client, "mode")) {
                case "empty" -> CopilotClientMode.EMPTY;
                case "copilot-cli" -> CopilotClientMode.COPILOT_CLI;
                default -> throw new IllegalArgumentException("Unknown client mode");
            });
        if (!"external".equals(text(client, "runtime"))) {
            options.setCopilotHome(text(client, "baseDirectory"))
                .setSessionIdleTimeoutSeconds(Math.toIntExact(integer(client, "idleTimeoutSeconds")))
                .setUseLoggedInUser(!session.has("provider") && "developer".equals(text(data, "identity")));
            // The SDK passes the log level to the runtime it starts; an existing server owns its own.
            if (data.has("logLevel")) options.setLogLevel(text(data, "logLevel"));
            // __S2S_RUNTIME_ENV_START__
            if (!session.has("provider") && "s2s-installation".equals(text(data, "identity"))) {
                String token = HostExtensions.requiredEnv("COPILOT_GITHUB_TOKEN");
                if ("managed".equals(text(client, "runtime"))) {
                    var environment = new HashMap<>(System.getenv());
                    environment.put("COPILOT_GITHUB_TOKEN", token);
                    options.setEnvironment(environment);
                }
            }
            // __S2S_RUNTIME_ENV_END__
        }
        return options;
    }

    List<String> allowedModels() {
        return data.has("allowedModels") ? strings(data, "allowedModels") : List.of();
    }

    Map<String, Object> responseSchema() {
        return data.has("responseSchema")
            ? MAPPER.convertValue(object(data, "responseSchema"), new TypeReference<Map<String, Object>>() {})
            : null;
    }

    private void extendedSession(SessionConfig config) {
        if (session.has("name")) config.setName(text(session, "name"));
        if (session.has("reasoningSummary")) config.setReasoningSummary(text(session, "reasoningSummary"));
        if (session.has("capi")) {
            JsonNode capi = object(session, "capi");
            fields(capi, Set.of("autoTier"));
            config.setCapi(new CapiSessionOptions().setAutoTier(AutoTier.fromValue(text(capi, "autoTier"))));
        }
        if (session.has("askUserVariant")) {
            config.setAskUserVariant(AskUserVariant.fromValue(text(session, "askUserVariant")));
        }
        if (session.has("excludedBuiltinAgents")) {
            config.setExcludedBuiltInAgents(strings(session, "excludedBuiltinAgents"));
        }
        if (session.has("includedBuiltinSkills")) {
            config.setIncludedBuiltinSkills(strings(session, "includedBuiltinSkills"));
        }
        if (session.has("agentDirectories")) config.setAgentDirectories(strings(session, "agentDirectories"));
        if (session.has("hookDirectories")) config.setHookDirectories(strings(session, "hookDirectories"));
        if (session.has("instructionDirectories")) {
            config.setInstructionDirectories(strings(session, "instructionDirectories"));
        }
        if (session.has("additionalDirectories")) {
            config.setAdditionalDirectories(strings(session, "additionalDirectories"));
        }
        if (session.has("skipCustomInstructions")) {
            config.setSkipCustomInstructions(flag(session, "skipCustomInstructions"));
        }
        if (session.has("enableOnDemandInstructionDiscovery")) {
            config.setEnableOnDemandInstructionDiscovery(flag(session, "enableOnDemandInstructionDiscovery"));
        }
        if (session.has("refreshCustomInstructions")) {
            config.setRefreshCustomInstructions(flag(session, "refreshCustomInstructions"));
        }
        if (session.has("organizationCustomInstructions")) {
            config.setOrganizationCustomInstructions(text(session, "organizationCustomInstructions"));
        }
        if (session.has("enableManagedSettings")) config.setEnableManagedSettings(flag(session, "enableManagedSettings"));
        if (session.has("enforceManagedModelDefaults")) {
            config.setEnforceManagedModelDefaults(flag(session, "enforceManagedModelDefaults"));
        }
        if (session.has("managedSettings")) {
            JsonNode managed = object(session, "managedSettings");
            fields(managed, Set.of("permissions"));
            JsonNode rules = object(managed, "permissions");
            fields(rules, Set.of("disableBypassPermissionsMode", "disableAssistedPermissionsMode",
                "deny", "ask", "allow", "limitTo"));
            var permissions = new ManagedSettingsPermissions();
            if (rules.has("disableBypassPermissionsMode")) {
                permissions.setDisableBypassPermissionsMode(text(rules, "disableBypassPermissionsMode"));
            }
            if (rules.has("disableAssistedPermissionsMode")) {
                permissions.setDisableAssistedPermissionsMode(flag(rules, "disableAssistedPermissionsMode"));
            }
            if (rules.has("deny")) permissions.setDeny(strings(rules, "deny"));
            if (rules.has("ask")) permissions.setAsk(strings(rules, "ask"));
            if (rules.has("allow")) permissions.setAllow(strings(rules, "allow"));
            if (rules.has("limitTo")) permissions.setLimitTo(strings(rules, "limitTo"));
            config.setManagedSettings(new ManagedSettings().setPermissions(permissions));
        }
        if (session.has("imageGeneration")) {
            JsonNode image = object(session, "imageGeneration");
            fields(image, Set.of("enabled"));
            config.setImageGeneration(new ImageGenerationConfig().setEnabled(flag(image, "enabled")));
        }
        if (session.has("toolSearch")) {
            JsonNode search = object(session, "toolSearch");
            fields(search, Set.of("enabled", "deferThreshold"));
            var toolSearch = new ToolSearchConfig();
            if (search.has("enabled")) toolSearch.setEnabled(flag(search, "enabled"));
            if (search.has("deferThreshold")) {
                toolSearch.setDeferThreshold(Math.toIntExact(integer(search, "deferThreshold")));
            }
            config.setToolSearch(toolSearch);
        }
        if (session.has("interactiveUser")) config.setInteractiveUser(flag(session, "interactiveUser"));
        if (session.has("diagnostics")) {
            JsonNode diagnostics = object(session, "diagnostics");
            fields(diagnostics, Set.of("sources"));
            JsonNode sources = object(diagnostics, "sources");
            fields(sources, Set.of("mcp"));
            JsonNode mcp = object(sources, "mcp");
            fields(mcp, Set.of("level"));
            config.setDiagnostics(new DiagnosticsConfiguration(new DiagnosticSourcesConfiguration(
                new McpDiagnosticSourceConfiguration(DiagnosticLogLevel.fromValue(text(mcp, "level"))))));
        }
        if (session.has("enableSessionStore")) config.setEnableSessionStore(flag(session, "enableSessionStore"));
        if (session.has("enableFileChangeTracking")) {
            config.setEnableFileChangeTracking(flag(session, "enableFileChangeTracking"));
        }
        if (session.has("includeSubAgentStreamingEvents")) {
            config.setIncludeSubAgentStreamingEvents(flag(session, "includeSubAgentStreamingEvents"));
        }
    }

    SessionConfig sessionConfig(HostExtensions host) {
        var config = new SessionConfig();
        config.setModel(session.has("model")
            ? text(session, "model") : HostExtensions.requiredEnv("COPILOT_MODEL"));
        if (session.has("reasoningEffort")) config.setReasoningEffort(text(session, "reasoningEffort"));
        if (session.has("contextTier")) config.setContextTier(text(session, "contextTier"));

        if (session.has("systemMessage")) {
            JsonNode prompt = object(session, "systemMessage");
            fields(prompt, Set.of("mode", "content", "sections"));
            var systemMessage = new SystemMessageConfig()
                .setMode(SystemMessageMode.valueOf(text(prompt, "mode").toUpperCase(Locale.ROOT)))
                .setContent(text(prompt, "content"));
            if (prompt.has("sections")) {
                Map<String, SectionOverride> sections = new LinkedHashMap<>();
                object(prompt, "sections").fields().forEachRemaining(entry -> {
                    var value = entry.getValue();
                    fields(value, Set.of("action", "content"));
                    var section = new SectionOverride().setAction(
                        SectionOverrideAction.valueOf(text(value, "action").toUpperCase(Locale.ROOT)));
                    if (value.has("content")) section.setContent(text(value, "content"));
                    sections.put(entry.getKey(), section);
                });
                systemMessage.setSections(sections);
            }
            config.setSystemMessage(systemMessage);
        }
        if (session.has("availableTools")) config.setAvailableTools(strings(session, "availableTools"));
        config.setExcludedTools(strings(session, "excludedTools"));
        if (session.has("workingDirectory")) config.setWorkingDirectory(text(session, "workingDirectory"));
        config.setEnableConfigDiscovery(flag(session, "enableConfigDiscovery"));
        config.setEnableSkills(flag(session, "enableSkills"));
        config.setEnableFileHooks(flag(session, "enableFileHooks"));
        config.setEnableHostGitOperations(flag(session, "enableHostGitOperations"));
        config.setSkillDirectories(strings(session, "skillDirectories"));
        config.setPluginDirectories(strings(session, "pluginDirectories"));
        config.setStreaming(flag(session, "streaming"));
        extendedSession(config);

        JsonNode infinite = required(session, "infiniteSessions");
        fields(infinite, Set.of("enabled"));
        config.setInfiniteSessions(new InfiniteSessionConfig().setEnabled(flag(infinite, "enabled")));
        JsonNode output = required(session, "largeOutput");
        fields(output, Set.of("enabled"));
        config.setLargeOutput(new LargeToolOutputConfig().setEnabled(flag(output, "enabled")));

        Map<String, McpServerConfig> servers = new LinkedHashMap<>();
        object(session, "mcpServers").fields().forEachRemaining(entry -> {
            var value = entry.getValue();
            fields(value, Set.of("type", "url", "tools"));
            if (!"http".equals(text(value, "type"))) {
                throw new IllegalArgumentException("Regenerate the adapter for this MCP transport");
            }
            servers.put(entry.getKey(), new McpHttpServerConfig()
                .setUrl(text(value, "url")).setTools(strings(value, "tools")));
        });
        config.setMcpServers(servers);
        List<CustomAgentConfig> agents = new ArrayList<>();
        for (var agent : array(session, "customAgents")) {
            fields(agent, Set.of("name", "displayName", "description", "prompt", "model", "tools", "hooks"));
            var value = new CustomAgentConfig().setName(text(agent, "name"))
                .setDescription(text(agent, "description")).setPrompt(text(agent, "prompt"))
                .setTools(strings(agent, "tools"));
            if (agent.has("displayName")) value.setDisplayName(text(agent, "displayName"));
            if (agent.has("model")) value.setModel(text(agent, "model"));
            if (agent.has("hooks")) {
                value.setHooks(MAPPER.convertValue(object(agent, "hooks"),
                    new TypeReference<Map<String, List<Map<String, Object>>>>() {}));
            }
            agents.add(value);
        }
        config.setCustomAgents(agents);
        if (session.has("agent")) config.setAgent(text(session, "agent"));
        if (session.has("defaultAgent")) {
            var root = required(session, "defaultAgent");
            fields(root, Set.of("excludedTools"));
            config.setDefaultAgent(new DefaultAgentConfig().setExcludedTools(strings(root, "excludedTools")));
        }
        List<ToolDefinition> tools = new ArrayList<>();
        for (var tool : array(data, "tools")) {
            fields(tool, Set.of("name", "description", "parameters", "overridesBuiltInTool", "isTerminal",
                "defer", "skipPermission"));
            tools.add(new ToolDefinition(text(tool, "name"), text(tool, "description"),
                object(tool, "parameters"), host::invokeTool, flag(tool, "overridesBuiltInTool"),
                tool.has("skipPermission") && flag(tool, "skipPermission"),
                tool.has("defer") ? ToolDefer.fromValue(text(tool, "defer")) : null,
                Map.of(), flag(tool, "isTerminal")));
        }
        config.setTools(tools);
        String permissionMode = text(data, "permissionMode");
        if ("host".equals(permissionMode)) config.setOnPermissionRequest(host::permission);
        else if ("allow-all".equals(permissionMode)) config.setOnPermissionRequest(PermissionHandler.APPROVE_ALL);
        else throw new IllegalArgumentException("Unknown permission mode");
        config.setOnUserInputRequest(host::userInput);
        // __COPILOT_IDENTITY_BINDING_START__
        if (!session.has("provider") && "host-token".equals(text(data, "identity"))) config.setGitHubTokenProvider(host::githubToken);
        // __COPILOT_IDENTITY_BINDING_END__
        if (flag(data, "observer")) config.setOnEvent(host::observe);
        if (flag(data, "preToolHook") || flag(data, "postToolHook")) {
            var hooks = new SessionHooks();
            if (flag(data, "preToolHook")) hooks.setOnPreToolUse(host::preToolUse);
            if (flag(data, "postToolHook")) hooks.setOnPostToolUse(host::postToolUse);
            config.setHooks(hooks);
        }
${javaHookBindings()}${javaHandlerBindings()}        // <opt:skill-provider>
        if (data.has("skillProvider") && flag(data, "skillProvider")) config.setSkillProvider(host.skillProvider());
        // </opt:skill-provider>
        if (session.has("provider")) {
            var providerData = required(session, "provider");
            fields(providerData, Set.of("type", "baseUrl", "wireApi", "modelProvider", "wireModel",
                "maxPromptTokens", "maxOutputTokens"));
            var provider = new ProviderConfig().setType(text(providerData, "type"))
                .setBaseUrl(text(providerData, "baseUrl").isBlank()
                    ? host.providerEndpoint() : text(providerData, "baseUrl"));
            if (providerData.has("wireApi")) provider.setWireApi(text(providerData, "wireApi"));
            if (providerData.has("modelProvider")) provider.setModelProvider(text(providerData, "modelProvider"));
            if (providerData.has("wireModel")) provider.setWireModel(text(providerData, "wireModel"));
            if (providerData.has("maxPromptTokens")) {
                provider.setMaxPromptTokens(Math.toIntExact(integer(providerData, "maxPromptTokens")));
            }
            if (providerData.has("maxOutputTokens")) {
                provider.setMaxOutputTokens(Math.toIntExact(integer(providerData, "maxOutputTokens")));
            }
            switch (text(data, "credential")) {
                case "api-key" -> provider.setApiKey(HostExtensions.requiredEnv(text(data, "credentialEnv")));
                case "bearer-callback" -> provider.setBearerTokenProvider(host::bearerToken);
                default -> throw new IllegalArgumentException("Unknown provider credential strategy");
            }
            config.setProvider(provider);
        }
        return config;
    }

    static JsonNode required(JsonNode object, String name) {
        if (object == null || !object.isObject() || !object.hasNonNull(name)) {
            throw new IllegalArgumentException("Missing configuration property: " + name);
        }
        return object.get(name);
    }

    static String text(JsonNode object, String name) {
        var value = required(object, name);
        if (!value.isTextual()) throw new IllegalArgumentException(name + " must be text");
        return value.textValue();
    }

    static JsonNode object(JsonNode parent, String name) {
        var value = required(parent, name);
        if (!value.isObject()) throw new IllegalArgumentException(name + " must be an object");
        return value;
    }

    static boolean flag(JsonNode object, String name) {
        var value = required(object, name);
        if (!value.isBoolean()) throw new IllegalArgumentException(name + " must be Boolean");
        return value.booleanValue();
    }

    static long integer(JsonNode object, String name) {
        var value = required(object, name);
        if (!value.isIntegralNumber() || !value.canConvertToLong()) {
            throw new IllegalArgumentException(name + " must be an integer");
        }
        return value.longValue();
    }

    static JsonNode array(JsonNode object, String name) {
        var value = required(object, name);
        if (!value.isArray()) throw new IllegalArgumentException(name + " must be an array");
        return value;
    }

    static List<String> strings(JsonNode object, String name) {
        List<String> values = new ArrayList<>();
        for (var value : array(object, name)) {
            if (!value.isTextual()) throw new IllegalArgumentException(name + " must contain text");
            values.add(value.textValue());
        }
        return values;
    }

    private static void fields(JsonNode object, Set<String> allowed) {
        if (object == null || !object.isObject()) throw new IllegalArgumentException("Expected a configuration object");
        object.fieldNames().forEachRemaining(name -> {
            if (!allowed.contains(name)) {
                throw new IllegalArgumentException("Unmapped configuration property: " + name);
            }
        });
    }
}
`;

export const JAVA_HOST = String.raw`// Copyright (c) Microsoft Corporation. All rights reserved.
package harness;

import static harness.Configuration.*;
import com.github.copilot.AllowCopilotExperimental;
// <opt:skill-provider>
import com.github.copilot.SkillProvider;
import com.github.copilot.SkillProviderDescriptor;
// </opt:skill-provider>
import com.github.copilot.generated.SessionEvent;
import com.github.copilot.rpc.*;
import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.concurrent.Callable;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.CompletionException;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

@AllowCopilotExperimental
final class HostExtensions implements AutoCloseable {
    private final Configuration configuration;
    private final BufferedReader input = new BufferedReader(new InputStreamReader(System.in, StandardCharsets.UTF_8));
    private final ExecutorService console = Executors.newSingleThreadExecutor(task -> {
        var thread = new Thread(task, "harness-console");
        thread.setDaemon(true);
        return thread;
    });

    HostExtensions(Configuration configuration) {
        this.configuration = configuration;
    }

    // Mark an integration ready only after replacing its failing implementation below.
    private Set<String> implementedTools() { return Set.of(); }
    private boolean permissionPolicyImplemented() { return false; }
    private boolean preToolHookImplemented() { return false; }
    private boolean postToolHookImplemented() { return false; }
    // <opt:lifecycle-hooks>
    private Set<String> implementedHooks() { return Set.of(); }
    // </opt:lifecycle-hooks>
    // <opt:handlers>
    private Set<String> implementedHandlers() { return Set.of(); }
    // </opt:handlers>
    // <opt:skill-provider>
    private boolean skillProviderImplemented() { return false; }
    // </opt:skill-provider>

    private static final String PROVIDER_ENDPOINT = "";

    String providerEndpoint() {
        if (PROVIDER_ENDPOINT.isBlank()) {
            throw new IllegalStateException("Provide the provider endpoint string in HostExtensions.java PROVIDER_ENDPOINT.");
        }
        return PROVIDER_ENDPOINT.strip();
    }

    List<String> preflight() {
        List<String> issues = new ArrayList<>();
        var data = configuration.data;
        var client = configuration.client;
        var session = configuration.session;
        if (!session.has("model")) capture(issues, () -> requiredEnv("COPILOT_MODEL"));
        // __COPILOT_IDENTITY_PREFLIGHT_START__
        if (!session.has("provider") && "host-token".equals(text(data, "identity"))) capture(issues, HostExtensions::tokenFromEnvironment);
        // __COPILOT_IDENTITY_PREFLIGHT_END__
        // __S2S_LOCAL_PREFLIGHT_START__
        if (!session.has("provider") && "s2s-installation".equals(text(data, "identity"))) {
            capture(issues, () -> requiredEnv("COPILOT_GITHUB_TOKEN"));
        }
        // __S2S_LOCAL_PREFLIGHT_END__
        if (session.has("provider")) {
            capture(issues, () -> "api-key".equals(text(data, "credential"))
                ? requiredEnv(text(data, "credentialEnv")) : rawBearerToken());
        }
        if ("external".equals(text(client, "runtime"))) {
            capture(issues, () -> requiredEnv("COPILOT_CONNECTION_TOKEN"));
            System.err.println("Preflight is local only: apply start-runtime.sh on the server host before connecting.");
        } else {
            if (session.has("workingDirectory")) directory(issues, text(session, "workingDirectory"), "workspace");
            for (String path : strings(session, "skillDirectories")) directory(issues, path, "skill directory");
            for (String path : strings(session, "pluginDirectories")) directory(issues, path, "plugin directory");
            if ("managed".equals(text(client, "runtime")) && !text(client, "cliPath").isBlank()) {
                Path executable = Path.of(text(client, "cliPath"));
                boolean javascript = executable.toString().toLowerCase(Locale.ROOT).endsWith(".js");
                if (!Files.isRegularFile(executable) || (!javascript && !Files.isExecutable(executable))) {
                    issues.add("Managed cliPath must name an executable wrapper or JavaScript entrypoint on this runtime host");
                }
            }
        }
        if (flag(data, "cliPathRuntime")) {
            // The pinned SDK source cannot build its native classifier artifacts, so the runtime is host-provisioned.
            String configured = System.getenv("COPILOT_CLI_PATH");
            if (configured == null || configured.isBlank()) {
                issues.add("Set COPILOT_CLI_PATH to a compatible runtime package executable on this host");
            } else {
                Path executable = Path.of(configured).toAbsolutePath().normalize();
                if (!Files.isRegularFile(executable)) {
                    issues.add("COPILOT_CLI_PATH must name an existing runtime package executable");
                } else if ("inprocess".equals(text(client, "runtime"))
                        && !Files.isRegularFile(executable.resolveSibling("runtime.node"))
                        && !Files.isDirectory(executable.resolveSibling("prebuilds"))) {
                    issues.add("COPILOT_CLI_PATH needs an adjacent runtime.node or prebuilds/<platform>/runtime.node");
                }
            }
        }
        for (var tool : array(data, "tools")) {
            String name = text(tool, "name");
            if (!implementedTools().contains(name)) issues.add("HOST TODO: implement tool " + name + " in HostExtensions.invokeTool");
        }
        if ("host".equals(text(data, "permissionMode")) && !permissionPolicyImplemented()) {
            issues.add("HOST TODO: implement HostExtensions.permission");
        }
        if (flag(data, "preToolHook") && !preToolHookImplemented()) {
            issues.add("HOST TODO: implement HostExtensions.preToolUse");
        }
        if (flag(data, "postToolHook") && !postToolHookImplemented()) {
            issues.add("HOST TODO: implement HostExtensions.postToolUse");
        }
        // <opt:lifecycle-hooks>
        for (String hook : data.has("hooks") ? strings(data, "hooks") : List.<String>of()) {
            if (!implementedHooks().contains(hook)) {
                issues.add("HOST TODO: implement and register the " + hook + " hook in HostExtensions");
            }
        }
        // </opt:lifecycle-hooks>
        // <opt:handlers>
        for (String handler : data.has("handlers") ? strings(data, "handlers") : List.<String>of()) {
            if (!implementedHandlers().contains(handler)) {
                issues.add("HOST TODO: implement and register the " + handler + " handler in HostExtensions");
            }
        }
        // </opt:handlers>
        // <opt:skill-provider>
        if (data.has("skillProvider") && flag(data, "skillProvider") && !skillProviderImplemented()) {
            issues.add("HOST TODO: implement and register HostExtensions.skillProvider");
        }
        // </opt:skill-provider>
        capture(issues, () -> configuration.sessionConfig(this));
        return issues;
    }

    CompletableFuture<PermissionRequestResult> permission(PermissionRequest _request, PermissionInvocation _context) {
        return CompletableFuture.failedFuture(
            new UnsupportedOperationException("HOST TODO: implement the selected host permission policy"));
    }

    CompletableFuture<Object> invokeTool(ToolInvocation invocation) {
        return CompletableFuture.failedFuture(new UnsupportedOperationException(
            "HOST TODO: implement and authorize tool " + invocation.getToolName()));
    }

    CompletableFuture<PreToolUseHookOutput> preToolUse(PreToolUseHookInput _input, HookInvocation _context) {
        return CompletableFuture.failedFuture(new UnsupportedOperationException("HOST TODO: implement pre-tool policy"));
    }

    CompletableFuture<PostToolUseHookOutput> postToolUse(PostToolUseHookInput _input, HookInvocation _context) {
        return CompletableFuture.failedFuture(new UnsupportedOperationException("HOST TODO: implement post-tool inspection/redaction"));
    }

${javaHookStubs()}${javaHandlerStubs()}    // <opt:skill-provider>
    SkillProvider skillProvider() {
        return new SkillProvider() {
            @Override
            public CompletableFuture<List<SkillProviderDescriptor>> listSkills() {
                return CompletableFuture.failedFuture(new UnsupportedOperationException("HOST TODO: list the host's skills"));
            }

            @Override
            public CompletableFuture<String> readSkill(String name) {
                return CompletableFuture.failedFuture(new UnsupportedOperationException("HOST TODO: read skill " + name));
            }
        };
    }

    // </opt:skill-provider>
    void observe(SessionEvent event) {
        System.err.println("[event] " + event.getClass().getSimpleName());
    }

    // __GITHUB_TOKEN_PROVIDER_START__
    CompletableFuture<GitHubTokenProviderResult> githubToken(GitHubTokenProviderArgs _args) {
        return attempt(HostExtensions::tokenFromEnvironment);
    }

    private static GitHubTokenProviderResult tokenFromEnvironment() {
        String token = requiredEnv("GITHUB_TOKEN");
        final long expiresAt;
        try {
            expiresAt = Long.parseLong(requiredEnv("GITHUB_TOKEN_EXPIRES_AT"));
        } catch (NumberFormatException error) {
            throw new IllegalStateException("GITHUB_TOKEN_EXPIRES_AT must be a UNIX timestamp in seconds");
        }
        long remaining = Math.subtractExact(expiresAt, Instant.now().getEpochSecond());
        if (remaining <= 0) throw new IllegalStateException("GITHUB_TOKEN is expired; acquire a new token and its real expiry");
        return GitHubTokenProviderResult.token(token, remaining);
    }
    // __GITHUB_TOKEN_PROVIDER_END__

    CompletableFuture<String> bearerToken(ProviderTokenArgs _args) {
        return attempt(HostExtensions::rawBearerToken);
    }

    private static String rawBearerToken() {
        String token = requiredEnv("MODEL_BEARER_TOKEN");
        if (token.regionMatches(true, 0, "Bearer ", 0, 7)) {
            throw new IllegalStateException("MODEL_BEARER_TOKEN must not include a Bearer prefix");
        }
        return token;
    }

    CompletableFuture<UserInputResponse> userInput(UserInputRequest request, UserInputInvocation _context) {
        return CompletableFuture.supplyAsync(() -> {
            try {
                var choices = request.getChoices() == null ? List.<String>of() : request.getChoices();
                boolean allowFreeform = request.getAllowFreeform().orElse(true);
                if (choices.isEmpty() && !allowFreeform) {
                    throw new IOException("The runtime requested input without choices or permission for freeform input");
                }
                System.err.println(request.getQuestion());
                for (int i = 0; i < choices.size(); i++) System.err.println((i + 1) + ". " + choices.get(i));
                while (true) {
                    System.err.print("> ");
                    System.err.flush();
                    String answer = input.readLine();
                    if (answer == null) throw new IOException("Console input ended before an answer was provided");
                    for (int i = 0; i < choices.size(); i++) {
                        if (answer.equals(choices.get(i)) || answer.strip().equals(Integer.toString(i + 1))) {
                            return new UserInputResponse().setAnswer(choices.get(i)).setWasFreeform(false);
                        }
                    }
                    if (allowFreeform) return new UserInputResponse().setAnswer(answer).setWasFreeform(true);
                    System.err.println("Choose one of the offered answers; freeform input is disabled.");
                }
            } catch (IOException error) {
                throw new CompletionException(error);
            }
        }, console);
    }

    static String requiredEnv(String name) {
        String value = System.getenv(name);
        if (value == null || value.isBlank()) throw new IllegalStateException("Set " + name + " in the process environment");
        return value;
    }

    private static <T> CompletableFuture<T> attempt(Callable<T> operation) {
        try {
            return CompletableFuture.completedFuture(operation.call());
        } catch (Exception error) {
            return CompletableFuture.failedFuture(error);
        }
    }

    private static void capture(List<String> issues, Callable<?> operation) {
        try {
            operation.call();
        } catch (Exception error) {
            issues.add(error.getMessage() == null ? error.getClass().getSimpleName() : error.getMessage());
        }
    }

    private static void directory(List<String> issues, String value, String label) {
        if (!Files.isDirectory(Path.of(value))) issues.add("Provide the selected " + label + " on the runtime host: " + value);
    }

    @Override
    public void close() {
        console.shutdownNow();
    }
}
`;

/** Version produced by the pinned SDK source: java/pom.xml sets <revision>, resolved by flatten-maven-plugin. */
export const JAVA_SDK_VERSION = "1.0.15-preview.1-SNAPSHOT";

export function javaSetupScript(revision: string, cliPathRuntime: boolean): string {
    return `#!/usr/bin/env bash
# Copyright (c) Microsoft Corporation. All rights reserved.
set -euo pipefail
usage() {
    cat <<'HELP'
Usage: bash setup-sdk.sh [--run | --help]
Without --run, only print this help.
Requires: Git, Maven, JDK 25 or later, and Node.js.
This recipe installs the pinned SDK's ${JAVA_SDK_VERSION} artifacts into your local
Maven repository. It never resets, cleans, or deletes an existing checkout.
Native classifier artifacts are never built: the pinned source's native profiles
cannot run because their fetch script imports repository scripts that this
revision no longer contains.
${
    cliPathRuntime
        ? `At run time, set COPILOT_CLI_PATH to a compatible runtime package executable
(with adjacent runtime.node or prebuilds/<platform>/runtime.node) on the host.`
        : "No runtime package is required for this selected connection recipe."
}
HELP
}
if [[ $# -eq 0 || \${1:-} == --help ]]; then usage; exit 0; fi
if [[ $# -ne 1 || $1 != --run ]]; then usage >&2; exit 2; fi
for tool in git mvn java node; do
    if ! command -v "$tool" >/dev/null 2>&1; then
        printf 'Missing prerequisite: %s\\n' "$tool" >&2
        exit 1
    fi
done
java_version=$(java -XshowSettings:properties -version 2>&1)
java_feature=$(printf '%s\\n' "$java_version" | awk '/java.specification.version =/ { print $3; exit }')
if [[ ! $java_feature =~ ^[0-9]+$ || $java_feature -lt 25 ]]; then
    printf '%s\\n' 'Building the pinned Java SDK requires JDK 25 or later; set JAVA_HOME/PATH accordingly.' >&2
    exit 1
fi
native_args=(-Dcopilot.native.skip.download=true)
root=$(cd -- "$(dirname -- "$0")" && pwd -P)
source_parent="$root/.sdk-source"
sdk_dir="$source_parent/copilot-sdk"
revision=${revision}
if [[ -L $source_parent || -L $sdk_dir ]]; then
    printf '%s\\n' 'Refusing a symlinked SDK source directory; choose a separate bootstrap directory.' >&2
    exit 1
fi
if [[ -e $sdk_dir ]]; then
    if [[ ! -d "$sdk_dir/.git" ]]; then
        printf '%s\\n' 'Existing .sdk-source/copilot-sdk is not a standalone Git checkout; it was left untouched.' >&2
        exit 1
    fi
    actual=$(git -C "$sdk_dir" rev-parse HEAD)
    changes=$(git -C "$sdk_dir" status --porcelain --untracked-files=normal)
    if [[ $actual != "$revision" || -n $changes ]]; then
        printf '%s\\n' 'Existing SDK checkout is dirty or at a different revision; it was left untouched.' >&2
        printf '%s\\n' 'Move your existing work to a separately chosen location before provisioning this bootstrap.' >&2
        exit 1
    fi
else
    mkdir -p "$source_parent"
    git clone --filter=blob:none --no-checkout https://github.com/github/copilot-sdk.git "$sdk_dir"
    git -C "$sdk_dir" fetch --depth=1 origin "$revision"
    git -C "$sdk_dir" switch --detach "$revision"
fi
if [[ $(git -C "$sdk_dir" rev-parse HEAD) != "$revision" ]]; then
    printf '%s\\n' 'The SDK checkout does not match the required revision.' >&2
    exit 1
fi
mvn --batch-mode -f "$sdk_dir/java/pom.xml" install \\
    -DskipTests -Dskip.test.harness=true "\${native_args[@]}"
printf '%s\\n' 'Installed the pinned SDK source artifacts. Build the application with mvn package.'
`;
}
