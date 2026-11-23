import { NextResponse } from "next/server";
import { loadSharedPlan } from "@/features/share/store";

export const runtime = "nodejs";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const plan = await loadSharedPlan(id);
  if (!plan) {
    return NextResponse.json({ error: "Share not found." }, { status: 404 });
  }
  return NextResponse.json(plan, {
    headers: {
      "Cache-Control": "public, s-maxage=60, stale-while-revalidate=600",
    },
  });
}
