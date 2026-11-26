import type { Metadata } from "next";
import { LegalPage, generateLegalMetadata } from "@/components/legal/legal-page";

export const generateMetadata = generateLegalMetadata("terms");

export default function TermsPage() {
  return <LegalPage slug="terms" />;
}
