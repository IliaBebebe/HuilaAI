import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/lib/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        night: "#05060a",
        graphite: "#17191f",
        accent: "#6d77ff",
        accentMuted: "#96a8ff",
        success: "#4ce1b6",
        warning: "#f9b24e",
      },
      boxShadow: {
        glass: "0 25px 65px rgba(0, 0, 0, 0.45)",
      },
      animation: {
        "pulse-glow": "pulse-glow 3s ease-in-out infinite",
      },
      keyframes: {
        "pulse-glow": {
          "0%, 100%": { opacity: "0.45" },
          "50%": { opacity: "1" },
        },
      },
    },
  },
  plugins: [],
};

export default config;

