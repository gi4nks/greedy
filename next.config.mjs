/** @type {import('next').NextConfig} */
import path from "path";
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const nextConfig = {
  // Enable standalone output for Docker deployment
  output: "standalone",

  // Fix workspace root detection warnings by explicitly setting the root
  outputFileTracingRoot: __dirname,

  // External packages for server components (moved from experimental)
  serverExternalPackages: ["better-sqlite3"],

  // Ignore TypeScript and ESLint errors during build
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },

  // Webpack configuration for better-sqlite3 and path resolution
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals.push("better-sqlite3");
    }

    // Add path resolution for @ alias
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': path.resolve(__dirname, 'src'),
    };

    return config;
  },
};

export default nextConfig;
