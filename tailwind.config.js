/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx}",
    "./components/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: "#1B5E20",
          dark: "#10410F",
          mid: "#2E7D32",
          soft: "#E8F2E9",
          softer: "#F3F8F4",
          accent: "#66BB6A",
        },
        ink: "#141414",
        offwhite: "#F7F7F4",
      },
      borderRadius: {
        card: "12px",
      },
      boxShadow: {
        card: "0 1px 3px rgba(20, 20, 20, 0.06), 0 6px 18px rgba(20, 20, 20, 0.05)",
        "card-hover": "0 4px 10px rgba(20, 20, 20, 0.08), 0 16px 32px rgba(20, 20, 20, 0.10)",
        nav: "0 1px 0 rgba(20, 20, 20, 0.06)",
      },
      keyframes: {
        stepPulse: {
          "0%, 18%, 100%": {
            transform: "scale(1)",
            boxShadow: "0 0 0 0 rgba(27, 94, 32, 0)",
            backgroundColor: "#ffffff",
            color: "#1B5E20",
          },
          "6%": {
            transform: "scale(1.12)",
            boxShadow: "0 0 0 10px rgba(27, 94, 32, 0.12)",
            backgroundColor: "#1B5E20",
            color: "#ffffff",
          },
          "12%": {
            transform: "scale(1.06)",
            boxShadow: "0 0 0 6px rgba(27, 94, 32, 0.08)",
            backgroundColor: "#1B5E20",
            color: "#ffffff",
          },
        },
        ticker: {
          "0%, 100%": { opacity: "0.45" },
          "8%": { opacity: "1" },
        },
        marquee: {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
        overlayIn: {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        modalIn: {
          from: { opacity: "0", transform: "translateY(14px) scale(0.97)" },
          to: { opacity: "1", transform: "translateY(0) scale(1)" },
        },
      },
      animation: {
        "step-pulse": "stepPulse 5.2s ease-in-out infinite",
        "step-label": "ticker 5.2s ease-in-out infinite",
        marquee: "marquee 38s linear infinite",
        "overlay-in": "overlayIn 0.2s ease-out both",
        "modal-in": "modalIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) both",
      },
    },
  },
  plugins: [],
};
