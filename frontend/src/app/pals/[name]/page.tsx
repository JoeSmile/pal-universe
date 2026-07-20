import type { Metadata } from "next";
import { PalDetailPageClient } from "@/components/pal-detail";

interface PalDetailPageProps {
  params: Promise<{ name: string }>;
}

export async function generateMetadata({
  params,
}: PalDetailPageProps): Promise<Metadata> {
  const { name } = await params;
  const decoded = decodeURIComponent(name);
  return {
    title: `${decoded} · Pal Universe`,
    description: `Palworld encyclopedia — ${decoded} detail`,
  };
}

export default async function PalDetailPage({
  params,
}: PalDetailPageProps): Promise<React.ReactElement> {
  const { name } = await params;
  return <PalDetailPageClient name={name} />;
}
