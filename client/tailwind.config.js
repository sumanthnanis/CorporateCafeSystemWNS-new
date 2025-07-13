/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    './pages/**/*.{js,jsx}',
    './components/**/*.{js,jsx}',
    './app/**/*.{js,jsx}',
    './src/**/*.{js,jsx}',
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        // Modern gradient color palette - More neutral and professional
        brand: {
          50: "#f8fafc",
          100: "#f1f5f9", 
          200: "#e2e8f0",
          300: "#cbd5e1",
          400: "#94a3b8",
          500: "#64748b",
          600: "#475569",
          700: "#334155",
          800: "#1e293b",
          900: "#0f172a",
        },
        // Employee side colors (fresh, clean, modern)
        employee: {
          primary: "#059669", // Professional emerald green
          secondary: "#0d9488", // Complementary teal
          accent: "#0891b2", // Ocean blue for accents
          success: "#10b981", // Bright green for success
          warning: "#f59e0b", // Warm amber for warnings
          background: "#f0fdfa", // Very light mint background
          card: "#ffffff",
          cardHover: "#ecfdf5", // Light green hover
          border: "#6ee7b7", // Soft green border
        },
        // Cafe owner side colors (warm, appetizing, earth tones)
        owner: {
          primary: "#c2410c", // Warm terracotta (less aggressive than red)
          secondary: "#ea580c", // Bright orange
          accent: "#d97706", // Golden amber
          success: "#16a34a", // Natural green
          warning: "#f59e0b", // Amber warning
          background: "#fefaf5", // Warm cream background
          card: "#ffffff",
          cardHover: "#fed7aa", // Light orange hover
          border: "#fdba74", // Soft orange border
          dark: "#9a3412", // Rich brown accent
        },
        // Notification colors
        notification: {
          info: "#3b82f6",
          success: "#10b981", 
          warning: "#f59e0b",
          error: "#ef4444",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}