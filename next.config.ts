// next.config.ts
import type { NextConfig } from 'next';

const withPWA = require('next-pwa')({
  dest: 'public',
  register: false, // MUDAMOS PARA FALSE
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
  sw: 'sw.js', // Nome do seu arquivo na pasta public
});

const nextConfig: NextConfig = {
  reactStrictMode: true,
  webpack: (config: any) => {
    return config;
  },
};

export default withPWA(nextConfig as any);