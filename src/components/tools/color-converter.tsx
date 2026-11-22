"use client";

// Color Converter & Picker — pure client-side HEX / RGB / HSL conversion.
import { useCallback, useMemo, useState } from "react";
import { useI18n } from "@/lib/i18n/i18n-context";
import { CopyButton } from "@/components/tool/copy-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

/** RGB triplet, 0-255 per channel. */
interface RGB {
  r: number;
  g: number;
  b: number;
}

function clamp255(n: number): number {
  if (Number.isNaN(n)) return 0;
  return Math.max(0, Math.min(255, Math.round(n)));
}

/** Convert RGB → HEX (#rrggbb, lowercase). */
function rgbToHex({ r, g, b }: RGB): string {
  const toHex = (n: number) =>
    clamp255(n).toString(16).padStart(2, "0").toLowerCase();
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/** Parse a HEX string (#rgb or #rrggbb, optional #). Returns null on failure. */
function parseHex(input: string): RGB | null {
  const trimmed = input.trim();
  const match = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(trimmed);
  if (!match) return null;
  const hex = match[1];
  if (hex.length === 3) {
    return {
      r: parseInt(hex[0] + hex[0], 16),
      g: parseInt(hex[1] + hex[1], 16),
      b: parseInt(hex[2] + hex[2], 16),
    };
  }
  return {
    r: parseInt(hex.slice(0, 2), 16),
    g: parseInt(hex.slice(2, 4), 16),
    b: parseInt(hex.slice(4, 6), 16),
  };
}

/** Convert RGB → HSL ({ h: 0-360, s: 0-100, l: 0-100 }). */
function rgbToHsl({ r, g, b }: RGB): { h: number; s: number; l: number } {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const delta = max - min;
  const l = (max + min) / 2;

  if (delta === 0) {
    return { h: 0, s: 0, l: Math.round(l * 100) };
  }

  let h = 0;
  if (max === rn) {
    h = ((gn - bn) / delta) % 6;
  } else if (max === gn) {
    h = (bn - rn) / delta + 2;
  } else {
    h = (rn - gn) / delta + 4;
  }
  h = h * 60;
  if (h < 0) h += 360;

  const s = l > 1 - 1e-10 || l < 1e-10 ? 0 : (max - l) / Math.min(l, 1 - l);
  return {
    h: Math.round(h),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  };
}

/** Convert HSL → RGB. h: 0-360, s: 0-100, l: 0-100. */
function hslToRgb(h: number, s: number, l: number): RGB {
  const sn = s / 100;
  const ln = l / 100;
  const c = (1 - Math.abs(2 * ln - 1)) * sn;
  const hp = ((h % 360) + 360) % 360;
  const x = c * (1 - Math.abs(((hp / 60) % 2) - 1));
  const m = ln - c / 2;
  let r1 = 0;
  let g1 = 0;
  let b1 = 0;
  if (hp < 60) {
    r1 = c; g1 = x; b1 = 0;
  } else if (hp < 120) {
    r1 = x; g1 = c; b1 = 0;
  } else if (hp < 180) {
    r1 = 0; g1 = c; b1 = x;
  } else if (hp < 240) {
    r1 = 0; g1 = x; b1 = c;
  } else if (hp < 300) {
    r1 = x; g1 = 0; b1 = c;
  } else {
    r1 = c; g1 = 0; b1 = x;
  }
  return {
    r: clamp255((r1 + m) * 255),
    g: clamp255((g1 + m) * 255),
    b: clamp255((b1 + m) * 255),
  };
}

/** Format RGB as `rgb(r, g, b)`. */
function formatRgb({ r, g, b }: RGB): string {
  return `rgb(${clamp255(r)}, ${clamp255(g)}, ${clamp255(b)})`;
}

/** Parse RGB string: `rgb(r, g, b)` or `r, g, b`. */
function parseRgb(input: string): RGB | null {
  const trimmed = input.trim();
  const match = /(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/.exec(trimmed);
  if (!match) return null;
  return {
    r: clamp255(parseInt(match[1], 10)),
    g: clamp255(parseInt(match[2], 10)),
    b: clamp255(parseInt(match[3], 10)),
  };
}

/** Format HSL as `hsl(h, s%, l%)`. */
function formatHsl(h: number, s: number, l: number): string {
  return `hsl(${Math.round(h)}, ${Math.round(s)}%, ${Math.round(l)}%)`;
}

/** Parse HSL string: `hsl(h, s%, l%)` or `h, s, l` (with or without %). */
function parseHsl(input: string): { h: number; s: number; l: number } | null {
  const trimmed = input.trim();
  // Strip "hsl(" / ")"
  const cleaned = trimmed
    .replace(/^hsla?\(/i, "")
    .replace(/\)\s*$/, "");
  const parts = cleaned.split(",").map((p) => parseFloat(p.trim()));
  if (parts.length !== 3 || parts.some((n) => Number.isNaN(n))) return null;
  return {
    h: ((parts[0] % 360) + 360) % 360,
    s: Math.max(0, Math.min(100, parts[1])),
    l: Math.max(0, Math.min(100, parts[2])),
  };
}

const DEFAULT_COLOR: RGB = { r: 59, g: 130, b: 246 }; // #3b82f6

type SourceKey = "picker" | "hex" | "rgb" | "hsl";

export function ColorConverter() {
  const { t } = useI18n();
  const [color, setColor] = useState<RGB>(DEFAULT_COLOR);
  /** Which field is the user actively editing — used to avoid feedback loops. */
  const [activeSource, setActiveSource] = useState<SourceKey>("picker");

  const hex = useMemo(() => rgbToHex(color), [color]);
  const rgb = useMemo(() => formatRgb(color), [color]);
  const hsl = useMemo(() => {
    const h = rgbToHsl(color);
    return formatHsl(h.h, h.s, h.l);
  }, [color]);

  const onPickerChange = useCallback((value: string) => {
    const parsed = parseHex(value);
    if (parsed) {
      setActiveSource("picker");
      setColor(parsed);
    }
  }, []);

  const onHexChange = useCallback((value: string) => {
    setActiveSource("hex");
    const parsed = parseHex(value);
    if (parsed) {
      setColor(parsed);
    }
  }, []);

  const onRgbChange = useCallback((value: string) => {
    setActiveSource("rgb");
    const parsed = parseRgb(value);
    if (parsed) {
      setColor(parsed);
    }
  }, []);

  const onHslChange = useCallback((value: string) => {
    setActiveSource("hsl");
    const parsed = parseHsl(value);
    if (parsed) {
      setColor(hslToRgb(parsed.h, parsed.s, parsed.l));
    }
  }, []);

  return (
    <div className="space-y-4">
      {/* Color picker + preview */}
      <div className="grid gap-4 md:grid-cols-[180px_1fr] md:items-stretch">
        <div className="space-y-2">
          <Label
            htmlFor="color-picker"
            className="text-xs text-muted-foreground"
          >
            {t("tools.color-converter.picker")}
          </Label>
          <div
            className={cn(
              "relative flex h-[80px] items-center justify-center overflow-hidden rounded-lg border",
              "border-input bg-muted/30"
            )}
          >
            <input
              id="color-picker"
              type="color"
              value={hex}
              onChange={(e) => onPickerChange(e.target.value)}
              className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
              aria-label={t("tools.color-converter.picker")}
            />
            <div
              className="h-full w-full"
              style={{ backgroundColor: hex }}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">
            {t("tools.color-converter.preview")}
          </Label>
          <div
            className="h-[80px] w-full rounded-lg border border-input shadow-inner"
            style={{ backgroundColor: hex }}
            role="img"
            aria-label={`Preview ${hex}`}
          />
        </div>
      </div>

      {/* Three text inputs */}
      <div className="grid gap-4 md:grid-cols-3">
        <HexField
          label={t("tools.color-converter.hex")}
          value={activeSource === "hex" ? undefined : hex}
          placeholder={hex}
          onValueChange={onHexChange}
          copiedValue={hex}
        />
        <RgbField
          label={t("tools.color-converter.rgb")}
          value={activeSource === "rgb" ? undefined : rgb}
          placeholder={rgb}
          onValueChange={onRgbChange}
          copiedValue={rgb}
        />
        <HslField
          label={t("tools.color-converter.hsl")}
          value={activeSource === "hsl" ? undefined : hsl}
          placeholder={hsl}
          onValueChange={onHslChange}
          copiedValue={hsl}
        />
      </div>

      <p className="text-xs text-muted-foreground inline-flex items-center gap-1.5">
        <ShieldCheck className="h-3.5 w-3.5" />
        {t("common.privacyNote")} · {t("common.clientSideOnly")}
      </p>
    </div>
  );
}

interface FieldProps {
  label: string;
  value: string | undefined;
  placeholder: string;
  onValueChange: (v: string) => void;
  copiedValue: string;
}

function HexField({
  label,
  value,
  placeholder,
  onValueChange,
  copiedValue,
}: FieldProps) {
  return (
    <div className="space-y-2">
      <Label className="text-xs text-muted-foreground uppercase tracking-wide">
        {label}
      </Label>
      <div className="flex items-center gap-1.5">
        <Input
          value={value ?? ""}
          placeholder={placeholder}
          onChange={(e) => onValueChange(e.target.value)}
          spellCheck={false}
          autoComplete="off"
          className="font-mono"
          aria-label={label}
        />
        <CopyButton
          value={copiedValue}
          size="icon"
          variant="outline"
          label=""
        />
      </div>
    </div>
  );
}

function RgbField(props: FieldProps) {
  return <HexField {...props} />;
}

function HslField(props: FieldProps) {
  return <HexField {...props} />;
}
