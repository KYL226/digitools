"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useI18n } from "@/lib/i18n/i18n-context";
import { FileDropzone } from "@/components/tool/file-dropzone";
import { DownloadButton } from "@/components/tool/download-button";
import { ResetButton } from "@/components/tool/action-buttons";
import { ErrorMessage, EmptyState, LoadingState } from "@/components/tool/states";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import { ShieldCheck, ImageDown, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

type OutputFormat = "original" | "image/jpeg" | "image/webp" | "image/png";

interface CompressorState {
  file: File;
  previewUrl: string;
  width: number;
  height: number;
}

interface CompressedResult {
  blob: Blob;
  url: string;
  width: number;
  height: number;
  mime: string;
}

const FORMAT_OPTIONS: { value: OutputFormat; key: string }[] = [
  { value: "original", key: "common.original" },
  { value: "image/jpeg", key: "common.format" },
  { value: "image/webp", key: "common.format" },
  { value: "image/png", key: "common.format" },
];

const FORMAT_LABELS: Record<OutputFormat, string> = {
  original: "Keep original",
  "image/jpeg": "JPEG",
  "image/webp": "WebP",
  "image/png": "PNG",
};

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function extensionFor(mime: string): string {
  switch (mime) {
    case "image/jpeg":
      return "jpg";
    case "image/webp":
      return "webp";
    case "image/png":
      return "png";
    default:
      return "img";
  }
}

export function ImageCompressor() {
  const { t } = useI18n();
  const [source, setSource] = useState<CompressorState | null>(null);
  const [quality, setQuality] = useState<number>(80);
  const [format, setFormat] = useState<OutputFormat>("original");
  const [result, setResult] = useState<CompressedResult | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);

  // Revoke object URLs on cleanup
  useEffect(() => {
    return () => {
      if (source) URL.revokeObjectURL(source.previewUrl);
      if (result) URL.revokeObjectURL(result.url);
    };
     
  }, []);

  // Re-run compression whenever inputs change
  const runCompression = useCallback(() => {
    if (!source) {
      setResult(null);
      return;
    }
    setLoading(true);
    setError(null);

    const targetMime: string =
      format === "original" ? source.file.type || "image/png" : format;

    const img = new Image();
    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = source.width;
        canvas.height = source.height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          setError(t("errors.canvasUnsupported"));
          setLoading(false);
          return;
        }
        // For JPEG output, fill white background (no alpha)
        if (targetMime === "image/jpeg") {
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
        ctx.drawImage(img, 0, 0);
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              setError(t("errors.compressionFailed", { message: "" }).trim());
              setLoading(false);
              return;
            }
            setResult((prev) => {
              if (prev) URL.revokeObjectURL(prev.url);
              return {
                blob,
                url: URL.createObjectURL(blob),
                width: source.width,
                height: source.height,
                mime: targetMime,
              };
            });
            setLoading(false);
          },
          targetMime,
          quality / 100
        );
      } catch (err) {
        setError(
          t("errors.compressionFailed", {
            message: err instanceof Error ? err.message : String(err),
          })
        );
        setLoading(false);
      }
    };
    img.onerror = () => {
      setError(t("errors.unsupportedFormat", { format: source.file.type }));
      setLoading(false);
    };
    img.src = source.previewUrl;
  }, [source, format, quality, t]);

  useEffect(() => {
    if (!source) return;
    const handle = window.setTimeout(runCompression, 120);
    return () => window.clearTimeout(handle);
  }, [source, runCompression]);

  const handleFile = useCallback(
    (file: File) => {
      // Revoke old URLs
      if (source) URL.revokeObjectURL(source.previewUrl);
      if (result) URL.revokeObjectURL(result.url);

      const url = URL.createObjectURL(file);
      const probe = new Image();
      probe.onload = () => {
        setSource({
          file,
          previewUrl: url,
          width: probe.naturalWidth,
          height: probe.naturalHeight,
        });
        setResult(null);
        setError(null);
      };
      probe.onerror = () => {
        setError(t("errors.unsupportedFormat", { format: file.type }));
        URL.revokeObjectURL(url);
      };
      probe.src = url;
    },
    [source, result, t]
  );

  const handleReset = useCallback(() => {
    if (source) URL.revokeObjectURL(source.previewUrl);
    if (result) URL.revokeObjectURL(result.url);
    setSource(null);
    setResult(null);
    setError(null);
    setQuality(80);
    setFormat("original");
  }, [source, result]);

  const originalSize = source?.file.size ?? 0;
  const compressedSize = result?.blob.size ?? 0;
  const reduction =
    originalSize > 0 && compressedSize > 0
      ? Math.max(0, Math.round((1 - compressedSize / originalSize) * 100))
      : 0;
  const increased =
    originalSize > 0 && compressedSize > 0 && compressedSize > originalSize;

  const downloadName = source
    ? source.file.name.replace(/\.[^.]+$/, "") +
      "-compressed." +
      extensionFor(result?.mime ?? format === "original" ? source.file.type : format)
    : "compressed";

  return (
    <div className="space-y-4">
      {!source ? (
        <FileDropzone
          onFile={handleFile}
          accept="image/*"
          maxSizeMB={20}
          label={t("tools.image-compressor.input")}
        />
      ) : (
        <>
          {/* Controls */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-4 rounded-lg border p-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="ic-quality" className="text-xs text-muted-foreground">
                    {t("tools.image-compressor.quality")}
                  </Label>
                  <span className="text-sm font-mono">{quality}%</span>
                </div>
                <Slider
                  id="ic-quality"
                  value={[quality]}
                  min={10}
                  max={100}
                  step={1}
                  onValueChange={(v) => setQuality(v[0] ?? 80)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="ic-format" className="text-xs text-muted-foreground">
                  {t("common.format")}
                </Label>
                <Select
                  value={format}
                  onValueChange={(v) => setFormat(v as OutputFormat)}
                >
                  <SelectTrigger id="ic-format" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {FORMAT_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.value === "original"
                          ? t("common.original")
                          : FORMAT_LABELS[opt.value]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground">
                    {t("tools.image-compressor.originalSize")}
                  </p>
                  <p className="font-mono">{formatBytes(originalSize)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">
                    {t("tools.image-compressor.compressedSize")}
                  </p>
                  <p className="font-mono">
                    {compressedSize > 0 ? formatBytes(compressedSize) : "—"}
                  </p>
                </div>
              </div>

              {compressedSize > 0 && (
                <div className="flex items-center gap-2">
                  {increased ? (
                    <Badge variant="secondary" className="gap-1">
                      <Sparkles className="h-3 w-3" />
                      {t("common.size")}: +{Math.round(compressedSize / originalSize * 100 - 100)}%
                    </Badge>
                  ) : (
                    <Badge
                      variant="secondary"
                      className="gap-1 bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
                    >
                      <Sparkles className="h-3 w-3" />
                      {t("common.reduceBy")} {reduction}%
                    </Badge>
                  )}
                  <span className="text-xs text-muted-foreground">
                    {t("common.sizeSaved")}:{" "}
                    {formatBytes(Math.max(0, originalSize - compressedSize))}
                  </span>
                </div>
              )}
            </div>

            {/* Side-by-side previews */}
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">{t("common.before")}</p>
                  <div
                    className={cn(
                      "flex aspect-square items-center justify-center overflow-hidden rounded-md border border-dashed bg-muted/30 p-2"
                    )}
                  >
                    { }
                    <img
                      ref={imageRef}
                      src={source.previewUrl}
                      alt={t("common.before")}
                      className="max-h-full max-w-full object-contain"
                    />
                  </div>
                  <p className="text-[10px] text-muted-foreground truncate">
                    {source.file.name} · {source.width}×{source.height}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">{t("common.after")}</p>
                  <div className="flex aspect-square items-center justify-center overflow-hidden rounded-md border border-dashed bg-muted/30 p-2">
                    {loading ? (
                      <LoadingState />
                    ) : result ? (
                       
                      <img
                        src={result.url}
                        alt={t("common.after")}
                        className="max-h-full max-w-full object-contain"
                      />
                    ) : (
                      <EmptyState />
                    )}
                  </div>
                  <p className="text-[10px] text-muted-foreground truncate">
                    {result
                      ? `${result.mime.split("/")[1]?.toUpperCase()} · ${result.width}×${result.height}`
                      : "—"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {error && <ErrorMessage message={error} />}

          <div className="flex flex-wrap items-center gap-2 mt-3">
            <DownloadButton
              data={result?.blob ?? ""}
              filename={downloadName}
              mime={result?.mime}
              disabled={!result}
              variant="default"
              label={t("common.download")}
            />
            <ResetButton onClick={handleReset} variant="outline" />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setFormat("original")}
              className="gap-1.5"
              disabled={format === "original"}
            >
              <ImageDown className="h-4 w-4" />
              {t("common.original")}
            </Button>
          </div>
        </>
      )}

      <p className="text-xs text-muted-foreground inline-flex items-center gap-1.5">
        <ShieldCheck className="h-3.5 w-3.5" />
        {t("common.privacyNote")} · {t("common.clientSideOnly")}
      </p>
    </div>
  );
}
