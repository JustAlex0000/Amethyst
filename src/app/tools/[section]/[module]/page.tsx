import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { MODULES, getModule } from "@/lib/registry";
import { ToolPage } from "@/components/tool-page";

type Params = { section: string; module: string };

export function generateStaticParams(): Params[] {
  return MODULES.map((m) => ({ section: m.section, module: m.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { section, module } = await params;
  const meta = getModule(section, module);
  if (!meta) return {};
  return { title: `${meta.name} — Amethyst`, description: meta.description };
}

export default async function Page({ params }: { params: Promise<Params> }) {
  const { section, module } = await params;
  const meta = getModule(section, module);
  if (!meta) notFound();

  return <ToolPage section={meta.section} id={meta.id} name={meta.name} description={meta.description} />;
}
