import type { Config } from "tailwindcss";

/**
 * Wuerth Elektronik control-center tokens.
 * Cool canvas, disciplined red, Inter-first typography, and flat B2B structure.
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
          red: "#CC0000",
          "red-dark": "#990000",
          "red-soft": "#FFF1F1",
          ink: "#1A1A1E",
          slate: "#3F424A",
          muted: "#6F7480",
          faint: "#9AA1AD",
          line: "#E1E5EA",
          "line-strong": "#CBD0D8",
          surface: "#FFFFFF",
          canvas: "#F5F6F8",
        },
        status: {
          good: "#2F7D57",
          "good-soft": "#EDF6F1",
          warn: "#A36A00",
          "warn-soft": "#FFF6E5",
          risk: "#CC0000",
          "risk-soft": "#FFF1F1",
          neutral: "#6F7480",
          "neutral-soft": "#EEF1F5",
          info: "#45505F",
          "info-soft": "#EEF2F6",
        },
      },
      fontFamily: {
        display: ["var(--font-inter)", "system-ui", "sans-serif"],
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        mono: ["var(--font-inter)", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      fontSize: {
        "display-lg": ["3.25rem", { lineHeight: "0.98", letterSpacing: "0" }],
        "display": ["2.5rem", { lineHeight: "1.02", letterSpacing: "0" }],
        "display-sm": ["1.9rem", { lineHeight: "1.08", letterSpacing: "0" }],
      },
      letterSpacing: {
        eyebrow: "0.14em",
      },
      borderRadius: {
        card: "14px",
        tag: "8px",
      },
      boxShadow: {
        card: "0 1px 2px rgba(16,24,40,0.04)",
        lift: "0 10px 24px -18px rgba(16,24,40,0.22)",
        float: "0 18px 48px -28px rgba(16,24,40,0.25)",
      },
      transitionTimingFunction: {
        premium: "cubic-bezier(0.22, 1, 0.36, 1)",
      },
      maxWidth: {
        editorial: "78rem",
      },
    },
  },
  plugins: [],
};

export default config;
