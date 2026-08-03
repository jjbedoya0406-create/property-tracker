/// <reference types="vitest/config" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

// GitHub Pages serves this as a project site at
// https://jjbedoya0406-create.github.io/property-tracker/, so the build needs
// that subpath baked into asset URLs. Local dev keeps serving from root.
const REPO_BASE = "/property-tracker/";

// https://vite.dev/config/
export default defineConfig(({ command }) => ({
  base: command === "build" ? REPO_BASE : "/",
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    globals: true,
  },
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.svg", "apple-touch-icon.png"],
      manifest: {
        name: "Property Expense Tracker",
        short_name: "Expense Tracker",
        description: "Capture and track rental property expenses and receipts.",
        theme_color: "#1e293b",
        background_color: "#ffffff",
        display: "standalone",
        // Relative (no leading slash) so vite-plugin-pwa resolves these
        // against `base` — a leading slash would point at the domain root
        // instead of the /property-tracker/ subpath.
        start_url: "./",
        icons: [
          { src: "icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "icon-512.png", sizes: "512x512", type: "image/png" },
          {
            src: "icon-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },
    }),
  ],
}));
