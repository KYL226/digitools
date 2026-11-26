"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { useI18n } from "@/lib/i18n/i18n-context";
import { getToolBySlug, type ToolMeta } from "@/data/tools";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

interface ToolLayoutProps {
  slug: string;
  children: ReactNode;
}

export function ToolLayout({ slug, children }: ToolLayoutProps) {
  const { t } = useI18n();
  const router = useRouter();
  const tool = getToolBySlug(slug);

  if (!tool) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12 text-center">
        <p>Tool not found.</p>
        <Button asChild className="mt-4">
          <Link href="/">{t("common.backToHome")}</Link>
        </Button>
      </div>
    );
  }

  const Icon = tool.icon;
  const faqs = t(`tools.${slug}.faq`) as any[];

  return (
    <article className="mx-auto max-w-5xl px-4 md:px-6 py-6 md:py-10">
      {/* Breadcrumbs */}
      <Breadcrumb className="mb-4 md:mb-6">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/">{t("common.backToTools")}</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href={`/category/${tool.category}`}>
                {t(`categories.${tool.category}.name`)}
              </Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{t(`tools.${slug}.name`)}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Header */}
      <header className="mb-6 md:mb-8">
        <div className="flex items-start gap-4">
          <div className="grid place-items-center h-12 w-12 md:h-14 md:w-14 rounded-xl bg-primary text-primary-foreground shrink-0 shadow-sm">
            <Icon className="h-6 w-6 md:h-7 md:w-7" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
              {t(`tools.${slug}.name`)}
            </h1>
            <p className="mt-1 text-sm md:text-base text-muted-foreground leading-relaxed">
              {t(`tools.${slug}.short`)}
            </p>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
          <Badge variant="secondary" className="gap-1">
            <Link href={`/category/${tool.category}`} className="hover:text-foreground">
              {t(`categories.${tool.category}.name`)}
            </Link>
          </Badge>
          <Badge variant="outline" className="gap-1 border-emerald-500/30 text-emerald-600 dark:text-emerald-400">
            <ShieldCheck className="h-3 w-3" />
            {t("common.clientSideOnly")}
          </Badge>
          <Badge variant="outline">{t("common.freeTools")}</Badge>
        </div>
      </header>

      {/* Main interface */}
      <div className="rounded-2xl border border-border/60 bg-card p-4 md:p-6 shadow-sm">
        {children}
      </div>

      {/* Description + FAQ */}
      <section className="mt-8 md:mt-10 grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2 space-y-4">
          <h2 className="text-lg md:text-xl font-semibold">{t("common.useCases")}</h2>
          <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
            {t(`tools.${slug}.description`)}
          </p>

          {Array.isArray(faqs) && faqs.length > 0 && (
            <>
              <Separator className="my-6" />
              <h2 className="text-lg md:text-xl font-semibold">{t("common.faqs")}</h2>
              <Accordion type="single" collapsible className="w-full">
                {faqs.map((faq, i) => (
                  <AccordionItem key={i} value={`item-${i}`}>
                    <AccordionTrigger className="text-left text-sm md:text-base">
                      {faq.q}
                    </AccordionTrigger>
                    <AccordionContent className="text-sm md:text-base text-muted-foreground leading-relaxed">
                      {faq.a}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </>
          )}
        </div>

        {/* Privacy sidebar */}
        <aside className="space-y-4">
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4">
            <div className="flex items-center gap-2 mb-2">
              <ShieldCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">
                {t("common.privacy")}
              </p>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {t("common.privacyNote")}
            </p>
          </div>
        </aside>
      </section>

      {/* Back link */}
      <div className="mt-10">
        <Button variant="ghost" size="sm" asChild className="gap-1.5">
          <Link href="/">
            <ArrowLeft className="h-4 w-4" />
            {t("common.backToTools")}
          </Link>
        </Button>
      </div>
    </article>
  );
}

interface ToolCardProps {
  tool: ToolMeta;
}

export function ToolCard({ tool }: ToolCardProps) {
  const { t } = useI18n();
  const Icon = tool.icon;

  return (
    <Link
      href={`/tools/${tool.slug}`}
      className="group relative flex flex-col items-start gap-3 rounded-2xl border border-border/60 bg-card p-4 md:p-5 text-left transition-all hover:border-primary/40 hover:shadow-md hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background"
    >
      <div className="grid place-items-center h-10 w-10 md:h-11 md:w-11 rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
        <Icon className="h-5 w-5" />
      </div>
      <div className="space-y-1 flex-1 min-w-0">
        <h3 className="font-semibold text-sm md:text-base leading-tight">
          {t(`tools.${tool.slug}.name`)}
        </h3>
        <p className="text-xs md:text-sm text-muted-foreground line-clamp-2 leading-relaxed">
          {t(`tools.${tool.slug}.short`)}
        </p>
      </div>
      <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-5">
        {t(`categories.${tool.category}.name`)}
      </Badge>
    </Link>
  );
}
