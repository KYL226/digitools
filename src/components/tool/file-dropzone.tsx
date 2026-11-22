"use client";

import { useCallback, useRef, useState, type ReactNode, type DragEvent, type ChangeEvent } from "react";
import { UploadCloud, File as FileIcon } from "lucide-react";
import { useI18n } from "@/lib/i18n/i18n-context";
import { cn } from "@/lib/utils";

interface FileDropzoneProps {
  onFile: (file: File) => void;
  accept?: string; // e.g. "image/*"
  maxSizeMB?: number;
  className?: string;
  label?: string;
  currentFileName?: string;
  children?: ReactNode;
  multiple?: boolean;
  onFiles?: (files: File[]) => void;
}

export function FileDropzone({
  onFile,
  accept,
  maxSizeMB = 50,
  className,
  label,
  currentFileName,
  children,
  multiple = false,
  onFiles,
}: FileDropzoneProps) {
  const { t } = useI18n();
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback(
    (files: FileList | null) => {
      if (!files || files.length === 0) return;
      setError(null);

      const fileArr = Array.from(files);

      // Validate size
      for (const file of fileArr) {
        if (file.size > maxSizeMB * 1024 * 1024) {
          setError(t("errors.fileTooLarge", { size: String(maxSizeMB) }));
          return;
        }
      }

      // Validate accept
      if (accept) {
        const acceptTypes = accept.split(",").map((s) => s.trim());
        const isValid = (file: File) => {
          if (acceptTypes.includes(file.type)) return true;
          // Handle wildcards like image/*
          return acceptTypes.some((type) => {
            if (type.endsWith("/*")) {
              const prefix = type.slice(0, -1);
              return file.type.startsWith(prefix);
            }
            // Handle extensions
            if (type.startsWith(".")) {
              return file.name.toLowerCase().endsWith(type.toLowerCase());
            }
            return false;
          });
        };
        for (const file of fileArr) {
          if (!isValid(file)) {
            setError(t("errors.unsupportedFormat", { format: file.type || file.name }));
            return;
          }
        }
      }

      if (multiple && onFiles) {
        onFiles(fileArr);
      } else {
        onFile(fileArr[0]);
      }
    },
    [accept, maxSizeMB, multiple, onFile, onFiles, t]
  );

  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  const onDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const onChange = (e: ChangeEvent<HTMLInputElement>) => {
    handleFiles(e.target.files);
    // Defer the reset to the next tick so handleFiles fully captures the
    // FileList before the input is cleared. This is important because
    // e.target.files is a live FileList that would be emptied immediately.
    window.setTimeout(() => {
      if (inputRef.current) inputRef.current.value = "";
    }, 0);
  };

  const openFilePicker = useCallback(() => {
    inputRef.current?.click();
  }, []);

  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      openFilePicker();
    }
  };

  return (
    <div
      onDrop={onDrop}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onClick={openFilePicker}
      onKeyDown={onKeyDown}
      role="button"
      tabIndex={0}
      aria-label={label ?? t("common.dragDropHere")}
      className={cn(
        "relative rounded-xl border-2 border-dashed transition-all cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        isDragging
          ? "border-primary bg-primary/5 scale-[1.01]"
          : "border-border hover:border-primary/50 hover:bg-muted/40",
        error && "border-destructive/50",
        className
      )}
    >
      {/* Hidden but accessible file input — uses opacity:0 + absolute positioning
          instead of sr-only (1px) to ensure cross-browser reliability */}
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        onChange={onChange}
        className="absolute inset-0 z-10 cursor-pointer opacity-0"
        aria-hidden="true"
        tabIndex={-1}
      />
      <div className="pointer-events-none p-6 md:p-8 text-center">
        {currentFileName ? (
          <div className="flex flex-col items-center gap-2">
            <FileIcon className="h-8 w-8 text-muted-foreground" />
            <p className="text-sm font-medium truncate max-w-full">{currentFileName}</p>
            <p className="text-xs text-muted-foreground">{t("common.uploaded")}</p>
          </div>
        ) : children ? (
          children
        ) : (
          <div className="flex flex-col items-center gap-2">
            <div className="grid place-items-center h-10 w-10 rounded-full bg-muted text-muted-foreground">
              <UploadCloud className="h-5 w-5" />
            </div>
            <p className="text-sm font-medium">{label ?? t("common.dragDropHere")}</p>
            <p className="text-xs text-muted-foreground">
              {t("common.dragDropOr")}{" "}
              <span className="text-primary font-medium underline-offset-2 hover:underline">
                {t("common.browseFiles")}
              </span>
            </p>
          </div>
        )}
      </div>
      {error && (
        <p className="absolute -bottom-6 left-0 right-0 text-center text-xs text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
