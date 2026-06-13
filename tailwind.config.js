/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx}",
    "./components/**/*.{js,jsx}",
    "./lib/**/*.{js,jsx}",
  ],
  // Scroll-reveal / nav primitives are applied dynamically (useReveal) and on
  // sections not yet built, so keep them from being tree-shaken.
  safelist: [
    "fade-up",
    "fade-in",
    "visible",
    "nav-underline",
    "hero-fade",
    "hero-rise",
    "stagger-1",
    "stagger-2",
    "stagger-3",
    "stagger-4",
    "stagger-5",
    "stagger-6",
  ],
  theme: {
    extend: {
      fontFamily: {
        // Display serif for major headings; body/UI stays Inter (set on <body>).
        // var(--font-fraunces) is provided by next/font in app/layout.jsx.
        display: ["var(--font-fraunces)", "ui-serif", "Georgia", "serif"],
      },
      colors: {
        // brand/ink/offwhite resolve to CSS variables so the STOREFRONT uses the new
        // "Warm Tech" palette (forest green) while the ADMIN panel (scoped by
        // .admin-shell in globals.css) keeps the original #1B5E20. rgb-channel form
        // preserves all the existing /opacity modifiers (bg-brand/40 etc.).
        brand: {
          DEFAULT: "rgb(var(--c-brand) / <alpha-value>)",
          dark: "rgb(var(--c-brand-dark) / <alpha-value>)",
          mid: "rgb(var(--c-brand-mid) / <alpha-value>)",
          soft: "rgb(var(--c-brand-soft) / <alpha-value>)",
          softer: "rgb(var(--c-brand-softer) / <alpha-value>)",
          accent: "rgb(var(--c-brand-accent) / <alpha-value>)",
        },
        ink: "rgb(var(--c-ink) / <alpha-value>)",
        offwhite: "rgb(var(--c-offwhite) / <alpha-value>)",
        // New named storefront tokens (Warm Tech palette)
        primary: { DEFAULT: "#2D5016", light: "#EDF2E8" },
        accent: { DEFAULT: "#E8A020", light: "#FDF3DC" },
        warm: { bg: "#FAF8F5", surface: "#FFFFFF", alt: "#F5F2EE", border: "#E8E4DF" },
        dark: "#1C1C1E",
        muted: "#8A8A8E",
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
            boxShadow: "0 0 0 0 rgba(45, 80, 22, 0)",
            backgroundColor: "#ffffff",
            color: "#2D5016",
          },
          "6%": {
            transform: "scale(1.12)",
            boxShadow: "0 0 0 10px rgba(45, 80, 22, 0.12)",
            backgroundColor: "#2D5016",
            color: "#ffffff",
          },
          "12%": {
            transform: "scale(1.06)",
            boxShadow: "0 0 0 6px rgba(45, 80, 22, 0.08)",
            backgroundColor: "#2D5016",
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
