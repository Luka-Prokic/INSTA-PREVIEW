import { NextResponse, type NextRequest } from "next/server";
import { fetchPublicProfile } from "@/features/import/adapters/publicPage";
import type { AdapterResult } from "@/features/import/types";
import { normalizeUsername } from "@/features/import/username";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const username = normalizeUsername(request.nextUrl.searchParams.get("username") ?? "");
  if (!username) {
    return NextResponse.json({ error: "Invalid username" }, { status: 400 });
  }
  try {
    return NextResponse.json(await fetchPublicProfile(username));
  } catch (error) {
    const result: AdapterResult = {
      adapter: "public",
      ok: false,
      message: error instanceof Error ? error.message : "Public page request failed.",
      fields: {},
    };
    return NextResponse.json(result);
  }
}
