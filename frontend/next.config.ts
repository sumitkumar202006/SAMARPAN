import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // ─── Output mode (standalone for Docker) ────────────────────────────────────
  output: "standalone",

  // ─── Image optimization ───────────────────────────────────────────────────
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "api.dicebear.com" },
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      { protocol: "https", hostname: "graph.facebook.com" },
      { protocol: "https", hostname: "res.cloudinary.com" },
      { protocol: "http",  hostname: "localhost" },
    ],
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 604800,
  },

  // ─── Compression ──────────────────────────────────────────────────────────
  compress: true,

  // ─── Strict mode ──────────────────────────────────────────────────────────
  reactStrictMode: true,

  // ─── Security & cache headers ─────────────────────────────────────────────
  // NOTE: Cache-Control on /_next/static is set by Next.js automatically.
  // Only add headers for app-level routes here to avoid conflicts.
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options",  value: "nosniff" },
          { key: "X-Frame-Options",         value: "DENY" },
          { key: "X-XSS-Protection",        value: "1; mode=block" },
          { key: "Referrer-Policy",         value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy",      value: "geolocation=(), microphone=(), camera=()" },
        ],
      },
      // Public font/image assets — 7 days
      {
        source: "/(.*)\\.(ico|jpg|jpeg|png|gif|svg|webp|avif|woff|woff2|ttf)",
        headers: [
          { key: "Cache-Control", value: "public, max-age=604800, stale-while-revalidate=86400" },
        ],
      },
    ];
  },

  // ─── Turbopack config (Next.js 16 default bundler) ───────────────────────
  // Required to silence the webpack/turbopack conflict warning.
  turbopack: {
    // Optimise package imports for smaller bundles
    resolveAlias: {},
  },

  // ─── Experimental ─────────────────────────────────────────────────────────
  experimental: {
    optimizePackageImports: [
      "lucide-react",
      "framer-motion",
    ],
  },
};

export default nextConfig;
