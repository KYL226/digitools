"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useI18n } from "@/lib/i18n/i18n-context";
import { ErrorMessage, EmptyState, LoadingState } from "@/components/tool/states";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import {
  ShieldCheck,
  Youtube,
  Music2,
  Film,
  Download,
  Loader2,
  Link2,
  Clock,
  User,
  ExternalLink,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";

// Backend mini-service runs on port 3004. In the dev environment, the frontend
// reaches it via Caddy using the XTransformPort query parameter (see examples/
// websocket for the pattern). Caddy reverse-proxies the entire request to
// localhost:3004, so we just append &XTransformPort=3004 to our fetch URLs.
const TRANSFORM_PORT = "3004";

function buildApiUrl(pathname: string, params: Record<string, string>): string {
  const qs = new URLSearchParams({ ...params, XTransformPort: TRANSFORM_PORT });
  return `${pathname}?${qs.toString()}`;
}

type FormatKind = "video+audio" | "video" | "audio";

interface VideoFormat {
  format_id: string;
  ext: string;
  quality: number | null;
  height: number | null;
  width: number | null;
  fps: number | null;
  vcodec: string;
  acodec: string;
  filesize: number | null;
  tbr: number | null;
  url: string;
}

interface VideoInfo {
  title: string;
  uploader: string | null;
  duration: number | null;
  thumbnail: string | null;
  webpage_url: string;
  extractor: string;
  is_live: boolean;
  formats: VideoFormat[];
  best_combined: string | null;
}

function formatBytes(bytes: number | null | undefined): string {
  if (!bytes) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

function formatDuration(seconds: number | null): string {
  if (!seconds) return "—";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function classifyFormat(f: VideoFormat): FormatKind {
  const hasVideo = f.vcodec && f.vcodec !== "none";
  const hasAudio = f.acodec && f.acodec !== "none";
  if (hasVideo && hasAudio) return "video+audio";
  if (hasAudio) return "audio";
  return "video";
}

// Detect the platform from the URL — used to show a friendly icon and a hint.
function detectPlatform(url: string): { name: string; icon: typeof Youtube } {
  try {
    const u = new URL(url);
    const host = u.hostname.toLowerCase().replace(/^www\./, "");
    if (host.includes("youtube") || host === "youtu.be") return { name: "YouTube", icon: Youtube };
    if (host.includes("tiktok")) return { name: "TikTok", icon: Youtube };
    if (host.includes("instagram")) return { name: "Instagram", icon: Youtube };
    if (host.includes("facebook") || host === "fb.watch") return { name: "Facebook", icon: Youtube };
    if (host.includes("vimeo")) return { name: "Vimeo", icon: Youtube };
    if (host.includes("twitter") || host === "x.com") return { name: "X/Twitter", icon: Youtube };
    if (host.includes("dailymotion")) return { name: "Dailymotion", icon: Youtube };
    if (host.includes("twitch")) return { name: "Twitch", icon: Youtube };
    return { name: "Direct", icon: Link2 };
  } catch {
    return { name: "Direct", icon: Link2 };
  }
}

export function VideoDownloader() {
  const { t } = useI18n();
  const [url, setUrl] = useState<string>("");
  const [info, setInfo] = useState<VideoInfo | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [downloading, setDownloading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedFormat, setSelectedFormat] = useState<string>("");
  const [downloadMode, setDownloadMode] = useState<"video" | "audio">("video");
  const abortRef = useRef<AbortController | null>(null);

  // Clean up any in-flight fetch on unmount.
  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  const handleFetch = useCallback(async () => {
    const trimmed = url.trim();
    if (!trimmed) {
      setError(t("tools.video-downloader.errors.emptyUrl"));
      return;
    }
    setError(null);
    setInfo(null);
    setSelectedFormat("");
    setLoading(true);
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    try {
      const res = await fetch(
        buildApiUrl("/api/info", { url: trimmed }),
        { signal: ctrl.signal }
      );
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || data.detail || t("tools.video-downloader.errors.fetchFailed"));
      }
      setInfo(data as VideoInfo);
      // Default: best combined format for video mode, or best audio-only.
      const defaultFmt =
        (data as VideoInfo).formats.find((f) => f.format_id === data.best_combined) ||
        (data as VideoInfo).formats[0];
      if (defaultFmt) setSelectedFormat(defaultFmt.format_id);
      toast.success(t("tools.video-downloader.toast.fetched"));
    } catch (e) {
      if ((e as Error).name === "AbortError") return;
      setError(
        (e as Error).message || t("tools.video-downloader.errors.fetchFailed")
      );
    } finally {
      setLoading(false);
    }
  }, [url, t]);

  const handleDownload = useCallback(async () => {
    if (!info || !selectedFormat) return;
    const fmt = info.formats.find((f) => f.format_id === selectedFormat);
    if (!fmt) return;

    setDownloading(true);
    setError(null);

    // We can't track download progress easily without complex streaming, so we
    // just open the proxy URL in a new tab — the browser handles the download
    // natively with its own progress UI. This is simpler and avoids memory
    // issues for very large videos.
    try {
      const proxyUrl = buildApiUrl("/api/proxy", { url: fmt.url });
      // Use a hidden iframe instead of window.open so it works in popup-blockers
      // and we can detect errors via the iframe load/error events.
      const iframe = document.createElement("iframe");
      iframe.style.display = "none";
      iframe.src = proxyUrl;
      document.body.appendChild(iframe);

      // Clean up the iframe after 30 seconds (download should have started by then).
      setTimeout(() => {
        if (iframe.parentNode) iframe.parentNode.removeChild(iframe);
      }, 30000);

      toast.success(t("tools.video-downloader.toast.downloading"));
    } catch (e) {
      setError(
        (e as Error).message || t("tools.video-downloader.errors.downloadFailed")
      );
    } finally {
      // Brief delay so the loading state is visible even on fast connections.
      setTimeout(() => setDownloading(false), 1200);
    }
  }, [info, selectedFormat, t]);

  const platform = url ? detectPlatform(url) : null;
  const PlatformIcon = platform?.icon ?? Link2;

  // Filter formats by mode (video mode shows video+audio first, then video-only).
  const filteredFormats = info
    ? info.formats.filter((f) => {
        const kind = classifyFormat(f);
        if (downloadMode === "audio") return kind === "audio";
        // Video mode: prefer combined, but also show video-only.
        return kind === "video+audio" || kind === "video";
      })
    : [];

  return (
    <div className="space-y-6">
      {/* URL input + fetch button */}
      <div className="space-y-3">
        <Label htmlFor="video-url" className="text-sm font-medium">
          {t("tools.video-downloader.urlLabel")}
        </Label>
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <PlatformIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              id="video-url"
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleFetch();
              }}
              placeholder={t("tools.video-downloader.placeholder")}
              className="pl-9"
              disabled={loading || downloading}
            />
          </div>
          <Button
            onClick={handleFetch}
            disabled={loading || downloading || !url.trim()}
            className="gap-1.5 sm:w-auto"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            <span>{t("tools.video-downloader.fetch")}</span>
          </Button>
        </div>
        {/* Platform badges */}
        <div className="flex flex-wrap gap-1.5 pt-1">
          <Badge variant="outline" className="gap-1 text-xs">
            <Youtube className="h-3 w-3" /> YouTube
          </Badge>
          <Badge variant="outline" className="gap-1 text-xs">
            <Music2 className="h-3 w-3" /> TikTok
          </Badge>
          <Badge variant="outline" className="gap-1 text-xs">
            <Youtube className="h-3 w-3" /> Instagram
          </Badge>
          <Badge variant="outline" className="gap-1 text-xs">
            <Youtube className="h-3 w-3" /> Facebook
          </Badge>
          <Badge variant="outline" className="gap-1 text-xs">
            <Youtube className="h-3 w-3" /> Vimeo
          </Badge>
          <Badge variant="outline" className="gap-1 text-xs">
            <Youtube className="h-3 w-3" /> X/Twitter
          </Badge>
        </div>
      </div>

      {error && <ErrorMessage message={error} />}

      {loading && (
        <LoadingState label={t("tools.video-downloader.fetching")} />
      )}

      {/* Video info card */}
      {info && !loading && (
        <div className="rounded-lg border bg-card p-4 md:p-6 space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            {info.thumbnail && (
              <div className="relative shrink-0 not-prose">
                <img
                  src={info.thumbnail}
                  alt={info.title}
                  className="rounded-md w-full md:w-48 h-auto object-cover border"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
              </div>
            )}
            <div className="flex-1 min-w-0 space-y-2">
              <h3 className="font-semibold text-base md:text-lg leading-snug line-clamp-2">
                {info.title}
              </h3>
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                {info.uploader && (
                  <span className="inline-flex items-center gap-1">
                    <User className="h-3.5 w-3.5" />
                    {info.uploader}
                  </span>
                )}
                {info.duration && (
                  <span className="inline-flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" />
                    {formatDuration(info.duration)}
                  </span>
                )}
                <span className="inline-flex items-center gap-1">
                  <Badge variant="secondary" className="text-xs">
                    {info.extractor}
                  </Badge>
                </span>
              </div>
              {info.webpage_url && (
                <a
                  href={info.webpage_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                >
                  <ExternalLink className="h-3 w-3" />
                  {t("tools.video-downloader.openOriginal")}
                </a>
              )}
            </div>
          </div>

          <Separator />

          {/* Mode toggle: video / audio */}
          <div className="flex gap-2">
            <Button
              variant={downloadMode === "video" ? "default" : "outline"}
              size="sm"
              onClick={() => {
                setDownloadMode("video");
                const bestVid = info.formats.find(
                  (f) => f.format_id === info.best_combined
                );
                if (bestVid) setSelectedFormat(bestVid.format_id);
              }}
              className="gap-1.5"
            >
              <Film className="h-4 w-4" />
              {t("tools.video-downloader.videoMode")}
            </Button>
            <Button
              variant={downloadMode === "audio" ? "default" : "outline"}
              size="sm"
              onClick={() => {
                setDownloadMode("audio");
                // Find best audio-only format.
                const bestAudio = info.formats
                  .filter((f) => classifyFormat(f) === "audio")
                  .sort((a, b) => (b.tbr || 0) - (a.tbr || 0))[0];
                if (bestAudio) setSelectedFormat(bestAudio.format_id);
              }}
              className="gap-1.5"
            >
              <Music2 className="h-4 w-4" />
              {t("tools.video-downloader.audioMode")}
            </Button>
          </div>

          {/* Format selector */}
          <div className="space-y-2">
            <Label className="text-sm">
              {downloadMode === "audio"
                ? t("tools.video-downloader.audioQuality")
                : t("tools.video-downloader.videoQuality")}
            </Label>
            <Select value={selectedFormat} onValueChange={setSelectedFormat}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {filteredFormats.map((f) => {
                  const kind = classifyFormat(f);
                  const label =
                    kind === "audio"
                      ? `Audio • ${f.ext.toUpperCase()} • ${f.tbr ? Math.round(f.tbr) + " kbps" : "—"}`
                      : `${f.height ? f.height + "p" : "—"} • ${f.ext.toUpperCase()} • ${f.fps ? f.fps + "fps" : ""} • ${f.tbr ? Math.round(f.tbr) + " kbps" : "—"}`;
                  return (
                    <SelectItem key={f.format_id} value={f.format_id}>
                      <span className="flex items-center justify-between gap-3 w-full">
                        <span>{label}</span>
                        <span className="text-xs text-muted-foreground">
                          {formatBytes(f.filesize)}
                        </span>
                      </span>
                    </SelectItem>
                  );
                })}
                {filteredFormats.length === 0 && (
                  <SelectItem value="_none" disabled>
                    {t("tools.video-downloader.noFormat")}
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Download button */}
          <div className="flex flex-col sm:flex-row gap-2">
            <Button
              onClick={handleDownload}
              disabled={downloading || !selectedFormat || selectedFormat === "_none"}
              size="lg"
              className="gap-2 flex-1 sm:flex-none"
            >
              {downloading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              {downloading
                ? t("tools.video-downloader.downloading")
                : t("tools.video-downloader.download")}
            </Button>
            <Button
              variant="ghost"
              onClick={() => {
                setInfo(null);
                setSelectedFormat("");
                setError(null);
              }}
              disabled={downloading}
            >
              {t("common.reset")}
            </Button>
          </div>

          {/* Selected format detail */}
          {selectedFormat && selectedFormat !== "_none" && (() => {
            const fmt = info.formats.find((f) => f.format_id === selectedFormat);
            if (!fmt) return null;
            const kind = classifyFormat(fmt);
            return (
              <div className="rounded-md bg-muted/50 p-3 text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t("tools.video-downloader.detail.format")}</span>
                  <span className="font-mono">{fmt.format_id} ({fmt.ext})</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t("tools.video-downloader.detail.resolution")}</span>
                  <span>
                    {kind === "audio"
                      ? "Audio only"
                      : `${fmt.width || "?"}×${fmt.height || "?"}${fmt.fps ? " @ " + fmt.fps + "fps" : ""}`}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t("tools.video-downloader.detail.size")}</span>
                  <span>{formatBytes(fmt.filesize)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t("tools.video-downloader.detail.bitrate")}</span>
                  <span>{fmt.tbr ? Math.round(fmt.tbr) + " kbps" : "—"}</span>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* Empty state when no info yet */}
      {!info && !loading && !error && (
        <EmptyState
          icon={Youtube}
          title={t("tools.video-downloader.empty.title")}
          description={t("tools.video-downloader.empty.description")}
        />
      )}

      {/* Privacy note */}
      <div className="flex items-start gap-2 text-xs text-muted-foreground bg-muted/30 rounded-md p-3">
        <ShieldCheck className="h-4 w-4 shrink-0 mt-0.5 text-green-600" />
        <p>{t("tools.video-downloader.privacy")}</p>
      </div>
    </div>
  );
}
