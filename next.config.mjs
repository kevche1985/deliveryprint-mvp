/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains; preload' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'geolocation=(), camera=(), microphone=()' },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "base-uri 'self'",
              "object-src 'none'",
              "img-src 'self' data: https:",
              "style-src 'self' 'unsafe-inline'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.paypal.com https://www.paypalobjects.com",
              [
                "connect-src 'self'",
                "https://*.supabase.co",
                "https://api.resend.com",
                "https://id.wompi.sv",
                "https://api.wompi.sv",
                "https://api.paypal.com",
                "https://*.paypal.com",
              ].join(' '),
              [
                "frame-src 'self'",
                "https://*.paypal.com",
              ].join(' '),
            ].join('; '),
          },
        ],
      },
    ]
  },
}

export default nextConfig
