"use client";

import { useMemo, useState } from "react";
import { monoInputCls, Button } from "@/components/ui";

const COMMON = [
  "password", "123456", "12345678", "qwerty", "abc123", "letmein", "monkey",
  "dragon", "111111", "iloveyou", "admin", "welcome", "login", "princess",
  "sunshine", "master", "hello", "freedom", "whatever", "trustno1",
];

function analyze(pw: string) {
  let pool = 0;
  if (/[a-z]/.test(pw)) pool += 26;
  if (/[A-Z]/.test(pw)) pool += 26;
  if (/\d/.test(pw)) pool += 10;
  if (/[^a-zA-Z0-9]/.test(pw)) pool += 33;
  const entropy = pw.length * Math.log2(Math.max(pool, 1));

  const warnings: string[] = [];
  const lower = pw.toLowerCase();
  if (COMMON.some((c) => lower.includes(c))) warnings.push("Contains a very common password or word.");
  if (/^\d+$/.test(pw)) warnings.push("Digits only — tiny search space regardless of length.");
  if (/(.)\1{2,}/.test(pw)) warnings.push("Repeated characters reduce effective entropy.");
  if (/(012|123|234|345|456|567|678|789|abc|bcd|cde|def|qwe|wer|ert|asd|sdf|zxc)/i.test(pw))
    warnings.push("Contains a keyboard or numeric sequence.");
  if (/(19|20)\d{2}/.test(pw)) warnings.push("Contains what looks like a year — a common, guessable pattern.");
  if (pw.length < 12) warnings.push("Shorter than 12 characters. Length beats complexity — use a longer passphrase.");

  const effective = Math.max(0, entropy - warnings.length * 10);
  const level =
    effective >= 80 ? "strong" : effective >= 60 ? "good" : effective >= 40 ? "weak" : "very weak";

  return { entropy, effective, warnings, level };
}

export default function PasswordStrengthChecker() {
  const [pw, setPw] = useState("");
  const [show, setShow] = useState(false);

  const r = useMemo(() => (pw ? analyze(pw) : null), [pw]);

  const color =
    r?.level === "strong" ? "text-lime" : r?.level === "good" ? "text-amethyst" : "text-danger";
  const barColor =
    r?.level === "strong" ? "bg-lime" : r?.level === "good" ? "bg-amethyst" : "bg-danger";

  return (
    <div className="max-w-xl">
      <p className="mb-4 text-xs text-dim">
        Checked entirely in your browser — the password is never sent anywhere, including to this site.
      </p>

      <div className="flex gap-2">
        <input
          type={show ? "text" : "password"}
          value={pw}
          onChange={(e) => setPw(e.target.value)}
          placeholder="Type a password…"
          aria-label="Password to check"
          autoComplete="off"
          className={monoInputCls}
        />
        <Button onClick={() => setShow(!show)} aria-pressed={show}>
          {show ? "Hide" : "Show"}
        </Button>
      </div>

      {r && (
        <div className="mt-5">
          <div className="mb-2 flex items-baseline justify-between">
            <span className={`font-mono text-sm uppercase tracking-wider ${color}`}>{r.level}</span>
            <span className="font-mono text-xs text-dim" data-numeric>
              ~{Math.round(r.entropy)} bits raw · ~{Math.round(r.effective)} bits after penalties
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-sm bg-surface">
            <div
              className={`h-full transition-[width] duration-200 ${barColor}`}
              style={{ width: `${Math.min(100, (r.effective / 100) * 100)}%` }}
            />
          </div>

          {r.warnings.length > 0 && (
            <ul className="mt-4 text-sm">
              {r.warnings.map((w) => (
                <li key={w} className="border-b border-line/40 py-1.5 text-dim">
                  <span className="mr-2 text-danger">•</span>
                  {w}
                </li>
              ))}
            </ul>
          )}

          <p className="mt-4 text-xs text-dim">
            Entropy assumes random character choice — real passwords are guessed with
            wordlists and rules, so treat these numbers as an upper bound.
          </p>
        </div>
      )}
    </div>
  );
}
