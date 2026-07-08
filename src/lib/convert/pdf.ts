import * as UPNG from "upng-js";

export async function imagesToPdf(files: File[]): Promise<Blob> {
  const { PDFDocument } = await import("pdf-lib");
  const doc = await PDFDocument.create();
  for (const f of files) {
    const bmp = await createImageBitmap(f).catch(() => {
      throw new Error(`Could not decode ${f.name} — only PNG/JPG/WebP images can go into a PDF here.`);
    });
    const canvas = document.createElement("canvas");
    canvas.width = bmp.width;
    canvas.height = bmp.height;
    const ctx = canvas.getContext("2d")!;
    ctx.drawImage(bmp, 0, 0);
    const png = UPNG.encode(
      [ctx.getImageData(0, 0, bmp.width, bmp.height).data.buffer as ArrayBuffer],
      bmp.width,
      bmp.height,
      0
    );
    const image = await doc.embedPng(png);
    const page = doc.addPage([bmp.width, bmp.height]);
    page.drawImage(image, { x: 0, y: 0, width: bmp.width, height: bmp.height });
    bmp.close();
  }
  const bytes = await doc.save();
  return new Blob([bytes as BlobPart], { type: "application/pdf" });
}

export async function pdfToImages(
  file: File,
  format: "png" | "jpg",
  onProgress?: (msg: string) => void
): Promise<{ blob: Blob; ext: string }> {
  const pdfjs = await import("pdfjs-dist");
  pdfjs.GlobalWorkerOptions.workerSrc = new URL(
    "pdfjs-dist/build/pdf.worker.min.mjs",
    import.meta.url
  ).toString();

  const doc = await pdfjs.getDocument({ data: await file.arrayBuffer() }).promise;
  const pages: Blob[] = [];
  for (let i = 1; i <= doc.numPages; i++) {
    onProgress?.(`Rendering page ${i}/${doc.numPages}…`);
    const page = await doc.getPage(i);
    const viewport = page.getViewport({ scale: 2 });
    const canvas = document.createElement("canvas");
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const ctx = canvas.getContext("2d")!;
    await page.render({ canvas, canvasContext: ctx, viewport }).promise;
    const blob = await new Promise<Blob>((res, rej) =>
      canvas.toBlob(
        (b) => (b ? res(b) : rej(new Error("Page render failed."))),
        format === "png" ? "image/png" : "image/jpeg",
        0.92
      )
    );
    pages.push(blob);
  }

  if (pages.length === 1) return { blob: pages[0], ext: format };

  const { default: JSZip } = await import("jszip");
  const zip = new JSZip();
  const base = file.name.replace(/\.pdf$/i, "");
  for (const [i, blob] of pages.entries()) {
    zip.file(`${base}-page-${i + 1}.${format}`, await blob.arrayBuffer());
  }
  return { blob: await zip.generateAsync({ type: "blob" }), ext: "zip" };
}
