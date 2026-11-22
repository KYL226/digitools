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
  Globe,
  Braces,
  Unlink,
  Link2,
} from "lucide-react";

type Action = "encode" | "encodeComponent" | "decode" | "decodeComponent";

export function UrlEncoder() {
  const { t } = useI18n();
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [error, setError] = useState<string | null>(null);

  const runAction = useCallback(
    (action: Action) => {
      if (!input) {
        setOutput("");
        setError(null);
        return;
      }
      try {
        let result: string;
        switch (action) {
          case "encode":
            result = encodeURI(input);
            break;
          case "encodeComponent":
            result = encodeURIComponent(input);
            break;
          case "decode":
            result = decodeURI(input);
            break;
          case "decodeComponent":
            result = decodeURIComponent(input);
            break;
          default:
            return;
        }
        setOutput(result);
        setError(null);
      } catch (err) {
        setOutput("");
        setError(
          t("errors.generic", {
            message: err instanceof Error ? err.message : String(err),
          })
        );
      }
    },
    [input, t]
  );

  const reset = useCallback(() => {
    setInput("");
    setOutput("");
    setError(null);
  }, []);

  return (
    <div className="space-y-4">
      {/* Action buttons row */}
      <div className="flex flex-wrap items-center gap-2">
        <Button onClick={() => runAction("encode")} className="gap-1.5">
          <Globe className="h-4 w-4" />
          {t("tools.url-encoder.encode")}
        </Button>
        <Button
          onClick={() => runAction("encodeComponent")}
          variant="secondary"
          className="gap-1.5"
        >
          <Braces className="h-4 w-4" />
          {t("tools.url-encoder.encodeComponent")}
        </Button>
        <Button
          onClick={() => runAction("decode")}
          variant="secondary"
          className="gap-1.5"
        >
          <Link2 className="h-4 w-4" />
          {t("tools.url-encoder.decode")}
        </Button>
        <Button
          onClick={() => runAction("decodeComponent")}
          variant="secondary"
          className="gap-1.5"
        >
          <Unlink className="h-4 w-4" />
          {t("tools.url-encoder.decodeComponent")}
        </Button>
      </div>

      {error && <ErrorMessage message={error} />}

      {/* Two-column layout */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Input column */}
        <div className="space-y-2">
          <Label
            htmlFor="url-input"
            className="text-xs text-muted-foreground"
          >
            {t("tools.url-encoder.input")}
          </Label>
          <Textarea
            id="url-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={t("tools.url-encoder.inputPlaceholder")}
            className="font-mono text-sm min-h-[320px] resize-y"
            spellCheck={false}
            aria-label={t("tools.url-encoder.input")}
          />
        </div>

        {/* Output column */}
        <div className="space-y-2">
          <Label
            htmlFor="url-output"
            className="text-xs text-muted-foreground"
          >
            {t("tools.url-encoder.output")}
          </Label>
          {output ? (
            <Textarea
              id="url-output"
              value={output}
              readOnly
              className="font-mono text-sm min-h-[320px] resize-y"
              spellCheck={false}
              aria-label={t("tools.url-encoder.output")}
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
          filename="encoded-url.txt"
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
