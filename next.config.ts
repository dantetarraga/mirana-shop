import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  images: {
    // Cloudinary ya optimiza/redimensiona/convierte formato vía parámetros de URL
    // (f_auto,q_auto) — reprocesar con sharp en el servidor sería trabajo duplicado
    // y depende de que sharp funcione en el hosting, que es justo lo que fallaba.
    //
    // Con unoptimized:true las imágenes se sirven directo desde el host remoto
    // (no pasan por el optimizador de Next), así que dangerouslyAllowSVG /
    // contentDispositionType / contentSecurityPolicy del bloque images no
    // aplicaban — se quitaron para no dar falsa sensación de protección.
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
      },
      {
        protocol: 'https',
        hostname: 'placehold.co',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'plus.unsplash.com',
      },
    ],
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
      ],
    },
  ],
}

export default nextConfig
