// Copyright (c) Microsoft Corporation. All rights reserved.
import { Box, Code2, Layers3 } from "lucide-react";
import type { PresetId } from "../domain/plan";

export const profileIcons = { empty: Box, minimal: Layers3, copilot: Code2 } satisfies Record<
    PresetId,
    typeof Box
>;
