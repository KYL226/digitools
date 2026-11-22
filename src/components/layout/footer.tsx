"use client";

import { Github, Heart } from "lucide-react";
import { useI18n } from "@/lib/i18n/i18n-context";
import { useAppStore } from "@/store/use-app-store";
import { CATEGORIES, TOOLS } from "@/data/tools";

export function Footer() {
  const { t } = useI18n();
  const { navigate, goHome } = useAppStore();

  return (
    <footer className="mt-auto border-t border-border/60 bg-muted/30">
      <div className="mx-auto max-w-7xl px-4 md:px-6 py-10 md:py-14">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1 space-y-3">
            <button
              onClick={goHome}
              className="flex items-center gap-2"
              aria-label={t("common.appName")}
            >
              <div className="grid place-items-center h-8 w-8 rounded-lg bg-primary text-primary-foreground font-bold text-sm">
                T
              </div>
              <span className="font-bold text-base">{t("common.appName")}</span>
            </button>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {t("footer.description")}
            </p>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-1 font-medium text-emerald-600 dark:text-emerald-400">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                {t("common.clientSideOnly")}
              </span>
            </div>
          </div>

          {/* Categories */}
          <div className="space-y-3">
            <p className="text-xs font-semibold text-foreground uppercase tracking-wider">
              {t("footer.categories")}
            </p>
            <ul className="space-y-2 text-sm">
              {CATEGORIES.map((cat) => (
                <li key={cat.id}>
                  <button
                    onClick={() => navigate({ name: "category", category: cat.id })}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {t(`categories.${cat.id}.name`)}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Popular tools */}
          <div className="space-y-3">
            <p className="text-xs font-semibold text-foreground uppercase tracking-wider">
              {t("home.popularTools")}
            </p>
            <ul className="space-y-2 text-sm">
              {TOOLS.slice(0, 6).map((tool) => (
                <li key={tool.slug}>
                  <button
                    onClick={() => navigate({ name: "tool", slug: tool.slug })}
                    className="text-muted-foreground hover:text-foreground transition-colors text-left"
                  >
                    {t(`tools.${tool.slug}.name`)}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Product */}
          <div className="space-y-3">
            <p className="text-xs font-semibold text-foreground uppercase tracking-wider">
              {t("footer.product")}
            </p>
            <ul className="space-y-2 text-sm">
              <li>
                <button
                  onClick={goHome}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  {t("footer.allTools")}
                </button>
              </li>
              <li>
                <span className="text-muted-foreground">{t("footer.privacy")}</span>
              </li>
              <li>
                <span className="text-muted-foreground">{t("footer.terms")}</span>
              </li>
              <li>
                <span className="text-muted-foreground">{t("footer.cookies")}</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-border/40 flex flex-col md:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
          <p>
            © {new Date().getFullYear()} {t("common.appName")}. {t("common.allRightsReserved")}.
          </p>
          <p className="flex items-center gap-1.5">
            {t("footer.madeWith")} <Heart className="h-3 w-3 fill-red-500 text-red-500" /> · Next.js · Tailwind · shadcn/ui
          </p>
        </div>
      </div>
    </footer>
  );
}
