"use client";

import { MODULE_COMPONENTS } from "@/lib/module-components";

export function ToolPage({
  section,
  id,
  name,
  description,
}: {
  section: string;
  id: string;
  name: string;
  description: string;
}) {
  const Tool = MODULE_COMPONENTS[`${section}/${id}`];

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 md:px-8 md:py-10">
      <header className="mb-6">
        <h1 className="font-display text-3xl">{name}</h1>
        <p className="mt-1 text-sm text-dim">{description}</p>
      </header>
      {Tool ? <Tool /> : <p className="text-sm text-dim">Tool not implemented yet.</p>}
    </div>
  );
}
