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
import { Sparkles, Minimize2 } from "lucide-react";

/**
 * CSS beautifier. Handles nested rules (@media, native CSS nesting), string
 * literals, and removes comments. Implements a depth-aware walker that
 * distinguishes selectors (text immediately before `{`) from declarations
 * (text terminated by `;`).
 */
export function beautifyCss(input: string, indentSize: number): string {
  // Strip /* ... */ comments first
  const stripped = input.replace(/\/\*[\s\S]*?\*\//g, "");
  // Collapse runs of whitespace to single spaces for easier walking
  const s = stripped.replace(/\s+/g, " ").trim();
  if (!s) return "";

  const lines: string[] = [];
  const ind = (depth: number): string => " ".repeat(depth * indentSize);
  let depth = 0;
  let i = 0;
  let buf = "";

  // Flush the leading complete declarations (those that ended with `;`).
  // The trailing partial fragment is kept in `buf` because it may be the
  // selector text that precedes a `{`.
  const flushPartial = (): void => {
    const parts = buf.split(";");
    if (parts.length <= 1) return; // keep buf as-is (potential selector)
    // All but last are complete declarations
    for (let p = 0; p < parts.length - 1; p++) {
      const decl = parts[p].trim();
      if (decl) lines.push(ind(depth) + decl + ";");
    }
    buf = parts[parts.length - 1];
  };

  // Flush whatever remains as final declarations (no following `{`).
  const flushFinal = (): void => {
    const parts = buf.split(";");
    for (const part of parts) {
      const decl = part.trim();
      if (decl) lines.push(ind(depth) + decl + ";");
    }
    buf = "";
  };

  while (i < s.length) {
    const ch = s[i];

    // String literal — copy verbatim until matching quote (handles escapes)
    if (ch === '"' || ch === "'") {
      const quote = ch;
      buf += ch;
      i++;
      while (i < s.length && s[i] !== quote) {
        if (s[i] === "\\" && i + 1 < s.length) {
          buf += s[i] + s[i + 1];
          i += 2;
        } else {
          buf += s[i];
          i++;
        }
      }
      if (i < s.length) {
        buf += s[i];
        i++;
      }
      continue;
    }

    if (ch === "{") {
      flushPartial();
      const selector = buf.trim();
      if (selector) lines.push(ind(depth) + selector + " {");
      depth++;
      buf = "";
      i++;
      continue;
    }

    if (ch === "}") {
      flushFinal();
      if (depth > 0) depth--;
      lines.push(ind(depth) + "}");
      buf = "";
      i++;
      continue;
    }

    buf += ch;
    i++;
  }

  // Trailing declarations without closing `}` (rare / malformed)
  flushFinal();

  return lines.join("\n");
}

/**
 * CSS minifier. Tokenises into strings and non-strings (and drops comments),
 * then aggressively strips whitespace and spaces around CSS punctuation.
 */
function minifyCss(input: string): string {
  const tokens: Array<{ type: "string" | "text"; value: string }> = [];
  let i = 0;
  while (i < input.length) {
    const ch = input[i];

    // Comment — drop entirely
    if (ch === "/" && input[i + 1] === "*") {
      i += 2;
      while (
        i < input.length &&
        !(input[i] === "*" && input[i + 1] === "/")
      ) {
        i++;
      }
      i += 2;
      continue;
    }

    // String literal — preserve exactly
    if (ch === '"' || ch === "'") {
      const quote = ch;
      let str = ch;
      i++;
      while (i < input.length && input[i] !== quote) {
        if (input[i] === "\\" && i + 1 < input.length) {
          str += input[i] + input[i + 1];
          i += 2;
        } else {
          str += input[i];
          i++;
        }
      }
      if (i < input.length) {
        str += input[i];
        i++;
      }
      tokens.push({ type: "string", value: str });
      continue;
    }

    // Chunk of plain text (until next string or comment)
    let chunk = "";
    while (
      i < input.length &&
      input[i] !== '"' &&
      input[i] !== "'" &&
      !(input[i] === "/" && input[i + 1] === "*")
    ) {
      chunk += input[i];
      i++;
    }
    if (chunk) tokens.push({ type: "text", value: chunk });
  }

  // Process: strip whitespace outside strings, remove spaces around punct
  let out = "";
  for (const tok of tokens) {
    if (tok.type === "string") {
      out += tok.value;
    } else {
      let v = tok.value;
      v = v.replace(/\s+/g, " ");
      v = v.replace(/\s*([{}:;,>~+])\s*/g, "$1");
      out += v;
    }
  }
  // Final boundary cleanup
  out = out.replace(/\s+/g, " ").trim();
  out = out.replace(/\s*([{}:;,>~+])\s*/g, "$1");
  return out;
}

export function CssFormatter() {
  const { t } = useI18n();
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [indent, setIndent] = useState<number>(2);

  const beautify = useCallback(() => {
    if (!input.trim()) {
      setOutput("");
      setError(null);
      return;
    }
    try {
      const result = beautifyCss(input, indent);
      setOutput(result);
      setError(null);
    } catch (err) {
      setError(
        t("errors.generic", {
          message: err instanceof Error ? err.message : String(err),
        })
      );
      setOutput("");
    }
  }, [input, indent, t]);

  const minify = useCallback(() => {
    if (!input.trim()) {
      setOutput("");
      setError(null);
      return;
    }
    try {
      const result = minifyCss(input);
      setOutput(result);
      setError(null);
    } catch (err) {
      setError(
        t("errors.generic", {
          message: err instanceof Error ? err.message : String(err),
        })
      );
      setOutput("");
    }
  }, [input, t]);

  const reset = useCallback(() => {
    setInput("");
    setOutput("");
    setError(null);
  }, []);

  return (
    <div className="space-y-4">
      {/* Top controls row */}
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-1.5">
          <Label
            htmlFor="css-indent"
            className="text-xs text-muted-foreground"
          >
            {t("tools.css-formatter.indent")}
          </Label>
          <Select
            value={String(indent)}
            onValueChange={(v) => setIndent(Number(v))}
          >
            <SelectTrigger id="css-indent" className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="2">2</SelectItem>
              <SelectItem value="4">4</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button onClick={beautify} className="gap-1.5">
            <Sparkles className="h-4 w-4" />
            {t("tools.css-formatter.beautify")}
          </Button>
          <Button onClick={minify} variant="secondary" className="gap-1.5">
            <Minimize2 className="h-4 w-4" />
            {t("tools.css-formatter.minify")}
          </Button>
        </div>
      </div>

      {error && <ErrorMessage message={error} />}

      {/* Two-column layout */}
      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label
            htmlFor="css-input"
            className="text-xs text-muted-foreground"
          >
            {t("tools.css-formatter.input")}
          </Label>
          <Textarea
            id="css-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={t("tools.css-formatter.inputPlaceholder")}
            className="font-mono text-sm min-h-[320px] resize-y"
            spellCheck={false}
            aria-label={t("tools.css-formatter.input")}
          />
        </div>

        <div className="space-y-2">
          <Label
            htmlFor="css-output"
            className="text-xs text-muted-foreground"
          >
            {t("tools.css-formatter.output")}
          </Label>
          {output ? (
            <Textarea
              id="css-output"
              value={output}
              readOnly
              className="font-mono text-sm min-h-[320px] resize-y"
              spellCheck={false}
              aria-label={t("tools.css-formatter.output")}
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
          filename="styles.css"
          mime="text/css"
          disabled={!output}
        />
        <ResetButton onClick={reset} variant="ghost" />
      </div>
    </div>
  );
}
