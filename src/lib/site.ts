// Absolute site URL used for canonical, Open Graph, sitemap and robots.
// Set NEXT_PUBLIC_SITE_URL in production (e.g. https://digitools.app).
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"
).replace(/\/$/, "");
