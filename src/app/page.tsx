import Link from "next/link";
import { SECTIONS, modulesBySection, modulePath } from "@/lib/registry";
import { Wordmark } from "@/components/wordmark";

export default function Dashboard() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-8 md:px-8 md:py-12">
      <header className="mb-10 border-b border-line pb-6">
        <h1>
          <Wordmark size="lg" />
        </h1>
        <p className="mt-3 max-w-[52ch] text-sm text-dim">
          Utilities for text, images, data, security and Discord. Everything
          runs in your browser unless a tool says otherwise.
        </p>
      </header>

      {SECTIONS.map((section) => {
        const mods = modulesBySection(section.id);
        return (
          <section key={section.id} aria-labelledby={`h-${section.id}`} className="mb-8">
            <h2
              id={`h-${section.id}`}
              className="border-b border-line pb-1 font-mono text-xs uppercase tracking-widest text-dim"
            >
              {section.label}
            </h2>
            <ul>
              {mods.map((m) => (
                <li key={m.id} className="border-b border-line/50">
                  <Link
                    href={modulePath(m)}
                    className="group flex flex-col gap-0.5 py-3 transition-colors duration-100 hover:bg-surface sm:flex-row sm:items-baseline sm:gap-4"
                  >
                    <span className="w-56 shrink-0 text-sm text-text group-hover:text-amethyst">
                      {m.name}
                    </span>
                    <span className="text-sm text-dim">{m.description}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        );
      })}

      <p className="mt-12 font-mono text-xs text-dim">
        Press <kbd className="border border-line px-1.5 py-0.5">⌘K</kbd> to
        search all tools.
      </p>
    </div>
  );
}
