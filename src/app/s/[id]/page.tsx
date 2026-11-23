import type { Metadata } from "next";
import { ShareMissing, ShareView } from "@/components/share/ShareView";
import { loadSharedPlan } from "@/features/share/store";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const plan = await loadSharedPlan(id);
  if (!plan) {
    return { title: "Share not found" };
  }
  return {
    title: `@${plan.username} · shared plan`,
    description: `Preview a shared Instagram plan for @${plan.username}. Device switching only — no API access.`,
  };
}

export default async function SharedPlanPage({ params }: Props) {
  const { id } = await params;
  const plan = await loadSharedPlan(id);
  if (!plan) return <ShareMissing id={id} />;
  return <ShareView plan={plan} />;
}
