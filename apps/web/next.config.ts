import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  transpilePackages: ["@orchard/shared"],
  outputFileTracingRoot: process.cwd().replace("/apps/web", ""),
};

export default nextConfig;
