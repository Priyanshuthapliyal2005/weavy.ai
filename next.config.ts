import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  experimental: {
    // Needed for large multipart uploads when middleware (Clerk) runs on /api/upload.
    // Otherwise Next truncates the request body at 10MB and req.formData() fails.
    proxyClientMaxBodySize: '200mb',
  },
};

export default nextConfig;
