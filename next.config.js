/** @type {import('next').NextConfig} */

const securityHeaders = [
    {
        key: 'X-DNS-Prefetch-Control',
        value: 'on',
    },
    {
        // Prevent clickjacking — disallow embedding in iframes from other origins
        key: 'X-Frame-Options',
        value: 'SAMEORIGIN',
    },
    {
        // Prevent MIME type sniffing
        key: 'X-Content-Type-Options',
        value: 'nosniff',
    },
    {
        // Limit referrer information sent on cross-origin requests
        key: 'Referrer-Policy',
        value: 'strict-origin-when-cross-origin',
    },
    {
        // Disable unused browser features
        key: 'Permissions-Policy',
        value: 'camera=(), microphone=(), geolocation=(), browsing-topics=()',
    },
]

const nextConfig = {
    // Expose env vars to client-side and edge runtime (middleware)
    env: {
        NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
        NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    },
    async headers() {
        return [
            {
                source: '/(.*)',
                headers: securityHeaders,
            },
        ]
    },
    async redirects() {
        return [
            {
                source: '/admin/returns',
                destination: '/admin/loans?tab=returns',
                permanent: true,
            },
        ]
    },
    // Experimental features for better env handling
    experimental: {
        serverActions: {
            // Add your production domain here when deploying
            allowedOrigins: [
                'localhost:3000',
                process.env.NEXT_PUBLIC_APP_URL?.replace(/^https?:\/\//, '') || '',
            ].filter(Boolean),
        },
        // Optimize barrel imports to reduce bundle size
        optimizePackageImports: ['lucide-react', 'recharts', 'date-fns'],
    },
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'kdqcypgmpogoekgklzun.supabase.co',
                pathname: '/storage/v1/object/public/**',
            },
        ],
    },
};

module.exports = nextConfig;

