declare module "@vercel/blob" {
  export function put(
    pathname: string,
    body: string | Blob | ArrayBuffer | ReadableStream,
    options?: {
      access?: "public" | "private";
      contentType?: string;
      addRandomSuffix?: boolean;
      allowOverwrite?: boolean;
    },
  ): Promise<{ url: string; pathname: string }>;

  export function head(urlOrPathname: string): Promise<{ url: string; pathname: string }>;
}
