"use client";

import { useState } from "react";

export function Tabs({
  tabs,
  active,
  onChange,
}: {
  tabs: { id: string; label: string }[];
  active: string;
  onChange: (id: string) => void;
}) {
  return (
    <div role="tablist" className="mb-4 flex flex-wrap gap-1 border-b border-line">
      {tabs.map((t) => (
        <button
          key={t.id}
          role="tab"
          aria-selected={active === t.id}
          onClick={() => onChange(t.id)}
          className={`-mb-px border-b-2 px-3 py-2 font-mono text-xs uppercase tracking-wider transition-colors duration-100 ${
            active === t.id
              ? "border-amethyst text-text"
              : "border-transparent text-dim hover:text-text"
          }`}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}

export function Field({
  label,
  children,
  hint,
}: {
  label: string;
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <label className="mb-3 block">
      <span className="mb-1 block font-mono text-[11px] uppercase tracking-wider text-dim">
        {label}
      </span>
      {children}
      {hint && <span className="mt-1 block text-xs text-dim">{hint}</span>}
    </label>
  );
}

export const inputCls =
  "w-full rounded-sm border border-line bg-surface px-3 py-2 text-sm text-text placeholder:text-dim focus:border-amethyst focus:outline-none";

export const monoInputCls = `${inputCls} font-mono`;

export function TextArea(props: React.ComponentProps<"textarea">) {
  return (
    <textarea
      {...props}
      className={`${monoInputCls} min-h-40 resize-y leading-relaxed ${props.className ?? ""}`}
    />
  );
}

export function Button({
  variant = "default",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "default" | "primary" | "success";
}) {
  const variants = {
    default: "border border-line text-text hover:border-dim",
    primary: "border border-amethyst-dim bg-amethyst-dim/20 text-text hover:bg-amethyst-dim/35",
    success: "border border-lime/40 bg-lime/10 text-lime hover:bg-lime/20",
  } as const;
  return (
    <button
      {...props}
      className={`rounded-sm px-3 py-1.5 text-sm transition-[background-color,border-color] duration-100 active:scale-[0.97] disabled:pointer-events-none disabled:opacity-50 ${variants[variant]} ${props.className ?? ""}`}
    />
  );
}

export function CopyButton({ text, label = "Copy" }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <Button
      variant={copied ? "success" : "default"}
      onClick={async () => {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
    >
      {copied ? "Copied" : label}
    </Button>
  );
}

export function Output({ children, label }: { children: React.ReactNode; label?: string }) {
  return (
    <div className="mb-3">
      {label && (
        <div aria-hidden="true" className="mb-1 font-mono text-[11px] uppercase tracking-wider text-dim">
          {label}
        </div>
      )}
      <pre
        aria-label={label}
        className="overflow-x-auto rounded-sm border border-line bg-surface p-3 font-mono text-sm leading-relaxed whitespace-pre-wrap break-all"
      >
        {children}
      </pre>
    </div>
  );
}

export function ErrorNote({ children }: { children: React.ReactNode }) {
  return (
    <p role="alert" className="mb-3 rounded-sm border border-danger/40 bg-danger/10 px-3 py-2 text-sm text-danger">
      {children}
    </p>
  );
}
