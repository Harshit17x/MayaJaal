import type { NextConfig } from "next";
import path from "path";

const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

const nextConfig: NextConfig = {
  outputFileTracingRoot: path.resolve(__dirname),
  async rewrites() {
    return [
      {
        source: "/api/backend/:path*",
        destination: `${backendUrl}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
