// Copyright (c) Microsoft Corporation. All rights reserved.
import { reference } from "../../content/reference";

export function sourceSetupScript(commands: string[]): string {
    return [
        "#!/usr/bin/env bash",
        "# Copyright (c) Microsoft Corporation. All rights reserved.",
        "set -euo pipefail",
        'cd "$(dirname "$0")"',
        `SDK_REVISION=${reference.revisions.sdk}`,
        "SDK_DIRECTORY=.sdk-source/copilot-sdk",
        'if [ -e "$SDK_DIRECTORY" ] && [ ! -d "$SDK_DIRECTORY/.git" ]; then',
        '  printf "Refusing to overwrite an existing non-Git SDK directory.\\n" >&2',
        "  exit 1",
        "fi",
        'if [ ! -d "$SDK_DIRECTORY/.git" ]; then',
        '  mkdir -p "$SDK_DIRECTORY"',
        '  git -C "$SDK_DIRECTORY" init --quiet',
        '  git -C "$SDK_DIRECTORY" remote add origin https://github.com/github/copilot-sdk.git',
        '  git -C "$SDK_DIRECTORY" fetch --quiet --depth 1 origin "$SDK_REVISION"',
        '  git -C "$SDK_DIRECTORY" checkout --quiet --detach "$SDK_REVISION"',
        "else",
        '  ACTUAL_REVISION=$(git -C "$SDK_DIRECTORY" rev-parse HEAD)',
        '  if [ "$ACTUAL_REVISION" != "$SDK_REVISION" ]; then',
        '    printf "Existing SDK checkout has another revision; resolve it manually. No reset was performed.\\n" >&2',
        "    exit 1",
        "  fi",
        "fi",
        ...commands,
        'printf "\\nSDK source provisioning complete. Review README.md and host integration points before running.\\n"',
        "",
    ].join("\n");
}
