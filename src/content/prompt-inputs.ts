// Copyright (c) Microsoft Corporation. All rights reserved.
export interface PromptInput {
    id: string;
    label: string;
    meaning: string;
    suppliedBy: string;
    example: string;
    condition: string;
}

export const promptInputs: PromptInput[] = [
    {
        id: "interaction_mode",
        label: "Interaction-mode guidance",
        meaning: "Instructions appropriate to interactive, headless, or autonomous work.",
        suppliedBy: "Session mode and host capabilities",
        example: "Whether the agent can ask a person for input or must finish a non-interactive task.",
        condition:
            "Changes with the actual runtime mode; it is not the SDK empty/copilot-cli client setting.",
    },
    {
        id: "search_and_delegation",
        label: "Search and delegation guidance",
        meaning: "Which search paths and available specialist agents the model should prefer.",
        suppliedBy: "Registered search tools and agent capabilities",
        example:
            "Prefer the configured glob/grep tools for narrow lookups; use an available specialist for broader exploration.",
        condition: "Only guidance relevant to the supplied tools/agents is included.",
    },
    {
        id: "tool_efficiency",
        label: "Tool-use guidance",
        meaning: "Instructions about batching, tool choice, and efficient execution.",
        suppliedBy: "The tool-efficiency builder and effective tool inventory",
        example: "Use a small number of direct read/search/edit calls for a simple lookup.",
        condition: "Tool names and delegation guidance depend on the active inventory.",
    },
    {
        id: "version_information",
        label: "Runtime version",
        meaning: "The version reported by the runtime package.",
        suppliedBy: "Runtime/package metadata",
        example: "Version number: <the runtime package version>",
        condition: "Omitted when no version is supplied to the assembler.",
    },
    {
        id: "model_information",
        label: "Model identity or Auto routing",
        meaning: "The selected model's identity, or guidance that Auto chooses it dynamically.",
        suppliedBy: "Resolved model selection",
        example: "Auto is active; a concrete model can change between requests.",
        condition: "Model-specific text is not resolved by this offline builder.",
    },
    {
        id: "direct_action_line",
        label: "Direct-action tool names",
        meaning: "A tool-efficiency sentence naming the actual direct search/read/edit tools.",
        suppliedBy: "Available tool metadata",
        example: "Use the configured read, search, and edit tools for a small task.",
        condition:
            "Absent when no matching tools are registered. This is a Rust-format slot, not an SDK macro.",
    },
    {
        id: "chaining_instruction",
        label: "Shell command chaining",
        meaning: "Whether related shell commands can use supported chaining syntax.",
        suppliedBy: "Selected shell and syntax support",
        example: "Chain related shell commands with && when the shell supports it.",
        condition: "Depends on the host shell; not every platform/shell gets the same text.",
    },
    {
        id: "investigation_line",
        label: "Investigation reminder",
        meaning: "The runtime's reminder that batching does not replace investigation.",
        suppliedBy: "A static runtime fragment",
        example: "Batching does not replace investigation; understand the evidence before acting.",
        condition: "A source-template input used to compose the tool-efficiency paragraph.",
    },
    {
        id: "sync_line",
        label: "Subagent scheduling guidance",
        meaning: "Guidance about synchronous work versus useful background parallelism.",
        suppliedBy: "Presence of the task/delegation tool",
        example: "Use background work when there is independent work to do, not merely to poll.",
        condition: "Included only for a harness with the corresponding delegation capability.",
    },
    {
        id: "display_line",
        label: "Baseline output surface",
        meaning: "The coding baseline's statement about where output is displayed.",
        suppliedBy: "The default tool-efficiency builder",
        example: "Your output appears in a command-line interface.",
        condition: "A non-terminal product may want to change this coding-harness assumption.",
    },
    {
        id: "working_directory",
        label: "Runtime working directory",
        meaning: "The actual directory in which the future runtime/session operates.",
        suppliedBy: "Host and session working-directory configuration",
        example: "/workspace/project (illustrative, not this web app's directory)",
        condition: "For an existing service it refers to that runtime host, not the browser machine.",
    },
    {
        id: "repository_and_git_root",
        label: "Repository context",
        meaning: "Verified repository identity and its resolved Git root, when present.",
        suppliedBy: "Runtime/host repository discovery",
        example: "A repository rooted at /workspace/project.",
        condition: "Can be absent for non-repository business workflows.",
    },
    {
        id: "operating_system",
        label: "Host platform",
        meaning: "Platform details relevant to paths, commands, and execution.",
        suppliedBy: "The runtime's host environment",
        example: "Windows or a POSIX host, with the matching path conventions.",
        condition: "The builder does not inspect the future deployment platform.",
    },
    {
        id: "available_tool_names",
        label: "Effective tool inventory",
        meaning: "Tool names available after configuration, filtering, and runtime feature gates.",
        suppliedBy: "Runtime tool registration and session policy",
        example: "The selected built-ins, custom handlers, and MCP tools.",
        condition: "The full compiled catalog is not the same thing as this effective session list.",
    },
    {
        id: "platform_specific_guidance",
        label: "Platform-specific guidance",
        meaning: "Additional instructions needed for the chosen host platform.",
        suppliedBy: "OS and shell-specific runtime branches",
        example: "Windows path handling and shell syntax notes.",
        condition: "Only relevant platform guidance is added.",
    },
    {
        id: "model_or_host_additional_rules",
        label: "Additional coding rules",
        meaning: "Model-tuned or host-supplied rules appended to the common code-change guidance.",
        suppliedBy: "Model profile and materialized prompt inputs",
        example: "Additional validation or editing guidance for a selected model.",
        condition: "The generic source fragments do not contain every model's tuned rules.",
    },
    {
        id: "capability_specific_guidance",
        label: "Capability-specific guidance",
        meaning:
            "Optional guidance for capabilities such as documentation lookup or specialist collaboration.",
        suppliedBy: "Enabled capabilities and registered tools",
        example: "Documentation-tool guidance only when that tool is available.",
        condition: "A disabled capability should not be inferred from a reference placeholder.",
    },
    {
        id: "tips_selected_for_available_tools",
        label: "Tool-aware task tips",
        meaning: "Task tips selected for the concrete editing and user-input tools.",
        suppliedBy: "Runtime guideline builders",
        example: "How to ask for input or use the supplied patch tool.",
        condition: "The content depends on the available tool variants.",
    },
    {
        id: "sandbox_or_host_environment_limitations",
        label: "Sandbox and host boundaries",
        meaning:
            "The actual execution constraints, including whether the host is sandboxed and which paths are permitted.",
        suppliedBy: "Host sandbox state and runtime environment policy",
        example:
            "A confined host describes permitted paths; an unconfined host warns that it shares an environment.",
        condition:
            "This is not a setting that grants permissions. Enforced isolation and authorization remain outside prompt text.",
    },
    {
        id: "runtime_safety_and_data_handling_guidance",
        label: "Safety and data-handling guidance",
        meaning: "The runtime's static safety guidance plus environment-dependent restrictions.",
        suppliedBy: "The environment-limitations template and host policy",
        example: "Protect secrets and respect execution/data boundaries.",
        condition: "Changing this text does not bypass enforced host or organization policy.",
    },
    {
        id: "instructions_for_each_configured_tool",
        label: "Per-tool instructions",
        meaning: "Usage guidance attached to the tools actually configured for the session.",
        suppliedBy: "Built-in, external, and MCP tool metadata",
        example: "A read tool may describe supported inputs and result-size behavior.",
        condition:
            "Removing or overriding a tool can change this guidance; the offline reference is not a live catalog expansion.",
    },
    {
        id: "organization_repository_and_host_instruction_content",
        label: "Custom instruction content",
        meaning: "Instruction text deliberately supplied or discovered from approved sources.",
        suppliedBy: "Host, organization, repository, and configured instruction inputs",
        example: "Reviewed team coding conventions or domain operating rules.",
        condition: "No personal, tenant, or repository-local instruction file is read by this browser app.",
    },
    {
        id: "mode_memory_model_mcp_agent_and_extension_guidance",
        label: "Additional runtime guidance",
        meaning: "Further guidance assembled from enabled session behavior and materialized inputs.",
        suppliedBy:
            "Runtime builders for modes, context, model/provider behavior, MCP, agents, and extensions",
        example: "Mode-specific or memory-related guidance when those capabilities are configured.",
        condition:
            "Contributors vary by runtime version and enabled capabilities; this is not one fixed prompt string.",
    },
    {
        id: "model_specific_and_subagent_guidance",
        label: "Final model/agent additions",
        meaning:
            "Additional model-specific or configured-subagent guidance near the final instruction section.",
        suppliedBy: "Model profile and configured agent preferences",
        example: "Final delegation/model guidance relevant to the selected task configuration.",
        condition: "The actual content and cache-block placement are resolved by the runtime.",
    },
];

const byId = new Map(promptInputs.map((input) => [input.id, input]));
const markers = /\{\{([^{}]+)\}\}|\{([a-z_]+)\}/g;

export function inputsInReference(content: string): PromptInput[] {
    const ids = new Set([...content.matchAll(markers)].map((match) => match[1] ?? match[2]));
    return [...ids].map((id) => {
        const input = id ? byId.get(id) : undefined;
        if (!input) throw new Error(`Unexplained prompt reference input: ${String(id)}`);
        return input;
    });
}

export function readablePromptReference(content: string): string {
    return content.replace(markers, (_marker, double: string | undefined, single: string | undefined) => {
        const id = double ?? single;
        const input = id ? byId.get(id) : undefined;
        if (!input) throw new Error(`Unexplained prompt reference input: ${String(id)}`);
        return `[Runtime supplies: ${input.label}]`;
    });
}
