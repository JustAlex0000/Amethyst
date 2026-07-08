import type { FFmpeg } from "@ffmpeg/ffmpeg";

let enginePromise: Promise<FFmpeg> | null = null;

const CORE = "https://unpkg.com/@ffmpeg/core@0.12.10/dist/umd";

export function loadFfmpeg(onProgress?: (msg: string) => void): Promise<FFmpeg> {
  if (!enginePromise) {
    enginePromise = (async () => {
      onProgress?.("Loading ffmpeg engine (~10 MB, one time)…");
      const [{ FFmpeg }, { toBlobURL }] = await Promise.all([
        import("@ffmpeg/ffmpeg"),
        import("@ffmpeg/util"),
      ]);
      const ff = new FFmpeg();
      await ff.load({
        coreURL: await toBlobURL(`${CORE}/ffmpeg-core.js`, "text/javascript"),
        wasmURL: await toBlobURL(`${CORE}/ffmpeg-core.wasm`, "application/wasm"),
      });
      return ff;
    })().catch((e) => {
      enginePromise = null;
      throw e instanceof Error ? e : new Error("Could not load the ffmpeg engine.");
    });
  }
  return enginePromise;
}

const MIME: Record<string, string> = {
  gif: "image/gif",
  mp4: "video/mp4",
  webm: "video/webm",
  mov: "video/quicktime",
  avi: "video/x-msvideo",
  mkv: "video/x-matroska",
  mp3: "audio/mpeg",
  wav: "audio/wav",
  ogg: "audio/ogg",
  flac: "audio/flac",
  m4a: "audio/mp4",
  aac: "audio/aac",
};

export async function convertMedia(
  file: File,
  sourceExt: string,
  targetExt: string,
  onProgress?: (msg: string) => void
): Promise<Blob> {
  const ff = await loadFfmpeg(onProgress);
  const { fetchFile } = await import("@ffmpeg/util");
  const inName = `in.${sourceExt}`;
  const outName = `out.${targetExt === "targz" ? "tar.gz" : targetExt}`;
  onProgress?.("Transcoding…");
  await ff.writeFile(inName, await fetchFile(file));
  const args = ["-i", inName];
  if (targetExt === "gif") {
    args.push("-vf", "fps=12,scale=480:-1:flags=lanczos");
  }
  args.push(outName);
  const code = await ff.exec(args);
  if (code !== 0) {
    throw new Error(`ffmpeg could not convert ${sourceExt.toUpperCase()} to ${targetExt.toUpperCase()} — the file may use an unsupported codec.`);
  }
  const data = await ff.readFile(outName);
  await ff.deleteFile(inName).catch(() => {});
  await ff.deleteFile(outName).catch(() => {});
  const bytes = typeof data === "string" ? new TextEncoder().encode(data) : data;
  return new Blob([bytes as BlobPart], { type: MIME[targetExt] ?? "application/octet-stream" });
}
