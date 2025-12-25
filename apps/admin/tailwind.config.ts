import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
    "../../packages/ui/src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        luxury: {
          gold: "#D4AF37",
          black: "#0A0A0A",
          dark: "#1A1A1A",
          darker: "#0F0F0F",
          gray: "#2A2A2A",
          card: "#1A1A1A",
          border: "#333333",
        },
      },
    },
  },
  plugins: [],
};

export default config;
