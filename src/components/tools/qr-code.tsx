"use client";

import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import { useI18n } from "@/lib/i18n/i18n-context";
import { DownloadButton } from "@/components/tool/download-button";
import { ErrorMessage, EmptyState } from "@/components/tool/states";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import {
  QrCode as QrCodeIcon,
  ImageDown,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";
import QRCode from "qrcode";
import { cn } from "@/lib/utils";

type ErrorCorrection = "L" | "M" | "Q" | "H";

const SIZE_OPTIONS: number[] = [128, 256, 512, 1024];
const EC_OPTIONS: ErrorCorrection[] = ["L", "M", "Q", "H"];

export function QrCodeGenerator() {
  const { t } = useI18n();
  const [text, setText] = useState<string>("");
  const [size, setSize] = useState<number>(256);
  const [fgColor, setFgColor] = useState<string>("#000000");
  const [bgColor, setBgColor] = useState<string>("#ffffff");
  const [errorCorrection, setErrorCorrection] =
    useState<ErrorCorrection>("M");
  const [error, setError] = useState<string | null>(null);
  const [svg, setSvg] = useState<string>("");

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Build the qrcode options object shared between PNG + SVG.
  const qrOptions = useMemo(
    () => ({
      errorCorrectionLevel: errorCorrection as
        | "L"
        | "M"
        | "Q"
        | "H",
      width: size,
      margin: 2,
      color: { dark: fgColor, light: bgColor },
    }),
    [errorCorrection, size, fgColor, bgColor]
  );

  // Debounced render: re-run when text or options change.
  useEffect(() => {
    const handle = window.setTimeout(() => {
      if (!text.trim()) {
        const canvas = canvasRef.current;
        if (canvas) {
          const ctx = canvas.getContext("2d");
          if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
        setError(null);
        setSvg("");
        return;
      }
      const canvas = canvasRef.current;
      if (!canvas) return;
      QRCode.toCanvas(canvas, text, qrOptions)
        .then(() => QRCode.toString(text, { type: "svg", ...qrOptions }))
        .then((svgStr: string) => {
          setSvg(svgStr);
          setError(null);
        })
        .catch((err: unknown) => {
          setError(
            t("errors.generic", {
              message: err instanceof Error ? err.message : String(err),
            })
          );
          setSvg("");
        });
    }, 150);

    return () => window.clearTimeout(handle);
  }, [text, qrOptions, t]);

  const downloadPng = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !text.trim()) return;
    try {
      canvas.toBlob((blob) => {
        if (!blob) {
          toast.error(t("errors.generic"));
          return;
        }
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "qrcode.png";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(url), 1000);
        toast.success(t("common.downloaded"));
      }, "image/png");
    } catch (err) {
      toast.error(
        t("errors.generic", {
          message: err instanceof Error ? err.message : String(err),
        })
      );
    }
  }, [text, t]);

  const hasOutput = Boolean(text.trim());

  return (
    <div className="space-y-4">
      <div className="grid md:grid-cols-2 gap-4">
        {/* Controls */}
        <div className="space-y-4">
          <div className="space-y-2">
            <Label
              htmlFor="qr-text"
              className="text-xs text-muted-foreground"
            >
              {t("tools.qr-code.input")}
            </Label>
            <Input
              id="qr-text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={t("tools.qr-code.inputPlaceholder")}
              aria-label={t("tools.qr-code.input")}
            />
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="qr-size"
              className="text-xs text-muted-foreground"
            >
              {t("tools.qr-code.size")}
            </Label>
            <Select
              value={String(size)}
              onValueChange={(v) => setSize(Number(v))}
            >
              <SelectTrigger id="qr-size" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SIZE_OPTIONS.map((s) => (
                  <SelectItem key={s} value={String(s)}>
                    {s}px
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="qr-ec"
              className="text-xs text-muted-foreground"
            >
              {t("tools.qr-code.errorCorrection")}
            </Label>
            <Select
              value={errorCorrection}
              onValueChange={(v) => setErrorCorrection(v as ErrorCorrection)}
            >
              <SelectTrigger id="qr-ec" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {EC_OPTIONS.map((ec) => (
                  <SelectItem key={ec} value={ec}>
                    {ec}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label
                htmlFor="qr-fg"
                className="text-xs text-muted-foreground"
              >
                {t("tools.qr-code.fgColor")}
              </Label>
              <div className="flex items-center gap-2 rounded-md border p-2">
                <input
                  id="qr-fg"
                  type="color"
                  value={fgColor}
                  onChange={(e) => setFgColor(e.target.value)}
                  className="h-7 w-7 cursor-pointer rounded border-0 bg-transparent p-0"
                  aria-label={t("tools.qr-code.fgColor")}
                />
                <span className="font-mono text-sm uppercase">{fgColor}</span>
              </div>
            </div>
            <div className="space-y-2">
              <Label
                htmlFor="qr-bg"
                className="text-xs text-muted-foreground"
              >
                {t("tools.qr-code.bgColor")}
              </Label>
              <div className="flex items-center gap-2 rounded-md border p-2">
                <input
                  id="qr-bg"
                  type="color"
                  value={bgColor}
                  onChange={(e) => setBgColor(e.target.value)}
                  className="h-7 w-7 cursor-pointer rounded border-0 bg-transparent p-0"
                  aria-label={t("tools.qr-code.bgColor")}
                />
                <span className="font-mono text-sm uppercase">{bgColor}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Preview */}
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">
            {t("tools.qr-code.output")}
          </Label>
          <div
            className={cn(
              "flex min-h-[320px] items-center justify-center rounded-md border border-dashed p-4"
            )}
          >
            {hasOutput ? (
              <canvas
                ref={canvasRef}
                className="max-w-full h-auto"
                style={{ background: bgColor }}
                aria-label={t("tools.qr-code.output")}
              />
            ) : (
              <EmptyState icon={QrCodeIcon} />
            )}
          </div>
        </div>
      </div>

      {error && <ErrorMessage message={error} />}

      {/* Download buttons */}
      <div className="flex flex-wrap items-center gap-2 mt-3">
        <Button
          variant="secondary"
          size="sm"
          onClick={downloadPng}
          disabled={!hasOutput}
          className="gap-1.5"
        >
          <ImageDown className="h-4 w-4" />
          {t("tools.qr-code.downloadPng")}
        </Button>
        <DownloadButton
          data={svg ? new Blob([svg], { type: "image/svg+xml" }) : ""}
          filename="qrcode.svg"
          mime="image/svg+xml"
          disabled={!hasOutput}
          label={t("tools.qr-code.downloadSvg")}
        />
      </div>

      <p className="text-xs text-muted-foreground inline-flex items-center gap-1.5">
        <ShieldCheck className="h-3.5 w-3.5" />
        {t("common.privacyNote")}
      </p>
    </div>
  );
}
