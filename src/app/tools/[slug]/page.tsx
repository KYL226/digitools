import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { TOOLS, getToolBySlug } from "@/data/tools";
import { getServerLocale, getMessages } from "@/lib/i18n/server";
import { SITE_URL } from "@/lib/site";
import { ToolView } from "@/components/tool/tool-view";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return TOOLS.map((tool) => ({ slug: tool.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const tool = getToolBySlug(slug);
  if (!tool) return {};

  const locale = await getServerLocale();
  const messages = getMessages(locale);
  const meta = messages.tools[slug as keyof typeof messages.tools];
  if (!meta) return {};

  const category = messages.categories[tool.category];
  const title = `${meta.name}`;
  const description = meta.short
    ? `${meta.short}. ${meta.description}`
    : meta.description;

  const url = `${SITE_URL}/tools/${slug}`;

  return {
    title,
    description,
    keywords: [...(tool.keywords ?? []), ...(tool.aliases ?? []), "online", "free", "browser"],
    alternates: {
      canonical: url,
    },
    openGraph: {
      title: `${title} | DigiTools`,
      description,
      url,
      siteName: "DigiTools",
      type: "website",
      images: [{ url: `${SITE_URL}/og-image.png`, width: 1200, height: 630, alt: title }],
      locale: locale === "fr" ? "fr_FR" : "en_US",
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} | DigiTools`,
      description,
      images: [`${SITE_URL}/og-image.png`],
    },
    robots: {
      index: true,
      follow: true,
    },
    other: {
      "og:see-also": `${SITE_URL}/category/${tool.category}`,
    },
    // Category name used in structured data below via viewport-less head tag
    ...(category ? {} : {}),
  };
}

export default async function ToolPage({ params }: PageProps) {
  const { slug } = await params;
  const tool = getToolBySlug(slug);
  if (!tool) notFound();

  const locale = await getServerLocale();
  const messages = getMessages(locale);
  const meta = messages.tools[slug as keyof typeof messages.tools];
  const category = messages.categories[tool.category];
  const related = TOOLS.filter((t) => t.category === tool.category && t.slug !== slug).slice(0, 4);

  const faq =
    meta && Array.isArray((meta as { faq?: unknown }).faq)
      ? ((meta as { faq: Array<{ q: string; a: string }> }).faq ?? [])
      : [];

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "DigiTools", item: SITE_URL },
      {
        "@type": "ListItem",
        position: 2,
        name: category?.name ?? "Tools",
        item: `${SITE_URL}/category/${tool.category}`,
      },
      { "@type": "ListItem", position: 3, name: meta?.name ?? slug, item: `${SITE_URL}/tools/${slug}` },
    ],
  };

  const faqLd =
    faq.length > 0
      ? {
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: faq.map((item) => ({
            "@type": "Question",
            name: item.q,
            acceptedAnswer: { "@type": "Answer", text: item.a },
          })),
        }
      : null;

  const appLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: meta?.name ?? slug,
    description: meta?.description ?? meta?.short ?? "",
    applicationCategory: "UtilitiesApplication",
    operatingSystem: "Web Browser",
    url: `${SITE_URL}/tools/${slug}`,
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(appLd) }} />
      {faqLd && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />
      )}
      <ToolView slug={slug} />
      {related.length > 0 && (
        <section className="mx-auto max-w-5xl px-4 md:px-6 pb-12">
          <h2 className="text-lg md:text-xl font-semibold mb-4">
            {messages.common.relatedTools}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            {related.map((r) => {
              const rMeta = messages.tools[r.slug as keyof typeof messages.tools];
              const Icon = r.icon;
              return (
                <a
                  key={r.slug}
                  href={`/tools/${r.slug}`}
                  className="group flex items-start gap-3 rounded-xl border border-border/60 bg-card p-4 transition-all hover:border-primary/40 hover:shadow-md"
                >
                  <div className="grid place-items-center h-9 w-9 rounded-lg bg-primary/10 text-primary shrink-0 group-hover:bg-primary group-hover:text-primary-foreground">
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium leading-tight">{rMeta?.name ?? r.slug}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                      {rMeta?.short}
                    </p>
                  </div>
                </a>
              );
            })}
          </div>
        </section>
      )}
    </>
  );
}
