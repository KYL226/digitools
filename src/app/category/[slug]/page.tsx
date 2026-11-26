import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CATEGORIES, getToolsByCategory, type ToolCategory } from "@/data/tools";
import { getServerLocale, getMessages } from "@/lib/i18n/server";
import { SITE_URL } from "@/lib/site";

interface PageProps {
  params: Promise<{ slug: string }>;
}

function isCategory(slug: string): slug is ToolCategory {
  return CATEGORIES.some((c) => c.id === slug);
}

export function generateStaticParams() {
  return CATEGORIES.map((cat) => ({ slug: cat.id }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  if (!isCategory(slug)) return {};

  const locale = await getServerLocale();
  const messages = getMessages(locale);
  const category = messages.categories[slug];
  const tools = getToolsByCategory(slug);
  if (!category) return {};

  const title = `${category.name} — Free Online Tools`;
  const description = `${category.description}. ${tools.length} free browser tools from DigiTools. Fast, private, no signup. Works offline.`;
  const url = `${SITE_URL}/category/${slug}`;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title: `${title} | DigiTools`,
      description,
      url,
      siteName: "DigiTools",
      type: "website",
      images: [{ url: `${SITE_URL}/og-image.png`, width: 1200, height: 630, alt: category.name }],
      locale: locale === "fr" ? "fr_FR" : "en_US",
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} | DigiTools`,
      description,
      images: [`${SITE_URL}/og-image.png`],
    },
    robots: { index: true, follow: true },
  };
}

export default async function CategoryPage({ params }: PageProps) {
  const { slug } = await params;
  if (!isCategory(slug)) notFound();

  const locale = await getServerLocale();
  const messages = getMessages(locale);
  const category = messages.categories[slug];
  if (!category) notFound();

  const tools = getToolsByCategory(slug);
  const categoryMeta = CATEGORIES.find((c) => c.id === slug);
  const Icon = categoryMeta?.icon;

  const listLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: category.name,
    numberOfItems: tools.length,
    itemListElement: tools.map((tool, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: messages.tools[tool.slug as keyof typeof messages.tools]?.name ?? tool.slug,
      url: `${SITE_URL}/tools/${tool.slug}`,
    })),
  };

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "DigiTools", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: category.name, item: `${SITE_URL}/category/${slug}` },
    ],
  };

  return (
    <div className="mx-auto max-w-5xl px-4 md:px-6 py-8 md:py-12">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(listLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />

      {/* Breadcrumb */}
      <nav aria-label="breadcrumb" className="mb-6 text-sm text-muted-foreground">
        <Link href="/" className="hover:text-foreground transition-colors">
          DigiTools
        </Link>
        <span className="mx-1.5">/</span>
        <span className="text-foreground">{category.name}</span>
      </nav>

      {/* Header */}
      <header className="mb-8">
        <div className="flex items-start gap-4">
          {Icon && (
            <div className="grid place-items-center h-12 w-12 md:h-14 md:w-14 rounded-xl bg-primary text-primary-foreground shrink-0 shadow-sm">
              <Icon className="h-6 w-6 md:h-7 md:w-7" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">{category.name}</h1>
            <p className="mt-2 text-sm md:text-base text-muted-foreground leading-relaxed max-w-2xl">
              {category.description}.{" "}
              {messages.common.privacyNote}
            </p>
            <p className="mt-2 text-xs text-muted-foreground">
              {tools.length} {messages.common.toolsCount}
            </p>
          </div>
        </div>
      </header>

      {/* Tools grid */}
      <section aria-label={category.name}>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
          {tools.map((tool) => {
            const meta = messages.tools[tool.slug as keyof typeof messages.tools];
            const ToolIcon = tool.icon;
            return (
              <Link
                key={tool.slug}
                href={`/tools/${tool.slug}`}
                className="group flex flex-col items-start gap-3 rounded-2xl border border-border/60 bg-card p-4 md:p-5 transition-all hover:border-primary/40 hover:shadow-md hover:-translate-y-0.5"
              >
                <div className="grid place-items-center h-10 w-10 rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                  <ToolIcon className="h-5 w-5" />
                </div>
                <div className="space-y-1 flex-1 min-w-0">
                  <h2 className="font-semibold text-sm md:text-base leading-tight">
                    {meta?.name ?? tool.slug}
                  </h2>
                  <p className="text-xs md:text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                    {meta?.short}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* All categories */}
      <nav className="mt-12 pt-8 border-t border-border/40" aria-label={messages.common.categories}>
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
          {messages.common.allCategories}
        </p>
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((c) => (
            <Link
              key={c.id}
              href={`/category/${c.id}`}
              className={
                c.id === slug
                  ? "inline-flex items-center gap-1.5 rounded-full border border-primary bg-primary text-primary-foreground px-3 py-1.5 text-xs font-medium"
                  : "inline-flex items-center gap-1.5 rounded-full border border-border bg-background hover:bg-accent px-3 py-1.5 text-xs font-medium transition-colors"
              }
            >
              <c.icon className="h-3 w-3" />
              {messages.categories[c.id]?.name ?? c.id}
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
}
