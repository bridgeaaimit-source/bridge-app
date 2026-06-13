import type { NextConfig } from "next";

import withBundleAnalyzerInit from '@next/bundle-analyzer';
const withBundleAnalyzer = withBundleAnalyzerInit({
  enabled: process.env.ANALYZE === 'true',
});

const nextConfig: NextConfig = {
  typescript: {
    tsconfigPath: "./tsconfig.json",
  },
  experimental: {
    optimizePackageImports: ["lucide-react", "framer-motion"],
  },
};

export default withBundleAnalyzer(nextConfig);
