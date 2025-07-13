import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  preview: {
    port: 5001,
    strictPort: true,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  base: "/",
  server: {
    allowedHosts: [
      "ee3f4aa2-31c7-4027-9b68-64a1c649745e-00-3aggi0t3zeegh.sisko.replit.dev",
      "ce6b25f-0ced-445a-9b02-455998149ed3-00-kge6s1kjkamo.pike.replit.dev",
      "7ce6b25f-0ced-445a-9b02-455998149ed3-00-kge6s1kjkamo.pike.replit.dev",
      "b2572ba7-ef4b-4f5e-b700-0ff6d94b6454-00-nn5dqmxi2786.pike.replit.dev",
      "localhost"
    ],
    host: "0.0.0.0",
    port: 5001,
    cors: true,
    proxy: {
      // Route admin API requests to Admin Service
      "/api/admin": {
        target: "http://localhost:8005",
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api\/admin/, "/admin"),
      },

      // Route feedback API requests to Feedback Service
      "/api/feedback": {
        target: "http://localhost:8004",
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api\/feedback/, ""),
      },

      // Route cafe-owner menu management to Menu Service (must come before general cafe-owner routes)
      "/api/cafe-owner/menu-items": {
        target: "http://localhost:8003",
        changeOrigin: true,
        secure: false,
        rewrite: (path) =>
          path.replace(/^\/api\/cafe-owner\/menu-items/, "/menu-items"),
      },
      // Route cafe-owner categories to Menu Service
      "/api/cafe-owner/categories": {
        target: "http://localhost:8003",
        changeOrigin: true,
        secure: false,
        rewrite: (path) =>
          path.replace(/^\/api\/cafe-owner\/categories/, "/categories"),
      },
      // Route cafe-owner cafe menu items to Menu Service
      "/api/cafe-owner/cafes/.*/menu-items": {
        target: "http://localhost:8003",
        changeOrigin: true,
        secure: false,
        rewrite: (path) =>
          path.replace(
            /^\/api\/cafe-owner\/cafes\/(\d+)\/menu-items/,
            "/menu-items",
          ),
      },

      // Route menu-related API requests to Menu Service
      "/api/menu": {
        target: "http://localhost:8003",
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api\/menu/, ""),
      },

      // Route cafe-related API requests to Cafe Service (must come after specific menu routes)
      "/api/cafes": {
        target: "http://localhost:8002",
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api\/cafes/, "/cafes"),
      },
      "/api/cafe-owner": {
        target: "http://localhost:8002",
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api\/cafe-owner/, ""),
      },
      "/api/employee/categories": {
        target: "http://localhost:8003",
        changeOrigin: true,
        secure: false,
        rewrite: (path) =>
          path.replace(/^\/api\/employee\/categories/, "/categories"),
      },
      "/api/employee/menu-items": {
        target: "http://localhost:8003",
        changeOrigin: true,
        secure: false,
        rewrite: (path) =>
          path.replace(/^\/api\/employee\/menu-items/, "/menu-items"),
      },
      "/api/employee/search": {
        target: "http://localhost:8003",
        changeOrigin: true,
        secure: false,
        rewrite: (path) =>
          path.replace(/^\/api\/employee\/search/, "/menu-items/search"),
      },

      // Route employee cafe browsing to User Service (it has the public endpoints)
      "/api/employee/cafes": {
        target: "http://localhost:8001",
        changeOrigin: true,
        secure: false,
        rewrite: (path) =>
          path.replace(/^\/api\/employee\/cafes/, "/employee/cafes"),
      },

      // Route order-related API requests to Order Service (not implemented yet)
      "/api/orders": {
        target: "http://localhost:8001",
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api\/orders/, "/orders"),
      },

      // Route authentication and user management to User Service
      "/api/login": {
        target: "http://localhost:8001",
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api\/login/, "/login"),
      },
      "/api/register": {
        target: "http://localhost:8001",
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api\/register/, "/register"),
      },
      "/api/me": {
        target: "http://localhost:8001",
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api\/me/, "/me"),
      },

      // Route ALL other API requests to User Service as fallback
      "/api": {
        target: "http://localhost:8001",
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api/, ""),
      },

      "/ws": {
        target: "ws://localhost:8001",
        ws: true,
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
