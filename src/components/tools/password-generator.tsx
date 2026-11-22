"use client";

import { useState, useCallback, useMemo } from "react";
import { useI18n } from "@/lib/i18n/i18n-context";
import { CopyButton } from "@/components/tool/copy-button";
import { EmptyState } from "@/components/tool/states";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import { RefreshCw, KeyRound, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface PasswordOptions {
  length: number;
  uppercase: boolean;
  lowercase: boolean;
  numbers: boolean;
  symbols: boolean;
  excludeAmbiguous: boolean;
}

const DEFAULT_OPTS: PasswordOptions = {
  length: 16,
  uppercase: true,
  lowercase: true,
  numbers: true,
  symbols: true,
  excludeAmbiguous: false,
};

const UPPER = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const LOWER = "abcdefghijklmnopqrstuvwxyz";
const NUMS = "0123456789";
const SYMS = "!@#$%^&*()-_=+[]{}|;:,.<>/?";
const AMBIGUOUS = /[Il1O0]/g;

/**
 * Cryptographically-secure random integer in [0, max).
 * Uses rejection sampling to avoid modulo bias.
 */
function secureRandomInt(max: number): number {
  const maxUint32 = 0xffffffff;
  const limit = maxUint32 - (maxUint32 % max);
  const buf = new Uint32Array(1);
  // Rejection sampling: keep drawing until we land in the unbiased range.
  while (true) {
    crypto.getRandomValues(buf);
    const r = buf[0];
    if (r < limit) {
      return r % max;
    }
  }
}

function buildPool(opts: PasswordOptions): string {
  let pool = "";
  if (opts.uppercase) pool += UPPER;
  if (opts.lowercase) pool += LOWER;
  if (opts.numbers) pool += NUMS;
  if (opts.symbols) pool += SYMS;
  if (opts.excludeAmbiguous) {
    pool = pool.replace(AMBIGUOUS, "");
  }
  return pool;
}

function generatePassword(opts: PasswordOptions): string {
  const pools: string[] = [];
  if (opts.uppercase) pools.push(opts.excludeAmbiguous ? UPPER.replace(AMBIGUOUS, "") : UPPER);
  if (opts.lowercase) pools.push(opts.excludeAmbiguous ? LOWER.replace(AMBIGUOUS, "") : LOWER);
  if (opts.numbers) pools.push(opts.excludeAmbiguous ? NUMS.replace(AMBIGUOUS, "") : NUMS);
  if (opts.symbols) pools.push(SYMS);

  if (pools.length === 0) return "";

  const fullPool = pools.join("");
  if (fullPool.length === 0) return "";

  const length = Math.max(1, opts.length);
  const chars: string[] = [];

  // Guarantee at least one of each enabled type.
  for (const p of pools) {
    if (p.length === 0) continue;
    chars.push(p[secureRandomInt(p.length)]);
  }

  // Fill remaining slots from the combined pool.
  while (chars.length < length) {
    chars.push(fullPool[secureRandomInt(fullPool.length)]);
  }

  // Fisher–Yates shuffle (unbiased) using secure randomness.
  for (let i = chars.length - 1; i > 0; i--) {
    const j = secureRandomInt(i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }

  return chars.join("");
}

interface StrengthInfo {
  score: 1 | 2 | 3 | 4 | 5;
  entropy: number;
}

function calcStrength(password: string, opts: PasswordOptions): StrengthInfo {
  if (!password) return { score: 1, entropy: 0 };
  let poolSize = 0;
  if (opts.uppercase) poolSize += 26;
  if (opts.lowercase) poolSize += 26;
  if (opts.numbers) poolSize += 10;
  if (opts.symbols) poolSize += SYMS.length;
  if (opts.excludeAmbiguous) {
    // Approximate the ambiguous-char reduction.
    poolSize = Math.max(poolSize - 6, 1);
  }
  if (poolSize === 0) poolSize = 1;
  const entropy = password.length * Math.log2(poolSize);
  // Map entropy to a 1–5 scale.
  let score: 1 | 2 | 3 | 4 | 5;
  if (entropy < 28) score = 1;
  else if (entropy < 40) score = 2;
  else if (entropy < 60) score = 3;
  else if (entropy < 80) score = 4;
  else score = 5;
  return { score, entropy };
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

const STRENGTH_COLORS = [
  "bg-red-500",
  "bg-orange-500",
  "bg-yellow-500",
  "bg-lime-500",
  "bg-green-500",
];

const STRENGTH_TEXT = [
  "text-red-500",
  "text-orange-500",
  "text-yellow-600",
  "text-lime-600",
  "text-green-600",
];

const STRENGTH_KEYS = [
  "tools.password-generator.strengthWeak",
  "tools.password-generator.strengthFair",
  "tools.password-generator.strengthGood",
  "tools.password-generator.strengthStrong",
  "tools.password-generator.strengthVeryStrong",
];

export function PasswordGenerator() {
  const { t } = useI18n();
  const [opts, setOpts] = useState<PasswordOptions>(DEFAULT_OPTS);
  const [password, setPassword] = useState<string>(() =>
    generatePassword(DEFAULT_OPTS)
  );

  const generate = useCallback(() => {
    const pwd = generatePassword(opts);
    setPassword(pwd);
    if (!pwd) {
      toast.error(t("errors.generic"));
    } else {
      toast.success(t("common.success"));
    }
  }, [opts, t]);

  const strength = useMemo(
    () => calcStrength(password, opts),
    [password, opts]
  );

  const setOpt = useCallback(
    <K extends keyof PasswordOptions>(key: K, value: PasswordOptions[K]) => {
      setOpts((prev) => {
        const next = { ...prev, [key]: value };
        // If user disables every category, refuse (avoid empty pool).
        const anyEnabled =
          next.uppercase || next.lowercase || next.numbers || next.symbols;
        if (!anyEnabled) {
          toast.error(t("errors.generic"));
          return prev;
        }
        return next;
      });
    },
    [t]
  );

  return (
    <div className="space-y-4">
      <div className="grid md:grid-cols-2 gap-4">
        {/* Controls */}
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label
                htmlFor="pwd-length"
                className="text-xs text-muted-foreground"
              >
                {t("tools.password-generator.length")}
              </Label>
              <span className="text-sm font-medium tabular-nums">
                {opts.length}
              </span>
            </div>
            <Slider
              id="pwd-length"
              min={4}
              max={64}
              step={1}
              value={[opts.length]}
              onValueChange={(v) => setOpt("length", v[0] ?? opts.length)}
              aria-label={t("tools.password-generator.length")}
            />
          </div>

          <ToggleRow
            id="pwd-upper"
            label={t("tools.password-generator.uppercase")}
            checked={opts.uppercase}
            onChange={(v) => setOpt("uppercase", v)}
          />
          <ToggleRow
            id="pwd-lower"
            label={t("tools.password-generator.lowercase")}
            checked={opts.lowercase}
            onChange={(v) => setOpt("lowercase", v)}
          />
          <ToggleRow
            id="pwd-nums"
            label={t("tools.password-generator.numbers")}
            checked={opts.numbers}
            onChange={(v) => setOpt("numbers", v)}
          />
          <ToggleRow
            id="pwd-syms"
            label={t("tools.password-generator.symbols")}
            checked={opts.symbols}
            onChange={(v) => setOpt("symbols", v)}
          />
          <ToggleRow
            id="pwd-amb"
            label={t("tools.password-generator.excludeAmbiguous")}
            checked={opts.excludeAmbiguous}
            onChange={(v) => setOpt("excludeAmbiguous", v)}
          />

          <Button onClick={generate} className="w-full gap-1.5">
            <KeyRound className="h-4 w-4" />
            {t("tools.password-generator.generate")}
          </Button>
        </div>

        {/* Password display + strength */}
        <div className="space-y-4">
          <div className="space-y-2">
            <Label
              htmlFor="pwd-output"
              className="text-xs text-muted-foreground"
            >
              {t("tools.password-generator.output")}
            </Label>
            {password ? (
              <Card className="py-4">
                <CardContent className="flex items-center justify-between gap-3 break-all">
                  <code
                    id="pwd-output"
                    className="font-mono text-lg leading-tight"
                  >
                    {password}
                  </code>
                  <div className="flex items-center gap-1 shrink-0">
                    <CopyButton
                      value={password}
                      size="icon"
                      variant="ghost"
                      label=""
                    />
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={generate}
                      aria-label={t("common.regenerate")}
                      title={t("common.regenerate")}
                    >
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="flex min-h-[80px] items-center justify-center rounded-md border border-dashed">
                <EmptyState />
              </div>
            )}
          </div>

          {/* Strength meter */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs text-muted-foreground">
                {t("tools.password-generator.strength")}
              </Label>
              <span
                className={cn(
                  "text-sm font-medium",
                  STRENGTH_TEXT[strength.score - 1]
                )}
              >
                {t(STRENGTH_KEYS[strength.score - 1])}
              </span>
            </div>
            <div className="flex items-center gap-1.5" role="meter" aria-valuenow={strength.score} aria-valuemin={1} aria-valuemax={5}>
              {[0, 1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className={cn(
                    "h-2 flex-1 rounded-full transition-colors",
                    i < strength.score
                      ? STRENGTH_COLORS[strength.score - 1]
                      : "bg-muted"
                  )}
                />
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              ~{Math.round(strength.entropy)} bits of entropy
            </p>
          </div>
        </div>
      </div>

      <p className="text-xs text-muted-foreground inline-flex items-center gap-1.5">
        <ShieldCheck className="h-3.5 w-3.5" />
        {t("common.privacyNote")}
      </p>
    </div>
  );
}
