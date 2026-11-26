import { getServerLocale, getMessages } from "@/lib/i18n/server";
import { TOOLS } from "@/data/tools";
import { SITE_URL } from "@/lib/site";

/**
 * JSON-LD structured data — server component so scripts land in the
 * initial HTML (Google reads them; React never has to "execute" them).
 */
export async function StructuredData() {
  const locale = await getServerLocale();
  const messages = getMessages(locale);

  const websiteData = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: messages.common.appName,
    description: messages.seo.siteDescription,
    url: SITE_URL,
    inLanguage: locale === "fr" ? "fr-FR" : "en-US",
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${SITE_URL}/?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };

  const orgData = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: messages.common.appName,
    description: messages.seo.siteDescription,
    url: SITE_URL,
  };

  const itemList = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: messages.home.allTools,
    numberOfItems: TOOLS.length,
    itemListElement: TOOLS.map((tool, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: messages.tools[tool.slug as keyof typeof messages.tools]?.name ?? tool.slug,
      description: messages.tools[tool.slug as keyof typeof messages.tools]?.short ?? "",
      url: `${SITE_URL}/tools/${tool.slug}`,
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteData) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(orgData) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemList) }}
      />
    </>
  );
}
