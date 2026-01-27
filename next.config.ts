import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  experimental: {
    // Needed for large multipart uploads when middleware (Clerk) runs on /api/upload.
    // Otherwise Next truncates the request body at 10MB and req.formData() fails.
    proxyClientMaxBodySize: '200mb',
    serverActions: {
      allowedOrigins: [
        'localhost:3000',
        '*.app.github.dev',
        '*.vercel.app',
        'weavy-ai-peach.vercel.app',
      ],
    },
  },
  // Serve index.html at root for unauthenticated users
  async rewrites() {
    return [
      {
        source: '/landing',
        destination: '/index.html',
      },
    ];
  },
  // Handle forwarded headers from Codespaces/proxies
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
