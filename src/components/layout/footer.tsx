"use client";

import Link from "next/link";
import { useI18n } from "@/lib/i18n/i18n-context";
import { CATEGORIES, TOOLS } from "@/data/tools";

export function Footer() {
  const { t } = useI18n();

  return (
    <footer className="mt-auto border-t border-border/60 bg-muted/30">
      <div className="mx-auto max-w-7xl px-4 md:px-6 py-10 md:py-14">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1 space-y-3">
            <Link
              href="/"
              className="flex items-center gap-2"
              aria-label={t("common.appName")}
            >
              <img
                src="/logo-digi.svg"
                alt={t("common.appName")}
                className="h-8 w-8 rounded-lg transition-transform group-hover:scale-105"
              />
              <span className="font-bold text-base">{t("common.appName")}</span>
            </Link>
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
                  <Link
                    href={`/category/${cat.id}`}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {t(`categories.${cat.id}.name`)}
                  </Link>
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
                  <Link
                    href={`/tools/${tool.slug}`}
                    className="text-muted-foreground hover:text-foreground transition-colors text-left"
                  >
                    {t(`tools.${tool.slug}.name`)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Product / Legal */}
          <div className="space-y-3">
            <p className="text-xs font-semibold text-foreground uppercase tracking-wider">
              {t("footer.product")}
            </p>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  href="/"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  {t("footer.allTools")}
                </Link>
              </li>
              <li>
                <Link
                  href="/privacy"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  {t("footer.privacy")}
                </Link>
              </li>
              <li>
                <Link
                  href="/terms"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  {t("footer.terms")}
                </Link>
              </li>
              <li>
                <Link
                  href="/cookies"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  {t("footer.cookies")}
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-border/40 flex flex-col md:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
          <p>
            © {new Date().getFullYear()} {t("common.appName")}. {t("common.allRightsReserved")}.
          </p>
          <p className="flex items-center gap-1.5">
            Digit'Tech Group
          </p>
        </div>
      </div>
    </footer>
  );
}
