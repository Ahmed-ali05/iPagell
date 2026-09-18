import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [{
      source: "/:path*",
      has: [{ type: "host", value: "(?:www\\.ipagell\\.website|[^/]+\\.chatgpt\\.site)" }],
      destination: "https://ipagell.website/:path*",
      permanent: true,
    }];
  },
};

export default nextConfig;
