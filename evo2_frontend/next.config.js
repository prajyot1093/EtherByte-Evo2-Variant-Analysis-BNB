/**
 * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially useful
 * for Docker builds.
 */
import "./src/env.js";

/** @type {import("next").NextConfig} */
const config = {
  reactStrictMode: false,
  eslint: {
    // Disable ESLint during build (for deployment)
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Disable TypeScript errors during build (for deployment)
    ignoreBuildErrors: true,
  },
};

export default config;
