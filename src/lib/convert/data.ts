import * as yaml from "js-yaml";
import { parse as parseToml, stringify as stringifyToml } from "smol-toml";
import { toBase64, fromBase64, parseCsv, toCsv } from "@/lib/encoding";

export function decodeStructured(text: string, formatId: string): unknown {
  switch (formatId) {
    case "json":
      try {
        return JSON.parse(text);
      } catch (e) {
        throw new Error(`Invalid JSON: ${e instanceof Error ? e.message : "parse error"}`);
      }
    case "yaml":
      return yaml.load(text);
    case "csv":
      return parseCsv(text);
    case "toml":
      return parseToml(text);
    default:
      throw new Error(`No structured decoder for ${formatId}.`);
  }
}

export function encodeStructured(value: unknown, formatId: string): string {
  switch (formatId) {
    case "json":
      return JSON.stringify(value, null, 2);
    case "yaml":
      return yaml.dump(value);
    case "csv":
      return toCsv(value);
    case "toml":
      if (value === null || typeof value !== "object" || Array.isArray(value)) {
        throw new Error("TOML output needs a top-level object (key/value table).");
      }
      return stringifyToml(value as Record<string, unknown>);
    default:
      throw new Error(`No structured encoder for ${formatId}.`);
  }
}

export function decodeBytes(text: string, formatId: string): Uint8Array {
  switch (formatId) {
    case "text":
      return new TextEncoder().encode(text);
    case "base64":
      try {
        return new TextEncoder().encode(fromBase64(text));
      } catch {
        throw new Error("Input is not valid Base64. Remove any non-Base64 characters and retry.");
      }
    case "hex": {
      const clean = text.replace(/\s|0x/gi, "");
      if (!/^[0-9a-f]*$/i.test(clean) || clean.length % 2 !== 0) {
        throw new Error("Input is not valid hex — expected pairs of 0-9 a-f characters.");
      }
      const out = new Uint8Array(clean.length / 2);
      for (let i = 0; i < out.length; i++) out[i] = parseInt(clean.slice(i * 2, i * 2 + 2), 16);
      return out;
    }
    case "url":
      try {
        return new TextEncoder().encode(decodeURIComponent(text.replace(/\+/g, "%20")));
      } catch {
        throw new Error("Input is not valid URL-encoding — check for stray % characters.");
      }
    default:
      throw new Error(`No byte decoder for ${formatId}.`);
  }
}

export function encodeBytes(bytes: Uint8Array, formatId: string): string {
  const text = () => new TextDecoder().decode(bytes);
  switch (formatId) {
    case "text":
      return text();
    case "base64":
      return toBase64(text());
    case "hex":
      return [...bytes].map((b) => b.toString(16).padStart(2, "0")).join("");
    case "url":
      return encodeURIComponent(text());
    default:
      throw new Error(`No byte encoder for ${formatId}.`);
  }
}

export function detectText(s: string): string {
  const t = s.trim();
  try {
    JSON.parse(t);
    return "json";
  } catch {}
  if (/^(?:[0-9a-f]{2}\s*)+$/i.test(t) && t.replace(/\s/g, "").length >= 8) return "hex";
  if (/^[A-Za-z0-9+/=\s]+$/.test(t) && t.replace(/\s/g, "").length % 4 === 0 && t.length > 8) {
    try {
      fromBase64(t);
      return "base64";
    } catch {}
  }
  if (/%[0-9a-f]{2}/i.test(t) && !/\s/.test(t)) return "url";
  const lines = t.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length >= 2 && lines[0].includes(",")) {
    const n = lines[0].split(",").length;
    if (n > 1 && lines.every((l) => l.split(",").length === n)) return "csv";
  }
  try {
    const v = parseToml(t);
    if (v && Object.keys(v).length > 0 && /^\s*(\[|[\w-]+\s*=)/m.test(t)) return "toml";
  } catch {}
  try {
    const v = yaml.load(t);
    if (v !== null && typeof v === "object") return "yaml";
  } catch {}
  return "text";
}
