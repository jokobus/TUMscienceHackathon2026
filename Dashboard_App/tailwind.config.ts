import type { Config } from "tailwindcss";

/**
 * Würth Elektronik design language (see /wuerth-elektronik-design.md):
 * technical, structured B2B. WE-Red accent, modular grid, high clarity.
 * Colors are exposed as CSS variables in globals.css so theming stays central.
 */
const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        we: {
          // WE brand red + supporting technical palette
          red: "#CC0000",
          "red-dark": "#A30000",
          "red-soft": "#FBE9E9",
          ink: "#1A1A1E",
          slate: "#3F4451",
          muted: "#6B7280",
          line: "#E4E7EC",
          surface: "#FFFFFF",
          canvas: "#F5F6F8",
        },
        // semantic status colors for event-health / prediction badges
        status: {
          good: "#1E9E5A",
          "good-soft": "#E6F4EC",
          warn: "#C77700",
          "warn-soft": "#FBF1E0",
          risk: "#CC0000",
          "risk-soft": "#FBE9E9",
          neutral: "#6B7280",
          "neutral-soft": "#EEF0F3",
          info: "#1F6FEB",
          "info-soft": "#E7F0FE",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
      borderRadius: {
        card: "10px",
      },
      boxShadow: {
        card: "0 1px 2px rgba(16,24,40,0.04), 0 1px 3px rgba(16,24,40,0.06)",
        "card-hover": "0 4px 12px rgba(16,24,40,0.10)",
      },
    },
  },
  plugins: [],
};

export default config;
