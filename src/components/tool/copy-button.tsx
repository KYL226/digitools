"use client";

import { useState, useCallback } from "react";
import { Check, Copy } from "lucide-react";
import { toast } from "sonner";
import { useI18n } from "@/lib/i18n/i18n-context";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface CopyButtonProps {
  value: string;
  className?: string;
  label?: string;
  size?: "default" | "sm" | "lg" | "icon";
  variant?: "default" | "secondary" | "ghost" | "outline";
  disabled?: boolean;
}

export function CopyButton({
  value,
  className,
  label,
  size = "sm",
  variant = "secondary",
  disabled,
}: CopyButtonProps) {
  const { t } = useI18n();
  const [copied, setCopied] = useState(false);

  const onCopy = useCallback(async () => {
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      toast.success(t("common.copied"));
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Fallback for older browsers
      const textarea = document.createElement("textarea");
      textarea.value = value;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      try {
        textarea.select();
        document.execCommand("copy");
        setCopied(true);
        toast.success(t("common.copied"));
        setTimeout(() => setCopied(false), 1500);
      } catch {
        toast.error(t("common.copyFailed"));
      } finally {
        document.body.removeChild(textarea);
      }
    }
  }, [value, t]);

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      onClick={onCopy}
      disabled={disabled || !value}
      className={cn("gap-1.5", className)}
    >
      {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
      <span>{label ?? t("common.copy")}</span>
    </Button>
  );
}
