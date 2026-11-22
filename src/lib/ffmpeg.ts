"use client";

// Shared FFmpeg loader that uses locally-served files from /public/ffmpeg/
// to avoid CDN/CORS issues. The FFmpeg instance is cached at module level
// so it's only loaded once even if the user switches between media tools.

import type { FFmpeg } from "@ffmpeg/ffmpeg";

let ffmpegInstance: FFmpeg | null = null;
let loadingPromise: Promise<FFmpeg> | null = null;

// Local URLs — these are served from /public/ffmpeg/ by Next.js
const FFMPEG_CORE_URL = "/ffmpeg/ffmpeg-core.js";
const FFMPEG_WASM_URL = "/ffmpeg/ffmpeg-core.wasm";
const FFMPEG_WORKER_URL = "/ffmpeg/esm/worker.js";

export interface FFmpegLoadOptions {
  onProgress?: (progress: number) => void;
}

export async function getFFmpeg(opts?: FFmpegLoadOptions): Promise<FFmpeg> {
  // If already loaded, return cached instance
  if (ffmpegInstance) {
    if (opts?.onProgress) {
      // Re-attach progress handler
      ffmpegInstance.on("progress", ({ progress }: { progress: number }) => {
        opts.onProgress?.(Math.max(0, Math.min(1, progress)));
      });
    }
    return ffmpegInstance;
  }

  // If loading is in progress, wait for it
  if (loadingPromise) {
    return loadingPromise;
  }

  loadingPromise = (async () => {
    const { FFmpeg } = await import("@ffmpeg/ffmpeg");
    const ffmpeg = new FFmpeg();

    if (opts?.onProgress) {
      ffmpeg.on("progress", ({ progress }: { progress: number }) => {
        opts.onProgress?.(Math.max(0, Math.min(1, progress)));
      });
    }

    // Load with local URLs — no toBlobURL needed since same-origin
    await ffmpeg.load({
      coreURL: FFMPEG_CORE_URL,
      wasmURL: FFMPEG_WASM_URL,
      classWorkerURL: FFMPEG_WORKER_URL,
    });

    ffmpegInstance = ffmpeg;
    return ffmpeg;
  })();

  try {
    return await loadingPromise;
  } catch (err) {
    // Reset on failure so the next attempt can retry
    loadingPromise = null;
    ffmpegInstance = null;
    throw err;
  }
}

// Helper to fetch a File into a Uint8Array for FFmpeg.writeFile
export async function fileToUint8Array(file: File | Blob): Promise<Uint8Array> {
  const buf = await file.arrayBuffer();
  return new Uint8Array(buf);
}
