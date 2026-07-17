import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // GitHub Pages serves pre-rendered files only; this prevents Next.js from
  // requiring a Node.js server at runtime.
  output: "export",
  trailingSlash: true,
  basePath: process.env.NEXT_PUBLIC_BASE_PATH || undefined,
};

export default nextConfig;
