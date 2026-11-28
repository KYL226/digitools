"use client";

import { useCallback, useRef, useState } from "react";
import { CheckSquare, Download, Loader2, Scissors, ShieldCheck, Square } from "lucide-react";
import { toast } from "sonner";
import { useI18n } from "@/lib/i18n/i18n-context";
import { FileDropzone } from "@/components/tool/file-dropzone";
import { ResetButton } from "@/components/tool/action-buttons";
import { ErrorMessage, LoadingState } from "@/components/tool/states";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { openPdfDocument, renderPageThumbnail, loadPdfLib, formatBytes } from "@/lib/pdf";

interface DocState {
  file: File;
  pageCount: number;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function PdfSplitter() {
  const { t } = useI18n();
  const [doc, setDoc] = useState<DocState | null>(null);
  const [thumbs, setThumbs] = useState<string[]>([]);
  const [selected, setSelected] = useState<boolean[]>([]);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const jobIdRef = useRef(0);

  const selectedCount = selected.filter(Boolean).length;

  const handleFile = useCallback(
    async (file: File) => {
      const jobId = ++jobIdRef.current;
      setError(null);
      setThumbs([]);
      setSelected([]);
      setProgress(null);
      setWorking(true);
      try {
        const opened = await openPdfDocument(await file.arrayBuffer());
        try {
          if (jobId !== jobIdRef.current) {
            return;
          }
          const pdfDoc = opened.document;
          const pageCount = pdfDoc.numPages;
          setDoc({ file, pageCount });
          setSelected(Array.from({ length: pageCount }, () => true));

          const rendered: string[] = [];
          for (let i = 1; i <= pageCount; i++) {
            if (jobId !== jobIdRef.current) return;
            try {
              const page = await pdfDoc.getPage(i);
              const thumb = await renderPageThumbnail(page, 140);
              rendered.push(thumb);
            } catch {
              rendered.push("");
            }
            setThumbs([...rendered]);
            setProgress({ done: i, total: pageCount });
          }
        } finally {
          await opened.destroy();
        }
      } catch (err) {
        setError(
          t("tools.pdf-splitter.errors.invalidPdf", {
            name: file.name,
            message: err instanceof Error ? err.message : String(err),
          })
        );
        setDoc(null);
      } finally {
        if (jobId === jobIdRef.current) {
          setWorking(false);
          setProgress(null);
        }
      }
    },
    [t]
  );

  const togglePage = useCallback((index: number) => {
    setSelected((prev) => {
      const copy = [...prev];
      copy[index] = !copy[index];
      return copy;
    });
  }, []);

  const selectAll = useCallback(() => {
    if (!doc) return;
    setSelected(Array.from({ length: doc.pageCount }, () => true));
  }, [doc]);

  const selectNone = useCallback(() => {
    if (!doc) return;
    setSelected(Array.from({ length: doc.pageCount }, () => false));
  }, [doc]);

  const invertSelection = useCallback(() => {
    setSelected((prev) => prev.map((s) => !s));
  }, []);

  const handleReset = useCallback(() => {
    jobIdRef.current++;
    setDoc(null);
    setThumbs([]);
    setSelected([]);
    setProgress(null);
    setWorking(false);
    setError(null);
  }, []);

  const buildPdfFromPages = useCallback(
    async (indices: number[]) => {
      if (!doc) throw new Error("no doc");
      const { PDFDocument } = await loadPdfLib();
      const src = await PDFDocument.load(await doc.file.arrayBuffer());
      const out = await PDFDocument.create();
      const pages = await out.copyPages(src, indices);
      pages.forEach((p) => out.addPage(p));
      const bytes = await out.save();
      return new Blob([bytes as unknown as BlobPart], { type: "application/pdf" });
    },
    [doc]
  );

  const indices = useCallback(
    () => selected.flatMap((s, i) => (s ? [i] : [])),
    [selected]
  );

  const handleDownloadSelected = useCallback(async () => {
    const idx = indices();
    if (idx.length === 0) return;
    setWorking(true);
    setError(null);
    try {
      const blob = await buildPdfFromPages(idx);
      const base = doc?.file.name.replace(/\.pdf$/i, "") ?? "document";
      triggerDownload(blob, `${base}-extracted.pdf`);
      toast.success(t("tools.pdf-splitter.downloadDone", { count: idx.length }));
    } catch (err) {
      setError(
        t("tools.pdf-splitter.errors.splitFailed", {
          message: err instanceof Error ? err.message : String(err),
        })
      );
    } finally {
      setWorking(false);
    }
  }, [indices, buildPdfFromPages, doc, t]);

  const handleDownloadEach = useCallback(async () => {
    const idx = indices();
    if (idx.length === 0) return;
    if (idx.length > 50) {
      setError(t("tools.pdf-splitter.errors.tooManyIndividual", { max: 50 }));
      return;
    }
    setWorking(true);
    setError(null);
    try {
      const base = doc?.file.name.replace(/\.pdf$/i, "") ?? "document";
      for (const i of idx) {
        const blob = await buildPdfFromPages([i]);
        triggerDownload(blob, `${base}-page-${i + 1}.pdf`);
        await sleep(350);
      }
      toast.success(t("tools.pdf-splitter.downloadDone", { count: idx.length }));
    } catch (err) {
      setError(
        t("tools.pdf-splitter.errors.splitFailed", {
          message: err instanceof Error ? err.message : String(err),
        })
      );
    } finally {
      setWorking(false);
    }
  }, [indices, buildPdfFromPages, doc, t]);

  if (!doc) {
    return (
      <div className="space-y-4">
        <FileDropzone
          onFile={handleFile}
          accept="application/pdf,.pdf"
          maxSizeMB={100}
          label={t("tools.pdf-splitter.input")}
        />
        {error && <ErrorMessage message={error} />}
        <p className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
          <ShieldCheck className="h-3.5 w-3.5" />
          {t("common.privacyNote")} · {t("common.clientSideOnly")}
        </p>
      </div>
    );
  }

  const loadingThumbs = thumbs.length < doc.pageCount;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">{doc.file.name}</p>
          <p className="text-xs text-muted-foreground">
            {t("tools.pdf-splitter.pages", { count: doc.pageCount })} ·{" "}
            {formatBytes(doc.file.size)}
          </p>
        </div>
        <Badge variant="secondary">
          {t("tools.pdf-splitter.selectedCount", { count: selectedCount })}
        </Badge>
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        <Button variant="outline" size="sm" onClick={selectAll}>
          <CheckSquare className="mr-1.5 h-3.5 w-3.5" />
          {t("tools.pdf-splitter.selectAll")}
        </Button>
        <Button variant="outline" size="sm" onClick={selectNone}>
          <Square className="mr-1.5 h-3.5 w-3.5" />
          {t("tools.pdf-splitter.selectNone")}
        </Button>
        <Button variant="outline" size="sm" onClick={invertSelection}>
          {t("tools.pdf-splitter.invert")}
        </Button>
      </div>

      {loadingThumbs && (
        <LoadingState
          label={
            progress
              ? t("tools.pdf-splitter.rendering", {
                  done: progress.done,
                  total: progress.total,
                })
              : t("common.loading")
          }
        />
      )}

      {thumbs.length > 0 && (
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8">
          {thumbs.map((src, i) => (
            <button
              key={i}
              type="button"
              onClick={() => togglePage(i)}
              aria-pressed={selected[i] ?? false}
              className={`group relative flex flex-col items-center gap-1 rounded-lg border p-1.5 transition-colors ${
                selected[i]
                  ? "border-primary bg-primary/5 ring-1 ring-primary"
                  : "border-border hover:border-primary/50"
              }`}
            >
              <div className="flex aspect-[3/4] w-full items-center justify-center overflow-hidden rounded bg-muted/40">
                {src ? (
                  <img src={src} alt="" className="h-full w-full object-contain" />
                ) : (
                  <span className="text-[10px] text-muted-foreground">—</span>
                )}
              </div>
              <span className="flex w-full items-center justify-center gap-1 text-[10px] text-muted-foreground">
                {selected[i] ? (
                  <CheckSquare aria-hidden="true" className="h-3 w-3 text-primary" />
                ) : (
                  <Square aria-hidden="true" className="h-3 w-3" />
                )}
                {i + 1}
              </span>
            </button>
          ))}
        </div>
      )}

      {(working || loadingThumbs) && !progress && <LoadingState />}
      {error && <ErrorMessage message={error} />}

      <div className="flex flex-wrap items-center gap-2">
        <Button
          onClick={handleDownloadSelected}
          disabled={working || selectedCount === 0}
          className="gap-1.5"
        >
          {working ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Scissors className="h-4 w-4" />
          )}
          {t("tools.pdf-splitter.downloadSelected", { count: selectedCount })}
        </Button>
        <Button
          variant="secondary"
          onClick={handleDownloadEach}
          disabled={working || selectedCount === 0}
          className="gap-1.5"
        >
          <Download className="h-4 w-4" />
          {t("tools.pdf-splitter.downloadEach")}
        </Button>
        <ResetButton onClick={handleReset} variant="outline" />
      </div>

      <p className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
        <ShieldCheck className="h-3.5 w-3.5" />
        {t("common.privacyNote")} · {t("common.clientSideOnly")}
      </p>
    </div>
  );
}
