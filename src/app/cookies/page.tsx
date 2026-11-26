import type { Metadata } from "next";
import { LegalPage, generateLegalMetadata } from "@/components/legal/legal-page";

export const generateMetadata = generateLegalMetadata("cookies");

export default function CookiesPage() {
  return <LegalPage slug="cookies" />;
}
