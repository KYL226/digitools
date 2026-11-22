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

/**
 * Keywords that should be followed by a space before `(` (control-flow
 * keywords). Other words (identifiers, `function`, `this`, `super`, etc.)
 * are treated as function-call expressions: no space before `(`.
 */
const SPACE_BEFORE_PAREN = new Set<string>([
  "if",
  "for",
  "while",
  "switch",
  "catch",
  "return",
  "typeof",
  "instanceof",
  "in",
  "of",
  "new",
  "delete",
  "void",
  "await",
  "yield",
  "throw",
  "else",
  "do",
  "try",
  "finally",
  "case",
]);

const THREE_CHAR_OPS = ["===", "!==", "**=", ">>>", "<<=", ">>=", "&&=", "||=", "??="];
const TWO_CHAR_OPS = [
  "==", "!=", "<=", ">=", "&&", "||", "??", "=>",
  "+=", "-=", "*=", "/=", "%=", "**", "<<", ">>", "++", "--", "?.", "...",
];

type TokenType =
  | "string"
  | "template"
  | "line_comment"
  | "block_comment"
  | "number"
  | "ident"
  | "op"
  | "punct"
  | "ws";

interface Token {
  type: TokenType;
  value: string;
}

/** Regex-based JS tokenizer. Handles strings, template literals, comments,
 * numbers, identifiers, and multi-char operators. Not a full parser but
 * good enough for line-based prettifying. */
function tokenizeJs(input: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;
  while (i < input.length) {
    const c = input[i];

    // Whitespace
    if (/\s/.test(c)) {
      let j = i;
      while (j < input.length && /\s/.test(input[j])) j++;
      tokens.push({ type: "ws", value: input.slice(i, j) });
      i = j;
      continue;
    }

    // Line comment
    if (c === "/" && input[i + 1] === "/") {
      let j = i + 2;
      while (j < input.length && input[j] !== "\n") j++;
      tokens.push({ type: "line_comment", value: input.slice(i, j) });
      i = j;
      continue;
    }

    // Block comment
    if (c === "/" && input[i + 1] === "*") {
      let j = i + 2;
      while (j < input.length && !(input[j] === "*" && input[j + 1] === "/")) j++;
      j = Math.min(j + 2, input.length);
      tokens.push({ type: "block_comment", value: input.slice(i, j) });
      i = j;
      continue;
    }

    // String literal (single/double quote, with escape handling)
    if (c === '"' || c === "'") {
      const quote = c;
      let j = i + 1;
      while (j < input.length && input[j] !== quote) {
        if (input[j] === "\\" && j + 1 < input.length) j += 2;
        else j++;
      }
      j = Math.min(j + 1, input.length);
      tokens.push({ type: "string", value: input.slice(i, j) });
      i = j;
      continue;
    }

    // Template literal (backticks with ${...} interpolations)
    if (c === "`") {
      let j = i + 1;
      let exprDepth = 0;
      while (j < input.length) {
        if (input[j] === "\\" && j + 1 < input.length) {
          j += 2;
          continue;
        }
        // Skip nested strings inside ${...}
        if (exprDepth > 0 && (input[j] === '"' || input[j] === "'")) {
          const innerQuote = input[j];
          j++;
          while (j < input.length && input[j] !== innerQuote) {
            if (input[j] === "\\" && j + 1 < input.length) j += 2;
            else j++;
          }
          if (j < input.length) j++; // skip closing quote
          continue;
        }
        if (input[j] === "$" && input[j + 1] === "{") {
          exprDepth++;
          j += 2;
          continue;
        }
        if (input[j] === "{" && exprDepth > 0) {
          exprDepth++;
          j++;
          continue;
        }
        if (input[j] === "}" && exprDepth > 0) {
          exprDepth--;
          j++;
          continue;
        }
        if (input[j] === "`" && exprDepth === 0) {
          j++;
          break;
        }
        j++;
      }
      tokens.push({ type: "template", value: input.slice(i, j) });
      i = j;
      continue;
    }

    // Number
    if (/[0-9]/.test(c) || (c === "." && /[0-9]/.test(input[i + 1] ?? ""))) {
      let j = i;
      while (j < input.length && /[0-9a-fxA-FX._]/.test(input[j])) j++;
      tokens.push({ type: "number", value: input.slice(i, j) });
      i = j;
      continue;
    }

    // Identifier / keyword
    if (/[a-zA-Z_$]/.test(c)) {
      let j = i;
      while (j < input.length && /[a-zA-Z0-9_$]/.test(input[j])) j++;
      tokens.push({ type: "ident", value: input.slice(i, j) });
      i = j;
      continue;
    }

    // Multi-char operators
    const threeChar = input.slice(i, i + 3);
    if (THREE_CHAR_OPS.includes(threeChar)) {
      tokens.push({ type: "op", value: threeChar });
      i += 3;
      continue;
    }
    const twoChar = input.slice(i, i + 2);
    if (TWO_CHAR_OPS.includes(twoChar)) {
      tokens.push({ type: "op", value: twoChar });
      i += 2;
      continue;
    }

    // Single-char punctuation
    tokens.push({ type: "punct", value: c });
    i++;
  }
  return tokens;
}

/** Decide whether a space should be inserted between two adjacent tokens. */
function needsSpace(prev: string, curr: string): boolean {
  if (!prev || !curr) return false;
  const lastChar = prev[prev.length - 1];
  const firstChar = curr[0];

  // No space before these chars
  if (",);:?.!]}/".includes(firstChar)) return false;

  // No space after these chars
  if ("([.!?".includes(lastChar)) return false;

  // `(` after an identifier: no space unless it follows a control-flow
  // keyword like `if`, `for`, `while`, etc.
  if (firstChar === "(" && /[a-zA-Z0-9_$]/.test(lastChar)) {
    const m = prev.match(/[a-zA-Z_$][a-zA-Z0-9_$]*$/);
    const word = m ? m[0] : "";
    if (word && !SPACE_BEFORE_PAREN.has(word)) return false;
  }

  // `[` after identifier / `)` / `]` (index access): no space
  if (firstChar === "[" && /[a-zA-Z0-9_$)\]]/.test(lastChar)) {
    return false;
  }

  return true;
}

/** Simple regex-based JS prettifier. Tokenises, then re-emits with
 * line breaks after `;`, `{`, `}` and after comments, indenting by depth. */
export function beautifyJs(input: string, indentSize: number): string {
  const tokens = tokenizeJs(input).filter((t) => t.type !== "ws");
  if (tokens.length === 0) return "";

  const ind = (depth: number): string =>
    " ".repeat(Math.max(0, depth) * indentSize);

  const out: string[] = [];
  let depth = 0;
  let parenDepth = 0;
  let bracketDepth = 0;
  let line = "";

  const pushLine = (): void => {
    if (line.trim()) out.push(ind(depth) + line.trimEnd());
    line = "";
  };

  const append = (text: string): void => {
    if (line) {
      if (needsSpace(line, text)) line += " ";
    }
    line += text;
  };

  for (let k = 0; k < tokens.length; k++) {
    const tok = tokens[k];
    const next = tokens[k + 1];

    if (tok.type === "line_comment") {
      append(tok.value);
      pushLine();
      continue;
    }

    if (tok.type === "block_comment") {
      append(tok.value);
      pushLine();
      continue;
    }

    if (tok.value === "(") parenDepth++;
    if (tok.value === ")") parenDepth = Math.max(0, parenDepth - 1);
    if (tok.value === "[") bracketDepth++;
    if (tok.value === "]") bracketDepth = Math.max(0, bracketDepth - 1);

    if (tok.value === ";") {
      append(";");
      if (parenDepth === 0 && bracketDepth === 0) pushLine();
      continue;
    }

    if (tok.value === "{") {
      append("{");
      pushLine();
      depth++;
      continue;
    }

    if (tok.value === "}") {
      pushLine();
      if (depth > 0) depth--;
      line = "}";
      const nextVal = next?.value;
      if (
        nextVal &&
        (nextVal[0] === "." ||
          nextVal === ")" ||
          nextVal === "," ||
          nextVal === ";" ||
          nextVal === "]")
      ) {
        // keep `}` on the same line as the following token (chain / etc.)
      } else {
        pushLine();
      }
      continue;
    }

    append(tok.value);
  }

  if (line.trim()) pushLine();

  return out.join("\n");
}

export function JavascriptFormatter() {
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
      const result = beautifyJs(input, indent);
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
            htmlFor="js-indent"
            className="text-xs text-muted-foreground"
          >
            {t("tools.javascript-formatter.indent")}
          </Label>
          <Select
            value={String(indent)}
            onValueChange={(v) => setIndent(Number(v))}
          >
            <SelectTrigger id="js-indent" className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="2">2</SelectItem>
              <SelectItem value="4">4</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button onClick={format} className="gap-1.5">
            <Code2 className="h-4 w-4" />
            {t("tools.javascript-formatter.format")}
          </Button>
        </div>
      </div>

      {error && <ErrorMessage message={error} />}

      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label
            htmlFor="js-input"
            className="text-xs text-muted-foreground"
          >
            {t("tools.javascript-formatter.input")}
          </Label>
          <Textarea
            id="js-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={t("tools.javascript-formatter.inputPlaceholder")}
            className="font-mono text-sm min-h-[320px] resize-y"
            spellCheck={false}
            aria-label={t("tools.javascript-formatter.input")}
          />
        </div>

        <div className="space-y-2">
          <Label
            htmlFor="js-output"
            className="text-xs text-muted-foreground"
          >
            {t("tools.javascript-formatter.output")}
          </Label>
          {output ? (
            <Textarea
              id="js-output"
              value={output}
              readOnly
              className="font-mono text-sm min-h-[320px] resize-y"
              spellCheck={false}
              aria-label={t("tools.javascript-formatter.output")}
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
          filename="formatted.js"
          mime="text/javascript"
          disabled={!output}
        />
        <ResetButton onClick={reset} variant="ghost" />
      </div>
    </div>
  );
}
