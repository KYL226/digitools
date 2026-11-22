"use client";

import { useState, useCallback, useEffect, useRef, type PointerEvent as ReactPointerEvent } from "react";
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
import { ShieldCheck, Crop as CropIcon, Scissors } from "lucide-react";
import { cn } from "@/lib/utils";

type AspectKey = "free" | "square" | "landscape" | "portrait" | "wide";

interface AspectPreset {
  key: AspectKey;
  labelKey: string;
  ratio: number | null; // width/height; null = free
}

const ASPECT_PRESETS: AspectPreset[] = [
  { key: "free", labelKey: "tools.image-cropper.free", ratio: null },
  { key: "square", labelKey: "tools.image-cropper.square", ratio: 1 },
  { key: "landscape", labelKey: "tools.image-cropper.landscape", ratio: 4 / 3 },
  { key: "portrait", labelKey: "tools.image-cropper.portrait", ratio: 3 / 4 },
  { key: "wide", labelKey: "tools.image-cropper.wide", ratio: 16 / 9 },
];

interface CropRect {
  // Normalized [0,1] coordinates
  x: number;
  y: number;
  w: number;
  h: number;
}

interface SourceState {
  file: File;
  previewUrl: string;
  naturalWidth: number;
  naturalHeight: number;
  imageAspect: number; // naturalWidth/naturalHeight
}

interface CroppedResult {
  blob: Blob;
  url: string;
  width: number;
  height: number;
}

type DragMode =
  | { kind: "move" }
  | { kind: "resize"; handle: "nw" | "ne" | "sw" | "se" }
  | null;

function extensionFor(mime: string): string {
  switch (mime) {
    case "image/jpeg":
      return "jpg";
    case "image/webp":
      return "webp";
    case "image/png":
      return "png";
    default:
      return "png";
    }
}

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

/** Build a centered crop rect that satisfies the given aspect ratio. */
function centeredRectForAspect(imageAspect: number, ratio: number | null): CropRect {
  if (ratio === null) {
    return { x: 0.1, y: 0.1, w: 0.8, h: 0.8 };
  }
  // ratio = w/h. The rect must fit within image with same shape.
  // If image is wider than ratio (imageAspect > ratio), then height fills, width = ratio*height.
  // i.e. cropAspect = (w * imageAspect) / h — actually crop normalized w/h in *display* space.
  // In normalized display space, the image is a unit square. But image natural aspect differs.
  // To make a final pixel-crop with ratio = w/h, we need (w * natW) / (h * natH) = ratio.
  // So w/h = ratio * natH/natW = ratio / imageAspect.
  const cropDisplayAspect = ratio / imageAspect;
  let w = cropDisplayAspect <= 1 ? cropDisplayAspect : 1;
  let h = cropDisplayAspect <= 1 ? 1 : 1 / cropDisplayAspect;
  if (w > 1) {
    h = h / w;
    w = 1;
  }
  if (h > 1) {
    w = w / h;
    h = 1;
  }
  return { x: (1 - w) / 2, y: (1 - h) / 2, w, h };
}

export function ImageCropper() {
  const { t } = useI18n();
  const [source, setSource] = useState<SourceState | null>(null);
  const [aspect, setAspect] = useState<AspectKey>("free");
  const [rotation, setRotation] = useState<number>(0);
  const [crop, setCrop] = useState<CropRect>({ x: 0.1, y: 0.1, w: 0.8, h: 0.8 });
  const [result, setResult] = useState<CroppedResult | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const imgRef = useRef<HTMLImageElement | null>(null);
  const dragRef = useRef<DragMode>(null);
  const dragStartRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    rect: CropRect;
  } | null>(null);

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
        const imgAspect = probe.naturalWidth / probe.naturalHeight;
        setSource({
          file,
          previewUrl: url,
          naturalWidth: probe.naturalWidth,
          naturalHeight: probe.naturalHeight,
          imageAspect: imgAspect,
        });
        // Reset crop rect
        const init = centeredRectForAspect(imgAspect, null);
        setCrop(init);
        setRotation(0);
        setAspect("free");
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
    setRotation(0);
    setAspect("free");
    setCrop({ x: 0.1, y: 0.1, w: 0.8, h: 0.8 });
  }, [source, result]);

  // Update crop when aspect ratio changes
  const onAspectChange = (key: AspectKey) => {
    setAspect(key);
    if (!source) return;
    const preset = ASPECT_PRESETS.find((p) => p.key === key);
    if (!preset) return;
    const newRect = centeredRectForAspect(source.imageAspect, preset.ratio);
    setCrop(newRect);
  };

  // Drag handlers
  const onPointerDownRect = (e: ReactPointerEvent<HTMLDivElement>, mode: DragMode) => {
    if (!source || !imgRef.current) return;
    e.preventDefault();
    e.stopPropagation();
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    dragRef.current = mode;
    dragStartRef.current = {
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      rect: { ...crop },
    };
  };

  const onPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!dragRef.current || !dragStartRef.current || !imgRef.current) return;
    if (e.pointerId !== dragStartRef.current.pointerId) return;

    const imgRect = imgRef.current.getBoundingClientRect();
    if (imgRect.width === 0 || imgRect.height === 0) return;

    const dx = (e.clientX - dragStartRef.current.startX) / imgRect.width;
    const dy = (e.clientY - dragStartRef.current.startY) / imgRect.height;
    const start = dragStartRef.current.rect;
    const mode = dragRef.current;

    let nx = start.x;
    let ny = start.y;
    let nw = start.w;
    let nh = start.h;

    if (mode.kind === "move") {
      nx = clamp(start.x + dx, 0, 1 - start.w);
      ny = clamp(start.y + dy, 0, 1 - start.h);
    } else {
      const handle = mode.handle;
      if (handle === "nw") {
        nx = clamp(start.x + dx, 0, start.x + start.w - 0.05);
        ny = clamp(start.y + dy, 0, start.y + start.h - 0.05);
        nw = start.x + start.w - nx;
        nh = start.y + start.h - ny;
      } else if (handle === "ne") {
        ny = clamp(start.y + dy, 0, start.y + start.h - 0.05);
        nh = start.y + start.h - ny;
        nw = clamp(start.w + dx, 0.05, 1 - start.x);
      } else if (handle === "sw") {
        nx = clamp(start.x + dx, 0, start.x + start.w - 0.05);
        nw = start.x + start.w - nx;
        nh = clamp(start.h + dy, 0.05, 1 - start.y);
      } else {
        // se
        nw = clamp(start.w + dx, 0.05, 1 - start.x);
        nh = clamp(start.h + dy, 0.05, 1 - start.y);
      }
    }

    // Constrain to aspect ratio if not free
    const preset = ASPECT_PRESETS.find((p) => p.key === aspect);
    if (preset && preset.ratio !== null && source) {
      const desiredDisplayAspect = preset.ratio / source.imageAspect;
      if (mode.kind === "move") {
        // No shape constraint during move
      } else {
        // Resize: keep width, derive height to match aspect
        const nhNew = nw / desiredDisplayAspect;
        if (nhNew <= 1 && nhNew > 0.05) {
          nh = nhNew;
        } else {
          nh = clamp(nhNew, 0.05, 1);
          nw = nh * desiredDisplayAspect;
        }
        // Anchor depends on handle
        if (mode.handle === "nw") {
          nx = start.x + start.w - nw;
          ny = start.y + start.h - nh;
        } else if (mode.handle === "ne") {
          ny = start.y + start.h - nh;
        } else if (mode.handle === "sw") {
          nx = start.x + start.w - nw;
        }
      }
      nx = clamp(nx, 0, 1 - nw);
      ny = clamp(ny, 0, 1 - nh);
    }

    nx = clamp(nx, 0, 1 - 0.05);
    ny = clamp(ny, 0, 1 - 0.05);
    setCrop({ x: nx, y: ny, w: nw, h: nh });
  };

  const onPointerUp = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (dragStartRef.current && e.pointerId === dragStartRef.current.pointerId) {
      (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);
    }
    dragRef.current = null;
    dragStartRef.current = null;
  };

  // Perform the crop
  const doCrop = useCallback(() => {
    if (!source) return;
    setLoading(true);
    setError(null);
    const img = new Image();
    img.onload = () => {
      try {
        // Compute crop rectangle in image pixel coordinates.
        const cropX = Math.round(crop.x * source.naturalWidth);
        const cropY = Math.round(crop.y * source.naturalHeight);
        const cropW = Math.max(1, Math.round(crop.w * source.naturalWidth));
        const cropH = Math.max(1, Math.round(crop.h * source.naturalHeight));

        const rad = (rotation * Math.PI) / 180;
        const cos = Math.abs(Math.cos(rad));
        const sin = Math.abs(Math.sin(rad));
        // Output canvas dimensions: bounding box of rotated crop.
        const outW = Math.max(1, Math.round(cropW * cos + cropH * sin));
        const outH = Math.max(1, Math.round(cropW * sin + cropH * cos));

        const canvas = document.createElement("canvas");
        canvas.width = outW;
        canvas.height = outH;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          setError(t("errors.canvasUnsupported"));
          setLoading(false);
          return;
        }
        const outMime =
          source.file.type === "image/png" ||
          source.file.type === "image/webp" ||
          source.file.type === "image/jpeg"
            ? source.file.type
            : "image/png";
        if (outMime === "image/jpeg") {
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(0, 0, outW, outH);
        }
        // Move origin to center of output, rotate, then draw the source image so
        // that the cropped sub-rectangle of the source lands centered on the origin.
        ctx.translate(outW / 2, outH / 2);
        ctx.rotate(rad);
        ctx.translate(-cropW / 2, -cropH / 2);
        ctx.drawImage(
          img,
          cropX,
          cropY,
          cropW,
          cropH,
          0,
          0,
          cropW,
          cropH
        );
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              setError(t("errors.generic"));
              setLoading(false);
              return;
            }
            setResult((prev) => {
              if (prev) URL.revokeObjectURL(prev.url);
              return {
                blob,
                url: URL.createObjectURL(blob),
                width: outW,
                height: outH,
              };
            });
            setLoading(false);
          },
          outMime
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
  }, [source, crop, rotation, t]);

  const downloadName = source
    ? source.file.name.replace(/\.[^.]+$/, "") + "-cropped." + extensionFor(source.file.type)
    : "cropped";

  return (
    <div className="space-y-4">
      {!source ? (
        <FileDropzone
          onFile={handleFile}
          accept="image/*"
          maxSizeMB={20}
          label={t("tools.image-cropper.input")}
        />
      ) : (
        <>
          <div className="grid md:grid-cols-2 gap-4">
            {/* Controls */}
            <div className="space-y-4 rounded-lg border p-4">
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">
                  {t("tools.image-cropper.aspectRatio")}
                </Label>
                <div className="grid grid-cols-2 gap-2">
                  {ASPECT_PRESETS.map((p) => (
                    <Button
                      key={p.key}
                      type="button"
                      variant={aspect === p.key ? "default" : "outline"}
                      size="sm"
                      onClick={() => onAspectChange(p.key)}
                      className="justify-start"
                    >
                      {t(p.labelKey)}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="icr-rotate" className="text-xs text-muted-foreground">
                    {t("tools.image-cropper.rotate")}
                  </Label>
                  <span className="text-sm font-mono">{rotation}°</span>
                </div>
                <Slider
                  id="icr-rotate"
                  value={[rotation]}
                  min={-180}
                  max={180}
                  step={1}
                  onValueChange={(v) => setRotation(v[0] ?? 0)}
                />
              </div>

              <Separator />

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground">{t("common.original")}</p>
                  <p className="font-mono">
                    {source.naturalWidth}×{source.naturalHeight}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{t("common.after")}</p>
                  <p className="font-mono">
                    {result ? `${result.width}×${result.height}` : "—"}
                  </p>
                </div>
              </div>

              <Button
                type="button"
                onClick={doCrop}
                disabled={loading}
                className="w-full gap-1.5"
              >
                {loading ? (
                  <LoadingState />
                ) : (
                  <>
                    <Scissors className="h-4 w-4" />
                    {t("tools.image-cropper.crop")}
                  </>
                )}
              </Button>
            </div>

            {/* Cropping surface */}
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">
                {t("common.preview")}
              </Label>
              <div
                className={cn(
                  "relative select-none rounded-md border bg-muted/30 overflow-hidden flex items-center justify-center p-2 min-h-[280px]"
                )}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
                onPointerCancel={onPointerUp}
              >
                <div className="relative inline-block max-w-full">
                  { }
                  <img
                    ref={imgRef}
                    src={source.previewUrl}
                    alt={t("common.before")}
                    className="block max-w-full max-h-[60vh] h-auto w-auto select-none"
                    draggable={false}
                  />
                  {/* Dark overlay */}
                  <div className="absolute inset-0 bg-black/50 pointer-events-none" />
                  {/* Crop rectangle (light area) */}
                  <div
                    className="absolute border-2 border-primary bg-transparent cursor-move"
                    style={{
                      left: `${crop.x * 100}%`,
                      top: `${crop.y * 100}%`,
                      width: `${crop.w * 100}%`,
                      height: `${crop.h * 100}%`,
                      boxShadow: "0 0 0 9999px rgba(0,0,0,0)",
                      touchAction: "none",
                    }}
                    onPointerDown={(e) => onPointerDownRect(e, { kind: "move" })}
                  >
                    {/* Corner handles */}
                    {(["nw", "ne", "sw", "se"] as const).map((h) => (
                      <div
                        key={h}
                        className="absolute h-3 w-3 rounded-full border-2 border-primary bg-background"
                        style={{
                          left: h === "nw" || h === "sw" ? "-6px" : "auto",
                          right: h === "ne" || h === "se" ? "-6px" : "auto",
                          top: h === "nw" || h === "ne" ? "-6px" : "auto",
                          bottom: h === "sw" || h === "se" ? "-6px" : "auto",
                          cursor:
                            h === "nw" || h === "se"
                              ? "nwse-resize"
                              : "nesw-resize",
                          touchAction: "none",
                        }}
                        onPointerDown={(e) =>
                          onPointerDownRect(e, { kind: "resize", handle: h })
                        }
                      />
                    ))}
                    {/* Rule-of-thirds guides */}
                    <div className="absolute inset-0 pointer-events-none">
                      <div className="absolute top-1/3 left-0 right-0 border-t border-primary/40" />
                      <div className="absolute top-2/3 left-0 right-0 border-t border-primary/40" />
                      <div className="absolute left-1/3 top-0 bottom-0 border-l border-primary/40" />
                      <div className="absolute left-2/3 top-0 bottom-0 border-l border-primary/40" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Cropped result preview */}
              {result && (
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">
                    {t("tools.image-cropper.output")}
                  </Label>
                  <div className="flex min-h-[160px] items-center justify-center overflow-hidden rounded-md border bg-muted/30 p-2">
                    { }
                    <img
                      src={result.url}
                      alt={t("tools.image-cropper.output")}
                      className="max-h-[300px] max-w-full object-contain"
                    />
                  </div>
                  <Badge variant="secondary" className="gap-1 mt-1">
                    <CropIcon className="h-3 w-3" />
                    {result.width}×{result.height}
                  </Badge>
                </div>
              )}
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
