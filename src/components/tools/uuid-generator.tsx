"use client";

import { useState, useCallback, useMemo } from "react";
import { useI18n } from "@/lib/i18n/i18n-context";
import { CopyButton } from "@/components/tool/copy-button";
import { DownloadButton } from "@/components/tool/download-button";
import { EmptyState } from "@/components/tool/states";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dices, Copy, KeyRound } from "lucide-react";
import { toast } from "sonner";

interface UuidOptions {
  uppercase: boolean;
  braces: boolean;
  hyphens: boolean;
}

/**
 * Generate a single RFC 4122 v4 UUID. Prefers crypto.randomUUID when present,
 * falls back to a manual v4 implementation using crypto.getRandomValues.
 */
function generateUuidV4(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  // Manual v4 fallback.
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  // Set version (4) and variant (10xx).
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, "0"));
  return (
    hex.slice(0, 4).join("") +
    "-" +
    hex.slice(4, 6).join("") +
    "-" +
    hex.slice(6, 8).join("") +
    "-" +
    hex.slice(8, 10).join("") +
    "-" +
    hex.slice(10, 16).join("")
  );
}

function formatUuid(uuid: string, opts: UuidOptions): string {
  let out = opts.hyphens ? uuid : uuid.replace(/-/g, "");
  if (opts.uppercase) out = out.toUpperCase();
  if (opts.braces) out = `{${out}}`;
  return out;
}

interface ToggleRowProps {
  id: string;
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}

function ToggleRow({ id, label, checked, onChange }: ToggleRowProps) {
  return (
    <div className="flex items-center justify-between rounded-md border p-3">
      <Label htmlFor={id} className="cursor-pointer text-sm">
        {label}
      </Label>
      <Switch id={id} checked={checked} onCheckedChange={onChange} />
    </div>
  );
}

export function UuidGenerator() {
  const { t } = useI18n();
  const [count, setCount] = useState<number>(5);
  const [uppercase, setUppercase] = useState<boolean>(false);
  const [braces, setBraces] = useState<boolean>(false);
  const [hyphens, setHyphens] = useState<boolean>(true);
  const [uuids, setUuids] = useState<string[]>([]);

  const opts: UuidOptions = useMemo(
    () => ({ uppercase, braces, hyphens }),
    [uppercase, braces, hyphens]
  );

  const formattedUuids = useMemo(
    () => uuids.map((u) => formatUuid(u, opts)),
    [uuids, opts]
  );

  const generate = useCallback(() => {
    const safeCount = Math.max(1, Math.min(100, Math.floor(count) || 1));
    const next: string[] = [];
    for (let i = 0; i < safeCount; i++) {
      next.push(generateUuidV4());
    }
    setUuids(next);
    toast.success(t("common.success"));
  }, [count, t]);

  const copyAll = useCallback(async () => {
    if (formattedUuids.length === 0) return;
    try {
      await navigator.clipboard.writeText(formattedUuids.join("\n"));
      toast.success(t("common.copied"));
    } catch {
      toast.error(t("common.copyFailed"));
    }
  }, [formattedUuids, t]);

  return (
    <div className="space-y-4">
      <div className="grid md:grid-cols-2 gap-4">
        {/* Controls */}
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label
                htmlFor="uuid-count"
                className="text-xs text-muted-foreground"
              >
                {t("tools.uuid-generator.count")}
              </Label>
              <span className="text-sm font-medium tabular-nums">{count}</span>
            </div>
            <div className="flex items-center gap-3">
              <Slider
                id="uuid-count"
                min={1}
                max={100}
                step={1}
                value={[count]}
                onValueChange={(v) => setCount(v[0] ?? count)}
                className="flex-1"
                aria-label={t("tools.uuid-generator.count")}
              />
              <Input
                type="number"
                min={1}
                max={100}
                value={count}
                onChange={(e) => {
                  const n = Number(e.target.value);
                  if (!Number.isNaN(n)) setCount(Math.max(1, Math.min(100, n)));
                }}
                className="w-20"
                aria-label={t("tools.uuid-generator.count")}
              />
            </div>
          </div>

          <ToggleRow
            id="uuid-uppercase"
            label={t("tools.uuid-generator.uppercase")}
            checked={uppercase}
            onChange={setUppercase}
          />
          <ToggleRow
            id="uuid-braces"
            label={t("tools.uuid-generator.braces")}
            checked={braces}
            onChange={setBraces}
          />
          <ToggleRow
            id="uuid-hyphens"
            label={t("tools.uuid-generator.hyphens")}
            checked={hyphens}
            onChange={setHyphens}
          />

          <Button onClick={generate} className="w-full gap-1.5">
            <Dices className="h-4 w-4" />
            {t("tools.uuid-generator.generate")}
          </Button>
        </div>

        {/* Output */}
        <div className="space-y-2">
          <Label
            htmlFor="uuid-output"
            className="text-xs text-muted-foreground"
          >
            {t("tools.uuid-generator.output")}
          </Label>
          {formattedUuids.length === 0 ? (
            <div className="flex min-h-[360px] items-center justify-center rounded-md border border-dashed">
              <EmptyState />
            </div>
          ) : (
            <ScrollArea className="h-[360px] rounded-md border">
              <ul
                id="uuid-output"
                className="p-3 space-y-1"
                aria-label={t("tools.uuid-generator.output")}
              >
                {formattedUuids.map((uuid, idx) => (
                  <li
                    key={`${uuid}-${idx}`}
                    className="flex items-center justify-between gap-2 rounded-sm px-2 py-1.5 hover:bg-accent/60"
                  >
                    <code className="font-mono text-sm break-all">{uuid}</code>
                    <CopyButton
                      value={uuid}
                      size="icon"
                      variant="ghost"
                      label=""
                    />
                  </li>
                ))}
              </ul>
            </ScrollArea>
          )}
        </div>
      </div>

      {/* Bulk actions */}
      <div className="flex flex-wrap items-center gap-2 mt-3">
        <Button
          variant="secondary"
          size="sm"
          onClick={copyAll}
          disabled={formattedUuids.length === 0}
          className="gap-1.5"
        >
          <Copy className="h-4 w-4" />
          {t("common.copy")}
        </Button>
        <DownloadButton
          data={formattedUuids.join("\n")}
          filename="uuids.txt"
          mime="text/plain"
          disabled={formattedUuids.length === 0}
        />
      </div>

      <p className="text-xs text-muted-foreground inline-flex items-center gap-1.5">
        <KeyRound className="h-3.5 w-3.5" />
        {t("common.privacyNote")}
      </p>
    </div>
  );
}
