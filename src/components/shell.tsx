"use client";

import { useEffect } from "react";
import { useUIStore } from "@/lib/store";
import { Sidebar } from "./sidebar";
import { CommandPalette } from "./command-palette";

export function Shell({ children }: { children: React.ReactNode }) {
  const togglePalette = useUIStore((s) => s.togglePalette);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        togglePalette();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [togglePalette]);

  return (
    <div className="flex min-h-dvh">
      <Sidebar />
      <main id="main" className="min-w-0 flex-1 pt-[41px] md:pt-0">
        {children}
      </main>
      <CommandPalette />
    </div>
  );
}
