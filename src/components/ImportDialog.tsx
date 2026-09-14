// Copyright (c) Microsoft Corporation. All rights reserved.
import { useId, useState } from "react";
import type { FormEvent } from "react";
import { FileJson2, Upload } from "lucide-react";
import { parsePlan } from "../domain/plan";
import type { HarnessPlan } from "../domain/plan";
import { Button, Modal, Notice, TextAreaField } from "./ui";

const MAX_FILE_BYTES = 1_000_000;

export function ImportDialog({
    blocked,
    onImport,
    onClose,
}: {
    blocked: boolean;
    onImport: (plan: HarnessPlan) => void;
    onClose: () => void;
}) {
    const fileId = useId();
    const [text, setText] = useState("");
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [fileName, setFileName] = useState<string | null>(null);

    async function readFile(file: File) {
        setError(null);
        setText("");
        setFileName(null);
        if (file.size > MAX_FILE_BYTES) {
            setError("Plan files must be smaller than 1 MB. The current draft has not changed.");
            return;
        }
        setBusy(true);
        try {
            const contents = await file.text();
            setText(contents);
            setFileName(file.name);
        } catch (cause) {
            setError(
                `Could not read the file: ${cause instanceof Error ? cause.message : String(cause)} The current draft has not changed.`,
            );
        } finally {
            setBusy(false);
        }
    }

    function submit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setError(null);
        let imported: HarnessPlan;
        try {
            imported = parsePlan(text);
        } catch (cause) {
            setError(
                `Import failed; the current draft is unchanged.\n${cause instanceof Error ? cause.message : String(cause)}`,
            );
            return;
        }
        onImport(imported);
    }

    return (
        <Modal
            open
            onOpenChange={(open) => {
                if (!open) onClose();
            }}
            title="Import a harness plan"
            description="Read a planner JSON file entirely in this browser, or paste its contents. Nothing is uploaded."
        >
            <form onSubmit={submit} className="hb-editor-stack">
                <div className="hb-file-input">
                    <FileJson2 size={27} aria-hidden="true" />
                    <label htmlFor={fileId}>Choose a plan JSON file</label>
                    <p>Exported HarnessPlan format, up to 1 MB. No credentials.</p>
                    <input
                        id={fileId}
                        type="file"
                        accept=".json,application/json"
                        disabled={busy}
                        onChange={(event) => {
                            const file = event.currentTarget.files?.[0];
                            event.currentTarget.value = "";
                            if (file) void readFile(file);
                        }}
                    />
                    <p className="hb-field-hint" role="status">
                        {busy
                            ? "Reading locally..."
                            : fileName
                              ? `${fileName} loaded locally. Choose Import plan to apply it.`
                              : "No file selected"}
                    </p>
                </div>
                <TextAreaField
                    label="Plan JSON"
                    value={text}
                    onValueChange={(value) => {
                        setText(value);
                        setError(null);
                        setFileName(null);
                    }}
                    disabled={busy}
                    monospace
                    spellCheck={false}
                    rows={9}
                    placeholder="Or paste an exported plan here"
                    hint="The full schema is validated before any draft is replaced."
                />
                {error && (
                    <Notice title="Plan not imported" tone="error">
                        <span className="hb-preserve-lines">{error}</span>
                    </Notice>
                )}
                <Notice title={blocked ? "Explicit recovery" : "This replaces the current draft"}>
                    {blocked
                        ? "A successful import explicitly replaces the unreadable saved draft. Save errors, if any, remain visible."
                        : "Import applies the whole composition, not a partial merge. Undo restores the previous in-memory draft."}
                </Notice>
                <div className="hb-dialog-actions">
                    <Button onClick={onClose}>Cancel</Button>
                    <Button type="submit" variant="primary" disabled={busy || !text.trim()}>
                        <Upload size={15} aria-hidden="true" />
                        Import plan
                    </Button>
                </div>
            </form>
        </Modal>
    );
}
