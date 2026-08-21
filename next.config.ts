import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Standalone output bundles the server + pruned node_modules into
  // .next/standalone, which scripts/build-portable.ps1 packages into a
  // portable Windows app (see dist-portable/).
  output: "standalone",
  // The dev server 403s /_next assets requested from any origin but
  // localhost, which silently kills hydration when a phone on the LAN
  // opens the dev site to test touch: the HTML renders, every deferred
  // chunk is Forbidden, and nothing interactive works. Opt the LAN
  // address in per-machine rather than hardcoding anyone's IP:
  //   ALLOWED_DEV_ORIGIN=192.168.x.x npm run dev   (comma-separate for
  // several). Dev-only — production builds ignore allowedDevOrigins.
  allowedDevOrigins: process.env.ALLOWED_DEV_ORIGIN
    ? process.env.ALLOWED_DEV_ORIGIN.split(",").map((s) => s.trim())
    : [],
  async redirects() {
    return [
      // The grown-up section's old URL, from before it split by language.
      {
        source: "/grown-ups",
        destination: "/mandarin-grown-ups",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
