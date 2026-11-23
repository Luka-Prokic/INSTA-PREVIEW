import { NextResponse, type NextRequest } from "next/server";
import { fetchGraphProfile, tokenFor } from "@/features/import/adapters/graphApi";
import type { AdapterResult } from "@/features/import/types";
import { normalizeUsername } from "@/features/import/username";

export const dynamic = "force-dynamic";

type Body = { username?: string; token?: string };

function fail(message: string, status = 200): NextResponse {
  const result: AdapterResult = { adapter: "graph", ok: false, message, fields: {} };
  return NextResponse.json(result, { status });
}

async function resolveRequest(request: NextRequest): Promise<{ username: string; token: string } | NextResponse> {
  let usernameRaw = "";
  let token = "";

  if (request.method === "POST") {
    const body = (await request.json().catch(() => ({}))) as Body;
    usernameRaw = body.username ?? "";
    token = (body.token ?? "").trim();
  } else {
    usernameRaw = request.nextUrl.searchParams.get("username") ?? "";
  }

  const username = normalizeUsername(usernameRaw);
  if (!username) {
    return NextResponse.json({ error: "Invalid username" }, { status: 400 });
  }

  if (!token) token = tokenFor(username) ?? "";
  if (!token) {
    return fail(
      `No Instagram access token provided for @${username}. Paste your token in Connect profile.`,
    );
  }

  return { username, token };
}

async function handle(request: NextRequest) {
  const resolved = await resolveRequest(request);
  if (resolved instanceof NextResponse) return resolved;
  const { username, token } = resolved;

  try {
    return NextResponse.json(await fetchGraphProfile(username, token));
  } catch (error) {
    return fail(error instanceof Error ? error.message : "Instagram API request failed.");
  }
}

export async function GET(request: NextRequest) {
  return handle(request);
}

export async function POST(request: NextRequest) {
  return handle(request);
}
