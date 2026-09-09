import type { NextConfig } from "next";
import path from "path";

let rawBackendUrl = (process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000").trim();
if (!rawBackendUrl.startsWith("http://") && !rawBackendUrl.startsWith("https://")) {
  rawBackendUrl = `http://${rawBackendUrl}`;
}
const backendUrl = rawBackendUrl.replace(/\/+$/, "");

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
