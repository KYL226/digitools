"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Header } from "./header";
import { Footer } from "./footer";

/**
 * Legacy hash URLs (/#/tools/slug, #/categories/slug) → real paths.
 * Keeps old shared links working after the migration to App Router.
 */
function HashRedirect() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const hash = window.location.hash.replace(/^#\/?/, "");
    if (!hash) return;
    const parts = hash.split("/");
    let target: string | null = null;
    if (parts[0] === "tools" && parts[1]) {
      target = `/tools/${parts[1]}`;
    } else if (parts[0] === "categories" && parts[1]) {
      target = `/category/${parts[1]}`;
    }
    if (target && target !== pathname) {
      router.replace(target);
    }
  }, [router, pathname]);

  return null;
}

export function AppShell({ children }: { children: React.ReactNode }) {
  // Set initial document lang from stored locale
  useEffect(() => {
    const stored = localStorage.getItem("toolforge-locale");
    if (stored === "fr" || stored === "en") {
      document.documentElement.lang = stored;
    }
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <HashRedirect />
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
