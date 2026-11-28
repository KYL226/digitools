"use client";

// Shared PDF helpers. pdf.js (preview) and pdf-lib (editing) are loaded
// lazily so they only download when a PDF tool is opened.

import type { PDFDocumentProxy, PDFPageProxy } from "pdfjs-dist";

let pdfjsPromise: Promise<typeof import("pdfjs-dist")> | null = null;

export async function getPdfjs(): Promise<typeof import("pdfjs-dist")> {
  if (!pdfjsPromise) {
    pdfjsPromise = import("pdfjs-dist").then((pdfjs) => {
      pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
      return pdfjs;
    });
  }
  return pdfjsPromise;
}

export async function openPdfDocument(
  data: ArrayBuffer
): Promise<{ document: PDFDocumentProxy; destroy: () => Promise<void> }> {
  const pdfjs = await getPdfjs();
  // NOTE: pdf.js may transfer `data` to its worker (detaching the buffer).
  // Always pass a fresh copy when the buffer is reused elsewhere.
  const loadingTask = pdfjs.getDocument({
    data: new Uint8Array(data.slice(0)),
  });
  const document = await loadingTask.promise;
  return {
    document,
    destroy: () => loadingTask.destroy(),
  };
}

export async function renderPageThumbnail(
  page: PDFPageProxy,
  maxWidth = 160
): Promise<string> {
  const base = page.getViewport({ scale: 1 });
  const scale = maxWidth / base.width;
  const viewport = page.getViewport({ scale });
  const canvas = document.createElement("canvas");
  canvas.width = Math.ceil(viewport.width);
  canvas.height = Math.ceil(viewport.height);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas unsupported");
  await page.render({ canvas, viewport }).promise;
  return canvas.toDataURL("image/png");
}

export async function loadPdfLib() {
  return import("pdf-lib");
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}
