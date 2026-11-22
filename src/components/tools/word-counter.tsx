"use client";

import { useState, useMemo } from "react";
import { useI18n } from "@/lib/i18n/i18n-context";
import { ClearButton } from "@/components/tool/action-buttons";
import { EmptyState } from "@/components/tool/states";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import {
  Type,
  Hash,
  AlignLeft,
  Pilcrow,
  BookOpen,
  Clock,
} from "lucide-react";

interface TextStats {
  words: number;
  characters: number;
  charactersNoSpaces: number;
  lines: number;
  paragraphs: number;
  sentences: number;
  readingTimeMin: number;
  readingTimeSec: number;
}

const READING_WPM = 200;

function computeStats(input: string): TextStats {
  if (!input) {
    return {
      words: 0,
      characters: 0,
      charactersNoSpaces: 0,
      lines: 0,
      paragraphs: 0,
      sentences: 0,
      readingTimeMin: 0,
      readingTimeSec: 0,
    };
  }
  const characters = input.length;
  const charactersNoSpaces = input.replace(/\s/g, "").length;
  const words = (input.trim().match(/\S+/g) ?? []).length;
  const lines = input === "" ? 0 : input.split("\n").length;

  // Paragraphs: blocks separated by one or more blank lines
  const paragraphs = input
    .split(/\n\s*\n+/)
    .map((p) => p.trim())
    .filter(Boolean).length;

  // Sentences: split on `.`, `!`, `?` followed by whitespace or end
  const sentenceMatches = input.match(/[^.!?]+[.!?]+(\s|$)|[^.!?]+$/g);
  const sentences = sentenceMatches
    ? sentenceMatches.filter((s) => s.trim().length > 0).length
    : 0;

  const totalSeconds = Math.round((words / READING_WPM) * 60);
  const readingTimeMin = Math.floor(totalSeconds / 60);
  const readingTimeSec = totalSeconds % 60;

  return {
    words,
    characters,
    charactersNoSpaces,
    lines,
    paragraphs,
    sentences,
    readingTimeMin,
    readingTimeSec,
  };
}

interface StatCardDef {
  key:
    | "words"
    | "characters"
    | "charactersNoSpaces"
    | "lines"
    | "paragraphs"
    | "sentences";
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  value: number;
}

export function WordCounter() {
  const { t } = useI18n();
  const [input, setInput] = useState("");

  const stats = useMemo(() => computeStats(input), [input]);

  const statCards: StatCardDef[] = [
    { key: "words", label: t("tools.word-counter.words"), icon: Type, value: stats.words },
    { key: "characters", label: t("tools.word-counter.characters"), icon: Hash, value: stats.characters },
    { key: "charactersNoSpaces", label: t("tools.word-counter.charactersNoSpaces"), icon: Hash, value: stats.charactersNoSpaces },
    { key: "lines", label: t("tools.word-counter.lines"), icon: AlignLeft, value: stats.lines },
    { key: "paragraphs", label: t("tools.word-counter.paragraphs"), icon: Pilcrow, value: stats.paragraphs },
    { key: "sentences", label: t("tools.word-counter.sentences"), icon: BookOpen, value: stats.sentences },
  ];

  const readingTimeLabel = `${stats.readingTimeMin} ${t("tools.word-counter.minutes")} ${stats.readingTimeSec} ${t("tools.word-counter.seconds")}`;

  const handleClear = () => setInput("");

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label
          htmlFor="word-input"
          className="text-xs text-muted-foreground"
        >
          {t("tools.word-counter.input")}
        </Label>
        <Textarea
          id="word-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={t("tools.word-counter.inputPlaceholder")}
          className="font-mono text-sm min-h-[220px] resize-y"
          spellCheck={false}
          aria-label={t("tools.word-counter.input")}
        />
      </div>

      {/* Stat grid: 2 / 3 / 6 cols */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {statCards.map((s) => {
          const Icon = s.icon;
          return (
            <Card
              key={s.key}
              className="overflow-hidden transition-shadow hover:shadow-md"
            >
              <CardContent className="p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="grid place-items-center h-8 w-8 rounded-md bg-primary/10 text-primary">
                    <Icon className="h-4 w-4" />
                  </div>
                </div>
                <div>
                  <div className="text-2xl font-bold tabular-nums">
                    {s.value.toLocaleString()}
                  </div>
                  <div className="text-[11px] uppercase tracking-wide text-muted-foreground leading-tight mt-1">
                    {s.label}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Reading time full-width card */}
      <Card className="overflow-hidden">
        <CardContent className="p-4 flex items-center gap-3">
          <div className="grid place-items-center h-10 w-10 rounded-md bg-primary/10 text-primary shrink-0">
            <Clock className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs uppercase tracking-wide text-muted-foreground">
              {t("tools.word-counter.readingTime")}
            </div>
            <div className="text-lg font-semibold tabular-nums">
              {readingTimeLabel}
            </div>
          </div>
          {input.trim() ? null : (
            <span className="text-xs text-muted-foreground">
              {t("common.startByTyping")}
            </span>
          )}
        </CardContent>
      </Card>

      <div className="flex flex-wrap items-center gap-2 mt-1">
        <ClearButton onClick={handleClear} variant="ghost" />
      </div>

      {!input.trim() && (
        <div className="flex min-h-[120px] items-center justify-center rounded-md border border-dashed">
          <EmptyState />
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        {t("common.privacyNote")}
      </p>
    </div>
  );
}
