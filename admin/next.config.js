const path = require('path');
const { withSentryConfig } = require('@sentry/nextjs');

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  reactStrictMode: true,
  swcMinify: true,
  images: {
    domains: ['localhost'],
  },
  // Resolve server deps from workspace root so webpack cache paths match (pnpm monorepo)
  experimental: {
    outputFileTracingRoot: path.join(__dirname, '..'),
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        // NestJS 서버 (포트 3001). Admin은 대부분 NEXT_PUBLIC_ADMIN_API_URL로 직접 호출
        destination: `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/:path*`,
      },
    ];
  },
};

module.exports = withSentryConfig(nextConfig, {
  org: 'oddscast',
  project: 'javascript-nextjs',
  silent: !process.env.CI,
  widenClientFileUpload: true,
  disableLogger: true,
});
