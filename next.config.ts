import type { NextConfig } from 'next';

const isProduction = process.env.NEXT_PUBLIC_SITE_ENVIRONMENT === 'prd';

const nextConfig: NextConfig = {
  serverExternalPackages: ['firebase-admin'],
  async headers() {
    if (!isProduction) {
      return [
        {
          source: '/:path*',
          headers: [
            {
              key: 'X-Robots-Tag',
              value: 'noindex, nofollow, noarchive, nosnippet',
            },
          ],
        },
      ];
    }
    return [];
  },
};

export default nextConfig;

