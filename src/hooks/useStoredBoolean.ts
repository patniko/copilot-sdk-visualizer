// Copyright (c) Microsoft Corporation. All rights reserved.
import { useState } from "react";

export function useStoredBoolean(key: string) {
    const [value, setValue] = useState(() => {
        try {
            return globalThis.localStorage?.getItem(key) === "1";
        } catch {
            return false;
        }
    });

    function toggle() {
        setValue((current) => {
            const next = !current;
            try {
                globalThis.localStorage?.setItem(key, next ? "1" : "0");
            } catch {
                // Browser preferences are best-effort.
            }
            return next;
        });
    }

    return [value, toggle] as const;
}
