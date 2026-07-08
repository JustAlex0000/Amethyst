import * as UPNG from "upng-js";
import type { ImageOptions } from "./types";

export async function decodeImage(file: File, formatId: string): Promise<ImageBitmap> {
  if (formatId === "heic") {
    const { default: heic2any } = await import("heic2any");
    const out = await heic2any({ blob: file, toType: "image/png" });
    return createImageBitmap(Array.isArray(out) ? out[0] : out);
  }
  if (formatId === "svg") return decodeSvg(file);
  if (formatId === "tiff") return decodeTiff(file);
  try {
    return await createImageBitmap(file);
  } catch {
    return decodeViaImg(file);
  }
}

async function decodeViaImg(file: File): Promise<ImageBitmap> {
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    await new Promise<void>((res, rej) => {
      img.onload = () => res();
      img.onerror = () => rej(new Error("The browser could not decode this image."));
      img.src = url;
    });
    return await createImageBitmap(img);
  } finally {
    URL.revokeObjectURL(url);
  }
}

async function decodeSvg(file: File): Promise<ImageBitmap> {
  const url = URL.createObjectURL(new Blob([await file.arrayBuffer()], { type: "image/svg+xml" }));
  try {
    const img = new Image();
    await new Promise<void>((res, rej) => {
      img.onload = () => res();
      img.onerror = () => rej(new Error("Could not render this SVG."));
      img.src = url;
    });
    const w = img.naturalWidth || 1024;
    const h = img.naturalHeight || 1024;
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    canvas.getContext("2d")!.drawImage(img, 0, 0, w, h);
    return await createImageBitmap(canvas);
  } finally {
    URL.revokeObjectURL(url);
  }
}

async function decodeTiff(file: File): Promise<ImageBitmap> {
  const UTIF = await import("utif2");
  const buf = await file.arrayBuffer();
  const ifds = UTIF.decode(buf);
  if (!ifds.length) throw new Error("No image data found in this TIFF.");
  UTIF.decodeImage(buf, ifds[0]);
  const rgba = UTIF.toRGBA8(ifds[0]);
  const data = new ImageData(new Uint8ClampedArray(rgba), ifds[0].width, ifds[0].height);
  return createImageBitmap(data);
}

export async function encodeImage(
  bitmap: ImageBitmap,
  formatId: string,
  opts: ImageOptions
): Promise<Blob> {
  const canvas = draw(bitmap, opts.maxWidth);
  switch (formatId) {
    case "png":
      return encodePng(canvas);
    case "jpg":
      return toBlob(canvas, "image/jpeg", opts.quality);
    case "webp":
      return toBlob(canvas, "image/webp", opts.lossless ? 1.0 : opts.quality);
    case "bmp":
      return encodeBmp(canvas);
    case "tiff":
      return encodeTiff(canvas);
    case "ico":
      return encodeIco(bitmap);
    default:
      throw new Error(`No encoder for ${formatId}.`);
  }
}

function draw(bmp: ImageBitmap, maxWidth: number | null): HTMLCanvasElement {
  let { width: w, height: h } = bmp;
  if (maxWidth && maxWidth > 0 && maxWidth < w) {
    h = Math.round((maxWidth / w) * h);
    w = maxWidth;
  }
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d")!;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(bmp, 0, 0, w, h);
  return canvas;
}

function toBlob(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) =>
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("Encoding failed — the browser refused this format."))),
      type,
      quality
    )
  );
}

function encodePng(canvas: HTMLCanvasElement): Blob {
  const ctx = canvas.getContext("2d")!;
  const data = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const buf = UPNG.encode([data.data.buffer as ArrayBuffer], canvas.width, canvas.height, 0);
  return new Blob([buf], { type: "image/png" });
}

function encodeBmp(canvas: HTMLCanvasElement): Blob {
  const { width: w, height: h } = canvas;
  const img = canvas.getContext("2d")!.getImageData(0, 0, w, h).data;
  const rowSize = Math.ceil((w * 3) / 4) * 4;
  const dataSize = rowSize * h;
  const buf = new ArrayBuffer(54 + dataSize);
  const dv = new DataView(buf);
  dv.setUint8(0, 0x42); dv.setUint8(1, 0x4d);
  dv.setUint32(2, 54 + dataSize, true);
  dv.setUint32(10, 54, true);
  dv.setUint32(14, 40, true);
  dv.setInt32(18, w, true);
  dv.setInt32(22, h, true);
  dv.setUint16(26, 1, true);
  dv.setUint16(28, 24, true);
  dv.setUint32(34, dataSize, true);
  const bytes = new Uint8Array(buf);
  for (let y = 0; y < h; y++) {
    const srcRow = (h - 1 - y) * w * 4;
    const dst = 54 + y * rowSize;
    for (let x = 0; x < w; x++) {
      bytes[dst + x * 3] = img[srcRow + x * 4 + 2];
      bytes[dst + x * 3 + 1] = img[srcRow + x * 4 + 1];
      bytes[dst + x * 3 + 2] = img[srcRow + x * 4];
    }
  }
  return new Blob([buf], { type: "image/bmp" });
}

async function encodeTiff(canvas: HTMLCanvasElement): Promise<Blob> {
  const UTIF = await import("utif2");
  const { width: w, height: h } = canvas;
  const rgba = canvas.getContext("2d")!.getImageData(0, 0, w, h).data;
  const buf = UTIF.encodeImage(new Uint8Array(rgba.buffer), w, h);
  return new Blob([buf], { type: "image/tiff" });
}

async function encodeIco(bitmap: ImageBitmap): Promise<Blob> {
  const size = Math.min(256, Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  const scale = size / Math.max(bitmap.width, bitmap.height);
  const w = Math.round(bitmap.width * scale);
  const h = Math.round(bitmap.height * scale);
  ctx.drawImage(bitmap, (size - w) / 2, (size - h) / 2, w, h);
  const png = new Uint8Array(
    UPNG.encode([ctx.getImageData(0, 0, size, size).data.buffer as ArrayBuffer], size, size, 0)
  );
  const header = new ArrayBuffer(22);
  const dv = new DataView(header);
  dv.setUint16(2, 1, true);
  dv.setUint16(4, 1, true);
  dv.setUint8(6, size === 256 ? 0 : size);
  dv.setUint8(7, size === 256 ? 0 : size);
  dv.setUint16(12, 32, true);
  dv.setUint32(14, png.length, true);
  dv.setUint32(18, 22, true);
  return new Blob([header, png], { type: "image/x-icon" });
}
