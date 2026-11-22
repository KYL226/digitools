"use client";

import { useEffect } from "react";
import { Header } from "./header";
import { Footer } from "./footer";
import { Router } from "./router";
import { StructuredData } from "./structured-data";

export function AppShell({ children }: { children: React.ReactNode }) {
  // Set initial document lang
  useEffect(() => {
    const stored = localStorage.getItem("toolforge-locale");
    if (stored === "fr" || stored === "en") {
      document.documentElement.lang = stored;
    }
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <StructuredData />
      <Header />
      <main className="flex-1">
        <Router />
      </main>
      <Footer />
    </div>
  );
}
