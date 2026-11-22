import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/layout/theme-provider";
import { I18nProvider } from "@/lib/i18n/i18n-context";
import { AppShell } from "@/components/layout/app-shell";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  applicationName: "DigiTools",
  title: {
    default: "DigiTools — Premium Browser Utility Tools",
    template: "%s — DigiTools",
  },
  description:
    "A premium collection of 25+ browser-based utilities for developers, writers, and creators. Fast, private, bilingual (English/French). Works offline.",
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
    title: "DigiTools — Premium Browser Utility Tools",
    description:
      "25+ browser-based utilities. Fast, private, bilingual. Installable PWA, works offline.",
    siteName: "DigiTools",
    type: "website",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "DigiTools" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "DigiTools — Premium Browser Utility Tools",
    description:
      "25+ browser-based utilities. Fast, private, bilingual. Installable PWA, works offline.",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="alternate" hrefLang="en" href="/" />
        <link rel="alternate" hrefLang="fr" href="/" />
        <link rel="alternate" hrefLang="x-default" href="/" />
        {/* PWA: apple-touch icon, SVG favicon for modern browsers */}
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="icon" type="image/svg+xml" href="/logo-digi.svg" />
        {/* Mobile web app capability hints (older iOS) */}
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="DigiTools" />
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
          <I18nProvider>
            <AppShell>{children}</AppShell>
            <Toaster position="bottom-right" richColors closeButton />
            <ServiceWorkerRegistrar />
          </I18nProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

/**
 * Registers the DigiTools service worker for offline support.
 * Client-side only — wrapped in a try/catch so it never crashes the page.
 * The inline script is tiny (~600 bytes) and runs after the page loads.
 */
function ServiceWorkerRegistrar() {
  return (
    <script
      dangerouslySetInnerHTML={{
        __html: `(function(){if('serviceWorker' in navigator){window.addEventListener('load',function(){navigator.serviceWorker.register('/sw.js',{scope:'/'}).then(function(reg){console.log('[DigiTools] Service Worker registered:',reg.scope);setInterval(function(){reg.update();},3600000);}).catch(function(err){console.warn('[DigiTools] SW registration failed:',err);});});}})();`,
      }}
    />
  );
}
