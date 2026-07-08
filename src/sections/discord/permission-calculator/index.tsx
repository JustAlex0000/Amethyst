"use client";

import { useState } from "react";
import { Tabs, Field, CopyButton, ErrorNote, Output, monoInputCls, Button } from "@/components/ui";
import { PermissionPicker } from "@/components/permission-picker";

const SCOPES = ["bot", "applications.commands"] as const;

export default function PermissionCalculator() {
  const [tab, setTab] = useState("calculator");
  const [bits, setBits] = useState(0n);
  const [raw, setRaw] = useState("0");
  const [error, setError] = useState("");

  const [clientId, setClientId] = useState("");
  const [scopes, setScopes] = useState<Set<string>>(new Set(["bot"]));

  function setFromBits(v: bigint) {
    setBits(v);
    setRaw(v.toString());
    setError("");
  }

  function setFromRaw(s: string) {
    setRaw(s);
    if (!/^\d*$/.test(s)) {
      setError("The bitfield is a plain integer — digits only.");
      return;
    }
    setError("");
    setBits(s === "" ? 0n : BigInt(s));
  }

  const idValid = /^\d{15,21}$/.test(clientId.trim());
  const inviteUrl = idValid
    ? `https://discord.com/oauth2/authorize?client_id=${clientId.trim()}&scope=${encodeURIComponent(
        [...scopes].join(" ")
      )}${scopes.has("bot") ? `&permissions=${bits.toString()}` : ""}`
    : "";

  return (
    <div>
      <Tabs
        tabs={[
          { id: "calculator", label: "Calculator" },
          { id: "invite", label: "Invite Link" },
        ]}
        active={tab}
        onChange={setTab}
      />

      {tab === "calculator" && (
        <>
          <div className="mb-4 flex flex-wrap items-end gap-3">
            <Field label="Permission bitfield">
              <input
                value={raw}
                onChange={(e) => setFromRaw(e.target.value)}
                inputMode="numeric"
                className={`${monoInputCls} w-64`}
                aria-label="Permission bitfield integer"
              />
            </Field>
            <div className="flex gap-2 pb-3">
              <CopyButton text={bits.toString()} />
              <Button onClick={() => setFromBits(0n)}>Clear</Button>
              <Button onClick={() => setFromBits(8n)}>Admin only</Button>
            </div>
          </div>

          {error && <ErrorNote>{error}</ErrorNote>}

          {(bits & 8n) !== 0n && (
            <p className="mb-3 text-xs text-lime">
              Administrator is set — it implicitly grants every other permission.
            </p>
          )}

          <PermissionPicker value={bits} onChange={setFromBits} />
        </>
      )}

      {tab === "invite" && (
        <>
          <p className="mb-4 text-xs text-dim">
            Builds the OAuth invite URL from the bitfield on the Calculator tab
            (currently <code className="font-mono text-amethyst" data-numeric>{bits.toString()}</code>).
          </p>

          <div className="mb-4 flex flex-wrap items-end gap-4">
            <Field label="Application client ID">
              <input
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                placeholder="e.g. 123456789012345678"
                inputMode="numeric"
                className={`${monoInputCls} w-72`}
              />
            </Field>
            <div className="flex gap-4 pb-3">
              {SCOPES.map((s) => (
                <label key={s} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={scopes.has(s)}
                    onChange={(e) => {
                      const next = new Set(scopes);
                      if (e.target.checked) next.add(s);
                      else next.delete(s);
                      setScopes(next);
                    }}
                    className="accent-(--amethyst)"
                  />
                  <code className="font-mono text-xs">{s}</code>
                </label>
              ))}
            </div>
          </div>

          {clientId && !idValid && (
            <ErrorNote>
              Client ID should be the 15–21 digit application ID from the Discord developer portal.
            </ErrorNote>
          )}

          {inviteUrl && (
            <>
              <Output label="Invite URL">{inviteUrl}</Output>
              <CopyButton text={inviteUrl} label="Copy URL" />
            </>
          )}
        </>
      )}
    </div>
  );
}
