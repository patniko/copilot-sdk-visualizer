// Copyright (c) Microsoft Corporation. All rights reserved.
import { z } from "zod";

export const LANGUAGE_IDS = ["typescript", "python", "go", "csharp", "java", "rust"] as const;
export const RUNTIME_KINDS = ["managed", "external", "inprocess"] as const;
export type BootstrapLanguage = (typeof LANGUAGE_IDS)[number];
export type RuntimeKind = (typeof RUNTIME_KINDS)[number];

export const LANGUAGES = [
    { id: "typescript", label: "TypeScript / Node.js", shortLabel: "TypeScript" },
    { id: "python", label: "Python", shortLabel: "Python" },
    { id: "go", label: "Go", shortLabel: "Go" },
    { id: "csharp", label: "C# / .NET", shortLabel: "C#" },
    { id: "java", label: "Java", shortLabel: "Java" },
    { id: "rust", label: "Rust", shortLabel: "Rust" },
] as const;

export const RUNTIME_OPTIONS = [
    {
        id: "managed",
        title: "Managed child process",
        tag: "Out of process",
        setupPath: "SDK docs: Default setup (bundled CLI)",
        description: "The SDK starts and stops a separate runtime process.",
        boundary: "Application + SDK | child runtime",
        lifecycle: "SDK-owned process lifecycle",
        channel: "JSON-RPC over stdio",
        note: "The established default. In the SDK docs this is the bundled/local CLI path: the SDK ships or locates the CLI and manages it for you. A process boundary is not a filesystem, network, or tenant sandbox.",
    },
    {
        id: "external",
        title: "Existing runtime service",
        tag: "Out of process",
        setupPath: "SDK docs: Backend services (headless CLI over TCP)",
        description: "Connect to a headless runtime that your host operates separately.",
        boundary: "Application + SDK | existing service",
        lifecycle: "Host-owned server; SDK-owned connection",
        channel: "JSON-RPC over TCP",
        note: "The SDK docs' backend-services path. Start and secure the service yourself, and for concurrent users apply the multi-tenancy guidance (empty mode, per-session tokens, isolated state). Disconnecting a client must not be treated as shutting down the shared service.",
    },
    {
        id: "inprocess",
        title: "Native in-process runtime",
        tag: "Experimental",
        setupPath: "SDK docs: In-process runtime (experimental)",
        description: "Load a compatible native runtime into the application process.",
        boundary: "One process: application + SDK + runtime",
        lifecycle: "SDK-managed handles; library can outlive clients",
        channel: "JSON-RPC frames over the C ABI",
        note: "Requires a matching native bundle and language-specific opt-in. Clients share process state; replacing the loaded native runtime version is not supported.",
    },
] as const;

export const BootstrapTargetSchema = z
    .object({
        language: z.enum(LANGUAGE_IDS),
        runtime: z.enum(RUNTIME_KINDS),
        serverUrl: z.string().max(1500),
        cliPath: z.string().max(1000),
    })
    .strict()
    .superRefine((target, context) => {
        if (target.runtime !== "external") return;
        try {
            const url = new URL(
                target.serverUrl.includes("://") ? target.serverUrl : `tcp://${target.serverUrl}`,
            );
            if (
                url.protocol !== "tcp:" ||
                !url.hostname ||
                !url.port ||
                Number(url.port) < 1 ||
                Number(url.port) > 65535 ||
                url.username ||
                url.password ||
                url.search ||
                url.hash ||
                (url.pathname && url.pathname !== "/")
            ) {
                throw new Error("invalid endpoint");
            }
        } catch {
            context.addIssue({
                code: "custom",
                path: ["serverUrl"],
                message:
                    "Use host:port or tcp://host:port for the existing runtime. Keep credentials out of the plan.",
            });
        }
    });
export type BootstrapTarget = z.infer<typeof BootstrapTargetSchema>;

export function defaultTarget(): BootstrapTarget {
    return { language: "typescript", runtime: "managed", serverUrl: "127.0.0.1:4321", cliPath: "" };
}

export function runtimeEndpoint(target: BootstrapTarget): { host: string; port: number; address: string } {
    const checked = BootstrapTargetSchema.parse({ ...target, runtime: "external" });
    const url = new URL(checked.serverUrl.includes("://") ? checked.serverUrl : `tcp://${checked.serverUrl}`);
    return { host: url.hostname.replace(/^\[|\]$/g, ""), port: Number(url.port), address: url.host };
}
