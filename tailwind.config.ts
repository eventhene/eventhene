import type { Config } from "tailwindcss";

export default {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./emails/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        bg: "#FAFAF7",
        surface: "#FFFFFF",
        "surface-2": "#F4F2EC",
        ink: "#0F0E13",
        "ink-muted": "#5B5666",
        border: "#E7E3D8",
        primary: { DEFAULT: "#4B1E78", 600: "#3A1760", 700: "#2D1149" },
        accent: { DEFAULT: "#D4A24C", 600: "#B8862F" },
        success: "#1F8A4C",
        warning: "#C77A0A",
        danger: "#B3261E",
        info: "#1E5FBE"
      },
      fontFamily: {
        display: ["Fraunces", "Georgia", "serif"],
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"]
      },
      borderRadius: {
        xl: "0.875rem",
        "2xl": "1.125rem",
        "3xl": "1.5rem"
      },
      boxShadow: {
        card: "0 1px 2px rgba(15,14,19,0.04), 0 8px 24px rgba(15,14,19,0.04)",
        lift: "0 4px 12px rgba(15,14,19,0.08), 0 16px 40px rgba(15,14,19,0.08)"
      },
      backgroundImage: {
        "royal-gradient": "linear-gradient(135deg, #4B1E78 0%, #2D1149 100%)",
        "gold-gradient": "linear-gradient(135deg, #D4A24C 0%, #B8862F 100%)"
      }
    }
  },
  plugins: []
} satisfies Config;
