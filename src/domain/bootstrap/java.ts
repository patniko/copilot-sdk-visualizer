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
import { JAVA_CONFIG, JAVA_HOST, JAVA_MAIN, javaSetupScript } from "./java-templates";
import type { BootstrapBlocker, LanguageAdapter } from "./types";

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
    return blockers;
}

function javaPom(plan: HarnessPlan, bundled: boolean): string {
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
    <copilot.version>1.0.14-SNAPSHOT</copilot.version>
${bundled ? "    <copilot.runtime.classifier>${env.COPILOT_JAVA_RUNTIME_CLASSIFIER}</copilot.runtime.classifier>\n" : ""}  </properties>
  <dependencies>
    <dependency>
      <groupId>com.github</groupId><artifactId>copilot-sdk-java</artifactId>
      <version>\${copilot.version}</version>
    </dependency>
${
    bundled
        ? `    <dependency>
      <groupId>com.github</groupId><artifactId>copilot-sdk-java-runtime</artifactId>
      <version>\${copilot.version}</version><classifier>\${copilot.runtime.classifier}</classifier>
    </dependency>
`
        : ""
}${
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
${
    bundled
        ? `          <systemProperties>
            <systemProperty><key>copilot.runtime.classifier</key><value>\${copilot.runtime.classifier}</value></systemProperty>
          </systemProperties>
`
        : ""
}        </configuration>
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
        const bundled =
            plan.target.runtime === "inprocess" ||
            (plan.target.runtime === "managed" && !plan.target.cliPath.trim());
        const requirements = javaRustRequirements(plan, "src/main/java/harness/HostExtensions.java");
        requirements.push({
            id: "java-source-sdk",
            title: "Build the pinned SDK source with Maven and JDK 25",
            detail: `Install JDK 25, Maven, Git, and Node.js, then run setup-sdk.sh --run. It checks out ${JAVA_RUST_SDK_REVISION} into .sdk-source/copilot-sdk and installs matching 1.0.14-SNAPSHOT artifacts in your local Maven repository. It refuses to reset, replace, or build over a dirty/different existing checkout. The generated application targets Java 17 bytecode.`,
            file: "setup-sdk.sh",
            kind: "runtime",
        });
        if (bundled) {
            requirements.push({
                id: "env-COPILOT_JAVA_RUNTIME_CLASSIFIER",
                environmentVariable: "COPILOT_JAVA_RUNTIME_CLASSIFIER",
                title: "Set COPILOT_JAVA_RUNTIME_CLASSIFIER explicitly",
                detail: "Choose the native build/deployment host: linux-x64 or linux-arm64 (glibc only), win32-x64, win32-arm64, or darwin-arm64. For example: export COPILOT_JAVA_RUNTIME_CLASSIFIER=darwin-arm64. The setup script validates the host and refuses unsupported artifacts; do not use darwin-x64 or linuxmusl classifiers.",
                file: "setup-sdk.sh",
                kind: "environment",
            });
        }
        return {
            files: [
                { path: "pom.xml", content: javaPom(plan, bundled), language: "xml" },
                {
                    path: "setup-sdk.sh",
                    content: javaSetupScript(JAVA_RUST_SDK_REVISION, bundled),
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
                        JSON.stringify({ ...javaRustConfiguration(plan), bundledRuntime: bundled }, null, 2) +
                        "\n",
                    language: "json",
                },
                { path: "src/main/java/harness/Main.java", content: JAVA_MAIN, language: "java" },
                { path: "src/main/java/harness/Configuration.java", content: JAVA_CONFIG, language: "java" },
                { path: "src/main/java/harness/HostExtensions.java", content: JAVA_HOST, language: "java" },
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
                "This project deliberately uses locally built 1.0.14-SNAPSHOT SDK artifacts, not release 1.0.13. Source API support does not prove Maven Central availability. setup-sdk.sh pins and checks the SDK commit before installing.",
                "bootstrap-config.json is mapped field-by-field into Java SDK setters. It is not deserialized into SessionConfig: Jackson ignores several of that class's Boolean properties. Edit Configuration.java when adding a new configuration field.",
                "GITHUB_TOKEN_EXPIRES_AT is a real UNIX expiry, not a duration. The planner's GitHub identity selection configures Copilot authentication; BYOK uses its selected provider credential route. Downstream services still need host-owned authorization.",
                "The default permission handler rejects every effect. Tool overrides retain their names, schemas and terminal flags; selected host tools/hooks deliberately fail preflight until implemented in HostExtensions.java.",
                "Console input is serialized on a daemon host thread; EOF, forbidden freeform answers, and unavailable input fail explicitly. Observers print event class names only, never prompts, arguments, tool results, or credentials. Streaming still reaches the SDK when selected.",
                "Session close detaches before client shutdown. Explicit stop errors are retained as suppressed errors when a primary operation failed. A completed turn without an assistant message is reported explicitly, including terminal-tool turns.",
                "For in-process hosting, set process-global settings before application startup. COPILOT_CLI_PATH can select a compatible package with adjacent runtime.node or prebuilds/<classifier>/runtime.node; it is not a bare-library argument. No mode or permission filter provides OS-level sandboxing.",
                "Paths are interpreted on the future runtime host. For external services, start-runtime.sh applies server-owned COPILOT_HOME, idle timeout, and login policy there; --check does not probe or reconfigure the server.",
                `Java API evidence at SDK ${JAVA_RUST_SDK_REVISION}: java/README.md (JDK/dependencies); java/sdk/src/main/java/com/github/copilot/rpc/RuntimeConnection.java:42-93; CopilotSession.java:598-635,2522-2561; rpc/SessionConfig.java:43-123,1438-1626; rpc/ToolDefinition.java:65-95; ffi/NativeRuntimeLoader.java:324-343.`,
            ],
            sources: javaRustSources(plan),
        };
    },
};
