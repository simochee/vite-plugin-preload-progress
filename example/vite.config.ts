import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { preloadProgress } from "vite-plugin-preload-progress";

export default defineConfig({
  base: "/vite-plugin-preload-progress/",
  plugins: [
    react(),
    preloadProgress({
      delay: 600,
      exitClass: "fade-out",
    }),
  ],
});
