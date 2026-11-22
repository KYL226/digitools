"use client";

import { Download } from "lucide-react";
import { toast } from "sonner";
import { useI18n } from "@/lib/i18n/i18n-context";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface DownloadButtonProps {
  data: Blob | string;
  filename: string;
  mime?: string;
  className?: string;
  label?: string;
  size?: "default" | "sm" | "lg" | "icon";
  variant?: "default" | "secondary" | "ghost" | "outline";
  disabled?: boolean;
}

export function DownloadButton({
  data,
  filename,
  mime,
  className,
  label,
  size = "sm",
  variant = "secondary",
  disabled,
}: DownloadButtonProps) {
  const { t } = useI18n();

  const onDownload = async () => {
    let blob: Blob;
    if (typeof data === "string") {
      blob = new Blob([data], { type: mime ?? "text/plain" });
    } else {
      blob = data;
    }
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    toast.success(t("common.downloaded"));
  };

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      onClick={onDownload}
      disabled={disabled || !data}
      className={cn("gap-1.5", className)}
    >
      <Download className="h-4 w-4" />
      <span>{label ?? t("common.download")}</span>
    </Button>
  );
}
