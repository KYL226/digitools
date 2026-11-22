"use client";

import { useMemo } from "react";
import { ArrowRight, Search, ShieldCheck, Zap, Globe, Gift, Sparkles, X } from "lucide-react";
import { useI18n } from "@/lib/i18n/i18n-context";
import { useAppStore } from "@/store/use-app-store";
import { TOOLS, CATEGORIES } from "@/data/tools";
import { ToolCard } from "@/components/tool/tool-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import enMessages from "@/messages/en.json";
import frMessages from "@/messages/fr.json";

export function Home() {
  const { t, locale } = useI18n();
  const { searchQuery, setSearch, navigate, selectedCategory, setCategory } = useAppStore();

  // Build search index for both languages
  const searchIndex = useMemo(() => {
    return TOOLS.map((tool) => {
      const enName = enMessages.tools[tool.slug as keyof typeof enMessages.tools]?.name ?? "";
      const enShort = enMessages.tools[tool.slug as keyof typeof enMessages.tools]?.short ?? "";
      const enDesc = enMessages.tools[tool.slug as keyof typeof enMessages.tools]?.description ?? "";
      const frName = frMessages.tools[tool.slug as keyof typeof frMessages.tools]?.name ?? "";
      const frShort = frMessages.tools[tool.slug as keyof typeof frMessages.tools]?.short ?? "";
      const frDesc = frMessages.tools[tool.slug as keyof typeof frMessages.tools]?.description ?? "";
      return {
        tool,
        text: [
          enName, enShort, enDesc,
          frName, frShort, frDesc,
          ...(tool.aliases ?? []),
          ...(tool.keywords ?? []),
          tool.slug,
        ].join(" ").toLowerCase(),
      };
    });
  }, []);

  const filteredTools = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return TOOLS;
    return searchIndex
      .filter((idx) => idx.text.includes(q))
      .map((idx) => idx.tool);
  }, [searchQuery, searchIndex]);

  const categoryTools = useMemo(() => {
    if (!selectedCategory) return filteredTools;
    return filteredTools.filter((t) => t.category === selectedCategory);
  }, [filteredTools, selectedCategory]);

  const hasSearch = searchQuery.trim().length > 0;

  return (
    <div className="relative">
      {/* Hero section */}
      <section className="relative overflow-hidden border-b border-border/40">
        {/* Background gradient */}
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-primary/5 via-background to-background" />
        <div
          className="absolute inset-0 -z-10 opacity-50"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 30%, hsl(var(--primary) / 0.08) 0%, transparent 50%), radial-gradient(circle at 80% 70%, hsl(var(--primary) / 0.05) 0%, transparent 50%)",
          }}
        />
        {/* Grid pattern */}
        <div
          className="absolute inset-0 -z-10 opacity-[0.03]"
          style={{
            backgroundImage:
              "linear-gradient(to right, hsl(var(--foreground) / 1) 1px, transparent 1px), linear-gradient(to bottom, hsl(var(--foreground) / 1) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />

        <div className="mx-auto max-w-7xl px-4 md:px-6 py-12 md:py-20 lg:py-24">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-background/60 backdrop-blur px-3 py-1 text-xs font-medium text-muted-foreground mb-6">
              <Sparkles className="h-3 w-3 text-primary" />
              {TOOLS.length} {t("common.toolsCount")}
              <span className="mx-1 h-1 w-1 rounded-full bg-muted-foreground/40" />
              <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                {t("common.clientSideOnly")}
              </span>
            </div>

            <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.05] mb-4 md:mb-6">
              {t("home.heroTitle")}
            </h1>
            <p className="text-base md:text-lg lg:text-xl text-muted-foreground leading-relaxed max-w-2xl mx-auto mb-8">
              {t("home.heroSubtitle")}
            </p>

            {/* Search */}
            <div className="relative max-w-xl mx-auto">
              <Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t("common.searchPlaceholder")}
                className="pl-11 pr-10 h-12 md:h-14 text-base rounded-xl shadow-sm border-border/60 bg-background"
                aria-label={t("common.search")}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 grid place-items-center h-6 w-6 rounded-full hover:bg-muted"
                  aria-label={t("common.clear")}
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* Quick stats */}
            <div className="mt-8 md:mt-10 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl mx-auto">
              {[
                { label: t("home.statsTools"), value: TOOLS.length },
                { label: t("home.statsCategories"), value: CATEGORIES.length },
                { label: t("home.statsLanguages"), value: 2 },
                { label: t("home.statsPrivacy"), value: "100%" },
              ].map((stat, i) => (
                <div key={i} className="text-center">
                  <div className="text-2xl md:text-3xl font-bold tracking-tight">
                    {stat.value}
                  </div>
                  <div className="text-xs md:text-sm text-muted-foreground mt-0.5">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features strip */}
      <section className="border-b border-border/40 bg-muted/20">
        <div className="mx-auto max-w-7xl px-4 md:px-6 py-8 md:py-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {[
              { icon: ShieldCheck, title: t("home.featurePrivacyTitle"), desc: t("home.featurePrivacyDesc") },
              { icon: Zap, title: t("home.featureFastTitle"), desc: t("home.featureFastDesc") },
              { icon: Globe, title: t("home.featureBilingualTitle"), desc: t("home.featureBilingualDesc") },
              { icon: Gift, title: t("home.featureFreeTitle"), desc: t("home.featureFreeDesc") },
            ].map((f, i) => (
              <div key={i} className="flex flex-col gap-2">
                <div className="grid place-items-center h-9 w-9 rounded-lg bg-primary/10 text-primary">
                  <f.icon className="h-4 w-4" />
                </div>
                <p className="text-sm font-semibold">{f.title}</p>
                <p className="text-xs text-muted-foreground leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Category filter + Tool grid */}
      <section className="mx-auto max-w-7xl px-4 md:px-6 py-8 md:py-12">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 md:mb-8">
          <div>
            <h2 className="text-xl md:text-2xl font-bold tracking-tight">
              {hasSearch ? t("common.results") : t("home.allTools")}
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              {filteredTools.length} / {TOOLS.length}
            </p>
          </div>

          {/* Category chips */}
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              onClick={() => setCategory(null)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                !selectedCategory
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-background hover:bg-accent"
              )}
            >
              {t("common.allCategories")}
            </button>
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setCategory(cat.id)}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                  selectedCategory === cat.id
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-background hover:bg-accent"
                )}
              >
                <cat.icon className="h-3 w-3" />
                {t(`categories.${cat.id}.name`)}
              </button>
            ))}
          </div>
        </div>

        {/* Tools grid */}
        {categoryTools.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
            {categoryTools.map((tool) => (
              <ToolCard key={tool.slug} tool={tool} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center text-center py-16">
            <div className="grid place-items-center h-12 w-12 rounded-full bg-muted text-muted-foreground mb-3">
              <Search className="h-6 w-6" />
            </div>
            <p className="text-sm font-medium">{t("common.searchEmpty")}</p>
            <p className="text-xs text-muted-foreground mt-1">{t("common.searchHint")}</p>
            <Button variant="outline" size="sm" className="mt-4" onClick={() => { setSearch(""); setCategory(null); }}>
              {t("common.clear")}
            </Button>
          </div>
        )}
      </section>

      {/* CTA */}
      <section className="border-t border-border/40 bg-muted/20">
        <div className="mx-auto max-w-3xl px-4 md:px-6 py-12 md:py-16 text-center">
          <h2 className="text-xl md:text-2xl font-bold tracking-tight mb-2">
            {t("home.madeWithLove")}
          </h2>
          <p className="text-sm md:text-base text-muted-foreground leading-relaxed mb-6 max-w-xl mx-auto">
            {t("common.privacyNote")}
          </p>
          <Button onClick={() => navigate({ name: "tool", slug: "json-formatter" })} className="gap-1.5">
            {t("common.exploreTools")}
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </section>
    </div>
  );
}
