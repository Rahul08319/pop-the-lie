import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  base: "./", // Crucial for playable packages, iframe embeds, and various web hosting roots
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    target: "es2020",
    assetsInlineLimit: 100000000, // Inline assets for single-bundle environments if needed
    chunkSizeWarningLimit: 1500,
    rollupOptions: {
      output: {
        manualChunks: undefined,
      },
    },
  },
}));
