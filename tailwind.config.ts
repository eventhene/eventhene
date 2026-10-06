import type { Config } from "tailwindcss";

export default {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./emails/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: "var(--bg)",
        surface: "var(--surface)",
        "surface-2": "var(--surface-2)",
        ink: {
          DEFAULT: "var(--ink)",
          2: "var(--ink-2)",
          muted: "var(--ink-muted)",
          faint: "var(--ink-faint)",
        },
        "ink-muted": "var(--ink-muted)",
        "ink-faint": "var(--ink-faint)",
        border: "var(--border)",
        "border-strong": "var(--border-strong)",
        accent: {
          DEFAULT: "var(--accent)",
          ink: "var(--accent-ink)",
        },
        royal: {
          DEFAULT: "var(--royal)",
          2: "var(--royal-2)",
        },
        emerald: "var(--emerald)",
        crimson: "var(--crimson)",
        sky: "var(--sky)",
      },
      fontFamily: {
        display: ["Inter", "system-ui", "sans-serif"],
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["ui-monospace", "Cascadia Code", "monospace"],
      },
      borderRadius: {
        sm: "10px",
        DEFAULT: "14px",
        lg: "20px",
        xl: "28px",
        "2xl": "32px",
      },
      maxWidth: {
        "7xl": "80rem",
        "8xl": "88rem",
      },
    },
  },
  plugins: [],
} satisfies Config;
