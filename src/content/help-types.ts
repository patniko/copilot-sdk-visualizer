// Copyright (c) Microsoft Corporation. All rights reserved.
export interface HelpSource {
    label: string;
    url?: string;
}

interface HelpBase {
    title: string;
    option: string;
    summary: string;
    scope?: string;
    example: string;
    boundary: string;
    sources: HelpSource[];
}

export interface ToggleHelp extends HelpBase {
    enabled: string;
    disabled: string;
    valueLabels?: { enabled: string; disabled: string };
}

export interface ValueHelp extends HelpBase {
    scope: string;
    details: { title: string; text: string; value?: string }[];
}
