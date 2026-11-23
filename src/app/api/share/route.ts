import { NextResponse } from "next/server";
import { createShareId, saveSharedPlan } from "@/features/share/store";
import type { CreateShareRequest, SharedPlan } from "@/features/share/types";

export const runtime = "nodejs";

function isShareBody(value: unknown): value is CreateShareRequest {
  if (!value || typeof value !== "object") return false;
  const body = value as CreateShareRequest;
  return (
    typeof body.username === "string" &&
    body.username.length > 0 &&
    body.snapshot != null &&
    typeof body.snapshot === "object" &&
    Array.isArray(body.planned)
  );
}

export async function POST(request: Request) {
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  if (!isShareBody(json)) {
    return NextResponse.json({ error: "Invalid share payload." }, { status: 400 });
  }

  // Hard cap — data URLs can get large; reject runaway payloads.
  const raw = JSON.stringify(json);
  if (raw.length > 12_000_000) {
    return NextResponse.json({ error: "Share is too large. Try fewer posts." }, { status: 413 });
  }

  const plan: SharedPlan = {
    id: createShareId(),
    createdAt: Date.now(),
    username: json.username.trim().replace(/^@/, ""),
    snapshot: { ...json.snapshot, reports: [] },
    planned: json.planned,
    viewMode: json.viewMode,
    phoneModelId: json.phoneModelId,
    phoneScaleMode: json.phoneScaleMode,
  };

  try {
    await saveSharedPlan(plan);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not save share.";
    return NextResponse.json({ error: message }, { status: 500 });
  }

  return NextResponse.json({ id: plan.id, url: `/s/${plan.id}` });
}
