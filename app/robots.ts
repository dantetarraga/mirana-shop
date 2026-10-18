import { getSiteUrl } from '@/shared/lib/env'
import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin', '/api', '/cuenta', '/checkout', '/carrito'],
    },
    sitemap: `${getSiteUrl()}/sitemap.xml`,
  }
}
