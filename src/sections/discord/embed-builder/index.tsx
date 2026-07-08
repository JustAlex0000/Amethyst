"use client";

import { useEffect, useState } from "react";
import { Field, Button, CopyButton, Output, TextArea, inputCls } from "@/components/ui";
import { useEmbedStore } from "@/lib/embed-store";

type EmbedField = { name: string; value: string; inline: boolean };

type EmbedState = {
  title: string;
  description: string;
  url: string;
  color: string;
  footer: string;
  imageUrl: string;
  thumbnailUrl: string;
  authorName: string;
  fields: EmbedField[];
};

const EMPTY: EmbedState = {
  title: "",
  description: "",
  url: "",
  color: "#9d5cff",
  footer: "",
  imageUrl: "",
  thumbnailUrl: "",
  authorName: "",
  fields: [],
};

export function buildPayload(e: EmbedState) {
  const embed: Record<string, unknown> = {};
  if (e.title) embed.title = e.title;
  if (e.description) embed.description = e.description;
  if (e.url) embed.url = e.url;
  embed.color = parseInt(e.color.slice(1), 16);
  if (e.footer) embed.footer = { text: e.footer };
  if (e.imageUrl) embed.image = { url: e.imageUrl };
  if (e.thumbnailUrl) embed.thumbnail = { url: e.thumbnailUrl };
  if (e.authorName) embed.author = { name: e.authorName };
  const fields = e.fields.filter((f) => f.name && f.value);
  if (fields.length) embed.fields = fields.map((f) => ({ name: f.name, value: f.value, inline: f.inline }));
  return { embeds: [embed] };
}

export default function EmbedBuilder() {
  const [e, setE] = useState<EmbedState>(EMPTY);
  const set = <K extends keyof EmbedState>(k: K, v: EmbedState[K]) => setE({ ...e, [k]: v });

  const setShared = useEmbedStore((s) => s.setPayload);
  useEffect(() => {
    setShared(buildPayload(e) as { embeds: unknown[] });
  }, [e, setShared]);

  const json = JSON.stringify(buildPayload(e), null, 2);

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div>
        <div className="grid gap-x-3 sm:grid-cols-2">
          <Field label="Title">
            <input value={e.title} onChange={(ev) => set("title", ev.target.value)} maxLength={256} className={inputCls} />
          </Field>
          <Field label="Title URL">
            <input value={e.url} onChange={(ev) => set("url", ev.target.value)} placeholder="https://…" className={inputCls} />
          </Field>
        </div>
        <Field label="Description">
          <TextArea value={e.description} onChange={(ev) => set("description", ev.target.value)} maxLength={4096} className="min-h-24 font-sans" />
        </Field>
        <div className="grid gap-x-3 sm:grid-cols-3">
          <Field label="Color">
            <input type="color" value={e.color} onChange={(ev) => set("color", ev.target.value)} className="h-9 w-full cursor-pointer rounded-sm border border-line bg-surface" />
          </Field>
          <Field label="Author">
            <input value={e.authorName} onChange={(ev) => set("authorName", ev.target.value)} maxLength={256} className={inputCls} />
          </Field>
          <Field label="Footer">
            <input value={e.footer} onChange={(ev) => set("footer", ev.target.value)} maxLength={2048} className={inputCls} />
          </Field>
        </div>
        <div className="grid gap-x-3 sm:grid-cols-2">
          <Field label="Image URL">
            <input value={e.imageUrl} onChange={(ev) => set("imageUrl", ev.target.value)} placeholder="https://…" className={inputCls} />
          </Field>
          <Field label="Thumbnail URL">
            <input value={e.thumbnailUrl} onChange={(ev) => set("thumbnailUrl", ev.target.value)} placeholder="https://…" className={inputCls} />
          </Field>
        </div>

        <div className="mb-1 flex items-center justify-between">
          <span className="font-mono text-[11px] uppercase tracking-wider text-dim">Fields ({e.fields.length}/25)</span>
          <Button
            disabled={e.fields.length >= 25}
            onClick={() => set("fields", [...e.fields, { name: "", value: "", inline: false }])}
          >
            Add field
          </Button>
        </div>
        {e.fields.map((f, i) => (
          <div key={i} className="mb-2 grid grid-cols-[1fr_1fr_auto_auto] items-center gap-2">
            <input
              value={f.name}
              onChange={(ev) => set("fields", e.fields.map((x, j) => (j === i ? { ...x, name: ev.target.value } : x)))}
              placeholder="Name"
              maxLength={256}
              aria-label={`Field ${i + 1} name`}
              className={inputCls}
            />
            <input
              value={f.value}
              onChange={(ev) => set("fields", e.fields.map((x, j) => (j === i ? { ...x, value: ev.target.value } : x)))}
              placeholder="Value"
              maxLength={1024}
              aria-label={`Field ${i + 1} value`}
              className={inputCls}
            />
            <label className="flex items-center gap-1 text-xs text-dim">
              <input
                type="checkbox"
                checked={f.inline}
                onChange={(ev) => set("fields", e.fields.map((x, j) => (j === i ? { ...x, inline: ev.target.checked } : x)))}
                className="accent-(--amethyst)"
              />
              inline
            </label>
            <Button onClick={() => set("fields", e.fields.filter((_, j) => j !== i))} aria-label={`Remove field ${i + 1}`}>
              ✕
            </Button>
          </div>
        ))}
      </div>

      <div>
        <div className="mb-1 font-mono text-[11px] uppercase tracking-wider text-dim">Preview</div>
        <div className="mb-4 rounded-md bg-[#313338] p-4">
          <div
            className="max-w-[520px] rounded-[4px] bg-[#2b2d31] py-3 pr-4 pl-3 text-[14px] leading-[1.375] text-[#dbdee1]"
            style={{ borderLeft: `4px solid ${e.color}` }}
          >
            {e.authorName && <div className="mb-1 text-[13px] font-semibold text-white">{e.authorName}</div>}
            {e.title && (
              <div className="mb-1 font-semibold">
                {e.url ? (
                  <span className="cursor-pointer text-[#00a8fc] hover:underline">{e.title}</span>
                ) : (
                  <span className="text-white">{e.title}</span>
                )}
              </div>
            )}
            {e.description && <div className="whitespace-pre-wrap">{e.description}</div>}
            {e.fields.filter((f) => f.name && f.value).length > 0 && (
              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-2">
                {e.fields
                  .filter((f) => f.name && f.value)
                  .map((f, i) => (
                    <div key={i} className={f.inline ? "min-w-[30%] flex-1" : "w-full"}>
                      <div className="text-[13px] font-semibold text-white">{f.name}</div>
                      <div className="whitespace-pre-wrap">{f.value}</div>
                    </div>
                  ))}
              </div>
            )}
            {e.imageUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={e.imageUrl} alt="Embed" className="mt-3 max-h-72 max-w-full rounded-[4px]" />
            )}
            {e.footer && <div className="mt-2 text-[12px] text-[#949ba4]">{e.footer}</div>}
          </div>
        </div>

        <Output label="JSON payload">{json}</Output>
        <CopyButton text={json} label="Copy JSON" />
      </div>
    </div>
  );
}
