// Copyright (c) Microsoft Corporation. All rights reserved.
import { useState, useSyncExternalStore } from "react";
import { createHarnessStore } from "../domain/store";

export function useHarness() {
    const [store] = useState(() => createHarnessStore(() => window.localStorage));
    const snapshot = useSyncExternalStore(store.subscribe, store.getSnapshot, store.getSnapshot);
    return {
        ...snapshot,
        update: store.update,
        replace: store.replace,
        undo: store.undo,
        redo: store.redo,
    };
}
