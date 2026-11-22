"use client";

import { RotateCcw, Eraser } from "lucide-react";
import { useI18n } from "@/lib/i18n/i18n-context";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ActionButtonProps {
  onClick: () => void;
  className?: string;
  label?: string;
  size?: "default" | "sm" | "lg" | "icon";
  variant?: "default" | "secondary" | "ghost" | "outline" | "destructive";
  disabled?: boolean;
}

export function ResetButton({ label, ...props }: ActionButtonProps) {
  const { t } = useI18n();
  return (
    <Button {...props} className={cn("gap-1.5", props.className)}>
      <RotateCcw className="h-4 w-4" />
      <span>{label ?? t("common.reset")}</span>
    </Button>
  );
}

export function ClearButton({ label, ...props }: ActionButtonProps) {
  const { t } = useI18n();
  return (
    <Button {...props} className={cn("gap-1.5", props.className)}>
      <Eraser className="h-4 w-4" />
      <span>{label ?? t("common.clear")}</span>
    </Button>
  );
}
