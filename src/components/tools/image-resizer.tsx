"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useI18n } from "@/lib/i18n/i18n-context";
import { FileDropzone } from "@/components/tool/file-dropzone";
import { DownloadButton } from "@/components/tool/download-button";
import { ResetButton } from "@/components/tool/action-buttons";
import { ErrorMessage, EmptyState, LoadingState } from "@/components/tool/states";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ShieldCheck, Link2, Link2Off, ImageDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface ResizeState {
  file: File;
  previewUrl: string;
  naturalWidth: number;
  naturalHeight: number;
  aspectRatio: number;
}

interface ResizedResult {
  blob: Blob;
  url: string;
  width: number;
  height: number;
}

function extensionFor(mime: string): string {
  switch (mime) {
    case "image/jpeg":
      return "jpg";
    case "image/webp":
      return "webp";
    case "image/png":
      return "png";
    case "image/gif":
      return "gif";
    default:
      return "img";
  }
}

export function ImageResizer() {
  const { t } = useI18n();
  const [source, setSource] = useState<ResizeState | null>(null);
  const [width, setWidth] = useState<number>(0);
  const [height, setHeight] = useState<number>(0);
  const [lockAspect, setLockAspect] = useState<boolean>(true);
  const [result, setResult] = useState<ResizedResult | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const lockRef = useRef<boolean>(lockAspect);
  const ratioRef = useRef<number>(1);

  useEffect(() => {
    lockRef.current = lockAspect;
  }, [lockAspect]);
  useEffect(() => {
    ratioRef.current = source?.aspectRatio ?? 1;
  }, [source]);

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
        const ar = probe.naturalWidth / probe.naturalHeight;
        ratioRef.current = ar;
        setSource({
          file,
          previewUrl: url,
          naturalWidth: probe.naturalWidth,
          naturalHeight: probe.naturalHeight,
          aspectRatio: ar,
        });
        setWidth(probe.naturalWidth);
        setHeight(probe.naturalHeight);
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
    setWidth(0);
    setHeight(0);
    setLockAspect(true);
  }, [source, result]);

  // Recompute resized output whenever width/height change
  useEffect(() => {
    if (!source) {
      // Reset is handled by handleReset; nothing to do here.
      return;
    }
    const w = Math.max(1, Math.round(width));
    const h = Math.max(1, Math.round(height));
    const handle = window.setTimeout(() => {
      setLoading(true);
      const img = new Image();
      img.onload = () => {
        try {
          const canvas = document.createElement("canvas");
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext("2d");
          if (!ctx) {
            setError(t("errors.canvasUnsupported"));
            setLoading(false);
            return;
          }
          if ((source.file.type || "image/png") === "image/jpeg") {
            ctx.fillStyle = "#ffffff";
            ctx.fillRect(0, 0, w, h);
          }
          ctx.drawImage(img, 0, 0, w, h);
          const mime = source.file.type || "image/png";
          canvas.toBlob(
            (blob) => {
              if (!blob) {
                setError(t("errors.generic"));
                setLoading(false);
                return;
              }
              setResult((prev) => {
                if (prev) URL.revokeObjectURL(prev.url);
                return { blob, url: URL.createObjectURL(blob), width: w, height: h };
              });
              setLoading(false);
            },
            mime
          );
        } catch (err) {
          setError(
            t("errors.generic", {
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
  }, [source, width, height, t]);

  // Lock-aspect input handlers
  const onWidthChange = (raw: string) => {
    const n = Math.max(1, parseInt(raw, 10) || 0);
    setWidth(n);
    if (lockRef.current && source) {
      setHeight(Math.max(1, Math.round(n / ratioRef.current)));
    }
  };
  const onHeightChange = (raw: string) => {
    const n = Math.max(1, parseInt(raw, 10) || 0);
    setHeight(n);
    if (lockRef.current && source) {
      setWidth(Math.max(1, Math.round(n * ratioRef.current)));
    }
  };

  const downloadName = source
    ? source.file.name.replace(/\.[^.]+$/, "") +
      `-${width}x${height}.` +
      extensionFor(source.file.type || "image/png")
    : "resized";

  return (
    <div className="space-y-4">
      {!source ? (
        <FileDropzone
          onFile={handleFile}
          accept="image/*"
          maxSizeMB={20}
          label={t("tools.image-resizer.input")}
        />
      ) : (
        <>
          <div className="grid md:grid-cols-2 gap-4">
            {/* Controls */}
            <div className="space-y-4 rounded-lg border p-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="ir-width" className="text-xs text-muted-foreground">
                    {t("common.width")}
                  </Label>
                  <Input
                    id="ir-width"
                    type="number"
                    min={1}
                    value={width}
                    onChange={(e) => onWidthChange(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ir-height" className="text-xs text-muted-foreground">
                    {t("common.height")}
                  </Label>
                  <Input
                    id="ir-height"
                    type="number"
                    min={1}
                    value={height}
                    onChange={(e) => onHeightChange(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Switch
                  id="ir-lock"
                  checked={lockAspect}
                  onCheckedChange={setLockAspect}
                />
                <Label htmlFor="ir-lock" className="text-sm inline-flex items-center gap-1.5">
                  {lockAspect ? (
                    <Link2 className="h-3.5 w-3.5 text-primary" />
                  ) : (
                    <Link2Off className="h-3.5 w-3.5 text-muted-foreground" />
                  )}
                  {t("tools.image-resizer.lockAspectRatio")}
                </Label>
              </div>

              <Separator />

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground">
                    {t("common.original")} {t("common.size")}
                  </p>
                  <p className="font-mono">
                    {source.naturalWidth}×{source.naturalHeight}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">
                    {t("common.after")}
                  </p>
                  <p className="font-mono">
                    {width}×{height}
                  </p>
                </div>
              </div>

              {lockAspect && source && (
                <Badge variant="secondary" className="gap-1">
                  <Link2 className="h-3 w-3" />
                  {t("tools.image-resizer.lockAspectRatio")} ·{" "}
                  {(1 / source.aspectRatio).toFixed(3)}
                </Badge>
              )}
            </div>

            {/* Preview */}
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">
                {t("tools.image-resizer.output")}
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
                    src={result.url}
                    alt={t("tools.image-resizer.output")}
                    className="max-h-[400px] max-w-full object-contain"
                  />
                ) : (
                  <EmptyState />
                )}
              </div>
            </div>
          </div>

          {error && <ErrorMessage message={error} />}

          <div className="flex flex-wrap items-center gap-2 mt-3">
            <DownloadButton
              data={result?.blob ?? ""}
              filename={downloadName}
              mime={source.file.type}
              disabled={!result}
              variant="default"
              label={t("common.download")}
            />
            <ResetButton onClick={handleReset} variant="outline" />
            <button
              type="button"
              onClick={() => {
                setWidth(source.naturalWidth);
                setHeight(source.naturalHeight);
              }}
              className="inline-flex items-center gap-1.5 rounded-md border border-input bg-transparent px-3 h-8 text-sm hover:bg-accent hover:text-accent-foreground"
            >
              <ImageDown className="h-4 w-4" />
              {t("common.original")}
            </button>
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
