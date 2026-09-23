// Copyright (c) Microsoft Corporation. All rights reserved.
import { useCallback, useEffect, useState } from "react";
import type { ViewId } from "../components/editor";

function viewFromLocation(navigation: readonly { id: ViewId }[]): ViewId {
    return navigation.find((entry) => `#${entry.id}` === window.location.hash)?.id ?? "overview";
}

function focusEditorHeading() {
    window.requestAnimationFrame(() => document.getElementById("editor-heading")?.focus());
}

export function useViewNavigation(navigation: readonly { id: ViewId }[]) {
    const [view, setView] = useState<ViewId>(() => viewFromLocation(navigation));

    useEffect(() => {
        const onHashChange = () => {
            if (window.location.hash && !navigation.some((entry) => `#${entry.id}` === window.location.hash))
                return;
            setView(viewFromLocation(navigation));
            focusEditorHeading();
        };
        window.addEventListener("hashchange", onHashChange);
        return () => window.removeEventListener("hashchange", onHashChange);
    }, [navigation]);

    const navigate = useCallback((next: ViewId) => {
        setView(next);
        if (window.location.hash !== `#${next}`) window.history.pushState(null, "", `#${next}`);
        focusEditorHeading();
    }, []);

    return { view, navigate };
}
