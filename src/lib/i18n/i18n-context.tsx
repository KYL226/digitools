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

// Always start with "en" on both server and client first render so that
// hydration matches. The actual user-preferred locale is detected in a
// post-mount effect below.
const SERVER_LOCALE: Locale = "en";

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(SERVER_LOCALE);
  const [hasMounted, setHasMounted] = useState(false);

  // Detect user's preferred locale AFTER mount so server and client render
  // the same initial HTML (avoiding hydration mismatch). This is a legitimate
  // use of setState-in-effect because the detected value is external state
  // (browser localStorage + navigator.languages) that isn't available on the
  // server, and React specifically supports this pattern for client-only data.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    const stored = getStoredLocale();
    const detected = stored ?? detectBrowserLocale();
    if (detected !== SERVER_LOCALE) {
      setLocaleState(detected);
    }
    setHasMounted(true);
  }, []);
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
