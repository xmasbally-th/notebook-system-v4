/** @type {import('next').NextConfig} */
const nextConfig = {
    // Expose env vars to client-side and edge runtime (middleware)
    env: {
        NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
        NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    },
    // Experimental features for better env handling
    experimental: {
        // Ensure env vars are loaded in edge runtime
        serverActions: {
            allowedOrigins: ['localhost:3000'],
        },
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
