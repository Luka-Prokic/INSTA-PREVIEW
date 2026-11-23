/** Optional Vercel Blob — avoided as a static import so local builds work without the package. */

export type VercelBlobMod = {
  put: (
    pathname: string,
    body: string,
    options: {
      access: "public";
      contentType: string;
      addRandomSuffix: boolean;
      allowOverwrite: boolean;
    },
  ) => Promise<unknown>;
  head: (pathname: string) => Promise<{ url: string }>;
};

export async function importVercelBlob(): Promise<VercelBlobMod | null> {
  try {
    // webpackIgnore: package is optional; only needed when BLOB_READ_WRITE_TOKEN is set.
    const mod = await import(/* webpackIgnore: true */ "@vercel/blob");
    return mod as unknown as VercelBlobMod;
  } catch {
    return null;
  }
}
