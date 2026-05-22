/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // react-plotly.js / plotly.js-dist-min ship browser-only code.
  transpilePackages: ["react-plotly.js"],
  env: {
    NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000",
  },
};

export default nextConfig;
