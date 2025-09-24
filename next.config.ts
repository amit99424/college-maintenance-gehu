import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'www.italcoholic.in',
        port: '',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
