"use client";

import { useMemo, useState } from "react";
import { TextArea, Output, ErrorNote, CopyButton } from "@/components/ui";
import { fromBase64Url } from "@/lib/encoding";

type Decoded = {
  header: Record<string, unknown>;
  payload: Record<string, unknown>;
  signature: string;
};

function decode(token: string): Decoded {
  const parts = token.trim().split(".");
  if (parts.length !== 3) {
    throw new Error("A JWT has three dot-separated parts (header.payload.signature). This input has " + parts.length + ".");
  }
  let header: unknown, payload: unknown;
  try {
    header = JSON.parse(fromBase64Url(parts[0]));
  } catch {
    throw new Error("Header is not valid Base64URL-encoded JSON.");
  }
  try {
    payload = JSON.parse(fromBase64Url(parts[1]));
  } catch {
    throw new Error("Payload is not valid Base64URL-encoded JSON.");
  }
  return {
    header: header as Record<string, unknown>,
    payload: payload as Record<string, unknown>,
    signature: parts[2],
  };
}

function fmtEpoch(sec: number): string {
  return new Date(sec * 1000).toISOString().replace("T", " ").replace(".000Z", " UTC");
}

export default function JwtDecoder() {
  const [token, setToken] = useState("");

  const result = useMemo(() => {
    if (!token.trim()) return null;
    try {
      return { decoded: decode(token), error: "" };
    } catch (e) {
      return { decoded: null, error: e instanceof Error ? e.message : "Decode failed." };
    }
  }, [token]);

  const payload = result?.decoded?.payload;
  const exp = typeof payload?.exp === "number" ? payload.exp : null;
  const iat = typeof payload?.iat === "number" ? payload.iat : null;
  const nbf = typeof payload?.nbf === "number" ? payload.nbf : null;
  const now = Date.now() / 1000;
  const expired = exp !== null && exp < now;

  return (
    <div>
      <TextArea
        value={token}
        onChange={(e) => setToken(e.target.value)}
        placeholder="Paste a JWT (eyJ…)"
        aria-label="JWT token"
        className="min-h-28"
      />

      {result?.error && <ErrorNote>{result.error}</ErrorNote>}

      {result?.decoded && (
        <div className="mt-4">
          {exp !== null && (
            <p
              className={`mb-3 rounded-sm border px-3 py-2 font-mono text-sm ${
                expired
                  ? "border-danger/40 bg-danger/10 text-danger"
                  : "border-lime/40 bg-lime/10 text-lime"
              }`}
            >
              {expired ? "Expired" : "Valid until"} {fmtEpoch(exp)}
            </p>
          )}

          <div className="grid gap-4 md:grid-cols-2">
            <Output label="Header">{JSON.stringify(result.decoded.header, null, 2)}</Output>
            <Output label="Payload">{JSON.stringify(result.decoded.payload, null, 2)}</Output>
          </div>

          <div className="mb-3 grid gap-1 font-mono text-xs text-dim" data-numeric>
            {iat !== null && <span>iat · issued {fmtEpoch(iat)}</span>}
            {nbf !== null && <span>nbf · not before {fmtEpoch(nbf)}</span>}
            {exp !== null && <span>exp · expires {fmtEpoch(exp)}</span>}
          </div>

          <p className="mb-3 text-xs text-dim">
            Signature is shown but not verified — verification needs the signing key.
          </p>
          <Output label="Signature (raw)">{result.decoded.signature}</Output>
          <CopyButton text={JSON.stringify(result.decoded.payload, null, 2)} label="Copy payload" />
        </div>
      )}
    </div>
  );
}
