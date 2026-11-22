"use client";

import { useState, useCallback, useMemo } from "react";
import { useI18n } from "@/lib/i18n/i18n-context";
import { CopyButton } from "@/components/tool/copy-button";
import { DownloadButton } from "@/components/tool/download-button";
import { ResetButton, ClearButton } from "@/components/tool/action-buttons";
import { ErrorMessage, EmptyState } from "@/components/tool/states";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ShieldCheck, Sparkles, Wand2, FileCode } from "lucide-react";
import { cn } from "@/lib/utils";

function byteCount(s: string): number {
  return new Blob([s]).size;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

/**
 * Regex-based SVG optimizer.
 *
 * Steps:
 * 1. Strip XML comments `<!-- ... -->`
 * 2. Strip `<?xml ... ?>` declaration
 * 3. Strip DOCTYPE
 * 4. Strip `<metadata>` blocks and `sodipodi:`/`inkscape:` elements + namespaces
 * 5. Strip `id="..."` attributes on non-<svg> tags
 * 6. Collapse `>\s+<` → `><`
 * 7. Trim leading/trailing whitespace per line
 * 8. Strip empty attributes (`attr=""`)
 * 9. Strip default values (`stroke="none"`, `fill="black"`, etc.)
 * 10. Collapse 2+ spaces inside tags, drop empty newlines.
 */
function optimizeSvg(input: string): string {
  let out = input;

  // 1. XML comments (non-greedy, multi-line)
  out = out.replace(/<!--[\s\S]*?-->/g, "");

  // 2. XML declaration
  out = out.replace(/<\?xml[\s\S]*?\?>/gi, "");

  // 3. DOCTYPE
  out = out.replace(/<!DOCTYPE[^>]*>/gi, "");

  // 4a. <metadata>...</metadata>
  out = out.replace(/<metadata[\s\S]*?<\/metadata>/gi, "");

  // 4b. sodipodi: / inkscape: elements (open, close, or self-closing)
  out = out.replace(/<\/?(sodipodi|inkscape):[^>]*\/?>/gi, "");

  // 4c. sodipodi/inkscape namespace declarations on the root <svg> tag
  out = out.replace(/\s+xmlns:(sodipodi|inkscape)="[^"]*"/gi, "");

  // 5. id attributes on any tag whose name is NOT "svg"
  //    Match `<tagname ... id="..." ...>` and remove only the ` id="..."`.
  //    Use a capturing group for the prefix so we can preserve it.
  out = out.replace(
    /(<(?!svg[\s>/])[\w:-]+[^>]*?)\s+id="[^"]*"/gi,
    "$1"
  );
  out = out.replace(
    /(<(?!svg[\s>/])[\w:-]+[^>]*?)\s+id='[^']*'/gi,
    "$1"
  );

  // 8. Empty attributes (`attr=""`)
  out = out.replace(/\s+[\w:-]+=""/g, " ");
  out = out.replace(/\s+[\w:-]+=''/g, " ");

  // 9. Default values
  out = out.replace(/\s+stroke="none"/gi, " ");
  out = out.replace(/\s+fill="black"/gi, " ");
  out = out.replace(/\s+fill-rule="nonzero"/gi, " ");
  out = out.replace(/\s+clip-rule="nonzero"/gi, " ");
  out = out.replace(/\s+fill-opacity="1"/gi, " ");
  out = out.replace(/\s+stroke-opacity="1"/gi, " ");
  out = out.replace(/\s+opacity="1"/gi, " ");
  out = out.replace(/\s+stroke-width="1"/gi, " ");

  // 7. Trim per line
  out = out
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .join("\n");

  // 6. Collapse whitespace between tags
  out = out.replace(/>\s+</g, "><");

  // Collapse 2+ spaces inside tags
  out = out.replace(/[ \t]{2,}/g, " ");

  // Collapse newlines (left from line join)
  out = out.replace(/\n{2,}/g, "\n");

  // Tidy leftover whitespace before `>` in tags
  out = out.replace(/\s+>/g, ">");

  return out.trim();
}

const EXAMPLE_SVG = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:sodipodi="http://sodipodi.sourceforge.net/DTD/sodipodi-0.0.dtd" xmlns:inkscape="http://www.inkscape.org/namespaces/inkscape" width="100" height="100">
  <!-- Created with an external editor -->
  <metadata id="metadata1">
    <rdf:RDF><cc:Work rdf:about=""><dc:format>image/svg+xml</dc:format></cc:Work></rdf:RDF>
  </metadata>
  <sodipodi:namedview id="base" pagecolor="#ffffff" />
  <g id="layer1" stroke="none" fill="black">
    <circle id="c1" cx="50" cy="50" r="40" fill="" />
    <rect id="r1" x="10" y="10" width="20" height="20" opacity="1" />
  </g>
</svg>`;

export function SvgOptimizer() {
  const { t } = useI18n();
  const [input, setInput] = useState<string>("");
  const [output, setOutput] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [touched, setTouched] = useState<boolean>(false);

  // When input becomes empty, clear derived output + error inline (avoid setState-in-effect).
  const onInputChange = (val: string) => {
    setInput(val);
    if (val.trim() === "") {
      setOutput("");
      setError(null);
      setTouched(false);
    }
  };

  const handleOptimize = useCallback(() => {
    if (input.trim() === "") {
      setOutput("");
      setError(null);
      return;
    }
    try {
      const result = optimizeSvg(input);
      if (!result) {
        setError(t("errors.generic"));
        setOutput("");
        return;
      }
      // Basic sanity check — must still look like an SVG.
      if (!/<svg[\s>]/i.test(result)) {
        setError(t("errors.unsupportedFormat", { format: "SVG" }));
        setOutput("");
        return;
      }
      setOutput(result);
      setError(null);
      setTouched(true);
    } catch (err) {
      setError(
        t("errors.generic", {
          message: err instanceof Error ? err.message : String(err),
        })
      );
      setOutput("");
    }
  }, [input, t]);

  const handleReset = useCallback(() => {
    setInput("");
    setOutput("");
    setError(null);
    setTouched(false);
  }, []);

  const handleClear = useCallback(() => {
    setInput("");
    setOutput("");
    setError(null);
  }, []);

  const originalSize = useMemo(() => byteCount(input), [input]);
  const optimizedSize = useMemo(() => byteCount(output), [output]);
  const reduction =
    originalSize > 0 && optimizedSize > 0
      ? Math.max(0, Math.round((1 - optimizedSize / originalSize) * 100))
      : 0;

  const hasOutput = output.length > 0;

  return (
    <div className="space-y-4">
      {/* Controls row */}
      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          onClick={handleOptimize}
          disabled={!input.trim()}
          className="gap-1.5"
        >
          <Wand2 className="h-4 w-4" />
          {t("tools.svg-optimizer.optimize")}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => onInputChange(EXAMPLE_SVG)}
          className="gap-1.5"
        >
          <FileCode className="h-4 w-4" />
          {t("common.loadExample")}
        </Button>
        <div className="ml-auto flex items-center gap-2">
          {hasOutput && (
            <Badge
              variant="secondary"
              className="gap-1 bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
            >
              <Sparkles className="h-3 w-3" />
              {t("common.reduceBy")} {reduction}%
            </Badge>
          )}
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {/* Input */}
        <div className="space-y-2">
          <Label htmlFor="svg-in" className="text-xs text-muted-foreground">
            {t("tools.svg-optimizer.input")}
          </Label>
          <Textarea
            id="svg-in"
            value={input}
            onChange={(e) => onInputChange(e.target.value)}
            placeholder={t("tools.svg-optimizer.inputPlaceholder")}
            className="font-mono text-xs min-h-[360px] resize-y"
            spellCheck={false}
            aria-label={t("tools.svg-optimizer.input")}
          />
          <p className="text-xs text-muted-foreground">
            {t("tools.svg-optimizer.originalSize")}:{" "}
            <span className="font-mono">{formatBytes(originalSize)}</span>
          </p>
        </div>

        {/* Output */}
        <div className="space-y-2">
          <Label htmlFor="svg-out" className="text-xs text-muted-foreground">
            {t("tools.svg-optimizer.output")}
          </Label>
          {hasOutput ? (
            <Textarea
              id="svg-out"
              value={output}
              readOnly
              className="font-mono text-xs min-h-[360px] resize-y"
              spellCheck={false}
              aria-label={t("tools.svg-optimizer.output")}
            />
          ) : (
            <div
              className={cn(
                "flex min-h-[360px] items-center justify-center rounded-md border border-dashed bg-muted/30 p-4"
              )}
            >
              <EmptyState icon={FileCode} />
            </div>
          )}
          <p className="text-xs text-muted-foreground">
            {t("tools.svg-optimizer.optimizedSize")}:{" "}
            <span className="font-mono">
              {hasOutput ? formatBytes(optimizedSize) : "—"}
            </span>
          </p>
        </div>
      </div>

      {error && <ErrorMessage message={error} />}

      <Separator />

      <div className="flex flex-wrap items-center gap-2 mt-3">
        <DownloadButton
          data={output}
          filename="optimized.svg"
          mime="image/svg+xml"
          disabled={!hasOutput}
          variant="default"
          label={t("common.download")}
        />
        <CopyButton
          value={output}
          disabled={!hasOutput}
          label={t("common.copy")}
        />
        <ClearButton onClick={handleClear} disabled={!input && !output} />
        <ResetButton onClick={handleReset} variant="outline" disabled={!touched && !input} />
      </div>

      <p className="text-xs text-muted-foreground inline-flex items-center gap-1.5">
        <ShieldCheck className="h-3.5 w-3.5" />
        {t("common.privacyNote")} · {t("common.clientSideOnly")}
      </p>
    </div>
  );
}
