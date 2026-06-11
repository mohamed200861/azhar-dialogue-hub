import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from "vite-plugin-pwa";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
    VitePWA({
      // Single registrar lives in src/pwa/register.ts — do not auto-inject.
      injectRegister: null,
      registerType: "autoUpdate",
      // Never emit an SW in dev / Lovable preview.
      devOptions: { enabled: false },
      // Keep using our existing public/manifest.webmanifest.
      manifest: false,
      includeAssets: ["favicon.png", "apple-touch-icon.png", "logo.png", "offline.html"],
      workbox: {
        cleanupOutdatedCaches: true,
        skipWaiting: true,
        clientsClaim: true,
        navigateFallback: "/offline.html",
        navigateFallbackDenylist: [
          /^\/admin/,
          /^\/~oauth/,
          /^\/functions\//,
          /^\/rest\//,
          /^\/auth\//,
          /\/_middleware/,
        ],
        globPatterns: ["**/*.{js,css,html,ico,png,svg,webp,woff2}"],
        // Don't precache the offline page binary twice or admin chunks.
        globIgnores: ["**/admin-*.js", "**/node_modules/**"],
        runtimeCaching: [
          {
            // HTML navigations — always try network first; fall back to cache,
            // then to offline.html via navigateFallback.
            urlPattern: ({ request }) => request.mode === "navigate",
            handler: "NetworkFirst",
            options: {
              cacheName: "html-pages",
              networkTimeoutSeconds: 3,
              expiration: { maxEntries: 30, maxAgeSeconds: 60 * 60 * 24 },
            },
          },
          {
            // Hashed app assets — long, immutable.
            urlPattern: ({ url, sameOrigin }) =>
              sameOrigin && /\/assets\/.+\.(?:js|css|woff2?|png|jpg|jpeg|webp|svg)$/.test(url.pathname),
            handler: "CacheFirst",
            options: {
              cacheName: "app-assets",
              expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            // Google Fonts CSS.
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: "StaleWhileRevalidate",
            options: { cacheName: "google-fonts-css" },
          },
          {
            // Google Fonts files.
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "google-fonts-files",
              expiration: { maxEntries: 30, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            // Supabase storage images — safe to cache (public assets).
            urlPattern: /^https:\/\/[a-z0-9-]+\.supabase\.co\/storage\/v1\/object\/public\/.*\.(?:png|jpe?g|webp|gif|svg)$/i,
            handler: "StaleWhileRevalidate",
            options: {
              cacheName: "supabase-images",
              expiration: { maxEntries: 60, maxAgeSeconds: 60 * 60 * 24 * 30 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            // Supabase REST / Auth / Functions / storage non-image — NEVER cache.
            urlPattern: /^https:\/\/[a-z0-9-]+\.supabase\.co\/(rest|auth|functions|realtime)\/.*/i,
            handler: "NetworkOnly",
          },
        ],
      },
    }),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    dedupe: ["react", "react-dom", "react/jsx-runtime", "react/jsx-dev-runtime", "@tanstack/react-query", "@tanstack/query-core"],
  },
  build: {
    // Better long-term caching: vendor chunks change less often than app code,
    // so a single page edit no longer invalidates the whole bundle.
    rollupOptions: {
      output: {
        manualChunks: {
          "react-vendor": ["react", "react-dom", "react-router-dom"],
          "query-vendor": ["@tanstack/react-query"],
          "supabase-vendor": ["@supabase/supabase-js"],
          "ui-vendor": [
            "@radix-ui/react-dialog",
            "@radix-ui/react-dropdown-menu",
            "@radix-ui/react-popover",
            "@radix-ui/react-select",
            "@radix-ui/react-tabs",
            "@radix-ui/react-tooltip",
          ],
          "editor-vendor": [
            "@tiptap/react",
            "@tiptap/starter-kit",
          ],
        },
      },
    },
  },
}));
