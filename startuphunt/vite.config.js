import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // Stub jquery for slick-carousel (react-slick doesn't actually need it)
      jquery: 'node_modules/jquery/dist/jquery.slim.min.js',
    },
  },
  build: {
    rollupOptions: {
      external: [],
      output: {
        manualChunks: {
          vendor: ["react", "react-dom"],
          router: ["react-router-dom"],
          supabase: ["@supabase/supabase-js"],
          slick: ["react-slick", "slick-carousel"],
          mui: ["@mui/material", "@mui/joy", "@emotion/react", "@emotion/styled"],
          utils: ["axios", "date-fns", "nanoid", "framer-motion"],
        },
        // Optimize chunk sizes
        chunkFileNames: (chunkInfo) => {
          const facadeModuleId = chunkInfo.facadeModuleId ? chunkInfo.facadeModuleId.split('/').pop() : 'chunk';
          return `js/${facadeModuleId}-[hash].js`;
        },
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name.split('.');
          const ext = info[info.length - 1];
          if (/\.(css)$/.test(assetInfo.name)) {
            return `css/[name]-[hash].${ext}`;
          }
          if (/\.(png|jpe?g|svg|gif|tiff|bmp|ico)$/i.test(assetInfo.name)) {
            return `images/[name]-[hash].${ext}`;
          }
          return `assets/[name]-[hash].${ext}`;
        },
      },
    },
    // Production optimizations
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
    },
    // Optimize chunk size warnings
    chunkSizeWarningLimit: 1000,
    // Enable source maps for production debugging (optional)
    sourcemap: false,
  },
  optimizeDeps: {
    include: [
      "react-router-dom",
      "@supabase/supabase-js",
      "react-slick",
      "slick-carousel",
      "@mui/material",
      "@mui/joy",
    ],
  },
  // Performance optimizations
  server: {
    headers: {
      'Cache-Control': 'public, max-age=31536000',
    },
  },
});
