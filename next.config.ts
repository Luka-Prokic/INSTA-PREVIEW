import type { NextConfig } from "next";

const config: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@caka/admin"],
  // Optional — only used when BLOB_READ_WRITE_TOKEN is set.
  serverExternalPackages: ["@vercel/blob"],
};

export default config;
