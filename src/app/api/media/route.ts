import { type NextRequest } from "next/server";

export const dynamic = "force-dynamic";

const ALLOWED_HOSTS = [
  "cdninstagram.com",
  "fbcdn.net",
  "instagram.com",
  "cdn.fbsbx.com",
  "scontent.instagram.com",
];

function allowed(url: URL): boolean {
  return (
    url.protocol === "https:" &&
    ALLOWED_HOSTS.some((host) => url.hostname === host || url.hostname.endsWith(`.${host}`))
  );
}

export async function GET(request: NextRequest) {
  let target: URL;
  try {
    target = new URL(request.nextUrl.searchParams.get("url") ?? "");
  } catch {
    return new Response("Invalid url", { status: 400 });
  }
  if (!allowed(target)) return new Response("Host not allowed", { status: 403 });

  const upstream = await fetch(target, { cache: "no-store" });
  const type = upstream.headers.get("content-type") ?? "";
  if (!upstream.ok || !type.startsWith("image/")) {
    return new Response("Upstream image unavailable", { status: 502 });
  }
  return new Response(upstream.body, {
    headers: { "content-type": type, "cache-control": "private, max-age=3600" },
  });
}
