import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import type { SharedPlan } from "./types";
import { importVercelBlob } from "./vercelBlob";

const LOCAL_DIR = path.join(process.cwd(), ".data", "shares");

function onVercel(): boolean {
  return process.env.VERCEL === "1";
}

function hasBlobToken(): boolean {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

async function putLocal(plan: SharedPlan): Promise<void> {
  await mkdir(LOCAL_DIR, { recursive: true });
  await writeFile(path.join(LOCAL_DIR, `${plan.id}.json`), JSON.stringify(plan), "utf8");
}

async function getLocal(id: string): Promise<SharedPlan | null> {
  try {
    const raw = await readFile(path.join(LOCAL_DIR, `${id}.json`), "utf8");
    return JSON.parse(raw) as SharedPlan;
  } catch {
    return null;
  }
}

async function putBlob(plan: SharedPlan): Promise<void> {
  const mod = await importVercelBlob();
  if (!mod) {
    throw new Error("Install @vercel/blob to persist shares in production.");
  }
  await mod.put(`shares/${plan.id}.json`, JSON.stringify(plan), {
    access: "public",
    contentType: "application/json",
    addRandomSuffix: false,
    allowOverwrite: true,
  });
}

async function getBlob(id: string): Promise<SharedPlan | null> {
  const mod = await importVercelBlob();
  if (!mod) return null;
  try {
    const meta = await mod.head(`shares/${id}.json`);
    const response = await fetch(meta.url, { cache: "no-store" });
    if (!response.ok) return null;
    return (await response.json()) as SharedPlan;
  } catch {
    return null;
  }
}

export async function saveSharedPlan(plan: SharedPlan): Promise<void> {
  if (hasBlobToken()) {
    await putBlob(plan);
    return;
  }
  if (onVercel()) {
    throw new Error(
      "Share storage is not configured. Set BLOB_READ_WRITE_TOKEN (Vercel Blob) for production shares.",
    );
  }
  await putLocal(plan);
}

export async function loadSharedPlan(id: string): Promise<SharedPlan | null> {
  if (!/^[a-zA-Z0-9_-]{8,64}$/.test(id)) return null;
  if (hasBlobToken()) {
    const fromBlob = await getBlob(id);
    if (fromBlob) return fromBlob;
  }
  if (onVercel() && !hasBlobToken()) return null;
  return getLocal(id);
}

export function createShareId(): string {
  return crypto.randomUUID().replace(/-/g, "").slice(0, 16);
}
