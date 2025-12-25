import type { Config } from "tailwindcss";

export default {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        luxury: {
          gold: "#D4AF37",
          black: "#0A0A0A",
          dark: "#1A1A1A",
          gray: "#2A2A2A",
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
