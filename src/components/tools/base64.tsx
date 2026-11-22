"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
import { useI18n } from "@/lib/i18n/i18n-context";
import { CopyButton } from "@/components/tool/copy-button";
import { DownloadButton } from "@/components/tool/download-button";
import { ResetButton } from "@/components/tool/action-buttons";
import { ErrorMessage, EmptyState } from "@/components/tool/states";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ShieldCheck } from "lucide-react";

type Mode = "encode" | "decode";

/**
 * Unicode-aware Base64 encoder.
 * Uses TextEncoder to get UTF-8 bytes, then btoa on the binary string.
 */
function encodeBase64(text: string): string {
  const bytes = new TextEncoder().encode(text);
  let binary = "";
  const chunkSize = 0x8000; // avoid call stack limits on large inputs
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode(...chunk);
  }
  return btoa(binary);
}

/**
 * Unicode-aware Base64 decoder.
 * Decodes atob to a binary string, then re-interprets as UTF-8 via TextDecoder.
 */
function decodeBase64(input: string): string {
  const cleaned = input.trim().replace(/\s+/g, "");
  const binary = atob(cleaned);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new TextDecoder("utf-8", { fatal: false }).decode(bytes);
}

interface ComputedResult {
  output: string;
  error: string | null;
}

export function Base64Tool() {
  const { t } = useI18n();
  const [mode, setMode] = useState<Mode>("encode");
  const [input, setInput] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Output is derived from input + mode, computed on demand so the user can
  // toggle modes and switch inputs freely without re-clicking a button.
  const { output } = useMemo<ComputedResult>(() => {
    if (!input) {
      return { output: "", error: null };
    }
    try {
      const result =
        mode === "encode" ? encodeBase64(input) : decodeBase64(input);
      return { output: result, error: null };
    } catch (err) {
      return {
        output: "",
        error:
          mode === "decode"
            ? t("errors.invalidBase64")
            : t("errors.generic", {
                message: err instanceof Error ? err.message : String(err),
              }),
      };
    }
  }, [input, mode, t]);

  // Sync error to state so <ErrorMessage> can render outside the memo.
  useEffect(() => {
    setError(error);
  }, [error]);

  const handleModeChange = useCallback((next: string) => {
    setMode(next as Mode);
  }, []);

  const reset = useCallback(() => {
    setInput("");
    setError(null);
    setMode("encode");
  }, []);

  return (
    <div className="space-y-4">
      {/* Mode toggle */}
      <div className="flex flex-wrap items-center gap-3">
        <Tabs value={mode} onValueChange={handleModeChange}>
          <TabsList>
            <TabsTrigger value="encode">{t("tools.base64.encode")}</TabsTrigger>
            <TabsTrigger value="decode">{t("tools.base64.decode")}</TabsTrigger>
          </TabsList>
        </Tabs>
        <span className="text-xs text-muted-foreground inline-flex items-center gap-1.5">
          <ShieldCheck className="h-3.5 w-3.5" />
          {t("common.clientSideOnly")}
        </span>
      </div>

      {error && <ErrorMessage message={error} />}

      {/* Two-column layout */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Input column */}
        <div className="space-y-2">
          <Label
            htmlFor="base64-input"
            className="text-xs text-muted-foreground"
          >
            {t("tools.base64.input")}
          </Label>
          <Textarea
            id="base64-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={t("tools.base64.inputPlaceholder")}
            className="font-mono text-sm min-h-[320px] resize-y"
            spellCheck={false}
            aria-label={t("tools.base64.input")}
          />
        </div>

        {/* Output column */}
        <div className="space-y-2">
          <Label
            htmlFor="base64-output"
            className="text-xs text-muted-foreground"
          >
            {t("tools.base64.output")}
          </Label>
          {output ? (
            <Textarea
              id="base64-output"
              value={output}
              readOnly
              className="font-mono text-sm min-h-[320px] resize-y"
              spellCheck={false}
              aria-label={t("tools.base64.output")}
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
          filename={
            mode === "encode" ? "encoded-base64.txt" : "decoded-base64.txt"
          }
          mime="text/plain"
          disabled={!output}
        />
        <ResetButton onClick={reset} variant="ghost" />
      </div>

      <p className="text-xs text-muted-foreground">
        {t("common.privacyNote")}
      </p>
    </div>
  );
}
