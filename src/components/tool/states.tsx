"use client";

import { AlertCircle, FileQuestion, Loader2 } from "lucide-react";
import { useI18n } from "@/lib/i18n/i18n-context";
import { cn } from "@/lib/utils";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export function ErrorMessage({ message, className }: { message?: string; className?: string }) {
  const { t } = useI18n();
  return (
    <Alert variant="destructive" className={cn("mt-2", className)}>
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>{t("common.error")}</AlertTitle>
      <AlertDescription>{message ?? t("errors.generic")}</AlertDescription>
    </Alert>
  );
}

export function EmptyState({
  title,
  description,
  icon: Icon = FileQuestion,
  className,
}: {
  title?: string;
  description?: string;
  icon?: React.ComponentType<{ className?: string }>;
  className?: string;
}) {
  const { t } = useI18n();
  return (
    <div className={cn("flex flex-col items-center justify-center text-center py-10 px-4", className)}>
      <div className="grid place-items-center h-12 w-12 rounded-full bg-muted text-muted-foreground mb-3">
        <Icon className="h-6 w-6" />
      </div>
      <p className="text-sm font-medium">{title ?? t("common.noOutput")}</p>
      <p className="text-xs text-muted-foreground mt-1">{description ?? t("common.noOutputDesc")}</p>
    </div>
  );
}

export function LoadingState({
  label,
  className,
}: {
  label?: string;
  className?: string;
}) {
  const { t } = useI18n();
  return (
    <div className={cn("flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground", className)}>
      <Loader2 className="h-4 w-4 animate-spin" />
      <span>{label ?? t("common.loading")}</span>
    </div>
  );
}
