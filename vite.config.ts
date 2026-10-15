import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// In dev, /api goes to the backend on :8787. In production nginx does the same proxy.
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
    proxy: { "/api": { target: "http://127.0.0.1:8787", changeOrigin: true } },
  },
});
