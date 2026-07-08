"use client";

import { useEffect, useRef, useState } from "react";
import { Tabs, TextArea, CopyButton, ErrorNote } from "@/components/ui";
import { md5Hex } from "@/lib/md5";

type Algo = "SHA-256" | "SHA-512" | "MD5";
const ALGOS: Algo[] = ["SHA-256", "SHA-512", "MD5"];

async function hashBytes(algo: Algo, bytes: Uint8Array): Promise<string> {
  if (algo === "MD5") return md5Hex(bytes);
  const buf = await crypto.subtle.digest(algo, bytes as BufferSource);
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export default function HashGenerator() {
  const [tab, setTab] = useState("text");
  const [text, setText] = useState("");
  const [fileName, setFileName] = useState("");
  const [fileBytes, setFileBytes] = useState<Uint8Array | null>(null);
  const [hashes, setHashes] = useState<Record<Algo, string> | null>(null);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const bytes = tab === "text" ? new TextEncoder().encode(text) : fileBytes;
    if (!bytes || (tab === "text" && text === "")) {
      setHashes(null);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const entries = await Promise.all(
          ALGOS.map(async (a) => [a, await hashBytes(a, bytes)] as const)
        );
        if (!cancelled) {
          setHashes(Object.fromEntries(entries) as Record<Algo, string>);
          setError("");
        }
      } catch {
        if (!cancelled) setError("Hashing failed. Try a smaller input.");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [tab, text, fileBytes]);

  async function onFile(f: File | undefined) {
    if (!f) return;
    if (f.size > 200 * 1024 * 1024) {
      setError("File is larger than 200 MB. Pick a smaller file.");
      return;
    }
    setFileName(`${f.name} · ${(f.size / 1024).toFixed(1)} KB`);
    setFileBytes(new Uint8Array(await f.arrayBuffer()));
  }

  return (
    <div>
      <Tabs
        tabs={[
          { id: "text", label: "Text" },
          { id: "file", label: "File" },
        ]}
        active={tab}
        onChange={setTab}
      />

      {tab === "text" && (
        <TextArea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Text to hash…"
          aria-label="Text to hash"
        />
      )}

      {tab === "file" && (
        <div>
          <input
            ref={fileRef}
            type="file"
            onChange={(e) => onFile(e.target.files?.[0])}
            className="block w-full cursor-pointer rounded-sm border border-dashed border-line bg-surface px-3 py-6 text-sm text-dim file:mr-3 file:cursor-pointer file:rounded-sm file:border file:border-line file:bg-raised file:px-3 file:py-1.5 file:text-sm file:text-text"
            aria-label="File to hash"
          />
          {fileName && (
            <p className="mt-2 font-mono text-xs text-dim" data-numeric>
              {fileName}
            </p>
          )}
        </div>
      )}

      {error && <div className="mt-3"><ErrorNote>{error}</ErrorNote></div>}

      {hashes && (
        <div className="mt-5">
          {ALGOS.map((a) => (
            <div key={a} className="mb-4">
              <div className="mb-1 flex items-baseline justify-between">
                <span className="font-mono text-[11px] uppercase tracking-wider text-dim">
                  {a}
                  {a === "MD5" && (
                    <span className="ml-2 normal-case text-danger/80">
                      broken for security — checksums only
                    </span>
                  )}
                </span>
                <CopyButton text={hashes[a]} />
              </div>
              <code className="block overflow-x-auto rounded-sm border border-line bg-surface p-3 font-mono text-sm break-all text-text">
                {hashes[a]}
              </code>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
