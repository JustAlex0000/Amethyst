export type Category =
  | "image"
  | "video"
  | "audio"
  | "archive"
  | "structured"
  | "bytes"
  | "document";

export const CATEGORY_LABELS: Record<Category, string> = {
  image: "Image",
  video: "Video / Animated",
  audio: "Audio",
  archive: "Archive",
  structured: "Structured data",
  bytes: "Byte encoding",
  document: "Document",
};

export type FormatDef = {
  id: string;
  label: string;
  category: Category;
  exts: string[];
  mimes: string[];
  decodeOnly?: boolean;
  decodeOnlyReason?: string;
};

export type ImageOptions = {
  maxWidth: number | null;
  lossless: boolean;
  quality: number;
};

export type ArchiveEntries = { name: string; data: Uint8Array }[];
