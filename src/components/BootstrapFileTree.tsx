// Copyright (c) Microsoft Corporation. All rights reserved.
import { FileText, Folder } from "lucide-react";
import type { BootstrapFile } from "../domain/bootstrap/types";

type FileNode =
    | { kind: "file"; path: string; name: string }
    | { kind: "directory"; path: string; name: string; children: FileNode[] };

function fileTree(files: BootstrapFile[]): FileNode[] {
    const root: FileNode[] = [];
    for (const file of files) {
        const parts = file.path.split("/");
        let children = root;
        for (const [index, name] of parts.entries()) {
            const path = parts.slice(0, index + 1).join("/");
            if (index === parts.length - 1) {
                children.push({ kind: "file", name, path: file.path });
            } else {
                let folder = children.find((node) => node.kind === "directory" && node.path === path);
                if (!folder) {
                    folder = { kind: "directory", name, path, children: [] };
                    children.push(folder);
                }
                if (folder.kind === "directory") children = folder.children;
            }
        }
    }
    return root;
}

export function BootstrapFileTree({
    files,
    selected,
    onSelect,
}: {
    files: BootstrapFile[];
    selected: string;
    onSelect: (path: string) => void;
}) {
    return (
        <nav className="hb-project-files" aria-label="Bootstrap project files">
            <p className="hb-small-label">Project files</p>
            <TreeNodes nodes={fileTree(files)} selected={selected} onSelect={onSelect} />
        </nav>
    );
}

function TreeNodes({
    nodes,
    selected,
    onSelect,
}: {
    nodes: FileNode[];
    selected: string;
    onSelect: (path: string) => void;
}) {
    return (
        <ul className="hb-file-tree">
            {nodes.map((node) => (
                <li key={node.path}>
                    {node.kind === "directory" ? (
                        <details open>
                            <summary>
                                <Folder size={14} aria-hidden="true" />
                                <span>{node.name}</span>
                            </summary>
                            <TreeNodes nodes={node.children} selected={selected} onSelect={onSelect} />
                        </details>
                    ) : (
                        <button
                            className={`hb-file-tree-button${node.path === selected ? " hb-file-tree-selected" : ""}`}
                            aria-current={node.path === selected ? "true" : undefined}
                            aria-label={`Preview ${node.path}`}
                            title={node.path}
                            onClick={() => onSelect(node.path)}
                        >
                            <FileText size={14} aria-hidden="true" />
                            <span>{node.name}</span>
                        </button>
                    )}
                </li>
            ))}
        </ul>
    );
}
