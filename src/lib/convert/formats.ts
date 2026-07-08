import type { FormatDef } from "./types";

export const FORMATS: FormatDef[] = [
  { id: "png", label: "PNG", category: "image", exts: ["png"], mimes: ["image/png"] },
  { id: "jpg", label: "JPG", category: "image", exts: ["jpg", "jpeg"], mimes: ["image/jpeg"] },
  { id: "webp", label: "WebP", category: "image", exts: ["webp"], mimes: ["image/webp"] },
  { id: "bmp", label: "BMP", category: "image", exts: ["bmp"], mimes: ["image/bmp"] },
  { id: "tiff", label: "TIFF", category: "image", exts: ["tif", "tiff"], mimes: ["image/tiff"] },
  { id: "ico", label: "ICO", category: "image", exts: ["ico"], mimes: ["image/x-icon", "image/vnd.microsoft.icon"] },
  {
    id: "avif", label: "AVIF", category: "image", exts: ["avif"], mimes: ["image/avif"],
    decodeOnly: true,
    decodeOnlyReason: "No browser encodes AVIF client-side without a heavyweight WASM encoder — read-only for now.",
  },
  {
    id: "heic", label: "HEIC", category: "image", exts: ["heic", "heif"], mimes: ["image/heic", "image/heif"],
    decodeOnly: true,
    decodeOnlyReason: "HEIC encoding is not possible client-side due to licensing — decode only.",
  },
  {
    id: "svg", label: "SVG", category: "image", exts: ["svg"], mimes: ["image/svg+xml"],
    decodeOnly: true,
    decodeOnlyReason: "Raster→SVG is tracing, not conversion — SVG is a source only.",
  },

  { id: "gif", label: "GIF (animated)", category: "video", exts: ["gif"], mimes: ["image/gif"] },
  { id: "mp4", label: "MP4", category: "video", exts: ["mp4"], mimes: ["video/mp4"] },
  { id: "webm", label: "WebM", category: "video", exts: ["webm"], mimes: ["video/webm"] },
  { id: "mov", label: "MOV", category: "video", exts: ["mov"], mimes: ["video/quicktime"] },
  { id: "avi", label: "AVI", category: "video", exts: ["avi"], mimes: ["video/x-msvideo"] },
  { id: "mkv", label: "MKV", category: "video", exts: ["mkv"], mimes: ["video/x-matroska"] },

  { id: "mp3", label: "MP3", category: "audio", exts: ["mp3"], mimes: ["audio/mpeg"] },
  { id: "wav", label: "WAV", category: "audio", exts: ["wav"], mimes: ["audio/wav", "audio/x-wav"] },
  { id: "ogg", label: "OGG", category: "audio", exts: ["ogg"], mimes: ["audio/ogg"] },
  { id: "flac", label: "FLAC", category: "audio", exts: ["flac"], mimes: ["audio/flac"] },
  { id: "m4a", label: "M4A", category: "audio", exts: ["m4a"], mimes: ["audio/mp4", "audio/x-m4a"] },
  { id: "aac", label: "AAC", category: "audio", exts: ["aac"], mimes: ["audio/aac"] },

  { id: "zip", label: "ZIP", category: "archive", exts: ["zip"], mimes: ["application/zip"] },
  { id: "tar", label: "TAR", category: "archive", exts: ["tar"], mimes: ["application/x-tar"] },
  { id: "targz", label: "TAR.GZ", category: "archive", exts: ["tgz", "gz"], mimes: ["application/gzip"] },
  {
    id: "7z", label: "7Z", category: "archive", exts: ["7z"], mimes: ["application/x-7z-compressed"],
    decodeOnly: true,
    decodeOnlyReason: "No practical client-side 7Z encoder — source only.",
  },
  {
    id: "rar", label: "RAR", category: "archive", exts: ["rar"], mimes: ["application/vnd.rar", "application/x-rar-compressed"],
    decodeOnly: true,
    decodeOnlyReason: "No practical client-side RAR encoder — source only.",
  },

  { id: "json", label: "JSON", category: "structured", exts: ["json"], mimes: ["application/json"] },
  { id: "yaml", label: "YAML", category: "structured", exts: ["yaml", "yml"], mimes: ["application/yaml", "text/yaml"] },
  { id: "csv", label: "CSV", category: "structured", exts: ["csv"], mimes: ["text/csv"] },
  { id: "toml", label: "TOML", category: "structured", exts: ["toml"], mimes: ["application/toml"] },

  { id: "text", label: "Plain text", category: "bytes", exts: ["txt"], mimes: ["text/plain"] },
  { id: "base64", label: "Base64", category: "bytes", exts: [], mimes: [] },
  { id: "hex", label: "Hex", category: "bytes", exts: [], mimes: [] },
  { id: "url", label: "URL-encoded", category: "bytes", exts: [], mimes: [] },

  { id: "pdf", label: "PDF", category: "document", exts: ["pdf"], mimes: ["application/pdf"] },
];

export function getFormat(id: string): FormatDef | undefined {
  return FORMATS.find((f) => f.id === id);
}

export function detectFile(f: File): FormatDef | null {
  const ext = f.name.toLowerCase().split(".").pop() ?? "";
  if (f.name.toLowerCase().endsWith(".tar.gz")) return getFormat("targz")!;
  return (
    FORMATS.find((fmt) => fmt.mimes.includes(f.type)) ??
    FORMATS.find((fmt) => fmt.exts.includes(ext)) ??
    null
  );
}

export function targetsFor(source: FormatDef, multiFile: boolean): FormatDef[] {
  if (multiFile) {
    return source.category === "image" ? [getFormat("pdf")!] : [];
  }
  if (source.id === "pdf") {
    return [getFormat("png")!, getFormat("jpg")!];
  }
  const sameCat = FORMATS.filter((f) => f.category === source.category && !f.decodeOnly);
  if (source.category === "image") return [...sameCat, getFormat("pdf")!];
  return sameCat;
}
