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
import { Code2 } from "lucide-react";

const VOID_ELEMENTS = new Set<string>([
  "area",
  "base",
  "br",
  "col",
  "embed",
  "hr",
  "img",
  "input",
  "link",
  "meta",
  "param",
  "source",
  "track",
  "wbr",
]);

const PRESERVE_TAGS = new Set<string>(["pre", "textarea", "script", "style"]);

type Token =
  | { type: "tag"; value: string }
  | { type: "text"; value: string }
  | { type: "comment"; value: string }
  | { type: "raw"; value: string };

function tokenizeHtml(input: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;
  while (i < input.length) {
    if (input[i] === "<") {
      // Comment
      if (input.startsWith("<!--", i)) {
        const endIdx = input.indexOf("-->", i + 4);
        const end = endIdx === -1 ? input.length : endIdx + 3;
        tokens.push({
          type: "comment",
          value: input.slice(i, end).replace(/\s+/g, " ").trim(),
        });
        i = end;
        continue;
      }

      // Doctype or other <! ... > declaration — read until `>`
      if (input.startsWith("<!", i)) {
        const endIdx = input.indexOf(">", i);
        const end = endIdx === -1 ? input.length : endIdx + 1;
        tokens.push({
          type: "comment",
          value: input.slice(i, end).replace(/\s+/g, " ").trim(),
        });
        i = end;
        continue;
      }

      // Regular tag — read until matching `>`, being careful with quoted attrs
      let j = i + 1;
      let inStr = false;
      let strCh = "";
      while (j < input.length) {
        const c = input[j];
        if (inStr) {
          if (c === strCh) inStr = false;
          j++;
          continue;
        }
        if (c === '"' || c === "'") {
          inStr = true;
          strCh = c;
          j++;
          continue;
        }
        if (c === ">") break;
        j++;
      }
      const tagText = input.slice(i, j + 1).replace(/\s+/g, " ").trim();
      tokens.push({ type: "tag", value: tagText });
      i = j + 1;

      // If this is a preserved-content opening tag, capture raw content
      // until the matching closing tag.
      const mOpen = /^<([a-zA-Z][a-zA-Z0-9]*)\b/.exec(tagText);
      if (mOpen) {
        const tagName = mOpen[1].toLowerCase();
        const isSelfClosing = /\/\s*$/.test(tagText.slice(0, -1));
        if (PRESERVE_TAGS.has(tagName) && !isSelfClosing) {
          const closeLower = `</${tagName}`;
          const lowerFromHere = input.slice(i).toLowerCase();
          const relClose = lowerFromHere.indexOf(closeLower);
          if (relClose !== -1) {
            const content = input.slice(i, i + relClose);
            if (content) tokens.push({ type: "raw", value: content });
            i = i + relClose; // next iteration parses the closing tag
          }
        }
      }
      continue;
    }

    // Text run — read until next `<`
    let j = i;
    while (j < input.length && input[j] !== "<") j++;
    const text = input.slice(i, j);
    if (text) tokens.push({ type: "text", value: text });
    i = j;
  }
  return tokens;
}

export function beautifyHtml(input: string, indentSize: number): string {
  const tokens = tokenizeHtml(input);
  if (tokens.length === 0) return "";

  const ind = (depth: number): string => " ".repeat(depth * indentSize);
  const lines: string[] = [];
  let depth = 0;

  for (const tok of tokens) {
    if (tok.type === "raw") {
      const trimmed = tok.value.replace(/^\n+/, "").replace(/\s+$/, "");
      if (trimmed) lines.push(trimmed);
      continue;
    }

    if (tok.type === "text") {
      const trimmed = tok.value.replace(/\s+/g, " ").trim();
      if (trimmed) lines.push(ind(depth) + trimmed);
      continue;
    }

    if (tok.type === "comment") {
      lines.push(ind(depth) + tok.value);
      continue;
    }

    // It's a tag
    const tag = tok.value;
    const isClosing = /^<\//.test(tag);
    const isSelfClosing = /\/>$/.test(tag);
    const mTag = /^<\/?([a-zA-Z][a-zA-Z0-9]*)/.exec(tag);
    const tagName = mTag ? mTag[1].toLowerCase() : "";
    const isVoid = VOID_ELEMENTS.has(tagName);

    if (isClosing) {
      if (depth > 0) depth--;
      lines.push(ind(depth) + tag);
    } else if (isSelfClosing || isVoid) {
      lines.push(ind(depth) + tag);
    } else {
      lines.push(ind(depth) + tag);
      depth++;
    }
  }

  return lines.join("\n");
}

export function HtmlFormatter() {
  const { t } = useI18n();
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [indent, setIndent] = useState<number>(2);

  const format = useCallback(() => {
    if (!input.trim()) {
      setOutput("");
      setError(null);
      return;
    }
    try {
      const result = beautifyHtml(input, indent);
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

  const reset = useCallback(() => {
    setInput("");
    setOutput("");
    setError(null);
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-1.5">
          <Label
            htmlFor="html-indent"
            className="text-xs text-muted-foreground"
          >
            {t("tools.html-formatter.indent")}
          </Label>
          <Select
            value={String(indent)}
            onValueChange={(v) => setIndent(Number(v))}
          >
            <SelectTrigger id="html-indent" className="w-32">
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
            <Code2 className="h-4 w-4" />
            {t("tools.html-formatter.format")}
          </Button>
        </div>
      </div>

      {error && <ErrorMessage message={error} />}

      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label
            htmlFor="html-input"
            className="text-xs text-muted-foreground"
          >
            {t("tools.html-formatter.input")}
          </Label>
          <Textarea
            id="html-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={t("tools.html-formatter.inputPlaceholder")}
            className="font-mono text-sm min-h-[320px] resize-y"
            spellCheck={false}
            aria-label={t("tools.html-formatter.input")}
          />
        </div>

        <div className="space-y-2">
          <Label
            htmlFor="html-output"
            className="text-xs text-muted-foreground"
          >
            {t("tools.html-formatter.output")}
          </Label>
          {output ? (
            <Textarea
              id="html-output"
              value={output}
              readOnly
              className="font-mono text-sm min-h-[320px] resize-y"
              spellCheck={false}
              aria-label={t("tools.html-formatter.output")}
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
          filename="formatted.html"
          mime="text/html"
          disabled={!output}
        />
        <ResetButton onClick={reset} variant="ghost" />
      </div>
    </div>
  );
}
