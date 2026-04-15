import type { NextConfig } from "next";
import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  customWorkerSrc: "worker",
  workboxOptions: {
    runtimeCaching: [
      // App shell: cache-first for static assets
      {
        urlPattern: /^\/_next\/static\/.*/i,
        handler: "CacheFirst",
        options: {
          cacheName: "static-assets",
          expiration: {
            maxEntries: 200,
            maxAgeSeconds: 365 * 24 * 60 * 60, // 1 year
          },
        },
      },
      // Monthly reports API: stale-while-revalidate
      {
        urlPattern: /^\/api\/reports\/.*/i,
        handler: "StaleWhileRevalidate",
        options: {
          cacheName: "reports-cache",
          expiration: {
            maxEntries: 50,
            maxAgeSeconds: 3600,
          },
        },
      },
      // Categories API: stale-while-revalidate
      {
        urlPattern: /^\/api\/categories.*/i,
        handler: "StaleWhileRevalidate",
        options: {
          cacheName: "categories-cache",
          expiration: {
            maxEntries: 10,
            maxAgeSeconds: 3600,
          },
        },
      },
    ],
  },
});

const nextConfig: NextConfig = {
  // Silence Turbopack/webpack conflict warning from next-pwa (PWA is disabled in dev)
  turbopack: {},
};

export default withPWA(nextConfig);
