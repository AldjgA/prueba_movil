import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

/**
 * Portal profesional de Puente Red (`PR-000` §3).
 *
 * El proxy de desarrollo apunta a la **API Profesional** del backend compartido
 * (`PR-003` §1). El portal habla **solo** con `/profesional/**`: nunca con `/joven/**`
 * (`PR-020` criterio 12).
 */
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/profesional": {
        target: process.env.PUENTE_API_URL ?? "http://127.0.0.1:8080",
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: "dist",
    sourcemap: true,
  },
});
