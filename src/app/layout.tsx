import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { cookies } from "next/headers";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/layout/theme-provider";
import { I18nProvider, type Locale } from "@/lib/i18n/i18n-context";
import { AppShell } from "@/components/layout/app-shell";
import { StructuredData } from "@/components/layout/structured-data";
import { SITE_URL } from "@/lib/site";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  applicationName: "DigiTools",
  title: {
    default: "DigiTools — Free Browser Tools for Developers & Creators",
    template: "%s | DigiTools",
  },
  description:
    "26 free browser-based tools for developers, writers, and creators. Format JSON, compress images, generate QR codes and more. Fast, private, works offline.",
  manifest: "/manifest.webmanifest",
  keywords: [
    "utility tools",
    "developer tools",
    "json formatter",
    "image compressor",
    "qr code generator",
    "password generator",
    "base64",
    "regex tester",
    "online tools",
    "browser tools",
    "free tools",
    "pwa",
  ],
  authors: [{ name: "DigiTools" }],
  creator: "DigiTools",
  icons: {
    icon: [
      { url: "/favicon-16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
    shortcut: "/favicon-32.png",
  },
  appleWebApp: {
    capable: true,
    title: "DigiTools",
    statusBarStyle: "default",
  },
  formatDetection: {
    telephone: false,
    address: false,
    email: false,
  },
  openGraph: {
    title: "DigiTools — Free Browser Tools for Developers & Creators",
    description:
      "26 free browser tools. Format JSON, compress images, convert media and more. Fast, private, bilingual, works offline.",
    siteName: "DigiTools",
    type: "website",
    url: SITE_URL,
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "DigiTools" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "DigiTools — Free Browser Tools for Developers & Creators",
    description:
      "26 free browser tools. Format JSON, compress images, convert media and more. Fast, private, bilingual.",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: "/",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: "cover",
};

const SW_REGISTER_SRC = "/sw-register.js";

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Read locale cookie on the server so SSR HTML matches the first
  // client render (avoids hydration mismatch on bilingual pages).
  const cookieStore = await cookies();
  const initialLocale: Locale =
    cookieStore.get("toolforge-locale")?.value === "fr" ? "fr" : "en";

  return (
    <html lang={initialLocale} suppressHydrationWarning>
      <head>
        {/* PWA: apple-touch icon, SVG favicon for modern browsers */}
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="icon" type="image/svg+xml" href="/logo-digi.svg" />
        {/* Mobile web app capability hints (older iOS) */}
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="DigiTools" />
        {/* JSON-LD structured data (server-rendered into HTML) */}
        <StructuredData />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <I18nProvider initialLocale={initialLocale}>
            <AppShell>{children}</AppShell>
            <Toaster position="bottom-right" richColors closeButton />
          </I18nProvider>
        </ThemeProvider>
        <Script id="sw-register" strategy="afterInteractive" src={SW_REGISTER_SRC} />
      </body>
    </html>
  );
}
