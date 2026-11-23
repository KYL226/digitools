"use client";

import { useCallback, useState } from "react";
import { useI18n } from "@/lib/i18n/i18n-context";
import { ClearButton } from "@/components/tool/action-buttons";
import { CopyButton } from "@/components/tool/copy-button";
import { EmptyState, ErrorMessage } from "@/components/tool/states";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { CalendarDays, Search, ShieldCheck, Link2 } from "lucide-react";

type ErrorKey =
  | "emptyUrl"
  | "invalidUrl"
  | "notTikTok"
  | "noVideoId"
  | "invalidId"
  | "noTimestamp"
  | "invalidTimestamp"
  | "invalidDate";

interface ExtractResult {
  vidId: string;
  timestamp: number;
  dateFormatted: string;
  timeFormatted: string;
  copyValue: string;
}

function getVidId(url: string): string {
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(url.trim());
  } catch {
    throw new Error("invalidUrl" as ErrorKey);
  }

  const hostname = parsedUrl.hostname.toLowerCase();
  const isTikTok = hostname === "tiktok.com" || hostname.endsWith(".tiktok.com");
  if (!isTikTok) {
    throw new Error("notTikTok" as ErrorKey);
  }

  const match = parsedUrl.pathname.match(/\/video\/([0-9]+)(?=\/|$)/);
  if (!match) {
    throw new Error("noVideoId" as ErrorKey);
  }

  const vidId = match[1];
  if (vidId.length < 15 || vidId.length > 20) {
    throw new Error("invalidId" as ErrorKey);
  }

  return vidId;
}

function extractUnixTimestamp(vidId: string): number {
  if (typeof BigInt !== "function") {
    throw new Error("noTimestamp" as ErrorKey);
  }
  if (!/^[0-9]+$/.test(vidId)) {
    throw new Error("invalidId" as ErrorKey);
  }

  const binary = BigInt(vidId).toString(2);
  if (binary.length < 31) {
    throw new Error("noTimestamp" as ErrorKey);
  }

  const first31Bits = binary.slice(0, 31);
  const timestamp = parseInt(first31Bits, 2);

  if (!Number.isSafeInteger(timestamp) || timestamp <= 0) {
    throw new Error("invalidTimestamp" as ErrorKey);
  }

  return timestamp;
}

export function TikTokDateExtractor() {
  const { t, locale } = useI18n();
  const [url, setUrl] = useState("");
  const [result, setResult] = useState<ExtractResult | null>(null);
  const [error, setError] = useState<ErrorKey | null>(null);

  const formatDateWithLocale = useCallback(
    (timestamp: number): Omit<ExtractResult, "vidId" | "timestamp"> => {
      const date = new Date(timestamp * 1000);
      if (Number.isNaN(date.getTime())) {
        throw new Error("invalidDate" as ErrorKey);
      }

      const lang = locale === "fr" ? "fr-FR" : "en-US";
      const dateFormatted = new Intl.DateTimeFormat(lang, {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
        timeZone: "UTC",
      }).format(date);

      const timeFormatted = new Intl.DateTimeFormat(lang, {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
        timeZone: "UTC",
      }).format(date);

      const atLabel = locale === "fr" ? "à" : "at";
      return {
        dateFormatted,
        timeFormatted,
        copyValue: `${dateFormatted} ${atLabel} ${timeFormatted} UTC`,
      };
    },
    [locale]
  );

  const extract = useCallback(() => {
    setError(null);
    setResult(null);

    if (!url.trim()) {
      setError("emptyUrl");
      return;
    }

    try {
      const vidId = getVidId(url);
      const timestamp = extractUnixTimestamp(vidId);
      const formatted = formatDateWithLocale(timestamp);
      setResult({ vidId, timestamp, ...formatted });
    } catch (e) {
      const key = (e as Error).message as ErrorKey;
      setError(key in ERROR_KEYS ? key : "invalidUrl");
    }
  }, [url, formatDateWithLocale]);

  const clear = useCallback(() => {
    setUrl("");
    setResult(null);
    setError(null);
  }, []);

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      extract();
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="tiktok-url" className="text-xs text-muted-foreground">
          {t("tools.tiktok-date-extractor.urlLabel")}
        </Label>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Input
            id="tiktok-url"
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder={t("tools.tiktok-date-extractor.placeholder")}
            autoComplete="off"
            spellCheck={false}
            className="font-mono flex-1"
          />
          <div className="flex gap-2">
            <Button type="button" onClick={extract} className="gap-1.5">
              <Search className="h-4 w-4" />
              {t("tools.tiktok-date-extractor.extract")}
            </Button>
            <ClearButton variant="outline" onClick={clear} />
          </div>
        </div>
      </div>

      {error && <ErrorMessage message={t(`tools.tiktok-date-extractor.errors.${error}`)} />}

      {!error && !result && (
        <EmptyState
          icon={Link2}
          title={t("tools.tiktok-date-extractor.empty.title")}
          description={t("tools.tiktok-date-extractor.empty.description")}
        />
      )}

      {result && !error && (
        <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-4 md:p-6 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {t("tools.tiktok-date-extractor.resultLabel")}
            </p>
            <CopyButton value={result.copyValue} size="sm" variant="secondary" />
          </div>

          <div className="text-center space-y-1 py-2">
            <p className="text-lg md:text-2xl font-bold capitalize leading-snug">
              {result.dateFormatted}
            </p>
            <p className="text-base md:text-xl text-muted-foreground tabular-nums">
              {result.timeFormatted}
            </p>
            <p className="text-xs text-muted-foreground">
              {t("tools.tiktok-date-extractor.timezone")}
            </p>
          </div>

          <Separator />

          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
            <span className="font-mono">ID: {result.vidId}</span>
            <span className="font-mono tabular-nums">ts: {result.timestamp}</span>
          </div>
        </div>
      )}

      <p className="text-xs text-muted-foreground inline-flex items-start gap-1.5">
        <ShieldCheck className="h-3.5 w-3.5 mt-0.5 shrink-0" />
        {t("tools.tiktok-date-extractor.note")}
      </p>
    </div>
  );
}

const ERROR_KEYS = new Set([
  "emptyUrl",
  "invalidUrl",
  "notTikTok",
  "noVideoId",
  "invalidId",
  "noTimestamp",
  "invalidTimestamp",
  "invalidDate",
]);
