/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{ts,tsx}"],
  presets: [require("nativewind/preset")],
  darkMode: "class",
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
      borderRadius: {
        lg: "6px",
        xl: "8px",
        "2xl": "10px",
        "3xl": "14px",
      },
      boxShadow: {
        card: "0px 1px 3px rgba(16,16,18,0.08)",
        pop: "0px 6px 20px rgba(16,16,18,0.14)",
        nav: "0px -1px 0px #E4E4E7",
      },
    },
  },
  plugins: [],
};
