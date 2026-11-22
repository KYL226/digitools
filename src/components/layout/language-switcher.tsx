"use client";

import { Check, Languages } from "lucide-react";
import { useI18n, type Locale } from "@/lib/i18n/i18n-context";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const LANGS: { code: Locale; label: string; flag: string }[] = [
  { code: "en", label: "English", flag: "🇬🇧" },
  { code: "fr", label: "Français", flag: "🇫🇷" },
];

export function LanguageSwitcher() {
  const { locale, setLocale } = useI18n();
  const current = LANGS.find((l) => l.code === locale) ?? LANGS[0];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          aria-label={current.label}
          className="gap-1.5 h-9 px-2.5"
        >
          <Languages className="h-4 w-4" />
          <span className="text-base leading-none" aria-hidden>
            {current.flag}
          </span>
          <span className="sr-only md:not-sr-only md:text-sm">
            {current.code.toUpperCase()}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[10rem]">
        {LANGS.map((l) => (
          <DropdownMenuItem
            key={l.code}
            onClick={() => setLocale(l.code)}
            className={cn(
              "gap-2 cursor-pointer",
              locale === l.code && "bg-accent"
            )}
          >
            <span className="text-base" aria-hidden>
              {l.flag}
            </span>
            <span>{l.label}</span>
            {locale === l.code && <Check className="ml-auto h-4 w-4" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
