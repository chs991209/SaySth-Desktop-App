import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  output: "export",
  async rewrites() {
    return [
      {
        source: "/:path*",
        destination: "https://f7bf-59-1-100-185.ngrok-free.app/:path*",
      },
    ];
  },
};

export default nextConfig;
