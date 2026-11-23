import { applyManual, emptySnapshot, mergeAdapterResults } from "./mergeSnapshot";
import { cacheSnapshotMedia } from "./cacheMedia";
import type { AdapterResult, ManualOverrides, ProfileSnapshot } from "./types";
import { normalizeUsername } from "./username";

async function fetchGraph(username: string, token: string): Promise<AdapterResult> {
  const res = await fetch("/api/instagram/profile", {
    method: "POST",
    headers: { "content-type": "application/json" },
    cache: "no-store",
    body: JSON.stringify({ username, token }),
  });
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: string };
    return {
      adapter: "graph",
      ok: false,
      message: body.error ?? `Request failed (${res.status})`,
      fields: {},
    };
  }
  return (await res.json()) as AdapterResult;
}

async function fetchPublic(username: string): Promise<AdapterResult> {
  const res = await fetch(`/api/instagram/public?username=${encodeURIComponent(username)}`, {
    cache: "no-store",
  });
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: string };
    return {
      adapter: "public",
      ok: false,
      message: body.error ?? `Request failed (${res.status})`,
      fields: {},
    };
  }
  return (await res.json()) as AdapterResult;
}

export type ImportOptions = {
  /** Optional. When set, Graph runs for the token owner’s account. */
  token?: string;
  skipPublic?: boolean;
  cacheImages?: boolean;
  manual?: ManualOverrides;
};

export async function importProfile(
  rawUsername: string,
  options: ImportOptions = {},
): Promise<ProfileSnapshot> {
  const username = normalizeUsername(rawUsername);
  if (!username) throw new Error("Enter a valid Instagram username.");

  const token = options.token?.trim() ?? "";
  const results: AdapterResult[] = [];

  if (token) {
    results.push(await fetchGraph(username, token));
  }

  if (!options.skipPublic) {
    try {
      results.push(await fetchPublic(username));
    } catch (error) {
      results.push({
        adapter: "public",
        ok: false,
        message: error instanceof Error ? error.message : "Public adapter failed.",
        fields: {},
      });
    }
  }

  if (results.length === 0) {
    throw new Error("Nothing to import — enable public import or paste an access token.");
  }

  let snapshot = mergeAdapterResults(username, results);
  if (!results.some((r) => r.ok)) {
    snapshot = emptySnapshot(username);
    snapshot.reports = results.map(({ adapter, ok, message }) => ({ adapter, ok, message }));
    const detail = results
      .map((r) => r.message)
      .filter(Boolean)
      .join(" · ");
    throw new Error(
      detail
        ? `Couldn’t load @${username}. ${detail}`
        : `Couldn’t load @${username}. The profile may be private, or Instagram blocked the request.`,
    );
  }

  if (options.cacheImages !== false) {
    snapshot = await cacheSnapshotMedia(snapshot);
  }

  if (options.manual) snapshot = applyManual(snapshot, options.manual);
  return snapshot;
}
