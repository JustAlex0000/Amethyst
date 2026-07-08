"use client";

import { useEffect, useMemo, useState } from "react";
import { Field, Button, CopyButton, ErrorNote, monoInputCls, inputCls } from "@/components/ui";

const ZONES = [
  "UTC",
  "Europe/London",
  "Europe/Berlin",
  "Europe/Bratislava",
  "America/New_York",
  "America/Chicago",
  "America/Los_Angeles",
  "Asia/Tokyo",
  "Asia/Shanghai",
  "Asia/Kolkata",
  "Australia/Sydney",
];

function parseInput(s: string): number | null {
  const t = s.trim();
  if (!t) return null;
  if (/^\d{13}$/.test(t)) return parseInt(t, 10);
  if (/^\d{9,11}$/.test(t)) return parseInt(t, 10) * 1000;
  const d = new Date(t);
  return Number.isNaN(d.getTime()) ? null : d.getTime();
}

function inZone(ms: number, tz: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: tz,
    dateStyle: "medium",
    timeStyle: "long",
  }).format(new Date(ms));
}

export default function TimestampConverter() {
  const [input, setInput] = useState("");
  const [zone, setZone] = useState("UTC");
  const [nowMs, setNowMs] = useState<number | null>(null);

  useEffect(() => {
    setNowMs(Date.now());
    const t = setInterval(() => setNowMs(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const ms = useMemo(() => parseInput(input), [input]);
  const invalid = input.trim() !== "" && ms === null;

  return (
    <div className="max-w-2xl">
      {nowMs !== null && (
        <div className="mb-5 flex flex-wrap items-center gap-3 rounded-sm border border-line bg-surface px-3 py-2">
          <span className="font-mono text-[11px] uppercase tracking-wider text-dim">Now</span>
          <code className="font-mono text-sm" data-numeric>{Math.floor(nowMs / 1000)}</code>
          <CopyButton text={String(Math.floor(nowMs / 1000))} label="Copy unix" />
        </div>
      )}

      <div className="flex flex-wrap items-end gap-3">
        <Field label="Timestamp or date" hint="Accepts unix seconds, unix milliseconds, or ISO 8601 (2026-07-08T12:00:00Z).">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="1751976000 or 2026-07-08T12:00:00Z"
            className={`${monoInputCls} w-80 max-w-full`}
          />
        </Field>
        <div className="pb-3">
          <Button onClick={() => setInput(String(Math.floor(Date.now() / 1000)))}>Use now</Button>
        </div>
      </div>

      {invalid && (
        <ErrorNote>
          Could not parse that. Use unix seconds (10 digits), milliseconds (13 digits), or an ISO 8601 date.
        </ErrorNote>
      )}

      {ms !== null && (
        <div className="mt-2">
          <table className="w-full text-sm">
            <tbody>
              {[
                ["Unix seconds", String(Math.floor(ms / 1000))],
                ["Unix milliseconds", String(ms)],
                ["ISO 8601 (UTC)", new Date(ms).toISOString()],
                ["Your local time", new Date(ms).toLocaleString()],
              ].map(([label, v]) => (
                <tr key={label} className="border-b border-line/40">
                  <td className="py-2 pr-4 font-mono text-[11px] tracking-wider whitespace-nowrap text-dim uppercase">{label}</td>
                  <td className="py-2 font-mono break-all" data-numeric>{v}</td>
                  <td className="py-2 pl-3 text-right">
                    <CopyButton text={v} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="mt-5 flex flex-wrap items-end gap-3">
            <Field label="Timezone">
              <select value={zone} onChange={(e) => setZone(e.target.value)} className={inputCls}>
                {ZONES.map((z) => (
                  <option key={z} value={z}>{z}</option>
                ))}
              </select>
            </Field>
            <p className="pb-4 font-mono text-sm" data-numeric>
              {inZone(ms, zone)}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
