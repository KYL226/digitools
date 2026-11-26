import { cookies } from "next/headers";
import enMessages from "@/messages/en.json";
import frMessages from "@/messages/fr.json";

export type Locale = "en" | "fr";

/** Server-side locale from the `toolforge-locale` cookie (defaults to English). */
export async function getServerLocale(): Promise<Locale> {
  const store = await cookies();
  const value = store.get("toolforge-locale")?.value;
  return value === "fr" ? "fr" : "en";
}

type Messages = typeof enMessages;

const messageMap: Record<Locale, Messages> = {
  en: enMessages,
  fr: frMessages as unknown as Messages,
};

/** Server-side messages for metadata / SSR content. */
export function getMessages(locale: Locale): Messages {
  return messageMap[locale];
}
