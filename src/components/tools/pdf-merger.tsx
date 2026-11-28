"use client";

import { useCallback, useState } from "react";
import { ArrowDown, ArrowUp, FileText, Files, Loader2, ShieldCheck, Trash2 } from "lucide-react";
import { useI18n } from "@/lib/i18n/i18n-context";
import { FileDropzone } from "@/components/tool/file-dropzone";
import { DownloadButton } from "@/components/tool/download-button";
import { ResetButton } from "@/components/tool/action-buttons";
import { ErrorMessage, LoadingState } from "@/components/tool/states";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { openPdfDocument, renderPageThumbnail, loadPdfLib, formatBytes } from "@/lib/pdf";

interface MergeItem {
  id: string;
  file: File;
  pageCount: number;
  thumb: string | null;
}

let idCounter = 0;

export function PdfMerger() {
  const { t } = useI18n();
  const [items, setItems] = useState<MergeItem[]>([]);
  const [result, setResult] = useState<{ blob: Blob; pages: number } | null>(null);
  const [merging, setMerging] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const totalPages = items.reduce((sum, it) => sum + it.pageCount, 0);

  const handleFiles = useCallback(
    async (files: File[]) => {
      setError(null);
      setScanning(true);
      const added: MergeItem[] = [];
      for (const file of files) {
        try {
          // Fresh copy: pdf.js may detach the ArrayBuffer it receives.
          const opened = await openPdfDocument(await file.arrayBuffer());
          try {
            const doc = opened.document;
            let thumb: string | null = null;
            try {
              const page = await doc.getPage(1);
              thumb = await renderPageThumbnail(page, 160);
            } catch {
              thumb = null;
            }
            added.push({
              id: `pdf-${++idCounter}`,
              file,
              pageCount: doc.numPages,
              thumb,
            });
          } finally {
            await opened.destroy();
          }
        } catch (err) {
          setError(
            t("tools.pdf-merger.errors.invalidPdf", {
              name: file.name,
              message: err instanceof Error ? err.message : String(err),
            })
          );
        }
      }
      if (added.length > 0) {
        setItems((prev) => [...prev, ...added]);
        setResult(null);
      }
      setScanning(false);
    },
    [t]
  );

  const move = useCallback((index: number, dir: -1 | 1) => {
    setItems((prev) => {
      const j = index + dir;
      if (j < 0 || j >= prev.length) return prev;
      const copy = [...prev];
      const tmp = copy[index];
      copy[index] = copy[j];
      copy[j] = tmp;
      return copy;
    });
    setResult(null);
  }, []);

  const removeItem = useCallback((id: string) => {
    setItems((prev) => prev.filter((it) => it.id !== id));
    setResult(null);
  }, []);

  const handleReset = useCallback(() => {
    setItems([]);
    setResult(null);
    setError(null);
    setMerging(false);
    setScanning(false);
  }, []);

  const handleMerge = useCallback(async () => {
    if (items.length < 2) return;
    setMerging(true);
    setError(null);
    setResult(null);
    try {
      const { PDFDocument } = await loadPdfLib();
      const merged = await PDFDocument.create();
      for (const item of items) {
        const src = await PDFDocument.load(await item.file.arrayBuffer());
        const pages = await merged.copyPages(src, src.getPageIndices());
        pages.forEach((p) => merged.addPage(p));
      }
      const bytes = await merged.save();
      const blob = new Blob([bytes as unknown as BlobPart], { type: "application/pdf" });
      setResult({ blob, pages: merged.getPageCount() });
    } catch (err) {
      setError(
        t("tools.pdf-merger.errors.mergeFailed", {
          message: err instanceof Error ? err.message : String(err),
        })
      );
    } finally {
      setMerging(false);
    }
  }, [items, t]);

  const baseName =
    items.length > 0 ? items[0].file.name.replace(/\.pdf$/i, "") : "merged";

  return (
    <div className="space-y-4">
      {items.length === 0 ? (
        <FileDropzone
          onFile={(file) => handleFiles([file])}
          onFiles={handleFiles}
          multiple
          accept="application/pdf,.pdf"
          maxSizeMB={100}
          label={t("tools.pdf-merger.input")}
        />
      ) : (
        <>
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-medium">
              {t("tools.pdf-merger.fileCount", { count: items.length })}
            </p>
            <Badge variant="secondary" className="gap-1">
              <Files className="h-3 w-3" />
              {t("tools.pdf-merger.pages", { count: totalPages })}
            </Badge>
          </div>

          <div className="space-y-2">
            {items.map((item, i) => (
              <div
                key={item.id}
                className="flex items-center gap-3 rounded-lg border p-2"
              >
                <div className="flex h-16 w-12 shrink-0 items-center justify-center overflow-hidden rounded border bg-muted/40">
                  {item.thumb ? (
                    <img
                      src={item.thumb}
                      alt=""
                      className="h-full w-full object-contain"
                    />
                  ) : (
                    <FileText className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{item.file.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {t("tools.pdf-merger.pages", { count: item.pageCount })} ·{" "}
                    {formatBytes(item.file.size)}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-0.5">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    disabled={i === 0}
                    aria-label={t("tools.pdf-merger.moveUp")}
                    onClick={() => move(i, -1)}
                  >
                    <ArrowUp className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    disabled={i === items.length - 1}
                    aria-label={t("tools.pdf-merger.moveDown")}
                    onClick={() => move(i, 1)}
                  >
                    <ArrowDown className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive"
                    aria-label={t("tools.pdf-merger.remove")}
                    onClick={() => removeItem(item.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {items.length < 2 && (
            <p className="text-xs text-muted-foreground">
              {t("tools.pdf-merger.needTwo")}
            </p>
          )}

          {scanning && <LoadingState label={t("tools.pdf-merger.scanning")} />}
          {merging && <LoadingState label={t("tools.pdf-merger.merging")} />}
          {error && <ErrorMessage message={error} />}

          <div className="flex flex-wrap items-center gap-2">
            <Button
              onClick={handleMerge}
              disabled={items.length < 2 || merging || scanning}
              className="gap-1.5"
            >
              {merging ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Files className="h-4 w-4" />
              )}
              {t("tools.pdf-merger.merge")}
            </Button>
            <DownloadButton
              data={result?.blob ?? ""}
              filename={`${baseName}-merged.pdf`}
              mime="application/pdf"
              disabled={!result}
              variant={result ? "default" : "secondary"}
              label={
                result
                  ? t("tools.pdf-merger.downloadResult", { count: result.pages })
                  : t("common.download")
              }
            />
            <ResetButton onClick={handleReset} variant="outline" />
          </div>
        </>
      )}

      <p className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
        <ShieldCheck className="h-3.5 w-3.5" />
        {t("common.privacyNote")} · {t("common.clientSideOnly")}
      </p>
    </div>
  );
}
