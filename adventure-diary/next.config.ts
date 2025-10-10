import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // Enable standalone output for Docker deployment
  output: 'standalone',
  
  // Fix workspace root detection warnings by explicitly setting the root
  outputFileTracingRoot: path.join(__dirname),
  
  // External packages for server components (moved from experimental)
  serverExternalPackages: ['better-sqlite3'],
  
  // Ignore TypeScript and ESLint errors during build
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  
  // Webpack configuration for better-sqlite3
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals.push('better-sqlite3');
    }
    return config;
  },
};

export default nextConfig;
