// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
// import { componentTagger } from "lovable-tagger"; // opcional

export default defineConfig(({ mode }) => ({
  server: {
    host: true,          // aceita 0.0.0.0 / domínios externos
    port: 5173,          // porta de DEV local (Publishing usa o server.mjs)
    allowedHosts: true   // libera *.replit.dev (ou informe um array com hosts)
  },
  plugins: [
    react(),
    // mode === "development" && componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));