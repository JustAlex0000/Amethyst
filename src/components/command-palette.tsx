"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { MODULES, SECTIONS, modulePath, type ModuleMeta } from "@/lib/registry";
import { useUIStore } from "@/lib/store";

function matches(m: ModuleMeta, q: string): boolean {
  const hay = `${m.name} ${m.description} ${m.keywords.join(" ")} ${m.section}`.toLowerCase();
  return q
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .every((term) => hay.includes(term));
}

export function CommandPalette() {
  const open = useUIStore((s) => s.paletteOpen);
  const close = useUIStore((s) => s.closePalette);
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [index, setIndex] = useState(0);

  const results = useMemo(
    () => (query ? MODULES.filter((m) => matches(m, query)) : MODULES),
    [query]
  );

  useEffect(() => {
    if (open) {
      setQuery("");
      setIndex(0);
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  useEffect(() => setIndex(0), [query]);

  function go(m: ModuleMeta) {
    close();
    router.push(modulePath(m));
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Escape") {
      e.preventDefault();
      close();
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setIndex((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const m = results[index];
      if (m) go(m);
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.12 }}
          className="fixed inset-0 z-40 bg-black/60"
          onClick={close}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Search tools"
            initial={{ opacity: 0, scale: 0.97, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: -4 }}
            transition={{ duration: 0.16, ease: [0.23, 1, 0.32, 1] }}
            className="mx-auto mt-[12dvh] w-[min(560px,calc(100vw-2rem))] overflow-hidden rounded-md border border-line bg-surface"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={onKeyDown}
          >
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search tools…"
              aria-label="Search tools"
              className="w-full border-b border-line bg-transparent px-4 py-3 font-mono text-sm text-text placeholder:text-dim focus:outline-none"
            />
            <ul className="max-h-[50dvh] overflow-y-auto py-1" role="listbox">
              {results.length === 0 && (
                <li className="px-4 py-6 text-center text-sm text-dim">
                  No tool matches “{query}”. Try a shorter term.
                </li>
              )}
              {results.map((m, i) => {
                const sectionLabel = SECTIONS.find((s) => s.id === m.section)?.label;
                return (
                  <li key={`${m.section}/${m.id}`} role="option" aria-selected={i === index}>
                    <button
                      onClick={() => go(m)}
                      onMouseMove={() => setIndex(i)}
                      className={`flex w-full items-baseline justify-between gap-3 px-4 py-2 text-left text-sm ${
                        i === index ? "bg-raised text-text" : "text-dim"
                      }`}
                    >
                      <span>{m.name}</span>
                      <span className="shrink-0 font-mono text-[11px] uppercase tracking-wider text-dim">
                        {sectionLabel}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
