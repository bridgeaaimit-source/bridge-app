import type { NextConfig } from "next";

const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
})

const nextConfig: NextConfig = {
  typescript: {
    tsconfigPath: "./tsconfig.json",
  },
};

export default withBundleAnalyzer(nextConfig);
