"use client";

import { useState, useCallback, useMemo } from "react";
import { useI18n } from "@/lib/i18n/i18n-context";
import { CopyButton } from "@/components/tool/copy-button";
import { DownloadButton } from "@/components/tool/download-button";
import { ClearButton } from "@/components/tool/action-buttons";
import { EmptyState } from "@/components/tool/states";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  CaseLower,
  CaseUpper,
  CaseSensitive,
  Pilcrow,
  Type,
  Braces,
  Underline,
  Minus,
} from "lucide-react";

type ConversionId =
  | "lowercase"
  | "uppercase"
  | "titleCase"
  | "sentenceCase"
  | "camelCase"
  | "pascalCase"
  | "snakeCase"
  | "kebabCase";

interface Conversion {
  id: ConversionId;
  /** translation key suffix under tools.case-converter */
  labelKey: string;
  icon: React.ComponentType<{ className?: string }>;
}

const CONVERSIONS: Conversion[] = [
  { id: "lowercase", labelKey: "lowercase", icon: CaseLower },
  { id: "uppercase", labelKey: "uppercase", icon: CaseUpper },
  { id: "titleCase", labelKey: "titleCase", icon: CaseSensitive },
  { id: "sentenceCase", labelKey: "sentenceCase", icon: Pilcrow },
  { id: "camelCase", labelKey: "camelCase", icon: Type },
  { id: "pascalCase", labelKey: "pascalCase", icon: Braces },
  { id: "snakeCase", labelKey: "snakeCase", icon: Underline },
  { id: "kebabCase", labelKey: "kebabCase", icon: Minus },
];

/** Unicode-aware: uppercase the first letter, lowercase the rest of a word. */
function capitalizeWord(word: string): string {
  if (!word) return word;
  const norm = word.normalize("NFC");
  const grapheme = Array.from(norm);
  if (grapheme.length === 0) return "";
  return grapheme[0].toUpperCase() + grapheme.slice(1).join("").toLowerCase();
}

/**
 * Split text on any run of non-word characters. Returns the word fragments
 * (excluding the separators).
 */
function splitWords(text: string): string[] {
  if (!text) return [];
  const matches = text.normalize("NFC").match(/[A-Za-zÀ-ÖØ-öø-ÿØ-ÿĀ-ž0-9]+/g);
  return matches ? matches : [];
}

const TITLE_BOUNDARY = /[\s\-\_]+/;

function toTitleCase(input: string): string {
  return input.normalize("NFC").split(TITLE_BOUNDARY).map((w) => capitalizeWord(w)).join(" ");
}

function toSentenceCase(input: string): string {
  // Lowercase everything first, then uppercase after sentence terminators
  const lower = input.normalize("NFC").toLowerCase();
  let result = "";
  let capitalizeNext = true;
  for (let i = 0; i < lower.length; i++) {
    const ch = lower[i];
    if (capitalizeNext && /\S/.test(ch)) {
      // Uppercase the next non-whitespace char (handles leading whitespace)
      result += ch.toUpperCase();
      capitalizeNext = false;
    } else {
      result += ch;
    }
    if (/[.!?]/.test(ch)) {
      capitalizeNext = true;
    }
  }
  return result;
}

function toCamelCase(input: string): string {
  const words = splitWords(input);
  if (words.length === 0) return "";
  const first = words[0].toLowerCase();
  const rest = words.slice(1).map((w) => capitalizeWord(w)).join("");
  return first + rest;
}

function toPascalCase(input: string): string {
  const words = splitWords(input);
  if (words.length === 0) return "";
  return words.map((w) => capitalizeWord(w)).join("");
}

function toSnakeCase(input: string): string {
  const words = splitWords(input).map((w) => w.toLowerCase());
  return words.join("_");
}

function toKebabCase(input: string): string {
  const words = splitWords(input).map((w) => w.toLowerCase());
  return words.join("-");
}

function applyConversion(id: ConversionId, input: string): string {
  switch (id) {
    case "lowercase":
      return input.normalize("NFC").toLowerCase();
    case "uppercase":
      return input.normalize("NFC").toUpperCase();
    case "titleCase":
      return toTitleCase(input);
    case "sentenceCase":
      return toSentenceCase(input);
    case "camelCase":
      return toCamelCase(input);
    case "pascalCase":
      return toPascalCase(input);
    case "snakeCase":
      return toSnakeCase(input);
    case "kebabCase":
      return toKebabCase(input);
    default:
      return input;
  }
}

export function CaseConverter() {
  const { t } = useI18n();
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [active, setActive] = useState<ConversionId | null>(null);

  const handleConvert = useCallback(
    (id: ConversionId) => {
      if (!input) {
        setOutput("");
        setActive(null);
        return;
      }
      setOutput(applyConversion(id, input));
      setActive(id);
    },
    [input]
  );

  const handleClear = useCallback(() => {
    setInput("");
    setOutput("");
    setActive(null);
  }, []);

  const outputBlob = useMemo(() => {
    if (!output) return null;
    return new Blob([output], { type: "text/plain" });
  }, [output]);

  return (
    <div className="space-y-4">
      {/* Input */}
      <div className="space-y-2">
        <Label
          htmlFor="case-input"
          className="text-xs text-muted-foreground"
        >
          {t("tools.case-converter.input")}
        </Label>
        <Textarea
          id="case-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={t("tools.case-converter.inputPlaceholder")}
          className="font-mono text-sm min-h-[120px] resize-y"
          spellCheck={false}
          aria-label={t("tools.case-converter.input")}
        />
      </div>

      {/* Conversion buttons grid (2 cols mobile, 4 cols desktop) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {CONVERSIONS.map((c) => {
          const Icon = c.icon;
          const isActive = active === c.id;
          return (
            <Button
              key={c.id}
              type="button"
              variant={isActive ? "default" : "outline"}
              size="sm"
              onClick={() => handleConvert(c.id)}
              disabled={!input.trim()}
              className={cn(
                "gap-1.5 justify-start",
                isActive && "ring-2 ring-primary ring-offset-2 ring-offset-background"
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span className="truncate">{t(`tools.case-converter.${c.labelKey}`)}</span>
            </Button>
          );
        })}
      </div>

      {/* Output */}
      <div className="space-y-2">
        <Label
          htmlFor="case-output"
          className="text-xs text-muted-foreground"
        >
          {t("tools.case-converter.output")}
        </Label>
        {output ? (
          <Textarea
            id="case-output"
            value={output}
            readOnly
            className="font-mono text-sm min-h-[120px] resize-y"
            spellCheck={false}
            aria-label={t("tools.case-converter.output")}
          />
        ) : (
          <div className="flex min-h-[120px] items-center justify-center rounded-md border border-dashed">
            <EmptyState />
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex flex-wrap items-center gap-2 mt-3">
        <CopyButton value={output} disabled={!output} />
        {outputBlob && (
          <DownloadButton
            data={outputBlob}
            filename="converted.txt"
            mime="text/plain"
            disabled={!output}
          />
        )}
        <ClearButton onClick={handleClear} variant="ghost" />
      </div>

      <p className="text-xs text-muted-foreground">
        {t("common.privacyNote")}
      </p>
    </div>
  );
}
