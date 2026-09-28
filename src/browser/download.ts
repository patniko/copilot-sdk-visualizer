// Copyright (c) Microsoft Corporation. All rights reserved.

export function downloadBlob(blob: Blob, name: string) {
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    try {
        anchor.href = url;
        anchor.download = name;
        document.body.append(anchor);
        anchor.click();
    } finally {
        anchor.remove();
        window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    }
}
