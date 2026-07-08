"use client";

import { useEffect, useState } from "react";
import { Field, CopyButton, monoInputCls } from "@/components/ui";

const STYLES = [
  { code: "t", label: "Short time" },
  { code: "T", label: "Long time" },
  { code: "d", label: "Short date" },
  { code: "D", label: "Long date" },
  { code: "f", label: "Short date/time" },
  { code: "F", label: "Long date/time" },
  { code: "R", label: "Relative" },
] as const;

function preview(unix: number, style: string, now: number): string {
  const d = new Date(unix * 1000);
  switch (style) {
    case "t": return d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
    case "T": return d.toLocaleTimeString();
    case "d": return d.toLocaleDateString();
    case "D": return d.toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });
    case "f": return d.toLocaleString(undefined, { dateStyle: "long", timeStyle: "short" });
    case "F": return d.toLocaleString(undefined, { dateStyle: "full", timeStyle: "short" });
    case "R": {
      const diff = unix - now;
      const rtf = new Intl.RelativeTimeFormat(undefined, { numeric: "auto" });
      const abs = Math.abs(diff);
      if (abs < 60) return rtf.format(Math.round(diff), "second");
      if (abs < 3600) return rtf.format(Math.round(diff / 60), "minute");
      if (abs < 86400) return rtf.format(Math.round(diff / 3600), "hour");
      if (abs < 2592000) return rtf.format(Math.round(diff / 86400), "day");
      if (abs < 31536000) return rtf.format(Math.round(diff / 2592000), "month");
      return rtf.format(Math.round(diff / 31536000), "year");
    }
    default: return "";
  }
}

function toLocalInputValue(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function TimestampGenerator() {
  const [value, setValue] = useState("");
  const [now, setNow] = useState(() => Math.floor(Date.now() / 1000));

  useEffect(() => {
    setValue(toLocalInputValue(new Date()));
    const t = setInterval(() => setNow(Math.floor(Date.now() / 1000)), 30000);
    return () => clearInterval(t);
  }, []);

  const unix = value ? Math.floor(new Date(value).getTime() / 1000) : null;

  return (
    <div className="max-w-2xl">
      <Field label="Date and time (local)">
        <input
          type="datetime-local"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className={`${monoInputCls} [color-scheme:dark]`}
        />
      </Field>

      {unix !== null && !Number.isNaN(unix) && (
        <>
          <p className="mb-4 font-mono text-xs text-dim" data-numeric>
            unix: {unix}
          </p>
          <ul>
            {STYLES.map((s) => {
              const code = `<t:${unix}:${s.code}>`;
              return (
                <li
                  key={s.code}
                  className="flex flex-wrap items-center justify-between gap-2 border-b border-line/50 py-2.5"
                >
                  <div className="min-w-0">
                    <code className="font-mono text-sm text-amethyst">{code}</code>
                    <p className="text-sm text-text">{preview(unix, s.code, now)}</p>
                    <p className="font-mono text-[11px] uppercase tracking-wider text-dim">{s.label}</p>
                  </div>
                  <CopyButton text={code} />
                </li>
              );
            })}
          </ul>
        </>
      )}
    </div>
  );
}
