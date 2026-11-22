"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useI18n } from "@/lib/i18n/i18n-context";
import { FileDropzone } from "@/components/tool/file-dropzone";
import { DownloadButton } from "@/components/tool/download-button";
import { ResetButton } from "@/components/tool/action-buttons";
import { ErrorMessage, EmptyState, LoadingState } from "@/components/tool/states";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import { ShieldCheck, Music, Loader2 } from "lucide-react";
import { getFFmpeg, fileToUint8Array } from "@/lib/ffmpeg";

interface AudioFormat {
  value: string;
  ext: string;
  mime: string;
  codec: string;
}

const FORMATS: AudioFormat[] = [
  { value: "mp3", ext: "mp3", mime: "audio/mpeg", codec: "libmp3lame" },
  { value: "wav", ext: "wav", mime: "audio/wav", codec: "pcm_s16le" },
  { value: "ogg", ext: "ogg", mime: "audio/ogg", codec: "libvorbis" },
  { value: "aac", ext: "aac", mime: "audio/aac", codec: "aac" },
];

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

interface ResultFile {
  blob: Blob;
  url: string;
  size: number;
  ext: string;
}

export function AudioConverter() {
  const { t } = useI18n();
  const [file, setFile] = useState<File | null>(null);
  const [targetFormat, setTargetFormat] = useState<string>("mp3");
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
    setTargetFormat("mp3");
  }, [result]);

  const handleConvert = useCallback(async () => {
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

      const fmt =
        FORMATS.find((f) => f.value === targetFormat) ?? FORMATS[0];
      const inputName = "input";
      const outputName = `output.${fmt.ext}`;
      await ffmpeg.writeFile(inputName, await fileToUint8Array(file));
      await ffmpeg.exec([
        "-i",
        inputName,
        "-c:a",
        fmt.codec,
        "-b:a",
        "128k",
        outputName,
      ]);
      const data = await ffmpeg.readFile(outputName);
      const u8 =
        data instanceof Uint8Array ? data : new Uint8Array(data as ArrayBuffer);
      const blob = new Blob([u8], { type: fmt.mime });
      const url = URL.createObjectURL(blob);
      if (resultRef.current) URL.revokeObjectURL(resultRef.current.url);
      const next: ResultFile = {
        blob,
        url,
        size: blob.size,
        ext: fmt.ext,
      };
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
          : t("errors.conversionFailed", { message: msg })
      );
    } finally {
      setLoading(false);
      setConverting(false);
    }
  }, [file, targetFormat, t]);

  const isLoading = loading || converting;
  const targetFmt =
    FORMATS.find((f) => f.value === targetFormat) ?? FORMATS[0];

  return (
    <div className="space-y-4">
      {!file ? (
        <FileDropzone
          onFile={handleFile}
          accept="audio/*"
          maxSizeMB={100}
          label={t("tools.audio-converter.input")}
        />
      ) : (
        <>
          {/* Controls */}
          <div className="space-y-4 rounded-lg border p-4">
            <div className="flex items-center gap-2 text-sm">
              <Music className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium truncate flex-1">{file.name}</span>
              <Badge variant="secondary" className="font-mono">
                {formatBytes(file.size)}
              </Badge>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label
                  htmlFor="ac-format"
                  className="text-xs text-muted-foreground"
                >
                  {t("tools.audio-converter.targetFormat")}
                </Label>
                <Select
                  value={targetFormat}
                  onValueChange={setTargetFormat}
                  disabled={isLoading}
                >
                  <SelectTrigger id="ac-format" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {FORMATS.map((fmt) => (
                      <SelectItem key={fmt.value} value={fmt.value}>
                        {fmt.ext.toUpperCase()}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                onClick={handleConvert}
                disabled={isLoading}
              >
                {converting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Music className="h-4 w-4" />
                )}
                {t("tools.audio-converter.convert")}
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
                {t("tools.audio-converter.output")}
              </h3>
              {result && (
                <Badge variant="secondary" className="font-mono">
                  {targetFmt.ext.toUpperCase()} · {formatBytes(result.size)}
                </Badge>
              )}
            </div>

            <Separator />

            {result ? (
              <div className="space-y-3">
                <audio
                  src={result.url}
                  controls
                  className="w-full"
                  aria-label={t("tools.audio-converter.output")}
                />
                <div className="flex flex-wrap items-center gap-2">
                  <DownloadButton
                    data={result.blob}
                    filename={`converted.${result.ext}`}
                    mime={targetFmt.mime}
                    variant="default"
                    label={t("common.download")}
                  />
                </div>
              </div>
            ) : (
              !converting &&
              !error && (
                <EmptyState
                  icon={Music}
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

