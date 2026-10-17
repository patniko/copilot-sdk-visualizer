// Copyright (c) Microsoft Corporation. All rights reserved.
import type { HarnessPlan } from "../plan";
import { projectName } from "./common";
import { COPILOT_CLI_VERSION } from "./revisions";
import {
    JAVA_RUST_SDK_REVISION,
    javaRustChecks,
    javaRustConfiguration,
    javaRustRequirements,
    javaRustServerFiles,
    javaRustOptionalBlocks,
    javaRustSources,
    renderOptionalBlocks,
} from "./java-rust-shared";
import {
    JAVA_CONFIG,
    JAVA_HOOKS,
    JAVA_HOST,
    JAVA_MAIN,
    JAVA_SDK_VERSION,
    javaSetupScript,
} from "./java-templates";
import type { BootstrapBlocker, LanguageAdapter } from "./types";

function renderJavaSource(template: string, plan: HarnessPlan): string {
    const source = renderOptionalBlocks(template, javaRustOptionalBlocks(plan));
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
            ? `            String token = HostExtensions.requiredEnv("COPILOT_GITHUB_TOKEN");
            var environment = new HashMap<>(System.getenv());
            environment.put("COPILOT_GITHUB_TOKEN", token);
            options.setEnvironment(environment);
`
            : plan.target.runtime === "inprocess"
              ? `            HostExtensions.requiredEnv("COPILOT_GITHUB_TOKEN");
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

function checkJava(plan: HarnessPlan): BootstrapBlocker[] {
    const blockers = javaRustChecks(plan, "java");
    if (plan.session.storage === "virtual") {
        blockers.push({
            id: "java-session-fs",
            title: "Java does not expose the SessionFs host integration",
            detail: "Select local session storage or Rust, or implement and verify a Java SDK SessionFs configuration/provider/callback bridge first. Raw generated RPC types alone do not implement virtual persistence.",
            fields: ["session.storage"],
            sources: ["sdk-inprocess-guide"],
        });
    }
    if (plan.session.idleTimeoutSeconds > 2_147_483_647) {
        blockers.push({
            id: "java-idle-timeout-range",
            title: "Java's idle timeout must fit a signed 32-bit integer",
            detail: "Choose an idle timeout between 0 and 2147483647 seconds. The Java SDK setter takes int; truncating a larger value would change the plan.",
            fields: ["session.idleTimeoutSeconds"],
            sources: javaRustSources(plan),
        });
    }
    for (const hook of plan.policy.hooks.filter((hook) => !JAVA_HOOKS[hook])) {
        blockers.push({
            id: `java-hook-${hook}`,
            title: `Java SessionHooks has no ${hook} callback`,
            detail: `Remove the ${hook} hook or choose another language. The pinned Java SDK SessionHooks exposes no setter for it, and silently dropping a selected hook would change the plan.`,
            fields: ["policy.hooks"],
            sources: javaRustSources(plan),
        });
    }
    return blockers;
}

function javaPom(plan: HarnessPlan): string {
    return `<?xml version="1.0" encoding="UTF-8"?>
<!-- Copyright (c) Microsoft Corporation. All rights reserved. -->
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 https://maven.apache.org/xsd/maven-4.0.0.xsd">
  <modelVersion>4.0.0</modelVersion>
  <groupId>example.harness</groupId>
  <artifactId>${projectName(plan)}</artifactId>
  <version>1.0.0</version>
  <properties>
    <project.build.sourceEncoding>UTF-8</project.build.sourceEncoding>
    <maven.compiler.release>17</maven.compiler.release>
    <copilot.version>${JAVA_SDK_VERSION}</copilot.version>
  </properties>
  <dependencies>
    <dependency>
      <groupId>com.github</groupId><artifactId>copilot-sdk-java</artifactId>
      <version>\${copilot.version}</version>
    </dependency>
${
    plan.target.runtime === "inprocess"
        ? `    <dependency>
      <groupId>net.java.dev.jna</groupId><artifactId>jna</artifactId><version>5.19.1</version>
    </dependency>
`
        : ""
}  </dependencies>
  <build>
    <plugins>
      <plugin>
        <groupId>org.apache.maven.plugins</groupId><artifactId>maven-compiler-plugin</artifactId>
        <version>3.14.1</version>
        <configuration>
          <compilerArgs><arg>-Acopilot.experimental.allowed=true</arg></compilerArgs>
        </configuration>
      </plugin>
      <plugin>
        <groupId>org.codehaus.mojo</groupId><artifactId>exec-maven-plugin</artifactId>
        <version>3.5.0</version>
        <configuration>
          <mainClass>harness.Main</mainClass>
        </configuration>
      </plugin>
    </plugins>
  </build>
</project>
`;
}

export const javaAdapter: LanguageAdapter = {
    language: "java",
    label: "Java",
    check: checkJava,
    generate(plan) {
        const blockers = checkJava(plan);
        if (blockers.length) throw new Error(blockers.map((blocker) => blocker.detail).join("\n"));
        // The pinned source cannot build native classifier artifacts (copilot-native's fetch script imports
        // repository-root scripts absent at this revision), so these runtimes use a host-provisioned package.
        const cliPathRuntime =
            plan.target.runtime === "inprocess" ||
            (plan.target.runtime === "managed" && !plan.target.cliPath.trim());
        const requirements = javaRustRequirements(plan, "src/main/java/harness/HostExtensions.java");
        requirements.push({
            id: "java-source-sdk",
            title: "Build the pinned SDK source with Maven and JDK 25",
            detail: `Install JDK 25, Maven, Git, and Node.js, then run setup-sdk.sh --run. It checks out ${JAVA_RUST_SDK_REVISION} into .sdk-source/copilot-sdk and installs matching ${JAVA_SDK_VERSION} artifacts in your local Maven repository. It refuses to reset, replace, or build over a dirty/different existing checkout. The generated application targets Java 17 bytecode.`,
            file: "setup-sdk.sh",
            kind: "runtime",
        });
        if (cliPathRuntime) {
            requirements.push({
                id: "env-COPILOT_CLI_PATH",
                environmentVariable: "COPILOT_CLI_PATH",
                title: "Set COPILOT_CLI_PATH to a provisioned runtime package",
                detail: `The pinned SDK source cannot build its bundled native classifier artifacts: copilot-native/scripts/fetch-native.mjs imports repository-root scripts that ${JAVA_RUST_SDK_REVISION} no longer contains, so every native-* Maven profile fails. Install a compatible Copilot runtime package (CLI ${COPILOT_CLI_VERSION}) on this host and point COPILOT_CLI_PATH at its executable${plan.target.runtime === "inprocess" ? ", with an adjacent runtime.node or prebuilds/<platform>/runtime.node" : ""}. ${plan.target.runtime === "managed" ? "Alternatively set target.cliPath in the plan. " : ""}Preflight checks the path.`,
                file: "src/main/java/harness/HostExtensions.java",
                kind: "environment",
            });
        }
        return {
            files: [
                { path: "pom.xml", content: javaPom(plan), language: "xml" },
                {
                    path: "setup-sdk.sh",
                    content: javaSetupScript(JAVA_RUST_SDK_REVISION, cliPathRuntime),
                    language: "text",
                },
                {
                    path: ".sdk-source/.gitignore",
                    content: "# Copyright (c) Microsoft Corporation. All rights reserved.\n*\n!.gitignore\n",
                    language: "text",
                },
                {
                    path: "src/main/resources/bootstrap-config.json",
                    content:
                        JSON.stringify({ ...javaRustConfiguration(plan), cliPathRuntime }, null, 2) + "\n",
                    language: "json",
                },
                {
                    path: "src/main/java/harness/Main.java",
                    content: renderJavaSource(JAVA_MAIN, plan),
                    language: "java",
                },
                {
                    path: "src/main/java/harness/Configuration.java",
                    content: renderJavaSource(JAVA_CONFIG, plan),
                    language: "java",
                },
                {
                    path: "src/main/java/harness/HostExtensions.java",
                    content: renderJavaSource(JAVA_HOST, plan),
                    language: "java",
                },
                ...javaRustServerFiles(plan),
            ],
            commands: {
                install: ["bash setup-sdk.sh --run", "mvn -q package"],
                check: 'mvn -q compile exec:java -Dexec.args="--check"',
                run: 'mvn -q compile exec:java -Dexec.args="Describe your task here"',
                ...(plan.target.runtime === "external"
                    ? { startRuntime: "bash start-runtime.sh --run" }
                    : {}),
            },
            requirements,
            notes: [
                `This project deliberately uses locally built ${JAVA_SDK_VERSION} SDK artifacts (the pinned java/pom.xml revision), not a Maven Central release. setup-sdk.sh pins and checks the SDK commit before installing.`,
                "Bundled native runtime classifier JARs are not buildable from the pinned SDK source (its native Maven profiles run a fetch script whose imported repository scripts were removed), so managed children without target.cliPath and in-process hosting load a host-provisioned runtime package from COPILOT_CLI_PATH.",
                ...(plan.model.allowedModels.length
                    ? [
                          "The Java SessionConfig has no allowedModels field. Main.java applies the allowlist with the experimental session.getRpc().model.setAllowedModels immediately after createSession and before the first message; a failure closes the session and stops the client.",
                      ]
                    : []),
                ...(plan.events.logLevel !== "default" && plan.target.runtime === "external"
                    ? [
                          "The client log level is a launch option for runtimes the SDK starts; it is not sent to an existing server. Configure the server's --log-level in start-runtime.sh on the runtime host.",
                      ]
                    : []),
                "bootstrap-config.json is mapped field-by-field into Java SDK setters. It is not deserialized into SessionConfig: Jackson ignores several of that class's Boolean properties. Edit Configuration.java when adding a new configuration field.",
                plan.model.provider === "copilot" && plan.identity === "s2s-installation"
                    ? plan.target.runtime === "external"
                        ? "GitHub App S2S identity is configured by start-runtime.sh on the separately operated runtime host. The Java client does not receive or inject COPILOT_GITHUB_TOKEN and does not install a GitHub token provider."
                        : plan.target.runtime === "inprocess"
                          ? "GitHub App S2S identity requires COPILOT_GITHUB_TOKEN before the in-process runtime loads. Logged-in-user fallback is false and no GitHub token provider is generated."
                          : "GitHub App S2S identity copies COPILOT_GITHUB_TOKEN into the managed child environment through CopilotClientOptions.setEnvironment. Logged-in-user fallback is false and no GitHub token provider is generated."
                    : "GITHUB_TOKEN_EXPIRES_AT is a real UNIX expiry, not a duration. The planner's GitHub identity selection configures Copilot authentication; BYOK uses its selected provider credential route. Downstream services still need host-owned authorization.",
                plan.policy.permissionMode === "host"
                    ? "Host permission handling is a required HostExtensions.java integration and fails preflight until implemented. Tool overrides retain their names, schemas, and terminal flags; selected host tools/hooks follow the same fail-before-start pattern."
                    : "The configuration explicitly binds PermissionHandler.APPROVE_ALL. It approves ordinary requests once; managed policy, content exclusion, downstream authorization, tool validity, and sandbox enablement still apply, while enabled sandbox bypass can also be approved.",
                "Console input is serialized on a daemon host thread; EOF, forbidden freeform answers, and unavailable input fail explicitly. Observers print event class names only, never prompts, arguments, tool results, or credentials. Streaming still reaches the SDK when selected.",
                "Session close detaches before client shutdown. Explicit stop errors are retained as suppressed errors when a primary operation failed. A completed turn without an assistant message is reported explicitly, including terminal-tool turns.",
                "For in-process hosting, set process-global settings before application startup. COPILOT_CLI_PATH must select a compatible package with adjacent runtime.node or prebuilds/<classifier>/runtime.node; it is not a bare-library argument. No mode or permission filter provides OS-level sandboxing.",
                "Paths are interpreted on the future runtime host. For external services, start-runtime.sh applies server-owned COPILOT_HOME, idle timeout, and login policy there; --check does not probe or reconfigure the server.",
            ],
            sources: javaRustSources(plan),
        };
    },
};
