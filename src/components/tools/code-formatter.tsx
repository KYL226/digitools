"use client";

import { useState, useCallback } from "react";
import { useI18n } from "@/lib/i18n/i18n-context";
import { CopyButton } from "@/components/tool/copy-button";
import { DownloadButton } from "@/components/tool/download-button";
import { ResetButton } from "@/components/tool/action-buttons";
import { ErrorMessage, EmptyState } from "@/components/tool/states";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import { Braces, Code2 } from "lucide-react";
// Re-use the dedicated mini-formatters so behaviour stays consistent across
// the platform. (Each function is exported from its own tool file.)
import { beautifyCss } from "@/components/tools/css-formatter";
import { beautifyHtml } from "@/components/tools/html-formatter";
import { beautifyJs } from "@/components/tools/javascript-formatter";

type Language = "javascript" | "typescript" | "json" | "html" | "css";

const DEFAULT_INDENT = 2;

const FILE_EXTENSIONS: Record<Language, string> = {
  javascript: "js",
  typescript: "ts",
  json: "json",
  html: "html",
  css: "css",
};

const MIME_TYPES: Record<Language, string> = {
  javascript: "text/javascript",
  typescript: "text/typescript",
  json: "application/json",
  html: "text/html",
  css: "text/css",
};

/** Dispatch the source to the appropriate mini-formatter based on language. */
function formatCode(language: Language, input: string): string {
  switch (language) {
    case "json": {
      // JSON.parse() + JSON.stringify() — handles parsing & stringification
      const parsed: unknown = JSON.parse(input);
      return JSON.stringify(parsed, null, DEFAULT_INDENT);
    }
    case "html":
      return beautifyHtml(input, DEFAULT_INDENT);
    case "css":
      return beautifyCss(input, DEFAULT_INDENT);
    case "javascript":
    case "typescript":
      // TypeScript is treated the same as JavaScript for this simple formatter.
      return beautifyJs(input, DEFAULT_INDENT);
    default:
      return input;
  }
}

export function CodeFormatter() {
  const { t } = useI18n();
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [language, setLanguage] = useState<Language>("javascript");

  const format = useCallback(() => {
    if (!input.trim()) {
      setOutput("");
      setError(null);
      return;
    }
    try {
      const result = formatCode(language, input);
      setOutput(result);
      setError(null);
    } catch (err) {
      // For JSON, surface a nicer "Invalid JSON" error; for others, generic.
      const message = err instanceof Error ? err.message : String(err);
      const friendly =
        language === "json"
          ? t("errors.invalidJson", { message })
          : t("errors.generic", { message });
      setError(friendly);
      setOutput("");
    }
  }, [input, language, t]);

  const reset = useCallback(() => {
    setInput("");
    setOutput("");
    setError(null);
  }, []);

  const downloadName = `formatted.${FILE_EXTENSIONS[language]}`;
  const downloadMime = MIME_TYPES[language];

  return (
    <div className="space-y-4">
      {/* Top controls row */}
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-1.5">
          <Label
            htmlFor="code-lang"
            className="text-xs text-muted-foreground"
          >
            {t("tools.code-formatter.language")}
          </Label>
          <Select
            value={language}
            onValueChange={(v) => setLanguage(v as Language)}
          >
            <SelectTrigger id="code-lang" className="w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="javascript">JavaScript</SelectItem>
              <SelectItem value="typescript">TypeScript</SelectItem>
              <SelectItem value="json">JSON</SelectItem>
              <SelectItem value="html">HTML</SelectItem>
              <SelectItem value="css">CSS</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button onClick={format} className="gap-1.5">
            {language === "json" ? (
              <Braces className="h-4 w-4" />
            ) : (
              <Code2 className="h-4 w-4" />
            )}
            {t("tools.code-formatter.format")}
          </Button>
        </div>
      </div>

      {error && <ErrorMessage message={error} />}

      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label
            htmlFor="code-input"
            className="text-xs text-muted-foreground"
          >
            {t("tools.code-formatter.input")}
          </Label>
          <Textarea
            id="code-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={t("tools.code-formatter.inputPlaceholder")}
            className="font-mono text-sm min-h-[320px] resize-y"
            spellCheck={false}
            aria-label={t("tools.code-formatter.input")}
          />
        </div>

        <div className="space-y-2">
          <Label
            htmlFor="code-output"
            className="text-xs text-muted-foreground"
          >
            {t("tools.code-formatter.output")}
          </Label>
          {output ? (
            <Textarea
              id="code-output"
              value={output}
              readOnly
              className="font-mono text-sm min-h-[320px] resize-y"
              spellCheck={false}
              aria-label={t("tools.code-formatter.output")}
            />
          ) : (
            <div className="flex min-h-[320px] items-center justify-center rounded-md border border-dashed">
              <EmptyState />
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 mt-3">
        <CopyButton value={output} disabled={!output} />
        <DownloadButton
          data={output}
          filename={downloadName}
          mime={downloadMime}
          disabled={!output}
        />
        <ResetButton onClick={reset} variant="ghost" />
      </div>
    </div>
  );
}
