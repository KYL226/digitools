"use client";

import { useEffect, useState } from "react";
import { Menu, Search, X } from "lucide-react";
import { useAppStore } from "@/store/use-app-store";
import { useI18n } from "@/lib/i18n/i18n-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ThemeToggle } from "./theme-toggle";
import { LanguageSwitcher } from "./language-switcher";
import { TOOLS, CATEGORIES } from "@/data/tools";
import { cn } from "@/lib/utils";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

export function Header() {
  const { t, locale } = useI18n();
  const { navigate, goHome, searchQuery, setSearch, route } = useAppStore();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [localSearch, setLocalSearch] = useState("");

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setLocalSearch(searchQuery);
  }, [searchQuery]);

  // Keyboard shortcut: / focuses search
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "/" && document.activeElement?.tagName !== "INPUT" && document.activeElement?.tagName !== "TEXTAREA") {
        e.preventDefault();
        const el = document.getElementById("global-search");
        el?.focus();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const submitSearch = () => {
    setSearch(localSearch);
    if (route.name !== "home") {
      goHome();
    }
  };

  const onSearchChange = (v: string) => {
    setLocalSearch(v);
    setSearch(v);
  };

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-xl transition-colors",
        scrolled && "bg-background/95 shadow-sm"
      )}
    >
      <div className="mx-auto flex h-14 md:h-16 max-w-7xl items-center gap-2 md:gap-4 px-4 md:px-6">
        {/* Logo */}
        <button
          onClick={goHome}
          className="flex items-center gap-2 shrink-0 group"
          aria-label={t("common.appName")}
        >
          <img
            src="/logo-digi.svg"
            alt={t("common.appName")}
            className="h-8 w-8 rounded-lg transition-transform group-hover:scale-105"
          />
          <span className="font-bold text-base md:text-lg tracking-tight hidden sm:block">
            {t("common.appName")}
          </span>
        </button>

        {/* Search */}
        <div className="relative flex-1 max-w-xl mx-auto hidden md:block">
          <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="global-search"
            type="search"
            value={localSearch}
            onChange={(e) => onSearchChange(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submitSearch()}
            onFocus={submitSearch}
            placeholder={t("common.searchPlaceholder")}
            className="pl-9 pr-16 h-9 bg-muted/50 border-transparent focus-visible:bg-background"
            aria-label={t("common.search")}
          />
          <kbd className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 hidden lg:inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] text-muted-foreground">
            /
          </kbd>
        </div>

        <div className="flex items-center gap-1 md:gap-2 ml-auto">
          <LanguageSwitcher />
          <ThemeToggle />
          {/* Mobile menu */}
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden h-9 w-9"
                aria-label={t("common.openMenu")}
              >
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-full sm:w-[400px] overflow-y-auto">
              <SheetHeader>
                <SheetTitle>{t("common.appName")}</SheetTitle>
              </SheetHeader>
              <div className="px-4 pb-6 space-y-4">
                {/* Mobile search */}
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="search"
                    value={localSearch}
                    onChange={(e) => onSearchChange(e.target.value)}
                    placeholder={t("common.searchPlaceholder")}
                    className="pl-9 h-9"
                  />
                </div>
                {/* Categories */}
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-2">
                    {t("common.categories")}
                  </p>
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => {
                        navigate({ name: "category", category: cat.id });
                        setMobileOpen(false);
                      }}
                      className="w-full flex items-center gap-3 px-2 py-2 text-sm rounded-md hover:bg-accent transition-colors text-left"
                    >
                      <cat.icon className="h-4 w-4 text-muted-foreground" />
                      <span>{t(`categories.${cat.id}.name`)}</span>
                      <span className="ml-auto text-xs text-muted-foreground">
                        {TOOLS.filter((tl) => tl.category === cat.id).length}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
