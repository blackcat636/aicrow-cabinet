import type { MetadataRoute } from 'next';

/**
 * Served at /robots.txt (text/plain). Must not be caught by auth redirects in middleware.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/'],
      },
    ],
  };
}
