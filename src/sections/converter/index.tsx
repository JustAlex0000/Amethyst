"use client";

import { useEffect, useRef, useState } from "react";
import { Field, Button, TextArea, CopyButton, Output, ErrorNote, inputCls } from "@/components/ui";
import { FORMATS, getFormat, detectFile, targetsFor } from "@/lib/convert/formats";
import { CATEGORY_LABELS, type FormatDef } from "@/lib/convert/types";
import { decodeImage, encodeImage } from "@/lib/convert/image";
import { decodeArchive, encodeArchive } from "@/lib/convert/archive";
import { decodeStructured, encodeStructured, decodeBytes, encodeBytes, detectText } from "@/lib/convert/data";
import { convertMedia } from "@/lib/convert/media";
import { imagesToPdf, pdfToImages } from "@/lib/convert/pdf";

function kb(n: number): string {
  return n > 1024 * 1024 ? `${(n / 1024 / 1024).toFixed(2)} MB` : `${(n / 1024).toFixed(1)} KB`;
}

export default function Converter() {
  const [files, setFiles] = useState<File[]>([]);
  const [text, setText] = useState("");
  const [source, setSource] = useState<FormatDef | null>(null);
  const [autoDetected, setAutoDetected] = useState<string | null>(null);
  const [target, setTarget] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState("");

  const [maxWidth, setMaxWidth] = useState("");
  const [lossless, setLossless] = useState(true);
  const [quality, setQuality] = useState(0.85);

  const [fileResult, setFileResult] = useState<{ url: string; name: string; size: number } | null>(null);
  const [textResult, setTextResult] = useState("");

  const resultUrl = useRef<string | null>(null);
  useEffect(() => () => { if (resultUrl.current) URL.revokeObjectURL(resultUrl.current); }, []);

  const file = files[0] ?? null;
  const multi = files.length > 1;

  function resetResults() {
    setError("");
    setFileResult(null);
    setTextResult("");
    setProgress("");
  }

  function onFiles(list: FileList | null) {
    const fs = [...(list ?? [])];
    if (fs.length === 0) return;
    resetResults();
    setText("");
    setTarget("");
    setFiles(fs);
    const fmt = detectFile(fs[0]);
    setAutoDetected(fmt?.id ?? null);
    setSource(fmt);
    if (!fmt) setError("Unrecognized file type. Pick the source type manually below.");
    if (fs.length > 1 && (!fmt || fmt.category !== "image")) {
      setError("Multiple files are only supported for images (combined into one PDF).");
      setFiles([fs[0]]);
    }
  }

  function onText(s: string) {
    resetResults();
    setFiles([]);
    setText(s);
    if (s.trim()) {
      const id = detectText(s);
      setAutoDetected(id);
      setSource(getFormat(id) ?? null);
    } else {
      setAutoDetected(null);
      setSource(null);
    }
    setTarget("");
  }

  const targets = source ? targetsFor(source, multi) : [];
  const targetFmt = target ? getFormat(target) : null;
  const lossyWebp = target === "webp" && !lossless;
  const isMediaSource = source?.category === "video" || source?.category === "audio";

  async function convert() {
    if (!source || !targetFmt) return;
    resetResults();
    setBusy(true);
    try {
      switch (source.category) {
        case "image": {
          if (!file) throw new Error("Upload an image file first.");
          if (targetFmt.id === "pdf") {
            const blob = await imagesToPdf(files);
            setDownload(blob, `${base()}.pdf`);
            break;
          }
          const bmp = await decodeImage(file, source.id);
          const blob = await encodeImage(bmp, targetFmt.id, {
            maxWidth: maxWidth ? parseInt(maxWidth, 10) : null,
            lossless,
            quality,
          });
          bmp.close();
          setDownload(blob, `${base()}.${targetFmt.id}`);
          break;
        }
        case "document": {
          if (!file) throw new Error("Upload a PDF first.");
          const { blob, ext } = await pdfToImages(file, targetFmt.id as "png" | "jpg", setProgress);
          setDownload(blob, `${base()}.${ext}`);
          break;
        }
        case "video":
        case "audio": {
          if (!file) throw new Error("Upload a media file first.");
          const blob = await convertMedia(file, source.exts[0] ?? source.id, targetFmt.id, setProgress);
          setDownload(blob, `${base()}.${targetFmt.id}`);
          break;
        }
        case "archive": {
          if (!file) throw new Error("Upload an archive first.");
          setProgress("Extracting…");
          const entries = await decodeArchive(file, source.id);
          if (entries.length === 0) throw new Error("The archive contains no files.");
          setProgress(`Repacking ${entries.length} file${entries.length === 1 ? "" : "s"}…`);
          const blob = await encodeArchive(entries, targetFmt.id);
          setDownload(blob, `${base()}.${targetFmt.id === "targz" ? "tar.gz" : targetFmt.id}`);
          break;
        }
        case "structured": {
          const value = decodeStructured(text || (file ? await file.text() : ""), source.id);
          setTextResult(encodeStructured(value, targetFmt.id));
          break;
        }
        case "bytes": {
          const bytes = decodeBytes(text || (file ? await file.text() : ""), source.id);
          setTextResult(encodeBytes(bytes, targetFmt.id));
          break;
        }
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Conversion failed.");
    } finally {
      setBusy(false);
      setProgress("");
    }
  }

  function base(): string {
    return file ? file.name.replace(/\.[^.]+$/, "") : "converted";
  }

  function setDownload(blob: Blob, name: string) {
    if (resultUrl.current) URL.revokeObjectURL(resultUrl.current);
    const url = URL.createObjectURL(blob);
    resultUrl.current = url;
    setFileResult({ url, name, size: blob.size });
  }

  const sourceChoices = source
    ? FORMATS.filter((f) => f.category === source.category)
    : FORMATS.filter((f) => f.category === "structured" || f.category === "bytes");

  const totalInputSize = files.reduce((s, f) => s + f.size, 0);

  return (
    <div className="max-w-3xl">
      <div className="mb-4 grid gap-3 md:grid-cols-2">
        <div>
          <div className="mb-1 font-mono text-[11px] uppercase tracking-wider text-dim">
            Upload file(s)
          </div>
          <input
            type="file"
            multiple
            onChange={(e) => onFiles(e.target.files)}
            className="block w-full cursor-pointer rounded-sm border border-dashed border-line bg-surface px-3 py-5 text-sm text-dim file:mr-3 file:cursor-pointer file:rounded-sm file:border file:border-line file:bg-raised file:px-3 file:py-1.5 file:text-sm file:text-text"
            aria-label="Upload files to convert"
          />
        </div>
        <Field label="…or paste text">
          <TextArea
            value={files.length ? "" : text}
            onChange={(e) => onText(e.target.value)}
            placeholder={'{"paste": "JSON, YAML, CSV, TOML, Base64, hex…"}'}
            className="min-h-[86px]"
            disabled={files.length > 0}
          />
        </Field>
      </div>

      {files.length > 0 && (
        <p className="mb-3 font-mono text-xs text-dim" data-numeric>
          {multi ? `${files.length} files` : file!.name} · {kb(totalInputSize)} — processed locally, never uploaded
        </p>
      )}

      {(files.length > 0 || text.trim()) && (
        <div className="mb-4 flex flex-wrap items-end gap-3">
          <Field
            label={
              source && autoDetected === source.id
                ? `From (detected: ${source.label} · ${CATEGORY_LABELS[source.category]})`
                : "From"
            }
          >
            <select
              value={source?.id ?? ""}
              onChange={(e) => {
                setSource(getFormat(e.target.value) ?? null);
                setTarget("");
                resetResults();
              }}
              className={inputCls}
              aria-label="Source format"
            >
              <option value="" disabled>Pick source</option>
              {sourceChoices.map((f) => (
                <option key={f.id} value={f.id}>{f.label}</option>
              ))}
            </select>
          </Field>

          <Field label="To">
            <select
              value={target}
              onChange={(e) => {
                setTarget(e.target.value);
                resetResults();
              }}
              className={inputCls}
              aria-label="Target format"
              disabled={!source || targets.length === 0}
            >
              <option value="" disabled>Pick target</option>
              {targets.map((f) => (
                <option key={f.id} value={f.id}>{f.label}</option>
              ))}
            </select>
          </Field>

          <div className="pb-3">
            <Button variant="primary" onClick={convert} disabled={!source || !target || busy}>
              {busy ? "Converting…" : "Convert"}
            </Button>
          </div>
        </div>
      )}

      {isMediaSource && !busy && !fileResult && (
        <p className="mb-3 text-xs text-dim">
          Video and audio conversion loads the ffmpeg engine (~10 MB) on first use, then runs
          entirely in your browser.
        </p>
      )}

      {source?.category === "image" && targetFmt && targetFmt.id !== "pdf" && (
        <div className="mb-4 flex flex-wrap items-end gap-4 rounded-sm border border-line bg-surface p-3">
          <Field label="Resize: max width (px, optional)">
            <input
              value={maxWidth}
              onChange={(e) => setMaxWidth(e.target.value.replace(/\D/g, ""))}
              placeholder="keep"
              inputMode="numeric"
              className={`${inputCls} w-32 font-mono`}
            />
          </Field>
          {target === "webp" && (
            <label className="flex items-center gap-2 pb-3 text-sm">
              <input
                type="checkbox"
                checked={lossless}
                onChange={(e) => setLossless(e.target.checked)}
                className="accent-(--amethyst)"
              />
              <span className={lossless ? "text-lime" : "text-text"}>
                Lossless {lossless ? "(default)" : ""}
              </span>
            </label>
          )}
          {(target === "jpg" || lossyWebp) && (
            <Field label={`Quality · ${Math.round(quality * 100)}%`}>
              <input
                type="range"
                min={10}
                max={100}
                value={quality * 100}
                onChange={(e) => setQuality(Number(e.target.value) / 100)}
                className="accent-(--amethyst)"
              />
            </Field>
          )}
          {lossyWebp && (
            <p className="w-full text-xs text-danger">
              Lossy WebP is irreversible — converting back later re-encodes already-degraded
              pixels; it does not recover the original.
            </p>
          )}
        </div>
      )}

      {progress && <p className="mb-3 font-mono text-xs text-amethyst">{progress}</p>}
      {error && <ErrorNote>{error}</ErrorNote>}

      {fileResult && files.length > 0 && (
        <div className="mt-4 flex flex-wrap items-center gap-4 rounded-sm border border-line bg-surface p-4">
          {/^(png|jpg|webp|bmp)$/.test(fileResult.name.split(".").pop() ?? "") && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={fileResult.url} alt="Converted result preview" className="max-h-48 max-w-full rounded-sm" />
          )}
          <div>
            <table className="font-mono text-sm" data-numeric>
              <tbody>
                <tr>
                  <td className="pr-4 text-dim">original</td>
                  <td>{kb(totalInputSize)}</td>
                </tr>
                <tr>
                  <td className="pr-4 text-dim">result</td>
                  <td className={fileResult.size <= totalInputSize ? "text-lime" : "text-danger"}>
                    {kb(fileResult.size)} ({fileResult.size <= totalInputSize ? "−" : "+"}
                    {Math.abs(Math.round((1 - fileResult.size / totalInputSize) * 100))}%)
                  </td>
                </tr>
              </tbody>
            </table>
            {fileResult.size > totalInputSize && source?.category === "image" && (
              <p className="mt-1 max-w-[40ch] text-xs text-dim">
                Result is larger than the original — usually a lossless target re-encoding a
                lossy source. Pick a lossy target or lower quality if size matters.
              </p>
            )}
            <a
              href={fileResult.url}
              download={fileResult.name}
              className="mt-2 inline-block rounded-sm border border-lime/40 bg-lime/10 px-3 py-1.5 text-sm text-lime transition-colors duration-100 hover:bg-lime/20"
            >
              Download {fileResult.name}
            </a>
          </div>
        </div>
      )}

      {textResult && (
        <div className="mt-4">
          <Output label={`Output (${targetFmt?.label ?? ""})`}>{textResult}</Output>
          <CopyButton text={textResult} />
        </div>
      )}
    </div>
  );
}
