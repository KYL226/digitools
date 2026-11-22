"use client";

import { useI18n } from "@/lib/i18n/i18n-context";
import { TOOLS, CATEGORIES } from "@/data/tools";

export function StructuredData() {
  const { t, locale } = useI18n();

  const websiteData = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: t("common.appName"),
    description: t("seo.siteDescription"),
    url: "/",
    inLanguage: locale === "fr" ? "fr-FR" : "en-US",
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: "/?q={search_term_string}",
      },
      "query-input": "required name=search_term_string",
    },
  };

  const orgData = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: t("common.appName"),
    description: t("seo.siteDescription"),
    url: "/",
  };

  // BuildItemList — list of all tools
  const itemList = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: t("home.allTools"),
    numberOfItems: TOOLS.length,
    itemListElement: TOOLS.map((tool, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: t(`tools.${tool.slug}.name`),
      description: t(`tools.${tool.slug}.short`),
      url: `#/tools/${tool.slug}`,
    })),
  };

  // SoftwareApplication — for each tool, define as SoftwareApplication
  const applications = TOOLS.map((tool) => ({
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: t(`tools.${tool.slug}.name`),
    description: t(`tools.${tool.slug}.description`),
    applicationCategory: "Utilities",
    operatingSystem: "Web Browser",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
    url: `#/tools/${tool.slug}`,
  }));

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
      {applications.map((app, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(app) }}
        />
      ))}
    </>
  );
}
