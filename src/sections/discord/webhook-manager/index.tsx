"use client";

import { useState } from "react";
import { Field, Button, TextArea, ErrorNote, monoInputCls, inputCls } from "@/components/ui";
import { useEmbedStore } from "@/lib/embed-store";

type SentMessage = {
  id: string;
  url: string;
  preview: string;
  at: number;
};

type ApiResult = { status?: number; body?: unknown; error?: string };

const proxyUrl = process.env.NEXT_PUBLIC_DISCORD_WEBHOOK_PROXY_URL;

async function callProxy(payload: object): Promise<ApiResult> {
  if (!proxyUrl) {
    throw new Error("Discord webhook sending is not available in this deployment.");
  }
  const res = await fetch(proxyUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return res.json();
}

export default function WebhookManager() {
  const [url, setUrl] = useState("");
  const [content, setContent] = useState("");
  const [username, setUsername] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [embedJson, setEmbedJson] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [sent, setSent] = useState<SentMessage[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);

  const builderPayload = useEmbedStore((s) => s.payload);

  function buildPayload(): { content?: string; username?: string; avatar_url?: string; embeds?: unknown[] } {
    const p: { content?: string; username?: string; avatar_url?: string; embeds?: unknown[] } = {};
    if (content.trim()) p.content = content;
    if (username.trim()) p.username = username.trim();
    if (avatarUrl.trim()) p.avatar_url = avatarUrl.trim();
    if (embedJson.trim()) {
      let parsed: unknown;
      try {
        parsed = JSON.parse(embedJson);
      } catch (e) {
        throw new Error(`Embed JSON is invalid: ${e instanceof Error ? e.message : "parse error"}`);
      }
      p.embeds =
        Array.isArray(parsed) ? parsed
        : parsed && typeof parsed === "object" && "embeds" in parsed ? (parsed as { embeds: unknown[] }).embeds
        : [parsed];
    }
    if (!p.content && !p.embeds) throw new Error("Add message content or an embed before sending.");
    return p;
  }

  async function run(fn: () => Promise<void>) {
    setError("");
    setNotice("");
    setBusy(true);
    try {
      await fn();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Request failed.");
    } finally {
      setBusy(false);
    }
  }

  const send = () =>
    run(async () => {
      const payload = buildPayload();
      const r = await callProxy({ action: "send", url, payload });
      if (r.error) throw new Error(r.error);
      if (r.status && r.status >= 300) throw new Error(`Discord returned HTTP ${r.status}: ${JSON.stringify(r.body).slice(0, 300)}`);
      const id = (r.body as { id?: string } | null)?.id;
      if (id) {
        setSent((s) => [{ id, url, preview: (content || "[embed]").slice(0, 60), at: Date.now() }, ...s]);
      }
      setNotice(`Sent — message ID ${id ?? "unknown"}.`);
    });

  const saveEdit = () =>
    run(async () => {
      if (!editingId) return;
      const payload = buildPayload();
      delete payload.username;
      delete payload.avatar_url;
      const r = await callProxy({ action: "edit", url, messageId: editingId, payload });
      if (r.error) throw new Error(r.error);
      if (r.status && r.status >= 300) throw new Error(`Discord returned HTTP ${r.status}: ${JSON.stringify(r.body).slice(0, 300)}`);
      setSent((s) => s.map((m) => (m.id === editingId ? { ...m, preview: (content || "[embed]").slice(0, 60) } : m)));
      setNotice(`Edited message ${editingId}.`);
      setEditingId(null);
    });

  const remove = (m: SentMessage) =>
    run(async () => {
      const r = await callProxy({ action: "delete", url: m.url, messageId: m.id });
      if (r.error) throw new Error(r.error);
      if (r.status && r.status >= 300 && r.status !== 404) throw new Error(`Discord returned HTTP ${r.status}.`);
      setSent((s) => s.filter((x) => x.id !== m.id));
      if (editingId === m.id) setEditingId(null);
      setNotice(`Deleted message ${m.id}.`);
    });

  return (
    <div className="max-w-2xl">
      <p className="mb-4 text-xs text-dim">
        {proxyUrl
          ? "Requests go through the configured server-side proxy. Nothing is stored — sent-message IDs live in this tab only, so a refresh loses edit/delete for earlier sends."
          : "Webhook sending is disabled in this static deployment because it needs a server-side proxy. Configure NEXT_PUBLIC_DISCORD_WEBHOOK_PROXY_URL with a compatible external proxy to enable it."}
      </p>

      <fieldset disabled={!proxyUrl} className={!proxyUrl ? "opacity-60" : undefined}>
      <Field label="Webhook URL">
        <input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://discord.com/api/webhooks/…"
          className={monoInputCls}
        />
      </Field>

      <Field label="Message content">
        <TextArea value={content} onChange={(e) => setContent(e.target.value)} className="min-h-24 font-sans" />
      </Field>

      <div className="grid gap-x-3 sm:grid-cols-2">
        <Field label="Username override (optional)" hint="Applies per send — no bot token needed.">
          <input value={username} onChange={(e) => setUsername(e.target.value)} className={inputCls} />
        </Field>
        <Field label="Avatar URL override (optional)">
          <input value={avatarUrl} onChange={(e) => setAvatarUrl(e.target.value)} placeholder="https://…" className={inputCls} />
        </Field>
      </div>

      <Field label="Embeds (JSON, optional)" hint="Paste embed JSON, or pull the payload straight from the Embed Builder.">
        <TextArea value={embedJson} onChange={(e) => setEmbedJson(e.target.value)} className="min-h-28" />
      </Field>

      <div className="mb-4 flex flex-wrap gap-2">
        <Button
          onClick={() => builderPayload && setEmbedJson(JSON.stringify(builderPayload.embeds, null, 2))}
          disabled={!builderPayload}
          title={builderPayload ? undefined : "Build an embed in the Embed Builder first (this session)"}
        >
          Use embed from Embed Builder
        </Button>
        {editingId ? (
          <>
            <Button variant="primary" onClick={saveEdit} disabled={!url || busy}>
              {busy ? "Saving…" : `Save edit → ${editingId.slice(0, 8)}…`}
            </Button>
            <Button onClick={() => setEditingId(null)}>Cancel edit</Button>
          </>
        ) : (
          <Button variant="primary" onClick={send} disabled={!url || busy}>
            {busy ? "Sending…" : "Send"}
          </Button>
        )}
      </div>

      {error && <ErrorNote>{error}</ErrorNote>}
      {notice && (
        <p className="mb-3 rounded-sm border border-lime/40 bg-lime/10 px-3 py-2 font-mono text-sm text-lime" data-numeric>
          {notice}
        </p>
      )}

      {sent.length > 0 && (
        <div className="mt-6">
          <div className="mb-1 font-mono text-[11px] uppercase tracking-wider text-dim">
            Sent this session ({sent.length})
          </div>
          <ul>
            {sent.map((m) => (
              <li key={m.id} className="flex flex-wrap items-center gap-3 border-b border-line/40 py-2">
                <code className="font-mono text-xs text-amethyst" data-numeric>{m.id}</code>
                <span className="min-w-0 flex-1 truncate text-sm text-dim">{m.preview}</span>
                <Button onClick={() => setEditingId(m.id)} disabled={busy}>
                  Edit
                </Button>
                <Button onClick={() => remove(m)} disabled={busy}>
                  Delete
                </Button>
              </li>
            ))}
          </ul>
        </div>
      )}
      </fieldset>
    </div>
  );
}
