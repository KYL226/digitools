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
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import { Braces, Minimize2, CheckCheck, CheckCircle2, XCircle } from "lucide-react";

interface JsonErrorInfo {
  message: string;
  line?: number;
  column?: number;
}

/**
 * Extract line/column info from a JSON.parse() error message.
 * Browsers report positions differently (Chrome: "at position N", Firefox:
 * "at line N column M"). We normalise to {line, column}.
 */
function describeJsonError(err: unknown, input: string): JsonErrorInfo {
  const raw = err instanceof Error ? err.message : String(err);

  // Chrome / Node / modern browsers: "... at position N"
  const posMatch = raw.match(/position\s+(\d+)/i);
  if (posMatch) {
    const pos = parseInt(posMatch[1], 10);
    if (!Number.isNaN(pos) && pos >= 0 && pos <= input.length) {
      let line = 1;
      let col = 1;
      for (let i = 0; i < pos && i < input.length; i++) {
        if (input[i] === "\n") {
          line++;
          col = 1;
        } else {
          col++;
        }
      }
      return { message: raw, line, column: col };
    }
  }

  // Firefox / Safari: "at line N column M"
  const lcMatch = raw.match(/line\s+(\d+)\s+column\s+(\d+)/i);
  if (lcMatch) {
    return {
      message: raw,
      line: parseInt(lcMatch[1], 10),
      column: parseInt(lcMatch[2], 10),
    };
  }

  return { message: raw };
}

export function JsonFormatter() {
  const { t } = useI18n();
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [indent, setIndent] = useState<number>(2);
  const [valid, setValid] = useState<boolean | null>(null);

  const runJson = useCallback(
    (mode: "format" | "minify" | "validate") => {
      if (!input.trim()) {
        setError(null);
        setValid(null);
        setOutput("");
        return;
      }
      try {
        const parsed: unknown = JSON.parse(input);
        if (mode === "validate") {
          setValid(true);
          setError(null);
          return;
        }
        const out =
          mode === "format"
            ? JSON.stringify(parsed, null, indent)
            : JSON.stringify(parsed);
        setOutput(out);
        setError(null);
        setValid(true);
      } catch (err) {
        const info = describeJsonError(err, input);
        const msg =
          info.line !== undefined && info.column !== undefined
            ? t("tools.json-formatter.errorAt", {
                line: info.line,
                col: info.column,
              })
            : t("errors.invalidJson", { message: info.message });
        setError(msg);
        setOutput("");
        setValid(false);
      }
    },
    [input, indent, t]
  );

  const format = useCallback(() => runJson("format"), [runJson]);
  const minify = useCallback(() => runJson("minify"), [runJson]);
  const validate = useCallback(() => runJson("validate"), [runJson]);

  const reset = useCallback(() => {
    setInput("");
    setOutput("");
    setError(null);
    setValid(null);
  }, []);

  return (
    <div className="space-y-4">
      {/* Top controls row */}
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-1.5">
          <Label
            htmlFor="json-indent"
            className="text-xs text-muted-foreground"
          >
            {t("tools.json-formatter.indent")}
          </Label>
          <Select
            value={String(indent)}
            onValueChange={(v) => setIndent(Number(v))}
          >
            <SelectTrigger id="json-indent" className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="2">2</SelectItem>
              <SelectItem value="4">4</SelectItem>
              <SelectItem value="8">8</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button onClick={format} className="gap-1.5">
            <Braces className="h-4 w-4" />
            {t("tools.json-formatter.format")}
          </Button>
          <Button onClick={minify} variant="secondary" className="gap-1.5">
            <Minimize2 className="h-4 w-4" />
            {t("tools.json-formatter.minify")}
          </Button>
          <Button onClick={validate} variant="outline" className="gap-1.5">
            <CheckCheck className="h-4 w-4" />
            {t("tools.json-formatter.validate")}
          </Button>
        </div>

        {valid !== null && (
          <Badge
            variant={valid ? "default" : "destructive"}
            className="gap-1 ml-auto"
          >
            {valid ? (
              <CheckCircle2 className="h-3 w-3" />
            ) : (
              <XCircle className="h-3 w-3" />
            )}
            {t(
              valid
                ? "tools.json-formatter.valid"
                : "tools.json-formatter.invalid"
            )}
          </Badge>
        )}
      </div>

      {error && <ErrorMessage message={error} />}

      {/* Two-column layout */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Input column */}
        <div className="space-y-2">
          <Label
            htmlFor="json-input"
            className="text-xs text-muted-foreground"
          >
            {t("tools.json-formatter.input")}
          </Label>
          <Textarea
            id="json-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={t("tools.json-formatter.inputPlaceholder")}
            className="font-mono text-sm min-h-[320px] resize-y"
            spellCheck={false}
            aria-label={t("tools.json-formatter.input")}
          />
        </div>

        {/* Output column */}
        <div className="space-y-2">
          <Label
            htmlFor="json-output"
            className="text-xs text-muted-foreground"
          >
            {t("tools.json-formatter.output")}
          </Label>
          {output ? (
            <Textarea
              id="json-output"
              value={output}
              readOnly
              className="font-mono text-sm min-h-[320px] resize-y"
              spellCheck={false}
              aria-label={t("tools.json-formatter.output")}
            />
          ) : (
            <div className="flex min-h-[320px] items-center justify-center rounded-md border border-dashed">
              <EmptyState />
            </div>
          )}
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex flex-wrap items-center gap-2 mt-3">
        <CopyButton value={output} disabled={!output} />
        <DownloadButton
          data={output}
          filename="formatted.json"
          mime="application/json"
          disabled={!output}
        />
        <ResetButton onClick={reset} variant="ghost" />
      </div>
    </div>
  );
}
