import type { Config } from "tailwindcss";

/**
 * Würth "Control Center" design system — art-directed, editorial, technical.
 * Warm-neutral paper + one disciplined red accent. Flat depth (hairlines, not
 * shadows). Serif display / sans UI / mono data. Tokens are the single source
 * of truth — values change here and propagate across every component.
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
          // accent — used sparingly, as punctuation
          red: "#CC1122",
          "red-dark": "#9E0A18",
          "red-soft": "#F6ECEA",
          // warm-neutral ink ramp
          ink: "#1B1A18",
          slate: "#46443E",
          muted: "#8B887E",
          faint: "#B6B2A7",
          line: "#E7E3D9",
          "line-strong": "#D8D3C7",
          surface: "#FFFFFF",
          canvas: "#F4F2EC",
        },
        // muted, sophisticated status hues (no candy colors)
        status: {
          good: "#2F7D57",
          "good-soft": "#EAF1EC",
          warn: "#9A6B16",
          "warn-soft": "#F4EEE2",
          risk: "#CC1122",
          "risk-soft": "#F6ECEA",
          neutral: "#7C7A72",
          "neutral-soft": "#EDEAE2",
          info: "#3F5A73",
          "info-soft": "#EAEEF1",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "Georgia", "serif"],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
      fontSize: {
        // editorial display sizes with tightened tracking
        "display-lg": ["3.4rem", { lineHeight: "1.02", letterSpacing: "-0.02em" }],
        "display": ["2.5rem", { lineHeight: "1.05", letterSpacing: "-0.018em" }],
        "display-sm": ["1.9rem", { lineHeight: "1.1", letterSpacing: "-0.015em" }],
      },
      letterSpacing: {
        eyebrow: "0.2em",
      },
      borderRadius: {
        card: "7px",
        tag: "4px",
      },
      boxShadow: {
        // near-flat; depth comes from borders + composition
        card: "0 1px 1px rgba(27,26,24,0.02)",
        lift: "0 10px 30px -12px rgba(27,26,24,0.18)",
        float: "0 24px 60px -20px rgba(27,26,24,0.28)",
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
