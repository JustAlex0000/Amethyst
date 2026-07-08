"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { SECTIONS, modulesBySection, modulePath } from "@/lib/registry";
import { useUIStore } from "@/lib/store";
import { Wordmark } from "./wordmark";

export function Sidebar() {
  const pathname = usePathname();
  const openPalette = useUIStore((s) => s.openPalette);
  const [mobileOpen, setMobileOpen] = useState(false);

  const nav = (
    <nav aria-label="Tools" className="flex-1 overflow-y-auto px-2 py-3">
      {SECTIONS.map((section) => {
        const mods = modulesBySection(section.id);
        return (
          <div key={section.id} className="mb-4">
            <div className="px-2 pb-1 font-mono text-[11px] uppercase tracking-widest text-dim">
              {section.label}
            </div>
            <ul>
              {mods.map((m) => {
                const href = modulePath(m);
                const active = pathname === href;
                return (
                  <li key={m.id}>
                    <Link
                      href={href}
                      onClick={() => setMobileOpen(false)}
                      aria-current={active ? "page" : undefined}
                      className={`block border-l-2 px-3 py-1.5 text-sm transition-colors duration-100 ${
                        active
                          ? "border-amethyst bg-raised text-text"
                          : "border-transparent text-dim hover:border-line hover:text-text"
                      }`}
                    >
                      {m.name}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        );
      })}
    </nav>
  );

  return (
    <>
      <div className="fixed inset-x-0 top-0 z-20 flex items-center justify-between border-b border-line bg-ink px-4 py-2 md:hidden">
        <Wordmark />
        <button
          onClick={() => setMobileOpen((o) => !o)}
          aria-expanded={mobileOpen}
          aria-label={mobileOpen ? "Close navigation" : "Open navigation"}
          className="px-3 py-2 font-mono text-xs text-dim"
        >
          {mobileOpen ? "close" : "menu"}
        </button>
      </div>

      <aside
        className={`${
          mobileOpen ? "flex" : "hidden"
        } fixed inset-0 top-[41px] z-10 flex-col bg-ink md:sticky md:top-0 md:flex md:h-dvh md:w-60 md:shrink-0 md:border-r md:border-line`}
      >
        <div className="hidden px-4 pt-5 pb-3 md:block">
          <Wordmark />
        </div>
        {nav}
        <div className="border-t border-line p-2">
          <button
            onClick={() => {
              setMobileOpen(false);
              openPalette();
            }}
            className="flex w-full items-center justify-between px-3 py-2 text-sm text-dim transition-colors duration-100 hover:text-text"
          >
            <span>Search tools</span>
            <kbd className="border border-line px-1.5 py-0.5 font-mono text-[11px]">
              ⌘K
            </kbd>
          </button>
        </div>
      </aside>

    </>
  );
}
