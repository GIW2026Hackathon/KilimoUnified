/** @type {import('next').NextConfig} */
const { PHASE_DEVELOPMENT_SERVER } = require("next/constants");

const nextConfig = (phase) => ({
  distDir: phase === PHASE_DEVELOPMENT_SERVER ? ".next-dev" : ".next",
  images: { unoptimized: true },
  reactStrictMode: true,
});

module.exports = nextConfig;
