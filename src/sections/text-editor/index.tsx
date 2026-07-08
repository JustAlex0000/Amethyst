"use client";

import { useMemo, useRef, useState } from "react";
import { marked } from "marked";
import { diffWords } from "diff";
import { Tabs, TextArea, Field, Button, monoInputCls, ErrorNote } from "@/components/ui";
import { analyzeStyle } from "@/lib/stylometry";
import { scanInjection, injectionScore } from "@/lib/injection";

type Tab = "write" | "markdown" | "diff" | "regex" | "case" | "ai-style" | "injection";

const TABS = [
  { id: "write", label: "Write" },
  { id: "markdown", label: "Markdown" },
  { id: "diff", label: "Diff" },
  { id: "regex", label: "Regex" },
  { id: "case", label: "Case" },
  { id: "ai-style", label: "AI Style" },
  { id: "injection", label: "Injection" },
];

function stats(text: string) {
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;
  const chars = text.length;
  const sentences = (text.match(/[.!?]+(\s|$)/g) ?? []).length;
  const minutes = Math.max(1, Math.round(words / 220));
  return { words, chars, sentences, minutes: words === 0 ? 0 : minutes };
}

function toWords(s: string): string[] {
  return s
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .split(/[\s_\-]+/)
    .filter(Boolean)
    .map((w) => w.toLowerCase());
}
const CASES = {
  camelCase: (s: string) =>
    toWords(s)
      .map((w, i) => (i === 0 ? w : w[0].toUpperCase() + w.slice(1)))
      .join(""),
  snake_case: (s: string) => toWords(s).join("_"),
  "kebab-case": (s: string) => toWords(s).join("-"),
  "Title Case": (s: string) =>
    toWords(s)
      .map((w) => w[0].toUpperCase() + w.slice(1))
      .join(" "),
} as const;

export default function TextEditor() {
  const [tab, setTab] = useState<Tab>("write");
  const [text, setText] = useState("");
  const [diffB, setDiffB] = useState("");
  const [pattern, setPattern] = useState("");
  const [flags, setFlags] = useState("g");
  const [replacement, setReplacement] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const s = stats(text);

  const style = useMemo(
    () => (tab === "ai-style" ? analyzeStyle(text) : null),
    [tab, text]
  );

  const styleHighlighted = useMemo(() => {
    if (tab !== "ai-style" || !style || style.tells.length === 0) return null;
    const parts: React.ReactNode[] = [];
    let last = 0;
    for (const [i, h] of style.tells.entries()) {
      if (h.index < last) continue;
      parts.push(text.slice(last, h.index));
      parts.push(
        <mark key={i} className="bg-amethyst-dim/40 text-text">
          {text.slice(h.index, h.index + h.length)}
        </mark>
      );
      last = h.index + h.length;
    }
    parts.push(text.slice(last));
    return parts;
  }, [tab, style, text]);

  const injectionHits = useMemo(
    () => (tab === "injection" && text.trim() ? scanInjection(text) : []),
    [tab, text]
  );
  const injScore = injectionScore(injectionHits);
  const injLevel = injScore >= 60 ? "high" : injScore >= 25 ? "medium" : injScore > 0 ? "low" : "none";

  const injectionHighlighted = useMemo(() => {
    if (tab !== "injection" || injectionHits.length === 0) return null;
    const parts: React.ReactNode[] = [];
    let last = 0;
    for (const [i, h] of injectionHits.entries()) {
      if (h.index < last) continue;
      parts.push(text.slice(last, h.index));
      parts.push(
        <mark key={i} className="bg-danger/25 text-danger" title={h.rule.label}>
          {h.match}
        </mark>
      );
      last = h.index + h.match.length;
    }
    parts.push(text.slice(last));
    return parts;
  }, [tab, injectionHits, text]);

  const md = useMemo(
    () => (tab === "markdown" ? (marked.parse(text, { async: false }) as string) : ""),
    [tab, text]
  );

  const diff = useMemo(
    () => (tab === "diff" ? diffWords(text, diffB) : []),
    [tab, text, diffB]
  );

  const regex = useMemo(() => {
    if (tab !== "regex" || !pattern) return { re: null as RegExp | null, error: "" };
    try {
      return { re: new RegExp(pattern, flags.includes("g") ? flags : flags + "g"), error: "" };
    } catch (e) {
      return { re: null, error: e instanceof Error ? e.message : "Invalid pattern" };
    }
  }, [tab, pattern, flags]);

  const matches = useMemo(() => {
    if (!regex.re || !text) return [];
    const out: { match: string; index: number; groups: string[] }[] = [];
    for (const m of text.matchAll(regex.re)) {
      out.push({ match: m[0], index: m.index ?? 0, groups: m.slice(1) });
      if (out.length >= 500) break;
    }
    return out;
  }, [regex.re, text]);

  const highlighted = useMemo(() => {
    if (!regex.re || !text) return null;
    const parts: React.ReactNode[] = [];
    let last = 0;
    matches.forEach((m, i) => {
      if (m.index > last) parts.push(text.slice(last, m.index));
      parts.push(
        <mark key={i} className="bg-amethyst-dim/40 text-text">
          {m.match || "∅"}
        </mark>
      );
      last = m.index + m.match.length;
    });
    parts.push(text.slice(last));
    return parts;
  }, [regex.re, text, matches]);

  function applyCase(fn: (s: string) => string) {
    const el = textareaRef.current;
    if (!el) return;
    const { selectionStart: a, selectionEnd: b } = el;
    if (a === b) {
      setText(fn(text));
    } else {
      setText(text.slice(0, a) + fn(text.slice(a, b)) + text.slice(b));
    }
  }

  const editor = (
    <TextArea
      ref={textareaRef}
      value={text}
      onChange={(e) => setText(e.target.value)}
      placeholder="Start typing…"
      aria-label="Editor"
      className="min-h-[50dvh]"
    />
  );

  return (
    <div>
      <Tabs tabs={TABS} active={tab} onChange={(t) => setTab(t as Tab)} />

      {tab === "write" && editor}

      {tab === "markdown" && (
        <div className="grid gap-4 md:grid-cols-2">
          {editor}
          <div
            className="prose-amethyst min-h-[50dvh] overflow-y-auto rounded-sm border border-line bg-surface p-4 text-sm leading-relaxed [&_a]:text-amethyst [&_blockquote]:border-l-2 [&_blockquote]:border-line [&_blockquote]:pl-3 [&_blockquote]:text-dim [&_code]:font-mono [&_code]:text-[13px] [&_code]:text-lime [&_h1]:font-display [&_h1]:text-2xl [&_h2]:font-display [&_h2]:text-xl [&_h3]:font-display [&_h3]:text-lg [&_h1]:mt-4 [&_h2]:mt-4 [&_h3]:mt-3 [&_li]:ml-4 [&_ol]:list-decimal [&_p]:my-2 [&_pre]:overflow-x-auto [&_pre]:rounded-sm [&_pre]:border [&_pre]:border-line [&_pre]:p-3 [&_ul]:list-disc"
            dangerouslySetInnerHTML={{ __html: md }}
          />
        </div>
      )}

      {tab === "diff" && (
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            {editor}
            <Field label="Compare against">
              <TextArea
                value={diffB}
                onChange={(e) => setDiffB(e.target.value)}
                placeholder="Paste the second text…"
              />
            </Field>
          </div>
          <div className="min-h-40 rounded-sm border border-line bg-surface p-4 font-mono text-sm leading-relaxed whitespace-pre-wrap">
            {diff.map((part, i) => (
              <span
                key={i}
                className={
                  part.added
                    ? "bg-lime/20 text-lime"
                    : part.removed
                      ? "bg-danger/20 text-danger line-through"
                      : undefined
                }
              >
                {part.value}
              </span>
            ))}
            {diff.length === 0 && <span className="text-dim">Diff appears here.</span>}
          </div>
        </div>
      )}

      {tab === "regex" && (
        <div>
          <div className="mb-3 grid gap-3 sm:grid-cols-[1fr_100px_1fr_auto]">
            <Field label="Pattern">
              <input
                value={pattern}
                onChange={(e) => setPattern(e.target.value)}
                placeholder="([a-z]+)@(\w+)"
                className={monoInputCls}
              />
            </Field>
            <Field label="Flags">
              <input
                value={flags}
                onChange={(e) => setFlags(e.target.value.replace(/[^gimsuy]/g, ""))}
                className={monoInputCls}
              />
            </Field>
            <Field label="Replace with (optional)">
              <input
                value={replacement}
                onChange={(e) => setReplacement(e.target.value)}
                placeholder="$1 at $2"
                className={monoInputCls}
              />
            </Field>
            <div className="pt-6">
              <Button
                variant="primary"
                disabled={!regex.re || !replacement}
                onClick={() => regex.re && setText(text.replace(regex.re, replacement))}
              >
                Replace all
              </Button>
            </div>
          </div>
          {regex.error && <ErrorNote>Invalid regex: {regex.error}</ErrorNote>}
          <div className="grid gap-4 md:grid-cols-2">
            {editor}
            <div>
              <div className="mb-3 min-h-24 rounded-sm border border-line bg-surface p-3 font-mono text-sm whitespace-pre-wrap">
                {highlighted ?? <span className="text-dim">Matches highlight here.</span>}
              </div>
              <div className="font-mono text-xs text-dim" data-numeric>
                {matches.length} match{matches.length === 1 ? "" : "es"}
              </div>
              {matches.slice(0, 50).map((m, i) => (
                <div key={i} className="mt-1 font-mono text-xs">
                  <span className="text-amethyst">[{m.index}]</span>{" "}
                  <span className="text-text">{m.match}</span>
                  {m.groups.length > 0 && (
                    <span className="text-dim"> groups: {m.groups.map((g) => g ?? "∅").join(", ")}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === "case" && (
        <div>
          <div className="mb-3 flex flex-wrap gap-2">
            {(Object.keys(CASES) as (keyof typeof CASES)[]).map((k) => (
              <Button key={k} onClick={() => applyCase(CASES[k])} className="font-mono text-xs">
                {k}
              </Button>
            ))}
          </div>
          <p className="mb-3 text-xs text-dim">
            Select text to convert only the selection; with no selection the whole document converts.
          </p>
          {editor}
        </div>
      )}

      {tab === "ai-style" && (
        <div className="grid gap-4 md:grid-cols-2">
          {editor}
          <div>
            <p className="mb-3 rounded-sm border border-line bg-surface px-3 py-2 text-xs text-dim">
              Approximate writing-pattern analysis, computed live on the editor content. These
              signals also flag formal and non-native human writing — that is a known limitation
              of the signals themselves, so treat this as a style check, not a verdict. This
              panel does not compute perplexity; that requires running a language model over
              the text, which a client-side heuristic cannot do.
            </p>

            {!style && (
              <p className="text-sm text-dim">
                Write at least 5 sentences (~80 words) in the editor — below that the
                statistics are meaningless.
              </p>
            )}

            {style && (
              <>
                <ul className="mb-4">
                  {style.signals.map((s) => (
                    <li key={s.name} className="border-b border-line/40 py-2.5">
                      <div className="flex flex-wrap items-baseline justify-between gap-2">
                        <span className="text-sm text-text">{s.name}</span>
                        <code className="font-mono text-xs text-amethyst" data-numeric>{s.value}</code>
                      </div>
                      <p className={`text-xs ${s.lean === "flag" ? "text-danger" : s.lean === "varied" ? "text-lime" : "text-dim"}`}>
                        {s.note}
                      </p>
                    </li>
                  ))}
                </ul>

                <div className="mb-1 font-mono text-[11px] uppercase tracking-wider text-dim">
                  Common AI-tell phrasing · {style.tells.length} match{style.tells.length === 1 ? "" : "es"}
                </div>
                <div className="mb-4 max-h-64 overflow-y-auto rounded-sm border border-line bg-surface p-3 text-sm leading-relaxed whitespace-pre-wrap">
                  {styleHighlighted ?? <span className="text-dim">No listed phrases found.</span>}
                </div>

                <p className="text-xs text-dim">
                  For a more thorough check, try a dedicated AI detector such as{" "}
                  <a href="https://gptzero.me" target="_blank" rel="noopener noreferrer" className="text-amethyst underline">
                    GPTZero
                  </a>{" "}
                  or{" "}
                  <a href="https://originality.ai" target="_blank" rel="noopener noreferrer" className="text-amethyst underline">
                    Originality.ai
                  </a>
                  .
                </p>
              </>
            )}
          </div>
        </div>
      )}

      {tab === "injection" && (
        <div className="grid gap-4 md:grid-cols-2">
          {editor}
          <div>
            <p className="mb-3 rounded-sm border border-line bg-surface px-3 py-2 text-xs text-dim">
              Heuristic pattern matching against known injection structures, computed live on
              the editor content. A clean result does not guarantee safe input, and matches can
              be false positives — a first pass, not a verdict.
            </p>

            {!text.trim() && <p className="text-sm text-dim">Paste or write text in the editor to scan it.</p>}

            {text.trim() && (
              <>
                <div className="mb-3 flex items-center gap-3">
                  <span className="font-mono text-[11px] uppercase tracking-wider text-dim">Confidence</span>
                  <div
                    className="h-2 w-36 overflow-hidden rounded-sm bg-raised"
                    role="meter"
                    aria-valuenow={injScore}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label="Injection confidence"
                  >
                    <div
                      className={`h-full ${injLevel === "high" ? "bg-danger" : injLevel === "medium" ? "bg-amethyst" : "bg-lime"}`}
                      style={{ width: `${Math.max(injScore, 4)}%` }}
                    />
                  </div>
                  <span className="font-mono text-sm" data-numeric>
                    {injScore}/100 · {injLevel === "none" ? "no known patterns" : `${injLevel} suspicion`}
                  </span>
                </div>

                {injectionHits.length > 0 && (
                  <>
                    <div className="mb-3 max-h-56 overflow-y-auto rounded-sm border border-line bg-surface p-3 text-sm leading-relaxed whitespace-pre-wrap">
                      {injectionHighlighted}
                    </div>
                    <ul className="text-sm">
                      {injectionHits.map((h, i) => (
                        <li key={i} className="flex items-baseline gap-3 border-b border-line/40 py-1.5">
                          <span className="font-mono text-[11px] text-dim" data-numeric>@{h.index}</span>
                          <span className="text-text">{h.rule.label}</span>
                          <code className="ml-auto truncate font-mono text-xs text-danger">{h.match}</code>
                        </li>
                      ))}
                    </ul>
                  </>
                )}

                {injectionHits.length === 0 && (
                  <p className="text-sm text-dim">
                    No known injection patterns found. This does not prove the text is safe.
                  </p>
                )}
              </>
            )}
          </div>
        </div>
      )}

      <div
        className="mt-4 flex flex-wrap gap-x-5 gap-y-1 border-t border-line pt-2 font-mono text-xs text-dim"
        data-numeric
        aria-live="polite"
      >
        <span>{s.words} words</span>
        <span>{s.chars} chars</span>
        <span>{s.sentences} sentences</span>
        <span>~{s.minutes} min read</span>
      </div>
    </div>
  );
}
