"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useI18n } from "@/lib/i18n/i18n-context";
import { FileDropzone } from "@/components/tool/file-dropzone";
import { DownloadButton } from "@/components/tool/download-button";
import { ResetButton } from "@/components/tool/action-buttons";
import { ErrorMessage, EmptyState, LoadingState } from "@/components/tool/states";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import { ShieldCheck, Film, Loader2 } from "lucide-react";
import { getFFmpeg, fileToUint8Array } from "@/lib/ffmpeg";

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

interface ResultFile {
  blob: Blob;
  url: string;
  size: number;
}

export function VideoCompressor() {
  const { t } = useI18n();
  const [file, setFile] = useState<File | null>(null);
  const [crf, setCrf] = useState<number>(28);
  const [targetSize, setTargetSize] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [converting, setConverting] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [result, setResult] = useState<ResultFile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const resultRef = useRef<ResultFile | null>(null);

  useEffect(() => {
    resultRef.current = result;
  }, [result]);

  useEffect(() => {
    return () => {
      if (resultRef.current) URL.revokeObjectURL(resultRef.current.url);
    };
  }, []);

  const handleFile = useCallback(
    (incoming: File) => {
      setFile(incoming);
      setError(null);
      if (result) {
        URL.revokeObjectURL(result.url);
        setResult(null);
      }
      setProgress(0);
    },
    [result]
  );

  const handleReset = useCallback(() => {
    setFile(null);
    setError(null);
    if (result) URL.revokeObjectURL(result.url);
    setResult(null);
    setProgress(0);
    setCrf(28);
    setTargetSize("");
  }, [result]);

  /** Read the duration of a video file using a hidden HTML5 video element. */
  const getDuration = useCallback((file: File): Promise<number> => {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file);
      const video = document.createElement("video");
      video.preload = "metadata";
      video.src = url;
      video.onloadedmetadata = () => {
        const d = video.duration;
        URL.revokeObjectURL(url);
        if (Number.isFinite(d) && d > 0) {
          resolve(d);
        } else {
          reject(new Error("Could not read video duration"));
        }
      };
      video.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error("Could not read video metadata"));
      };
    });
  }, []);

  const handleCompress = useCallback(async () => {
    if (!file) return;
    setError(null);
    setProgress(0);
    setResult(null);
    setConverting(true);

    setLoading(true);
    try {
      const ffmpeg = await getFFmpeg({
        onProgress: (p) => setProgress(Math.round(p * 100)),
      });
      setLoading(false);

      const inputName = "input";
      const outputName = "output.mp4";
      await ffmpeg.writeFile(inputName, await fileToUint8Array(file));

      const targetSizeNum = parseFloat(targetSize);
      const hasTargetSize =
        !Number.isNaN(targetSizeNum) && targetSizeNum > 0;

      let args: string[];
      if (hasTargetSize) {
        // Get duration via HTML5 video element.
        const duration = await getDuration(file);
        // bitrate (kbit/s) = (targetSizeMB * 8192) / durationSeconds
        // (here we treat the entire stream bitrate as video bitrate for simplicity)
        const bitrate = Math.max(
          100,
          Math.round((targetSizeNum * 8192) / duration)
        );
        args = [
          "-i",
          inputName,
          "-c:v",
          "libx264",
          "-b:v",
          `${bitrate}k`,
          "-preset",
          "medium",
          "-c:a",
          "aac",
          "-b:a",
          "128k",
          outputName,
        ];
      } else {
        args = [
          "-i",
          inputName,
          "-c:v",
          "libx264",
          "-crf",
          String(crf),
          "-preset",
          "medium",
          "-c:a",
          "aac",
          "-b:a",
          "128k",
          outputName,
        ];
      }

      await ffmpeg.exec(args);
      const data: Uint8Array = await ffmpeg.readFile(outputName);
      const u8 =
        data instanceof Uint8Array ? data : new Uint8Array(data as any);
      const blob = new Blob([u8], { type: "video/mp4" });
      const url = URL.createObjectURL(blob);
      if (resultRef.current) URL.revokeObjectURL(resultRef.current.url);
      const next: ResultFile = { blob, url, size: blob.size };
      resultRef.current = next;
      setResult(next);
      setProgress(100);
      try {
        await ffmpeg.deleteFile(inputName);
        await ffmpeg.deleteFile(outputName);
      } catch {
        // ignore
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(
        msg.includes("load") || msg.includes("Fetch")
          ? t("errors.ffmpegLoadFailed") + " (" + msg + ")"
          : t("errors.compressionFailed", { message: msg })
      );
    } finally {
      setLoading(false);
      setConverting(false);
    }
  }, [file, crf, targetSize, getDuration, t]);

  const isLoading = loading || converting;

  const originalSize = file?.size ?? 0;
  const compressedSize = result?.size ?? 0;
  const reduction =
    originalSize > 0 && compressedSize > 0
      ? Math.max(0, Math.round((1 - compressedSize / originalSize) * 100))
      : 0;
  const increased =
    originalSize > 0 && compressedSize > 0 && compressedSize > originalSize;

  return (
    <div className="space-y-4">
      {!file ? (
        <FileDropzone
          onFile={handleFile}
          accept="video/*"
          maxSizeMB={500}
          label={t("tools.video-compressor.input")}
        />
      ) : (
        <>
          {/* Controls */}
          <div className="space-y-4 rounded-lg border p-4">
            <div className="flex items-center gap-2 text-sm">
              <Film className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium truncate flex-1">{file.name}</span>
              <Badge variant="secondary" className="font-mono">
                {formatBytes(file.size)}
              </Badge>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label
                    htmlFor="vc-crf"
                    className="text-xs text-muted-foreground"
                  >
                    {t("tools.video-compressor.crf")}
                  </Label>
                  <span className="text-sm font-mono">{crf}</span>
                </div>
                <Slider
                  id="vc-crf"
                  value={[crf]}
                  min={18}
                  max={32}
                  step={1}
                  onValueChange={(v) => setCrf(v[0] ?? 28)}
                  disabled={isLoading}
                />
                <p className="text-[10px] text-muted-foreground">
                  18 = best quality / largest, 32 = smallest / lowest quality
                </p>
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="vc-target"
                  className="text-xs text-muted-foreground"
                >
                  {t("tools.video-compressor.targetSize")}
                </Label>
                <Input
                  id="vc-target"
                  value={targetSize}
                  onChange={(e) => setTargetSize(e.target.value)}
                  type="number"
                  min={0.1}
                  step={0.1}
                  placeholder="—"
                  disabled={isLoading}
                  inputMode="decimal"
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                onClick={handleCompress}
                disabled={isLoading}
              >
                {converting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Film className="h-4 w-4" />
                )}
                {t("tools.video-compressor.compress")}
              </Button>
              <ResetButton onClick={handleReset} variant="outline" />
            </div>

            {loading && (
              <LoadingState
                label={t("errors.ffmpegLoadFailed").split(".")[0] + "..."}
                className="justify-start py-3"
              />
            )}

            {converting && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{t("common.processing")}</span>
                  <span className="font-mono">{progress}%</span>
                </div>
                <Progress value={progress} />
              </div>
            )}

            {error && <ErrorMessage message={error} />}
          </div>

          {/* Output preview */}
          <div className="space-y-3 rounded-lg border p-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">
                {t("tools.video-compressor.output")}
              </h3>
              {result && (
                <Badge variant="secondary" className="font-mono">
                  {formatBytes(result.size)}
                </Badge>
              )}
            </div>

            <Separator />

            {result ? (
              <div className="space-y-3">
                <div className="grid grid-cols-3 gap-3 text-center text-xs">
                  <div>
                    <div className="text-muted-foreground">
                      {t("common.before")}
                    </div>
                    <div className="font-mono text-sm">
                      {formatBytes(originalSize)}
                    </div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">
                      {t("common.after")}
                    </div>
                    <div className="font-mono text-sm">
                      {formatBytes(compressedSize)}
                    </div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">
                      {t("common.reduceBy")}
                    </div>
                    <div>
                      {increased ? (
                        <Badge variant="secondary" className="font-mono">
                          +
                          {Math.round(
                            compressedSize / originalSize * 100 - 100
                          )}
                          %
                        </Badge>
                      ) : (
                        <Badge
                          variant="secondary"
                          className="font-mono bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
                        >
                          -{reduction}%
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>

                <video
                  src={result.url}
                  controls
                  className="w-full max-h-[360px] rounded-md bg-black"
                />

                <div className="flex flex-wrap items-center gap-2">
                  <DownloadButton
                    data={result.blob}
                    filename="compressed.mp4"
                    mime="video/mp4"
                    variant="default"
                    label={t("common.download")}
                  />
                </div>
              </div>
            ) : (
              !converting &&
              !error && (
                <EmptyState
                  icon={Film}
                  title={t("common.noOutput")}
                  description={t("common.noOutputDesc")}
                />
              )
            )}
          </div>

          <p className="text-xs text-muted-foreground inline-flex items-center gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5" />
            {t("common.privacyNote")} · {t("common.clientSideOnly")}
          </p>
        </>
      )}
    </div>
  );
}
