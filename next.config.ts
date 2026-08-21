import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Standalone output bundles the server + pruned node_modules into
  // .next/standalone, which scripts/build-portable.ps1 packages into a
  // portable Windows app (see dist-portable/).
  output: "standalone",
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
