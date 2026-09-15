import typography from "@tailwindcss/typography";

/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        sec: "var(--sec)",
        "white-custom": "var(--white)",
        "white-icon": "var(--white-icon)",
        "white-icon-tr": "var(--white-icon-tr)",
        "component-bg": "var(--component-bg)",
      },
      fontFamily: {
        sans: [
          '"Montserrat Variable"',
          "Montserrat",
          "-apple-system",
          "BlinkMacSystemFont",
          "sans-serif",
        ],
        mono: ["JetBrains Mono", "ui-monospace", "monospace"],
      },
      keyframes: {
        scaleAnim: {
          "0%": { transform: "scale(1)" },
          "50%": { transform: "scale(1.1)" },
          "100%": { transform: "scale(1)" },
        },
        "heart-pulse": {
          "0%": { transform: "scale(1)" },
          "25%": { transform: "scale(1.1)" },
          "50%": { transform: "scale(1)" },
          "75%": { transform: "scale(1.06)" },
          "100%": { transform: "scale(1)" },
        },
      },
      animation: {
        scale: "scaleAnim 300ms ease-in-out",
        "heart-pulse": "heart-pulse 0.6s ease-in-out",
      },
    },
  },
  plugins: [typography],
};
