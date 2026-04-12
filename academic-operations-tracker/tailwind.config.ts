import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        nust: {
          blue: "#003366",
          ceramic: "#0088B9",
          orange: "#E87722",
          silver: "#C0C0C0",
          beige: "#F5F0E8",
        },
        bg: "#F7F8FA",
        priority: {
          critical: "#DC2626",
          high: "#E87722",
          medium: "#D97706",
          low: "#059669",
        },
      },
      fontFamily: {
        heading: ["Georgia", "Calisto MT", "serif"],
        body: ["system-ui", "-apple-system", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
