import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      external: [],
      output: {
        manualChunks: {
          vendor: ["react", "react-dom"],
          router: ["react-router-dom"],
          supabase: ["@supabase/supabase-js"],
          slick: ["react-slick", "slick-carousel"],
        },
      },
    },
  },
  optimizeDeps: {
    include: [
      "react-router-dom",
      "@supabase/supabase-js",
      "react-slick",
      "slick-carousel",
    ],
  },
});
