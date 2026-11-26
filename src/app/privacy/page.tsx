import type { Metadata } from "next";
import { LegalPage, generateLegalMetadata } from "@/components/legal/legal-page";

export const generateMetadata = generateLegalMetadata("privacy");

export default function PrivacyPage() {
  return <LegalPage slug="privacy" />;
}
