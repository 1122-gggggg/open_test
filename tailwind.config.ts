import type { Config } from "tailwindcss";
const config: Config = {
  content: ["./app/**/*.{js,ts,jsx,tsx,mdx}","./components/**/*.{js,ts,jsx,tsx,mdx}","./lib/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        primary: { DEFAULT: "#2563eb", dark: "#1d4ed8", light: "#3b82f6" },
        secondary: { DEFAULT: "#f59e0b" },
      }
    },
  },
  plugins: [],
};
export default config;
