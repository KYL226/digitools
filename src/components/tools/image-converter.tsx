"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useI18n } from "@/lib/i18n/i18n-context";
import { FileDropzone } from "@/components/tool/file-dropzone";
import { DownloadButton } from "@/components/tool/download-button";
import { ResetButton } from "@/components/tool/action-buttons";
import { ErrorMessage, EmptyState, LoadingState } from "@/components/tool/states";
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
import { ShieldCheck, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

type TargetFormat = "image/png" | "image/jpeg" | "image/webp";

interface SourceState {
  file: File;
  previewUrl: string;
  width: number;
  height: number;
}

interface ConvertedResult {
  blob: Blob;
  url: string;
  mime: string;
}

const FORMAT_OPTIONS: { value: TargetFormat; label: string }[] = [
  { value: "image/png", label: "PNG" },
  { value: "image/jpeg", label: "JPG" },
  { value: "image/webp", label: "WebP" },
];

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

function mimeLabel(mime: string): string {
  const opt = FORMAT_OPTIONS.find((o) => o.value === mime);
  return opt?.label ?? mime.split("/")[1]?.toUpperCase() ?? mime;
}

export function ImageConverter() {
  const { t } = useI18n();
  const [source, setSource] = useState<SourceState | null>(null);
  const [targetFormat, setTargetFormat] = useState<TargetFormat>("image/webp");
  const [quality, setQuality] = useState<number>(90);
  const [result, setResult] = useState<ConvertedResult | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);

  // Revoke object URLs on cleanup
  useEffect(() => {
    return () => {
      if (source) URL.revokeObjectURL(source.previewUrl);
      if (result) URL.revokeObjectURL(result.url);
    };
     
  }, []);

  const handleFile = useCallback(
    (file: File) => {
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
    setQuality(90);
    setTargetFormat("image/webp");
  }, [source, result]);

  // Re-run conversion when inputs change
  useEffect(() => {
    if (!source) {
      // Reset is handled by handleReset; nothing to do here.
      return;
    }
    const handle = window.setTimeout(() => {
      setLoading(true);
      setError(null);
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
          if (targetFormat === "image/jpeg") {
            ctx.fillStyle = "#ffffff";
            ctx.fillRect(0, 0, canvas.width, canvas.height);
          }
          ctx.drawImage(img, 0, 0);
          canvas.toBlob(
            (blob) => {
              if (!blob) {
                setError(t("errors.conversionFailed", { message: "" }).trim());
                setLoading(false);
                return;
              }
              setResult((prev) => {
                if (prev) URL.revokeObjectURL(prev.url);
                return { blob, url: URL.createObjectURL(blob), mime: targetFormat };
              });
              setLoading(false);
            },
            targetFormat,
            quality / 100
          );
        } catch (err) {
          setError(
            t("errors.conversionFailed", {
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
    }, 120);
    return () => window.clearTimeout(handle);
  }, [source, targetFormat, quality, t]);

  const originalSize = source?.file.size ?? 0;
  const convertedSize = result?.blob.size ?? 0;
  const reduction =
    originalSize > 0 && convertedSize > 0
      ? Math.max(0, Math.round((1 - convertedSize / originalSize) * 100))
      : 0;
  const increased =
    originalSize > 0 && convertedSize > 0 && convertedSize > originalSize;

  const downloadName = source
    ? source.file.name.replace(/\.[^.]+$/, "") +
      "-converted." +
      extensionFor(targetFormat)
    : "converted";

  const showQuality = targetFormat !== "image/png";

  return (
    <div className="space-y-4">
      {!source ? (
        <FileDropzone
          onFile={handleFile}
          accept="image/*"
          maxSizeMB={20}
          label={t("tools.image-converter.input")}
        />
      ) : (
        <>
          <div className="grid md:grid-cols-2 gap-4">
            {/* Controls */}
            <div className="space-y-4 rounded-lg border p-4">
              <div className="space-y-2">
                <Label htmlFor="icv-format" className="text-xs text-muted-foreground">
                  {t("tools.image-converter.targetFormat")}
                </Label>
                <Select
                  value={targetFormat}
                  onValueChange={(v) => setTargetFormat(v as TargetFormat)}
                >
                  <SelectTrigger id="icv-format" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {FORMAT_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {showQuality && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="icv-quality" className="text-xs text-muted-foreground">
                      {t("common.quality")}
                    </Label>
                    <span className="text-sm font-mono">{quality}%</span>
                  </div>
                  <Slider
                    id="icv-quality"
                    value={[quality]}
                    min={10}
                    max={100}
                    step={1}
                    onValueChange={(v) => setQuality(v[0] ?? 90)}
                  />
                </div>
              )}

              <Separator />

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground">
                    {t("common.original")}
                  </p>
                  <p className="font-mono">{mimeLabel(source.file.type || "image/*")}</p>
                  <p className="text-xs text-muted-foreground">{formatBytes(originalSize)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">
                    {t("common.after")}
                  </p>
                  <p className="font-mono">{result ? mimeLabel(result.mime) : "—"}</p>
                  <p className="text-xs text-muted-foreground">
                    {convertedSize > 0 ? formatBytes(convertedSize) : "—"}
                  </p>
                </div>
              </div>

              {convertedSize > 0 && (
                <div className="flex items-center gap-2">
                  {increased ? (
                    <Badge variant="secondary" className="gap-1">
                      <Sparkles className="h-3 w-3" />+
                      {Math.round((convertedSize / originalSize) * 100 - 100)}%
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
                    {formatBytes(Math.max(0, originalSize - convertedSize))}
                  </span>
                </div>
              )}
            </div>

            {/* Preview */}
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">
                {t("tools.image-converter.output")}
              </Label>
              <div
                className={cn(
                  "flex min-h-[280px] items-center justify-center rounded-md border border-dashed bg-muted/30 p-4"
                )}
              >
                {loading ? (
                  <LoadingState />
                ) : result ? (
                   
                  <img
                    ref={imgRef}
                    src={result.url}
                    alt={t("tools.image-converter.output")}
                    className="max-h-[400px] max-w-full object-contain"
                  />
                ) : (
                  <EmptyState />
                )}
              </div>
              <p className="text-xs text-muted-foreground truncate">
                {source.file.name} · {source.width}×{source.height}
              </p>
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
