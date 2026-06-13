import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./features/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // VSCode 다크 팔레트 (사이드바/마켓플레이스 룩)
        panel: "#1e1e1e",
        "panel-alt": "#252526",
        "panel-border": "#333333",
        "panel-hover": "#2a2d2e",
        accent: "#0e639c",
        "accent-hover": "#1177bb",
        "text-primary": "#cccccc",
        "text-muted": "#858585",
        up: "#26a69a",
        down: "#ef5350",
      },
    },
  },
  plugins: [],
};

export default config;
