import type { ArchiveEntries } from "./types";

function readString(bytes: Uint8Array, off: number, len: number): string {
  let end = off;
  while (end < off + len && bytes[end] !== 0) end++;
  return new TextDecoder().decode(bytes.subarray(off, end));
}

function readOctal(bytes: Uint8Array, off: number, len: number): number {
  const s = readString(bytes, off, len).trim();
  return s ? parseInt(s, 8) : 0;
}

export function untar(bytes: Uint8Array): ArchiveEntries {
  const entries: ArchiveEntries = [];
  let off = 0;
  while (off + 512 <= bytes.length) {
    if (bytes[off] === 0) break;
    const name = readString(bytes, off, 100);
    const size = readOctal(bytes, off + 124, 12);
    const type = bytes[off + 156];
    const prefix = readString(bytes, off + 345, 155);
    const full = prefix ? `${prefix}/${name}` : name;
    off += 512;
    if (type === 0 || type === 48) {
      entries.push({ name: full, data: bytes.slice(off, off + size) });
    }
    off += Math.ceil(size / 512) * 512;
  }
  return entries;
}

function writeOctal(bytes: Uint8Array, off: number, len: number, value: number) {
  const s = value.toString(8).padStart(len - 1, "0");
  for (let i = 0; i < s.length; i++) bytes[off + i] = s.charCodeAt(i);
}

export function tar(entries: ArchiveEntries): Uint8Array {
  const enc = new TextEncoder();
  let total = 1024;
  for (const e of entries) total += 512 + Math.ceil(e.data.length / 512) * 512;
  const out = new Uint8Array(total);
  let off = 0;
  for (const e of entries) {
    const nameBytes = enc.encode(e.name.slice(0, 100));
    out.set(nameBytes, off);
    writeOctal(out, off + 100, 8, 0o644);
    writeOctal(out, off + 108, 8, 0);
    writeOctal(out, off + 116, 8, 0);
    writeOctal(out, off + 124, 12, e.data.length);
    writeOctal(out, off + 136, 12, Math.floor(Date.now() / 1000));
    out[off + 156] = 48;
    out.set(enc.encode("ustar"), off + 257);
    out[off + 263] = 48; out[off + 264] = 48;
    for (let i = 0; i < 8; i++) out[off + 148 + i] = 32;
    let sum = 0;
    for (let i = 0; i < 512; i++) sum += out[off + i];
    const cs = sum.toString(8).padStart(6, "0");
    for (let i = 0; i < 6; i++) out[off + 148 + i] = cs.charCodeAt(i);
    out[off + 154] = 0;
    out[off + 155] = 32;
    off += 512;
    out.set(e.data, off);
    off += Math.ceil(e.data.length / 512) * 512;
  }
  return out;
}
