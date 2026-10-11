import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Use standalone output for container builds (App Runner / Docker)
  // while preserving default Vercel serverless behavior when deployed on Vercel
  output: process.env.VERCEL ? undefined : 'standalone',
};

export default nextConfig;
