import type { ArchiveEntries } from "./types";
import { tar, untar } from "./tar";

export async function decodeArchive(file: File, formatId: string): Promise<ArchiveEntries> {
  const bytes = new Uint8Array(await file.arrayBuffer());
  switch (formatId) {
    case "zip": {
      const { default: JSZip } = await import("jszip");
      const zip = await JSZip.loadAsync(bytes);
      const entries: ArchiveEntries = [];
      for (const [name, entry] of Object.entries(zip.files)) {
        if (!entry.dir) entries.push({ name, data: await entry.async("uint8array") });
      }
      return entries;
    }
    case "tar":
      return untar(bytes);
    case "targz": {
      const pako = await import("pako");
      return untar(pako.ungzip(bytes));
    }
    case "7z":
    case "rar":
      throw new Error(
        `${formatId.toUpperCase()} extraction is not available in this build yet — repack as ZIP or TAR first.`
      );
    default:
      throw new Error(`No archive decoder for ${formatId}.`);
  }
}

export async function encodeArchive(entries: ArchiveEntries, formatId: string): Promise<Blob> {
  switch (formatId) {
    case "zip": {
      const { default: JSZip } = await import("jszip");
      const zip = new JSZip();
      for (const e of entries) zip.file(e.name, e.data);
      return zip.generateAsync({ type: "blob", compression: "DEFLATE" });
    }
    case "tar":
      return new Blob([tar(entries) as BlobPart], { type: "application/x-tar" });
    case "targz": {
      const pako = await import("pako");
      return new Blob([pako.gzip(tar(entries)) as BlobPart], { type: "application/gzip" });
    }
    default:
      throw new Error(`No archive encoder for ${formatId}.`);
  }
}
