import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        ink: "#202124",
        muted: "#667085",
        line: "#d9dee8",
        panel: "#f6f7f9",
        brand: "#0f7f74",
        coral: "#f36d54",
        saffron: "#f4b740",
      },
      boxShadow: {
        soft: "0 12px 30px rgba(32, 33, 36, 0.08)",
      },
    },
  },
  plugins: [],
};

export default config;
