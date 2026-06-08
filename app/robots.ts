import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const isDev = process.env.NEXT_PUBLIC_SITE_ENVIRONMENT === 'dev';

  if (isDev) {
    return {
      rules: {
        userAgent: '*',
        disallow: '/',
      },
    };
  }

  return {
    rules: {
      userAgent: '*',
      allow: '/',
    },
    sitemap: `${process.env.NEXT_PUBLIC_APP_URL}/sitemap.xml`,
  };
}
