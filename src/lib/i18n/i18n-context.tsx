"use client";

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react";
import enMessages from "@/messages/en.json";
import frMessages from "@/messages/fr.json";

export type Locale = "en" | "fr";

type Messages = typeof enMessages;

const messageMap: Record<Locale, Messages> = {
  en: enMessages,
  fr: frMessages as unknown as Messages,
};

const STORAGE_KEY = "toolforge-locale";

// Get a nested value from an object using a dot-path
function getValue(obj: any, path: string): any {
  const parts = path.split(".");
  let cur = obj;
  for (const p of parts) {
    if (cur == null) return undefined;
    cur = cur[p];
  }
  return cur;
}

// Replace {placeholders} in a string with values
function interpolate(str: string, params?: Record<string, string | number>): string {
  if (!params) return str;
  return str.replace(/\{(\w+)\}/g, (_, key) => String(params[key] ?? `{${key}}`));
}

interface I18nContextValue {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
  tArray: (key: string) => any[];
  tRaw: (key: string) => any;
}

const I18nContext = createContext<I18nContextValue | null>(null);

function detectBrowserLocale(): Locale {
  if (typeof navigator === "undefined") return "en";
  const langs = navigator.languages ?? [navigator.language];
  for (const l of langs) {
    if (l.toLowerCase().startsWith("fr")) return "fr";
  }
  // Default fallback: English for any non-French
  return "en";
}

function getStoredLocale(): Locale | null {
  if (typeof window === "undefined") return null;
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === "en" || stored === "fr") return stored;
  } catch {
    // ignore
  }
  return null;
}

interface I18nProviderProps {
  children: ReactNode;
  /**
   * Locale determined on the server (from the `toolforge-locale` cookie).
   * Server and client first render MUST use the same value to avoid
   * hydration mismatches. Defaults to "en" when not provided.
   */
  initialLocale?: Locale;
}

export function I18nProvider({ children, initialLocale = "en" }: I18nProviderProps) {
  // Seed with the server-provided locale so SSR HTML matches the first
  // client render. Detection of browser preference happens after mount
  // only when there is no explicit cookie/initial locale.
  const [locale, setLocaleState] = useState<Locale>(initialLocale);
  const [hasMounted, setHasMounted] = useState(false);

  // Post-mount: persist choice + reflect <html lang>. If the server already
  // sent a locale (cookie), we keep it — no second-guessing with navigator.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (!hasMounted) {
      // First visit (no cookie → server sent "en"): detect browser language.
      const stored = getStoredLocale();
      const detected = stored ?? detectBrowserLocale();
      if (detected !== initialLocale) {
        setLocaleState(detected);
      }
      setHasMounted(true);
      return;
    }
  }, [hasMounted, initialLocale]);
  /* eslint-enable react-hooks/set-state-in-effect */

  // Persist + reflect <html lang> on locale change.
  useEffect(() => {
    if (!hasMounted) return;
    document.documentElement.lang = locale;
    try {
      window.localStorage.setItem(STORAGE_KEY, locale);
    } catch {
      // ignore
    }
    // Cookie for SSR/headers
    document.cookie = `${STORAGE_KEY}=${locale};path=/;max-age=${60 * 60 * 24 * 365};SameSite=Lax`;
  }, [locale, hasMounted]);

  const setLocale = useCallback((l: Locale) => setLocaleState(l), []);

  const t = useCallback(
    (key: string, params?: Record<string, string | number>) => {
      const messages = messageMap[locale] ?? messageMap.en;
      const val = getValue(messages, key);
      if (typeof val === "string") return interpolate(val, params);
      // Fallback to English if missing
      const fallback = getValue(messageMap.en, key);
      if (typeof fallback === "string") return interpolate(fallback, params);
      return key;
    },
    [locale]
  );

  const tArray = useCallback(
    (key: string) => {
      const messages = messageMap[locale] ?? messageMap.en;
      const val = getValue(messages, key);
      if (Array.isArray(val)) return val;
      const fallback = getValue(messageMap.en, key);
      return Array.isArray(fallback) ? fallback : [];
    },
    [locale]
  );

  const tRaw = useCallback(
    (key: string) => {
      const messages = messageMap[locale] ?? messageMap.en;
      const val = getValue(messages, key);
      if (val !== undefined) return val;
      return getValue(messageMap.en, key);
    },
    [locale]
  );

  return (
    <I18nContext.Provider value={{ locale, setLocale, t, tArray, tRaw }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    throw new Error("useI18n must be used within I18nProvider");
  }
  return ctx;
}
