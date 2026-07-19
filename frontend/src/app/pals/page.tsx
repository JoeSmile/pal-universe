import type { Metadata } from "next";
import { PalsPageClient } from "@/components/pals-page-client";

export const metadata: Metadata = {
  title: "Pal List · Pal Universe",
  description: "Browse and filter all Palworld pals",
};

export default function PalsPage(): React.ReactElement {
  return <PalsPageClient />;
}
