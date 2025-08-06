import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    // Enable standalone output for Docker
    output: "standalone",

    // Skip ESLint during build
    eslint: {
        ignoreDuringBuilds: true,
    },

    // Skip TypeScript type checking during build
    typescript: {
        ignoreBuildErrors: true,
    },

    // Allow access from local network
    async headers() {
        return [
            {
                source: "/(.*)",
                headers: [
                    {
                        key: "Access-Control-Allow-Origin",
                        value: "*",
                    },
                    {
                        key: "Access-Control-Allow-Methods",
                        value: "GET, POST, PUT, DELETE, OPTIONS",
                    },
                    {
                        key: "Access-Control-Allow-Headers",
                        value: "Content-Type, Authorization",
                    },
                ],
            },
        ];
    },
};

export default nextConfig;
