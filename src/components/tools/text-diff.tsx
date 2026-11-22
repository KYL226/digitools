"use client";

import { useState, useMemo, useCallback } from "react";
import { useI18n } from "@/lib/i18n/i18n-context";
import { CopyButton } from "@/components/tool/copy-button";
import { ClearButton } from "@/components/tool/action-buttons";
import { EmptyState } from "@/components/tool/states";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { GitCompareArrows, Plus, Minus } from "lucide-react";

type DiffOp = "equal" | "added" | "removed";

interface DiffLine {
  op: DiffOp;
  text: string;
  /** original index in either source array (for equal/removed/added) */
  aIndex?: number;
  bIndex?: number;
}

/**
 * Compute the LCS table of two string arrays.
 * Returns a (m+1) x (n+1) DP table where dp[i][j] is the LCS length of
 * a[0..i) and b[0..j).
 */
function lcsTable(a: string[], b: string[]): number[][] {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () =>
    new Array(n + 1).fill(0)
  );
  for (let i = m - 1; i >= 0; i--) {
    for (let j = n - 1; j >= 0; j--) {
      if (a[i] === b[j]) {
        dp[i][j] = dp[i + 1][j + 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i + 1][j], dp[i][j + 1]);
      }
    }
  }
  return dp;
}

/**
 * Walk the LCS table to produce a line-based diff. Equal lines render once;
 * removed lines come from `a`, added lines from `b`.
 */
function diffLines(a: string[], b: string[]): DiffLine[] {
  const dp = lcsTable(a, b);
  const result: DiffLine[] = [];
  let i = 0;
  let j = 0;
  const m = a.length;
  const n = b.length;
  while (i < m && j < n) {
    if (a[i] === b[j]) {
      result.push({ op: "equal", text: a[i], aIndex: i, bIndex: j });
      i++;
      j++;
    } else if (dp[i + 1][j] >= dp[i][j + 1]) {
      result.push({ op: "removed", text: a[i], aIndex: i });
      i++;
    } else {
      result.push({ op: "added", text: b[j], bIndex: j });
      j++;
    }
  }
  while (i < m) {
    result.push({ op: "removed", text: a[i], aIndex: i });
    i++;
  }
  while (j < n) {
    result.push({ op: "added", text: b[j], bIndex: j });
    j++;
  }
  return result;
}

/**
 * Normalise a line per the active options for the comparison itself — but
 * always render the original text in the UI.
 */
function normaliseLine(line: string, ignoreCase: boolean, ignoreWs: boolean): string {
  let out = line;
  if (ignoreWs) {
    out = out.replace(/\s+/g, " ").trim();
  }
  if (ignoreCase) {
    out = out.toLowerCase();
  }
  return out;
}

interface DiffStats {
  additions: number;
  deletions: number;
  unchanged: number;
}

export function TextDiff() {
  const { t } = useI18n();
  const [original, setOriginal] = useState("");
  const [changed, setChanged] = useState("");
  const [ignoreCase, setIgnoreCase] = useState(false);
  const [ignoreWhitespace, setIgnoreWhitespace] = useState(false);

  const { diff, stats, diffText } = useMemo(() => {
    const a = original.split("\n");
    const b = changed.split("\n");
    const aNorm = a.map((l) => normaliseLine(l, ignoreCase, ignoreWhitespace));
    const bNorm = b.map((l) => normaliseLine(l, ignoreCase, ignoreWhitespace));
    const result = diffLines(aNorm, bNorm);
    // Replace the normalised text with the original text for rendering
    const rendered: DiffLine[] = result.map((d, idx) => {
      if (d.op === "added") return { ...d, text: b[d.bIndex ?? idx] ?? d.text };
      if (d.op === "removed") return { ...d, text: a[d.aIndex ?? idx] ?? d.text };
      // equal: prefer original
      return { ...d, text: a[d.aIndex ?? idx] ?? d.text };
    });
    const stats: DiffStats = {
      additions: rendered.filter((d) => d.op === "added").length,
      deletions: rendered.filter((d) => d.op === "removed").length,
      unchanged: rendered.filter((d) => d.op === "equal").length,
    };
    const diffText = rendered
      .map((d) => {
        const prefix = d.op === "added" ? "+ " : d.op === "removed" ? "- " : "  ";
        return `${prefix}${d.text}`;
      })
      .join("\n");
    return { diff: rendered, stats, diffText };
  }, [original, changed, ignoreCase, ignoreWhitespace]);

  const reset = useCallback(() => {
    setOriginal("");
    setChanged("");
  }, []);

  const hasInput = Boolean(original.trim() || changed.trim());

  return (
    <div className="space-y-4">
      {/* Options row */}
      <div className="flex flex-wrap items-center gap-4">
        <label
          htmlFor="diff-ignore-case"
          className="flex items-center gap-2 cursor-pointer text-xs select-none"
        >
          <Checkbox
            id="diff-ignore-case"
            checked={ignoreCase}
            onCheckedChange={(v) => setIgnoreCase(v === true)}
          />
          <span>{t("tools.text-diff.ignoreCase")}</span>
        </label>
        <label
          htmlFor="diff-ignore-ws"
          className="flex items-center gap-2 cursor-pointer text-xs select-none"
        >
          <Checkbox
            id="diff-ignore-ws"
            checked={ignoreWhitespace}
            onCheckedChange={(v) => setIgnoreWhitespace(v === true)}
          />
          <span>{t("tools.text-diff.ignoreWhitespace")}</span>
        </label>
        <div className="ml-auto flex flex-wrap items-center gap-2">
          <Badge variant="outline" className="gap-1 text-emerald-700 dark:text-emerald-400">
            <Plus className="h-3 w-3" />
            {stats.additions} {t("tools.text-diff.added")}
          </Badge>
          <Badge variant="outline" className="gap-1 text-red-700 dark:text-red-400">
            <Minus className="h-3 w-3" />
            {stats.deletions} {t("tools.text-diff.removed")}
          </Badge>
        </div>
      </div>

      {/* Two-column input */}
      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label
            htmlFor="diff-original"
            className="text-xs text-muted-foreground"
          >
            {t("tools.text-diff.original")}
          </Label>
          <Textarea
            id="diff-original"
            value={original}
            onChange={(e) => setOriginal(e.target.value)}
            placeholder={t("tools.text-diff.originalPlaceholder")}
            className="font-mono text-sm min-h-[240px] resize-y"
            spellCheck={false}
            aria-label={t("tools.text-diff.original")}
          />
        </div>
        <div className="space-y-2">
          <Label
            htmlFor="diff-changed"
            className="text-xs text-muted-foreground"
          >
            {t("tools.text-diff.changed")}
          </Label>
          <Textarea
            id="diff-changed"
            value={changed}
            onChange={(e) => setChanged(e.target.value)}
            placeholder={t("tools.text-diff.changedPlaceholder")}
            className="font-mono text-sm min-h-[240px] resize-y"
            spellCheck={false}
            aria-label={t("tools.text-diff.changed")}
          />
        </div>
      </div>

      {/* Diff output */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-xs text-muted-foreground flex items-center gap-1.5">
            <GitCompareArrows className="h-3.5 w-3.5" />
            {t("tools.text-diff.output")}
          </Label>
          <CopyButton value={diffText} disabled={!hasInput} size="sm" />
        </div>
        {hasInput ? (
          <div className="min-h-[200px] max-h-[480px] overflow-y-auto rounded-md border border-border bg-background font-mono text-xs">
            <ul className="divide-y divide-border/40">
              {diff.map((line, i) => (
                <li
                  key={i}
                  className={
                    line.op === "added"
                      ? "flex gap-2 px-3 py-0.5 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                      : line.op === "removed"
                        ? "flex gap-2 px-3 py-0.5 bg-red-500/10 text-red-700 dark:text-red-300"
                        : "flex gap-2 px-3 py-0.5 text-muted-foreground"
                  }
                >
                  <span className="select-none w-4 text-center shrink-0">
                    {line.op === "added" ? "+" : line.op === "removed" ? "-" : " "}
                  </span>
                  <span className="whitespace-pre-wrap break-all">{line.text}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <div className="flex min-h-[200px] items-center justify-center rounded-md border border-dashed">
            <EmptyState />
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex flex-wrap items-center gap-2 mt-3">
        <ClearButton onClick={reset} variant="ghost" />
      </div>

      <p className="text-xs text-muted-foreground">
        {t("common.privacyNote")}
      </p>
    </div>
  );
}
