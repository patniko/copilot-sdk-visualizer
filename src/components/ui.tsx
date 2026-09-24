// Copyright (c) Microsoft Corporation. All rights reserved.
import { useId, useRef, useState } from "react";
import type { ComponentProps, ReactNode } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { clsx } from "clsx";
import { X } from "lucide-react";
import { splitLines } from "../domain/plan";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
type ButtonSize = "default" | "small" | "icon";

export function Button({
    variant = "secondary",
    size = "default",
    className,
    type = "button",
    ...props
}: ComponentProps<"button"> & { variant?: ButtonVariant; size?: ButtonSize }) {
    return (
        <button
            type={type}
            className={clsx(
                "hb-button",
                `hb-button-${variant}`,
                size !== "default" && `hb-button-${size}`,
                className,
            )}
            {...props}
        />
    );
}

export function Badge({
    children,
    accent = false,
    className,
}: {
    children: ReactNode;
    accent?: boolean;
    className?: string;
}) {
    return <span className={clsx("hb-badge", accent && "hb-badge-accent", className)}>{children}</span>;
}

export function Panel({
    title,
    description,
    action,
    children,
    className,
}: {
    title: string;
    description?: ReactNode;
    action?: ReactNode;
    children: ReactNode;
    className?: string;
}) {
    return (
        <section className={clsx("hb-panel", className)}>
            <div className="hb-panel-heading">
                <div>
                    <h3>{title}</h3>
                    {description && <p>{description}</p>}
                </div>
                {action}
            </div>
            {children}
        </section>
    );
}

export function Notice({
    title,
    children,
    tone = "neutral",
}: {
    title?: string;
    children: ReactNode;
    tone?: "neutral" | "accent" | "error";
}) {
    return (
        <div className={clsx("hb-notice", `hb-notice-${tone}`)} role={tone === "error" ? "alert" : undefined}>
            {title && <strong>{title}</strong>}
            <div>{children}</div>
        </div>
    );
}

interface FieldDetails {
    label: string;
    hint?: ReactNode;
    help?: ReactNode;
    error?: string;
    monospace?: boolean;
}

function FieldLabel({ id, label, help }: { id: string; label: string; help?: ReactNode }) {
    if (!help) return <label htmlFor={id}>{label}</label>;
    return (
        <div className="hb-field-heading">
            <label htmlFor={id}>{label}</label>
            {help}
        </div>
    );
}

function FieldHelp({ id, hint, error }: { id: string; hint?: ReactNode; error?: string }) {
    return (
        <>
            {hint && (
                <p className="hb-field-hint" id={`${id}-hint`}>
                    {hint}
                </p>
            )}
            {error && (
                <p className="hb-field-error" id={`${id}-error`}>
                    {error}
                </p>
            )}
        </>
    );
}

function describedBy(id: string, hint: ReactNode, error?: string) {
    return [hint ? `${id}-hint` : "", error ? `${id}-error` : ""].filter(Boolean).join(" ") || undefined;
}

export function TextField({
    label,
    hint,
    help,
    error,
    monospace,
    value,
    onValueChange,
    className,
    ...props
}: Omit<ComponentProps<"input">, "id" | "value" | "onChange" | "children"> &
    FieldDetails & {
        value: string;
        onValueChange: (value: string) => void;
    }) {
    const id = useId();
    return (
        <div className={clsx("hb-field", className)}>
            <FieldLabel id={id} label={label} help={help} />
            <input
                {...props}
                id={id}
                className={clsx("hb-input", monospace && "hb-mono")}
                value={value}
                onChange={(event) => onValueChange(event.currentTarget.value)}
                aria-invalid={Boolean(error)}
                aria-describedby={describedBy(id, hint, error)}
            />
            <FieldHelp id={id} hint={hint} error={error} />
        </div>
    );
}

export function TextAreaField({
    label,
    hint,
    help,
    error,
    monospace,
    value,
    onValueChange,
    className,
    rows = 5,
    ...props
}: Omit<ComponentProps<"textarea">, "id" | "value" | "onChange" | "children"> &
    FieldDetails & {
        value: string;
        onValueChange: (value: string) => void;
    }) {
    const id = useId();
    return (
        <div className={clsx("hb-field", className)}>
            <FieldLabel id={id} label={label} help={help} />
            <textarea
                {...props}
                id={id}
                className={clsx("hb-input hb-textarea", monospace && "hb-mono")}
                rows={rows}
                value={value}
                onChange={(event) => onValueChange(event.currentTarget.value)}
                aria-invalid={Boolean(error)}
                aria-describedby={describedBy(id, hint, error)}
            />
            <FieldHelp id={id} hint={hint} error={error} />
        </div>
    );
}

export function LineListField({
    values,
    onValuesChange,
    ...props
}: Omit<ComponentProps<typeof TextAreaField>, "value" | "onValueChange"> & {
    values: string[];
    onValuesChange: (values: string[]) => void;
}) {
    const canonical = values.join("\n");
    const [input, setInput] = useState<{ text: string; canonical: string } | null>(null);
    return (
        <TextAreaField
            {...props}
            value={input?.canonical === canonical ? input.text : canonical}
            onValueChange={(text) => {
                const parsed = splitLines(text);
                // Keep an in-progress newline without delaying the live plan update.
                setInput({ text, canonical: parsed.join("\n") });
                onValuesChange(parsed);
            }}
            onBlur={() => setInput(null)}
        />
    );
}

export interface Option<T extends string> {
    id?: string;
    value: T;
    label: string;
    description?: string;
    disabled?: boolean;
}

export function SelectField<T extends string>({
    label,
    hint,
    help,
    error,
    value,
    options,
    onValueChange,
}: FieldDetails & {
    value: T;
    options: readonly Option<T>[];
    onValueChange: (value: T) => void;
}) {
    const id = useId();
    return (
        <div className="hb-field">
            <FieldLabel id={id} label={label} help={help} />
            <select
                id={id}
                className="hb-input hb-select"
                value={value}
                aria-invalid={Boolean(error)}
                aria-describedby={describedBy(id, hint, error)}
                onChange={(event) => {
                    const option = options.find((entry) => entry.value === event.currentTarget.value);
                    if (option) onValueChange(option.value);
                }}
            >
                {options.map((option) => (
                    <option key={option.id ?? option.value} value={option.value} disabled={option.disabled}>
                        {option.label}
                    </option>
                ))}
            </select>
            <FieldHelp id={id} hint={hint} error={error} />
        </div>
    );
}

export function ChoiceField<T extends string>({
    label,
    value,
    options,
    onValueChange,
    compact = false,
    hideLabel = false,
    hint,
    help,
    error,
}: FieldDetails & {
    value: T;
    options: readonly Option<T>[];
    onValueChange: (value: T) => void;
    compact?: boolean;
    hideLabel?: boolean;
}) {
    const id = useId();
    return (
        <fieldset
            className={clsx("hb-choice-field", compact && "hb-choice-compact")}
            aria-describedby={describedBy(id, hint, error)}
        >
            <legend id={`${id}-label`} className={clsx(hideLabel && "hb-sr-only")}>
                {label}
            </legend>
            {help && <div className="hb-choice-help">{help}</div>}
            <div className="hb-choices">
                {options.map((option) => (
                    <label
                        key={option.value}
                        className={clsx("hb-choice", option.disabled && "hb-choice-disabled")}
                    >
                        <input
                            className="hb-sr-only"
                            type="radio"
                            name={id}
                            value={option.value}
                            checked={value === option.value}
                            disabled={option.disabled}
                            onChange={() => onValueChange(option.value)}
                        />
                        <span className="hb-choice-body">
                            <span className="hb-choice-label">{option.label}</span>
                            {option.description && (
                                <span className="hb-choice-description">{option.description}</span>
                            )}
                        </span>
                    </label>
                ))}
            </div>
            <FieldHelp id={id} hint={hint} error={error} />
        </fieldset>
    );
}

export function ToggleField({
    label,
    description,
    checked,
    onCheckedChange,
    help,
}: {
    label: string;
    description: string;
    checked: boolean;
    onCheckedChange: (checked: boolean) => void;
    help: ReactNode;
}) {
    const id = useId();
    return (
        <div className="hb-toggle-row">
            <div className="hb-toggle-copy">
                <div className="hb-toggle-heading">
                    <label htmlFor={id}>
                        <strong>{label}</strong>
                    </label>
                    {help}
                </div>
                <label className="hb-toggle-description" htmlFor={id} id={`${id}-hint`}>
                    {description}
                </label>
            </div>
            <label className="hb-toggle-control" htmlFor={id}>
                <input
                    id={id}
                    className="hb-sr-only"
                    type="checkbox"
                    role="switch"
                    checked={checked}
                    aria-label={label}
                    aria-describedby={`${id}-hint`}
                    onChange={(event) => onCheckedChange(event.currentTarget.checked)}
                />
                <span className="hb-switch" aria-hidden="true" />
            </label>
        </div>
    );
}

export function EmptyState({
    icon,
    title,
    children,
}: {
    icon: ReactNode;
    title: string;
    children: ReactNode;
}) {
    return (
        <div className="hb-empty-state">
            <span className="hb-empty-icon" aria-hidden="true">
                {icon}
            </span>
            <strong>{title}</strong>
            <p>{children}</p>
        </div>
    );
}

export function Modal({
    open,
    onOpenChange,
    title,
    description,
    children,
    size = "medium",
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title: string;
    description: string;
    children: ReactNode;
    size?: "medium" | "wide" | "drawer";
}) {
    const opener = useRef<HTMLElement | null>(null);
    const heading = useRef<HTMLHeadingElement | null>(null);
    return (
        <Dialog.Root open={open} onOpenChange={onOpenChange}>
            <Dialog.Portal>
                <Dialog.Overlay className="hb-dialog-overlay" />
                <Dialog.Content
                    className={clsx("hb-dialog", `hb-dialog-${size}`)}
                    onOpenAutoFocus={(event) => {
                        const active = document.activeElement;
                        opener.current =
                            active instanceof HTMLElement && active !== document.body ? active : null;
                        event.preventDefault();
                        heading.current?.focus();
                    }}
                    onCloseAutoFocus={(event) => {
                        event.preventDefault();
                        const target = opener.current?.isConnected
                            ? opener.current
                            : document.getElementById("builder-main");
                        target?.focus();
                    }}
                >
                    <div className="hb-dialog-heading">
                        <div>
                            <Dialog.Title ref={heading} tabIndex={-1}>
                                {title}
                            </Dialog.Title>
                            <Dialog.Description>{description}</Dialog.Description>
                        </div>
                        <Dialog.Close asChild>
                            <Button variant="ghost" size="icon" aria-label={`Close ${title}`}>
                                <X size={18} aria-hidden="true" />
                            </Button>
                        </Dialog.Close>
                    </div>
                    <div className="hb-dialog-body">{children}</div>
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    );
}
