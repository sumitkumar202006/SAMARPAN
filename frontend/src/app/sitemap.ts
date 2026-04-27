import type { MetadataRoute } from 'next';

/**
 * SSG Sitemap — generated at build time.
 * Next.js serves this at /sitemap.xml automatically.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_APP_URL || 'https://samarpan-quiz.vercel.app';

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${base}/`,            lastModified: new Date(), changeFrequency: 'weekly',  priority: 1.0 },
    { url: `${base}/marketplace`, lastModified: new Date(), changeFrequency: 'daily',   priority: 0.9 },
    { url: `${base}/leaderboard`, lastModified: new Date(), changeFrequency: 'hourly',  priority: 0.9 },
    { url: `${base}/pricing`,     lastModified: new Date(), changeFrequency: 'monthly', priority: 0.8 },
    { url: `${base}/about`,       lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
    { url: `${base}/contact`,     lastModified: new Date(), changeFrequency: 'monthly', priority: 0.6 },
    { url: `${base}/auth`,        lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
    { url: `${base}/events`,      lastModified: new Date(), changeFrequency: 'daily',   priority: 0.8 },
  ];

  return staticRoutes;
}
