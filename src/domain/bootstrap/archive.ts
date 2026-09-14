// Copyright (c) Microsoft Corporation. All rights reserved.
import { strToU8, zipSync } from "fflate";
import type { BootstrapProject } from "./types";

export function createBootstrapArchive(project: BootstrapProject): Uint8Array<ArrayBuffer> {
    const entries: Record<string, Uint8Array> = {};
    for (const file of project.files) {
        if (
            !file.path ||
            file.path.startsWith("/") ||
            file.path.includes("\\") ||
            file.path.split("/").some((part) => part === ".." || part === ".")
        ) {
            throw new Error(`Unsafe bootstrap file path: ${file.path}`);
        }
        const path = `${project.name}/${file.path}`;
        if (Object.hasOwn(entries, path)) throw new Error(`Duplicate bootstrap path: ${file.path}`);
        entries[path] = strToU8(file.content);
    }
    return new Uint8Array(zipSync(entries, { level: 6 }));
}
