import type { Metadata } from "next";
import Link from "next/link";
import { getServerLocale, getMessages } from "@/lib/i18n/server";
import { SITE_URL } from "@/lib/site";

export type LegalKey = "privacy" | "terms" | "cookies";

interface LegalPageProps {
  slug: LegalKey;
}

export function generateLegalMetadata(slug: LegalKey): () => Promise<Metadata> {
  return async () => {
    const locale = await getServerLocale();
    const messages = getMessages(locale);
    const doc = messages.legal[slug];
    const url = `${SITE_URL}/${slug}`;

    return {
      title: doc.title,
      description: doc.intro,
      alternates: { canonical: url },
      openGraph: {
        title: `${doc.title} | DigiTools`,
        description: doc.intro,
        url,
        siteName: "DigiTools",
        type: "article",
        locale: locale === "fr" ? "fr_FR" : "en_US",
      },
      robots: { index: true, follow: true },
    };
  };
}

export async function LegalPage({ slug }: LegalPageProps) {
  const locale = await getServerLocale();
  const messages = getMessages(locale);
  const doc = messages.legal[slug];

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "DigiTools", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: doc.title, item: `${SITE_URL}/${slug}` },
    ],
  };

  return (
    <div className="mx-auto max-w-3xl px-4 md:px-6 py-8 md:py-12">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
      />

      <nav aria-label="breadcrumb" className="mb-6 text-sm text-muted-foreground">
        <Link href="/" className="hover:text-foreground transition-colors">
          DigiTools
        </Link>
        <span className="mx-1.5">/</span>
        <span className="text-foreground">{doc.title}</span>
      </nav>

      <header className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">{doc.title}</h1>
        <p className="mt-2 text-xs text-muted-foreground">{doc.updated}</p>
        <p className="mt-4 text-sm md:text-base text-muted-foreground leading-relaxed">
          {doc.intro}
        </p>
      </header>

      <div className="space-y-8">
        {doc.sections.map((section, i) => (
          <section key={i}>
            <h2 className="text-lg md:text-xl font-semibold mb-2">{section.heading}</h2>
            <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
              {section.body}
            </p>
          </section>
        ))}
      </div>

      <div className="mt-12 pt-6 border-t border-border/40 flex flex-wrap gap-4 text-sm">
        <Link href="/privacy" className="text-muted-foreground hover:text-foreground transition-colors">
          {messages.legal.privacy.title}
        </Link>
        <Link href="/terms" className="text-muted-foreground hover:text-foreground transition-colors">
          {messages.legal.terms.title}
        </Link>
        <Link href="/cookies" className="text-muted-foreground hover:text-foreground transition-colors">
          {messages.legal.cookies.title}
        </Link>
      </div>
    </div>
  );
}
