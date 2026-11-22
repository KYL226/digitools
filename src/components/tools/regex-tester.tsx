"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { useI18n } from "@/lib/i18n/i18n-context";
import { CopyButton } from "@/components/tool/copy-button";
import { ResetButton } from "@/components/tool/action-buttons";
import { ErrorMessage, EmptyState } from "@/components/tool/states";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  ScrollArea,
} from "@/components/ui/scroll-area";
import { Search, Hash, ListChecks } from "lucide-react";

interface FlagDef {
  code: string;
  label: string;
  description: string;
}

const FLAGS: FlagDef[] = [
  { code: "g", label: "g", description: "global" },
  { code: "i", label: "i", description: "ignore case" },
  { code: "m", label: "m", description: "multiline" },
  { code: "s", label: "s", description: "dotall" },
  { code: "u", label: "u", description: "unicode" },
  { code: "y", label: "y", description: "sticky" },
];

interface RegexMatch {
  match: string;
  index: number;
  groups: (string | undefined)[];
}

interface Segment {
  text: string;
  isMatch: boolean;
  match?: RegexMatch;
}

interface RegexState {
  matches: RegexMatch[];
  segments: Segment[];
  error: string | null;
}

/**
 * Compute matches + segments (for highlight rendering) from a pattern and
 * test string. Throws for invalid patterns so the caller can show an error.
 */
function computeRegex(
  pattern: string,
  flagString: string,
  testString: string
): RegexState {
  if (!pattern) {
    return { matches: [], segments: [], error: null };
  }
  let re: RegExp;
  try {
    re = new RegExp(pattern, flagString);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { matches: [], segments: [], error: msg };
  }

  const matches: RegexMatch[] = [];
  const segments: Segment[] = [];

  if (re.global) {
    // Use matchAll to get every match (including capture groups)
    let lastEnd = 0;
    for (const m of testString.matchAll(re)) {
      const idx = m.index ?? 0;
      const matched =
        typeof m[0] === "string" ? (m[0] as string) : "";
      // Push the preceding text segment
      if (idx > lastEnd) {
        segments.push({
          text: testString.slice(lastEnd, idx),
          isMatch: false,
        });
      }
      const groups = m.length > 1
        ? Array.from(m).slice(1).map((g) => (typeof g === "string" ? g : undefined))
        : [];
      const matchInfo: RegexMatch = { match: matched, index: idx, groups };
      segments.push({ text: matched, isMatch: true, match: matchInfo });
      matches.push(matchInfo);
      lastEnd = idx + matched.length;
      // Guard against zero-width matches (e.g. `/a*/g`) which would loop
      if (matched.length === 0) {
        // advance by 1 to avoid infinite loop
        if (lastEnd < testString.length) {
          segments.push({
            text: testString[lastEnd],
            isMatch: false,
          });
          lastEnd += 1;
        }
      }
    }
    if (lastEnd < testString.length) {
      segments.push({
        text: testString.slice(lastEnd),
        isMatch: false,
      });
    }
  } else {
    const m = re.exec(testString);
    if (m) {
      const idx = m.index;
      const matched = typeof m[0] === "string" ? (m[0] as string) : "";
      if (idx > 0) {
        segments.push({ text: testString.slice(0, idx), isMatch: false });
      }
      const groups =
        m.length > 1
          ? Array.from(m).slice(1).map((g) => (typeof g === "string" ? g : undefined))
          : [];
      const matchInfo: RegexMatch = { match: matched, index: idx, groups };
      segments.push({ text: matched, isMatch: true, match: matchInfo });
      matches.push(matchInfo);
      if (idx + matched.length < testString.length) {
        segments.push({
          text: testString.slice(idx + matched.length),
          isMatch: false,
        });
      }
    }
  }

  return { matches, segments, error: null };
}

export function RegexTester() {
  const { t } = useI18n();
  const [pattern, setPattern] = useState("");
  const [testString, setTestString] = useState("");
  const [flags, setFlags] = useState<Record<string, boolean>>({
    g: true,
    i: false,
    m: false,
    s: false,
    u: false,
    y: false,
  });
  const [error, setError] = useState<string | null>(null);

  const flagString = useMemo(
    () => FLAGS.filter((f) => flags[f.code]).map((f) => f.code).join(""),
    [flags]
  );

  const { matches, segments } = useMemo<RegexState>(() => {
    return computeRegex(pattern, flagString, testString);
  }, [pattern, flagString, testString]);

  // If the regex compile fails, surface the error via <ErrorMessage>
  const computedError = useMemo(() => {
    if (!pattern.trim()) return null;
    try {
      // Re-attempt to compile; computeRegex swallows the error so we can
      // safely still render matches with whatever we got
      new RegExp(pattern, flagString);
      return null;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      return t("errors.invalidRegex", { message: msg });
    }
  }, [pattern, flagString, t]);

  useEffect(() => {
    setError(computedError);
  }, [computedError]);

  const toggleFlag = useCallback((code: string) => {
    setFlags((prev) => ({ ...prev, [code]: !prev[code] }));
  }, []);

  const reset = useCallback(() => {
    setPattern("");
    setTestString("");
    setFlags({ g: true, i: false, m: false, s: false, u: false, y: false });
    setError(null);
  }, []);

  return (
    <div className="space-y-4">
      {/* Top: pattern + flags */}
      <div className="space-y-3">
        <div className="space-y-1.5">
          <Label
            htmlFor="regex-pattern"
            className="text-xs text-muted-foreground flex items-center gap-1.5"
          >
            <Search className="h-3.5 w-3.5" />
            {t("tools.regex-tester.pattern")}
          </Label>
          <div className="flex items-stretch gap-2">
            <div className="flex items-center justify-center rounded-md border border-input bg-muted px-3 font-mono text-sm text-muted-foreground">
              /
            </div>
            <Input
              id="regex-pattern"
              value={pattern}
              onChange={(e) => setPattern(e.target.value)}
              placeholder={t("tools.regex-tester.patternPlaceholder")}
              className="font-mono text-sm flex-1"
              spellCheck={false}
              aria-label={t("tools.regex-tester.pattern")}
            />
            <div className="flex items-center justify-center rounded-md border border-input bg-muted px-3 font-mono text-sm text-muted-foreground">
              /{flagString}
            </div>
            <CopyButton value={pattern ? `/${pattern}/${flagString}` : ""} disabled={!pattern} />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">
            {t("tools.regex-tester.flags")}
          </Label>
          <div className="flex flex-wrap gap-3">
            {FLAGS.map((f) => (
              <label
                key={f.code}
                className="flex items-center gap-1.5 cursor-pointer text-xs select-none"
                htmlFor={`flag-${f.code}`}
              >
                <Checkbox
                  id={`flag-${f.code}`}
                  checked={!!flags[f.code]}
                  onCheckedChange={() => toggleFlag(f.code)}
                />
                <span className="font-mono font-semibold">{f.label}</span>
                <span className="text-muted-foreground">{f.description}</span>
              </label>
            ))}
          </div>
        </div>
      </div>

      {error && <ErrorMessage message={error} />}

      {/* Bottom: test string | results */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Test string */}
        <div className="space-y-2">
          <Label
            htmlFor="regex-test"
            className="text-xs text-muted-foreground"
          >
            {t("tools.regex-tester.testString")}
          </Label>
          <Textarea
            id="regex-test"
            value={testString}
            onChange={(e) => setTestString(e.target.value)}
            placeholder={t("tools.regex-tester.testStringPlaceholder")}
            className="font-mono text-sm min-h-[260px] resize-y"
            spellCheck={false}
            aria-label={t("tools.regex-tester.testString")}
          />
        </div>

        {/* Results */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-xs text-muted-foreground flex items-center gap-1.5">
              <ListChecks className="h-3.5 w-3.5" />
              {t("tools.regex-tester.matches")}
            </Label>
            <Badge variant={matches.length ? "default" : "secondary"}>
              {matches.length
                ? t("tools.regex-tester.matchCount", { count: matches.length })
                : t("tools.regex-tester.noMatches")}
            </Badge>
          </div>

          {/* Highlight view */}
          {testString ? (
            <div className="min-h-[120px] rounded-md border border-border bg-background p-3 font-mono text-sm whitespace-pre-wrap break-words leading-relaxed">
              {segments.map((seg, i) =>
                seg.isMatch ? (
                  <mark
                    key={i}
                    className="bg-yellow-300/60 dark:bg-yellow-500/40 rounded px-0.5"
                  >
                    {seg.text}
                  </mark>
                ) : (
                  <span key={i}>{seg.text}</span>
                )
              )}
            </div>
          ) : (
            <div className="flex min-h-[120px] items-center justify-center rounded-md border border-dashed">
              <EmptyState />
            </div>
          )}

          {/* Matches list */}
          {matches.length > 0 && (
            <ScrollArea className="h-[140px] rounded-md border border-border bg-background">
              <ul className="divide-y divide-border">
                {matches.map((m, i) => (
                  <li key={i} className="px-3 py-2 text-xs space-y-1">
                    <div className="flex items-start gap-2">
                      <span className="inline-grid place-items-center min-w-[1.75rem] h-5 rounded bg-primary/10 text-primary text-[10px] font-mono font-semibold mt-0.5">
                        {i + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="font-mono break-all">
                          <span className="text-muted-foreground">@</span>
                          <span className="inline-flex items-center gap-1">
                            <Hash className="h-3 w-3 text-muted-foreground" />
                            {m.index}
                          </span>
                          <span className="text-muted-foreground"> · </span>
                          <span className="text-foreground break-all">{m.match || "∅"}</span>
                        </div>
                        {m.groups.length > 0 && (
                          <div className="mt-1 space-y-0.5">
                            <div className="text-[10px] uppercase tracking-wide text-muted-foreground">
                              {t("tools.regex-tester.groups")}
                            </div>
                            {m.groups.map((g, gi) => (
                              <div
                                key={gi}
                                className="font-mono break-all text-muted-foreground"
                              >
                                <span className="text-primary">${gi + 1}</span>
                                <span className="mx-1">=</span>
                                <span>{g ?? "∅"}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </ScrollArea>
          )}
        </div>
      </div>

      {/* Action row */}
      <div className="flex flex-wrap items-center gap-2 mt-3">
        <ResetButton onClick={reset} variant="ghost" />
      </div>

      <p className="text-xs text-muted-foreground">
        {t("common.privacyNote")}
      </p>
    </div>
  );
}
