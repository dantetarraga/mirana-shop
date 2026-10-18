import type { NextConfig } from 'next'

const isProduction = process.env.NODE_ENV === 'production'

// Hosts de imágenes de relleno (seed/demo). En producción las imágenes reales
// viven en Cloudinary: permitirlos ahí solo agranda la superficie de la CSP.
const DEV_IMAGE_HOSTS = ['picsum.photos', 'images.unsplash.com', 'plus.unsplash.com']
const IMAGE_HOSTS = [
  'res.cloudinary.com',
  'placehold.co',
  ...(isProduction ? [] : DEV_IMAGE_HOSTS),
]

const contentSecurityPolicy = [
  "default-src 'self'",
  "base-uri 'self'",
  "frame-ancestors 'none'",
  "form-action 'self'",
  "object-src 'none'",
  // React en desarrollo usa eval() para reconstruir callstacks entre entornos;
  // sin 'unsafe-eval' el dev server rompe. En producción React nunca lo usa.
  isProduction
    ? "script-src 'self' 'unsafe-inline'"
    : "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
  "style-src 'self' 'unsafe-inline'",
  `img-src 'self' data: blob: ${IMAGE_HOSTS.map((host) => `https://${host}`).join(' ')}`,
  "font-src 'self' data:",
  isProduction
    ? "connect-src 'self'"
    : "connect-src 'self' ws: wss:",
  ...(isProduction ? ['upgrade-insecure-requests'] : []),
].join('; ')

const nextConfig: NextConfig = {
  images: {
    // Sin el optimizador de Next: reprocesar con sharp en el servidor era
    // trabajo duplicado y dependía de que sharp funcionara en el hosting, que
    // es justo lo que fallaba. En su lugar un loader propio pide a cada CDN
    // (Cloudinary, Unsplash) el ancho exacto de cada entrada del srcSet; antes,
    // con `unoptimized: true`, se descargaba siempre el original.
    loader: 'custom',
    loaderFile: './shared/lib/image-loader.ts',
    // Con loader propio Next no valida estos hosts, pero se mantienen como
    // inventario de orígenes permitidos (y alineados con la CSP de arriba).
    remotePatterns: IMAGE_HOSTS.map((hostname) => ({ protocol: 'https' as const, hostname })),
  },
  experimental: {
    serverActions: {
      // El límite por defecto de las Server Actions es 1MB, pero uploadImage
      // acepta imágenes de hasta 5MB: cualquier foto de móvil pasaba de 1MB y
      // la subida fallaba antes de llegar a la action. Las imágenes se suben de
      // una en una (ver MultiImageField), así que basta con cubrir un archivo.
      bodySizeLimit: '6mb',
    },
  },
  headers: async () => [
    {
      source: '/(.*)',
      headers: [
        { key: 'X-Frame-Options', value: 'DENY' },
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        { key: 'Content-Security-Policy', value: contentSecurityPolicy },
        ...(isProduction
          ? [
              {
                key: 'Strict-Transport-Security',
                value: 'max-age=31536000; includeSubDomains',
              },
            ]
          : []),
      ],
    },
  ],
}

export default nextConfig
