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
    host: "0.0.0.0",
    port: 5001,
    cors: true,
    proxy: {
      // Route admin API requests to Admin Service
      "/api/admin": {
        target: "http://admin-service:8005",
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api\/admin/, "/admin"),
      },

      // Route feedback API requests to Feedback Service
      "/api/feedback": {
        target: "http://feedback-service:8004",
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api\/feedback/, ""),
      },

      // Route cafe-owner menu management to Menu Service
      "/api/cafe-owner/menu-items": {
        target: "http://menu-service:8003",
        changeOrigin: true,
        secure: false,
        rewrite: (path) =>
          path.replace(/^\/api\/cafe-owner\/menu-items/, "/menu-items"),
      },
      "/api/cafe-owner/categories": {
        target: "http://menu-service:8003",
        changeOrigin: true,
        secure: false,
        rewrite: (path) =>
          path.replace(/^\/api\/cafe-owner\/categories/, "/categories"),
      },
      "/api/cafe-owner/cafes/.*/menu-items": {
        target: "http://menu-service:8003",
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
        target: "http://menu-service:8003",
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api\/menu/, ""),
      },

      // Route cafe-related API requests to Cafe Service
      "/api/cafes": {
        target: "http://cafe-service:8002",
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api\/cafes/, "/cafes"),
      },
      "/api/cafe-owner": {
        target: "http://cafe-service:8002",
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api\/cafe-owner/, ""),
      },
      "/api/employee/categories": {
        target: "http://menu-service:8003",
        changeOrigin: true,
        secure: false,
        rewrite: (path) =>
          path.replace(/^\/api\/employee\/categories/, "/categories"),
      },
      "/api/employee/menu-items": {
        target: "http://menu-service:8003",
        changeOrigin: true,
        secure: false,
        rewrite: (path) =>
          path.replace(/^\/api\/employee\/menu-items/, "/menu-items"),
      },
      "/api/employee/search": {
        target: "http://menu-service:8003",
        changeOrigin: true,
        secure: false,
        rewrite: (path) =>
          path.replace(/^\/api\/employee\/search/, "/menu-items/search"),
      },

      // Route employee cafe browsing to User Service
      "/api/employee/cafes": {
        target: "http://user-service:8001",
        changeOrigin: true,
        secure: false,
        rewrite: (path) =>
          path.replace(/^\/api\/employee\/cafes/, "/employee/cafes"),
      },

      // Route order-related API requests
      "/api/orders": {
        target: "http://user-service:8001",
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api\/orders/, "/orders"),
      },

      // Route authentication and user management to User Service
      "/api/login": {
        target: "http://user-service:8001",
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api\/login/, "/login"),
      },
      "/api/register": {
        target: "http://user-service:8001",
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api\/register/, "/register"),
      },
      "/api/me": {
        target: "http://user-service:8001",
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api\/me/, "/me"),
      },

      // Route ALL other API requests to User Service as fallback
      "/api": {
        target: "http://user-service:8001",
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api/, ""),
      },

      "/ws": {
        target: "ws://user-service:8001",
        ws: true,
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
