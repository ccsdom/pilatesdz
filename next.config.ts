import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  distDir: process.env.PILATES_AUTH_TEST === "true" ? ".next-auth-tests" : process.env.PILATES_CLOUD_DEV === "true" ? ".next-cloud" : ".next",
};

export default nextConfig;
