import type { Config } from "tailwindcss";

export const churchPalette = {
  copticNavy: {
    DEFAULT: "#1E2A78",
    50: "#EEF1FA",
    100: "#DCE2F5",
    200: "#B8C4EB",
    500: "#1E2A78",
    600: "#182260",
    700: "#131A49",
    800: "#0D1131",
    900: "#07091A",
  },
  copticGold: {
    DEFAULT: "#C5A880",
    50: "#F9F6F1",
    100: "#F2ECE2",
    200: "#E6D8C4",
    300: "#D9C5A7",
    400: "#CDB38B",
    500: "#C5A880",
    600: "#B08E5F",
    700: "#8B6F45",
    800: "#655030",
    900: "#3F321C",
  },
  alabasterBg: "#FAF8F5",
  surfaceCard: "#FFFFFF",
  slateText: {
    primary: "#1E293B",
    secondary: "#475569",
    muted: "#64748B",
  },
  status: {
    presentGreen: "#15803D",
    absentRed: "#DC2626",
    pendingYellow: "#D97706",
  },
};

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        ...churchPalette,
      },
      fontFamily: {
        heading: ["var(--font-noto-kufi)", "var(--font-alexandria)", "sans-serif"],
        body: ["var(--font-noto-sans)", "sans-serif"],
        scripture: ["var(--font-amiri)", "serif"],
        english: ["var(--font-inter)", "sans-serif"],
      },
      borderRadius: {
        "2xl": "1rem",
        "3xl": "1.5rem",
      },
    },
  },
  plugins: [],
};

export default config;
