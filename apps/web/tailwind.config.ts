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
      keyframes: {
        fadeIn: {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        fadeUp: {
          from: { opacity: "0", transform: "translateY(12px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        slideUp: {
          from: { opacity: "0", transform: "translateY(16px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        shimmer: {
          from: { backgroundPosition: "-200% 0" },
          to: { backgroundPosition: "200% 0" },
        },
        pulseGold: {
          from: { boxShadow: "0 0 0 0 rgba(197, 168, 128, 0.4)" },
          to: { boxShadow: "0 0 0 10px rgba(197, 168, 128, 0)" },
        },
        goldGlow: {
          "0%, 100%": {
            boxShadow: "0 0 15px -3px rgba(197, 168, 128, 0.35), 0 0 6px -2px rgba(197, 168, 128, 0.2)",
          },
          "50%": {
            boxShadow: "0 0 25px 2px rgba(197, 168, 128, 0.6), 0 0 10px 1px rgba(197, 168, 128, 0.35)",
          },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-6px)" },
        },
      },
      animation: {
        fadeIn: "fadeIn 0.4s ease-out forwards",
        fadeUp: "fadeUp 0.5s ease-out forwards",
        "fade-in": "fadeIn 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        "slide-up": "slideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        "gold-glow": "goldGlow 3s ease-in-out infinite",
        shimmer: "shimmer 2s infinite linear",
        pulseGold: "pulseGold 2s infinite",
        float: "float 4s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
