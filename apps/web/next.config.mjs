import { withSentryConfig } from "@sentry/nextjs";

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // react-plotly.js / plotly.js-dist-min ship browser-only code.
  transpilePackages: ["react-plotly.js"],
  env: {
    NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000",
  },
};

// Sentry wraps the config; no SENTRY_AUTH_TOKEN => source-map upload is skipped
// silently and the runtime SDK no-ops when NEXT_PUBLIC_SENTRY_DSN is unset.
export default withSentryConfig(nextConfig, {
  silent: true,
  hideSourceMaps: true,
  disableLogger: true,
});
