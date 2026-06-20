import type { Config } from "tailwindcss";

/**
 * Würth Corporate Design tokens.
 * Würth Red is the single dominant brand colour; everything else is neutral
 * anthracite / greys on white, so the red always reads as "Würth".
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
        wuerth: {
          red: "#CC0000",
          "red-dark": "#A30000",
          "red-soft": "#FBE9E9",
          ink: "#1A1A1A",
          slate: "#52525B",
          mute: "#8A8A8F",
          line: "#E4E4E7",
          surface: "#FFFFFF",
          bg: "#F4F4F5",
        },
      },
      fontFamily: {
        sans: [
          "var(--font-inter)",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "Roboto",
          "Helvetica Neue",
          "Arial",
          "sans-serif",
        ],
      },
      borderRadius: {
        // Tightened scale — flatter and more utilitarian, less "app-store rounded".
        lg: "0.375rem",
        xl: "0.5rem",
        "2xl": "0.625rem",
        "3xl": "0.875rem",
      },
      boxShadow: {
        card: "0 1px 2px rgba(16,16,18,0.05), 0 1px 2px rgba(16,16,18,0.04)",
        pop: "0 6px 20px rgba(16,16,18,0.10)",
        nav: "0 -1px 0 #E4E4E7",
      },
      maxWidth: {
        app: "30rem",
      },
      keyframes: {
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "slide-up": {
          "0%": { transform: "translateY(100%)" },
          "100%": { transform: "translateY(0)" },
        },
        "sheet-in": {
          "0%": { transform: "translateY(16px) scale(0.98)", opacity: "0" },
          "100%": { transform: "translateY(0) scale(1)", opacity: "1" },
        },
        "toast-in": {
          "0%": { transform: "translateY(-12px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        "scan-line": {
          "0%": { top: "8%" },
          "100%": { top: "92%" },
        },
        shimmer: {
          "100%": { transform: "translateX(100%)" },
        },
      },
      animation: {
        "fade-in": "fade-in 0.2s ease-out",
        "slide-up": "slide-up 0.28s cubic-bezier(0.16,1,0.3,1)",
        "sheet-in": "sheet-in 0.26s cubic-bezier(0.16,1,0.3,1)",
        "toast-in": "toast-in 0.24s cubic-bezier(0.16,1,0.3,1)",
        "scan-line": "scan-line 2s ease-in-out infinite alternate",
      },
    },
  },
  plugins: [],
};

export default config;
