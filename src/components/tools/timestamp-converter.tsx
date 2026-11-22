"use client";

import { useCallback, useMemo, useState } from "react";
import { useI18n } from "@/lib/i18n/i18n-context";
import { CopyButton } from "@/components/tool/copy-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ShieldCheck, Clock, Calendar } from "lucide-react";

type UnitKey = "auto" | "seconds" | "milliseconds";
type TzKey = "local" | "utc";

const UNIT_KEYS: { value: UnitKey; key: string }[] = [
  { value: "auto", key: "common.format" }, // placeholder; replaced inline below
  { value: "seconds", key: "tools.timestamp-converter.seconds" },
  { value: "milliseconds", key: "tools.timestamp-converter.milliseconds" },
];

/** Format a Date in UTC as `YYYY-MM-DD HH:mm:ss`. */
function formatUtc(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())} ` +
    `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())}`
  );
}

/** Format a Date in Local as `YYYY-MM-DD HH:mm:ss`. */
function formatLocal(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ` +
    `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
  );
}

/** Use Intl.DateTimeFormat for a more human-readable string. */
function formatHuman(d: Date, tz: TzKey): string {
  try {
    const formatter = new Intl.DateTimeFormat(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      timeZone: tz === "utc" ? "UTC" : undefined,
      timeZoneName: "short",
    });
    return formatter.format(d);
  } catch {
    return tz === "utc" ? formatUtc(d) : formatLocal(d);
  }
}

/** Trim trailing milliseconds/zone from the value the user typed (loose parse). */
function parseNumber(raw: string): number | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  // Allow leading +/-
  if (!/^[+-]?\d+(\.\d+)?$/.test(trimmed)) return null;
  const n = Number(trimmed);
  if (!Number.isFinite(n)) return null;
  return n;
}

/** Auto-detect seconds vs ms: more than 10 digits → ms. */
function resolveUnit(value: number, unit: UnitKey): "seconds" | "milliseconds" {
  if (unit === "seconds") return "seconds";
  if (unit === "milliseconds") return "milliseconds";
  // Auto
  const intDigits = Math.floor(Math.abs(value)).toString().length;
  return intDigits > 10 ? "milliseconds" : "seconds";
}

/** Convert a `datetime-local` string into a Date in local or UTC time. */
function datetimeLocalToDate(value: string, tz: TzKey): Date | null {
  // value is `YYYY-MM-DDTHH:mm` or `YYYY-MM-DDTHH:mm:ss`
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/.exec(value);
  if (!m) return null;
  const [, y, mo, d, h, mi, s] = m;
  const year = parseInt(y, 10);
  const month = parseInt(mo, 10) - 1;
  const day = parseInt(d, 10);
  const hour = parseInt(h, 10);
  const min = parseInt(mi, 10);
  const sec = s ? parseInt(s, 10) : 0;
  if (tz === "utc") {
    return new Date(Date.UTC(year, month, day, hour, min, sec));
  }
  return new Date(year, month, day, hour, min, sec);
}

/** Convert a Date into the `YYYY-MM-DDTHH:mm` value expected by `<input type=datetime-local>`. */
function dateToDatetimeLocalValue(d: Date, tz: TzKey): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  const year = tz === "utc" ? d.getUTCFullYear() : d.getFullYear();
  const month = (tz === "utc" ? d.getUTCMonth() : d.getMonth()) + 1;
  const day = tz === "utc" ? d.getUTCDate() : d.getDate();
  const hours = tz === "utc" ? d.getUTCHours() : d.getHours();
  const minutes = tz === "utc" ? d.getUTCMinutes() : d.getMinutes();
  const seconds = tz === "utc" ? d.getUTCSeconds() : d.getSeconds();
  return `${year}-${pad(month)}-${pad(day)}T${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
}

export function TimestampConverter() {
  const { t } = useI18n();

  // LEFT panel: timestamp → date
  const [tsInput, setTsInput] = useState<string>("");
  const [tsUnit, setTsUnit] = useState<UnitKey>("auto");
  const [tsTz, setTsTz] = useState<TzKey>("utc");

  // RIGHT panel: date → timestamp
  const [dateInput, setDateInput] = useState<string>("");
  const [dateTz, setDateTz] = useState<TzKey>("local");

  /** Compute the LEFT-side Date object. */
  const tsDate = useMemo<Date | null>(() => {
    const value = parseNumber(tsInput);
    if (value === null) return null;
    const unit = resolveUnit(value, tsUnit);
    return unit === "seconds" ? new Date(value * 1000) : new Date(value);
  }, [tsInput, tsUnit]);

  const tsDateStrUtc = tsDate ? formatUtc(tsDate) : null;
  const tsDateStrLocal = tsDate ? formatLocal(tsDate) : null;
  const tsHuman = tsDate ? formatHuman(tsDate, tsTz) : null;

  /** Compute the RIGHT-side timestamp values. */
  const dateToDate = useMemo<Date | null>(() => {
    if (!dateInput) return null;
    return datetimeLocalToDate(dateInput, dateTz);
  }, [dateInput, dateTz]);

  const dateSeconds = dateToDate ? Math.floor(dateToDate.getTime() / 1000) : null;
  const dateMillis = dateToDate ? dateToDate.getTime() : null;

  const fillNowLeft = useCallback(() => {
    setTsInput(String(Math.floor(Date.now() / 1000)));
    setTsUnit("seconds");
  }, []);

  const fillNowRight = useCallback(() => {
    setDateInput(dateToDatetimeLocalValue(new Date(), dateTz));
  }, [dateTz]);

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        {/* LEFT: timestamp → date */}
        <div className="space-y-4 rounded-lg border p-4">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-sm font-semibold inline-flex items-center gap-1.5">
              <Clock className="h-4 w-4" />
              {t("tools.timestamp-converter.toHuman")}
            </h3>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={fillNowLeft}
            >
              {t("common.generate")}
            </Button>
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="ts-input"
              className="text-xs text-muted-foreground"
            >
              {t("tools.timestamp-converter.timestamp")}
            </Label>
            <Input
              id="ts-input"
              value={tsInput}
              onChange={(e) => setTsInput(e.target.value)}
              placeholder={String(Math.floor(Date.now() / 1000))}
              inputMode="numeric"
              spellCheck={false}
              autoComplete="off"
              className="font-mono"
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label
                htmlFor="ts-unit"
                className="text-xs text-muted-foreground"
              >
                {t("tools.timestamp-converter.unit")}
              </Label>
              <Select
                value={tsUnit}
                onValueChange={(v) => setTsUnit(v as UnitKey)}
              >
                <SelectTrigger id="ts-unit" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="auto">{t("common.preview")}</SelectItem>
                  {UNIT_KEYS.filter((u) => u.value !== "auto").map((u) => (
                    <SelectItem key={u.value} value={u.value}>
                      {t(u.key)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">
                {t("tools.timestamp-converter.timezone")}
              </Label>
              <Tabs
                value={tsTz}
                onValueChange={(v) => setTsTz(v as TzKey)}
              >
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="local">
                    {t("tools.timestamp-converter.local")}
                  </TabsTrigger>
                  <TabsTrigger value="utc">UTC</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </div>

          <Separator />

          <div className="space-y-2 rounded-md bg-muted/30 p-3">
            <div className="text-xs text-muted-foreground">
              {t("tools.timestamp-converter.utc")}
            </div>
            <div className="font-mono text-lg break-all">
              {tsDateStrUtc ?? "—"}
            </div>
            <div className="text-xs text-muted-foreground pt-1">
              {t("tools.timestamp-converter.local")}
            </div>
            <div className="font-mono text-lg break-all">
              {tsDateStrLocal ?? "—"}
            </div>
            {tsHuman && (
              <div className="text-xs text-muted-foreground pt-2">
                {tsHuman}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT: date → timestamp */}
        <div className="space-y-4 rounded-lg border p-4">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-sm font-semibold inline-flex items-center gap-1.5">
              <Calendar className="h-4 w-4" />
              {t("tools.timestamp-converter.toTimestamp")}
            </h3>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={fillNowRight}
            >
              {t("common.generate")}
            </Button>
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="date-input"
              className="text-xs text-muted-foreground"
            >
              {t("tools.timestamp-converter.date")}
            </Label>
            <Input
              id="date-input"
              type="datetime-local"
              step={1}
              value={dateInput}
              onChange={(e) => setDateInput(e.target.value)}
              className="font-mono"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">
              {t("tools.timestamp-converter.timezone")}
            </Label>
            <Tabs
              value={dateTz}
              onValueChange={(v) => setDateTz(v as TzKey)}
            >
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="local">
                  {t("tools.timestamp-converter.local")}
                </TabsTrigger>
                <TabsTrigger value="utc">UTC</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          <Separator />

          <div className="space-y-3 rounded-md bg-muted/30 p-3">
            <div>
              <div className="text-xs text-muted-foreground">
                {t("tools.timestamp-converter.seconds")}
              </div>
              <div className="flex items-center gap-2">
                <code className="font-mono text-lg break-all flex-1">
                  {dateSeconds ?? "—"}
                </code>
                {dateSeconds !== null && (
                  <CopyButton
                    value={String(dateSeconds)}
                    size="icon"
                    variant="outline"
                    label=""
                  />
                )}
              </div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">
                {t("tools.timestamp-converter.milliseconds")}
              </div>
              <div className="flex items-center gap-2">
                <code className="font-mono text-lg break-all flex-1">
                  {dateMillis ?? "—"}
                </code>
                {dateMillis !== null && (
                  <CopyButton
                    value={String(dateMillis)}
                    size="icon"
                    variant="outline"
                    label=""
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <p className="text-xs text-muted-foreground inline-flex items-center gap-1.5">
        <ShieldCheck className="h-3.5 w-3.5" />
        {t("common.privacyNote")} · {t("common.clientSideOnly")}
      </p>
    </div>
  );
}
