// Copyright (c) Microsoft Corporation. All rights reserved.
import { SDK_SOURCE_REVISION } from "./revisions";

export interface SourceCheckout {
    /** HTTPS clone URL. */
    repository: string;
    revision: string;
    /** Directory under the generated project, e.g. .sdk-source/copilot-sdk. */
    directory: string;
    /** Optional non-cone sparse-checkout paths for very large repositories. */
    sparse?: string[];
    /** Human-readable access note for --help. */
    access?: string;
}

export const PUBLIC_SDK_CHECKOUT: SourceCheckout = {
    repository: "https://github.com/github/copilot-sdk.git",
    revision: SDK_SOURCE_REVISION,
    directory: ".sdk-source/copilot-sdk",
};

export function sourceSetupScript(commands: string[], source: SourceCheckout = PUBLIC_SDK_CHECKOUT): string {
    return [
        "#!/usr/bin/env bash",
        "# Copyright (c) Microsoft Corporation. All rights reserved.",
        "set -euo pipefail",
        "usage() {",
        "  cat <<'HELP'",
        "Usage: bash setup-sdk.sh [--run | --help]",
        "Without --run, explain setup without changing files.",
        `Requires Git, Node.js, npm, and ${source.access ?? "access to the pinned SDK source"}.`,
        `Provisions ${source.directory} and installs/builds the generated project.`,
        "Existing symlinks, non-repository directories, dirty checkouts, or another revision are refused.",
        "HELP",
        "}",
        'if [ "$#" -eq 0 ] || [ "${1:-}" = "--help" ]; then usage; exit 0; fi',
        'if [ "$#" -ne 1 ] || [ "$1" != "--run" ]; then usage >&2; exit 2; fi',
        'cd "$(dirname "$0")"',
        `SDK_REVISION=${source.revision}`,
        `SDK_DIRECTORY=${source.directory}`,
        'if [ -L .sdk-source ] || [ -L "$SDK_DIRECTORY" ]; then',
        '  printf "Refusing SDK setup through a symlink.\\n" >&2',
        "  exit 1",
        "fi",
        'if [ -e "$SDK_DIRECTORY" ] && [ ! -d "$SDK_DIRECTORY/.git" ]; then',
        '  printf "Refusing to overwrite an existing non-Git SDK directory.\\n" >&2',
        "  exit 1",
        "fi",
        'if [ ! -d "$SDK_DIRECTORY/.git" ]; then',
        '  mkdir -p "$SDK_DIRECTORY"',
        '  git -C "$SDK_DIRECTORY" init --quiet',
        `  git -C "$SDK_DIRECTORY" remote add origin ${source.repository}`,
        ...(source.sparse?.length
            ? [
                  '  git -C "$SDK_DIRECTORY" config core.sparseCheckout true',
                  `  git -C "$SDK_DIRECTORY" sparse-checkout set --no-cone ${source.sparse.map((path) => `'/${path}/'`).join(" ")}`,
                  '  git -C "$SDK_DIRECTORY" fetch --quiet --depth 1 --filter=blob:none origin "$SDK_REVISION"',
              ]
            : ['  git -C "$SDK_DIRECTORY" fetch --quiet --depth 1 origin "$SDK_REVISION"']),
        '  git -C "$SDK_DIRECTORY" checkout --quiet --detach "$SDK_REVISION"',
        "else",
        '  ACTUAL_REVISION=$(git -C "$SDK_DIRECTORY" rev-parse HEAD)',
        '  if [ "$ACTUAL_REVISION" != "$SDK_REVISION" ]; then',
        '    printf "Existing SDK checkout has another revision; resolve it manually. No reset was performed.\\n" >&2',
        "    exit 1",
        "  fi",
        '  if [ -n "$(git -C "$SDK_DIRECTORY" status --porcelain)" ]; then',
        '    printf "Existing SDK checkout has local changes; review them before setup.\\n" >&2',
        "    exit 1",
        "  fi",
        "fi",
        ...commands,
        'printf "\\nSDK source provisioning complete. Review README.md and host integration points before running.\\n"',
        "",
    ].join("\n");
}
