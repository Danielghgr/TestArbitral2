import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#0f172a",
        panel: "#1e293b",
        panel2: "#273449",
        accent: "#f97316",
        accent2: "#fb923c",
        muted: "#94a3b8",
        good: "#22c55e",
        bad: "#ef4444",
        border: "#334155"
      }
    }
  },
  plugins: []
};
export default config;
