import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  distDir: process.env.PILATES_AUTH_TEST === "true" ? ".next-auth-tests" : ".next",
};

export default nextConfig;
