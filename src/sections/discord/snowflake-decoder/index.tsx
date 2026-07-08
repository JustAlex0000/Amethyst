"use client";

import { useMemo, useState } from "react";
import { monoInputCls, ErrorNote, Output } from "@/components/ui";
import { decodeSnowflake } from "@/lib/discord";

export default function SnowflakeDecoder() {
  const [id, setId] = useState("");

  const result = useMemo(() => {
    if (!id.trim()) return null;
    try {
      return { data: decodeSnowflake(id), error: "" };
    } catch (e) {
      return { data: null, error: e instanceof Error ? e.message : "Decode failed." };
    }
  }, [id]);

  const d = result?.data;

  return (
    <div className="max-w-xl">
      <input
        value={id}
        onChange={(e) => setId(e.target.value)}
        placeholder="e.g. 175928847299117063"
        aria-label="Discord ID"
        inputMode="numeric"
        className={monoInputCls}
      />

      {result?.error && <div className="mt-3"><ErrorNote>{result.error}</ErrorNote></div>}

      {d && (
        <div className="mt-4">
          <Output label="Created">
            {new Date(d.timestampMs).toISOString()}
            {"\n"}
            {new Date(d.timestampMs).toLocaleString()} (local)
            {"\n"}
            unix: {Math.floor(d.timestampMs / 1000)}
          </Output>
          <div className="grid grid-cols-3 gap-3">
            {(
              [
                ["Worker", d.workerId],
                ["Process", d.processId],
                ["Increment", d.increment],
              ] as const
            ).map(([label, v]) => (
              <div key={label} className="rounded-sm border border-line bg-surface p-3">
                <div className="font-mono text-[11px] uppercase tracking-wider text-dim">{label}</div>
                <div className="font-mono text-lg" data-numeric>{v}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
