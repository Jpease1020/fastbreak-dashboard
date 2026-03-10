import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  distDir: process.env.FASTBREAK_E2E_MOCK === "1" ? ".next-e2e" : ".next",
};

export default nextConfig;
