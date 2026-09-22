/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#0B0A08",
        plum: "#1A1017",
        gold: {
          50: "#FBF7EA",
          100: "#F6EDD6",
          200: "#EDD9A9",
          300: "#E1C077",
          400: "#D4A548",
          500: "#BE8A2C",
          600: "#9B6C22",
          700: "#75511D",
          800: "#573D1C",
          900: "#3B2913",
        },
      },
      fontFamily: {
        display: ["'Playfair Display'", "serif"],
        body: ["'Jost'", "system-ui", "sans-serif"],
      },
      boxShadow: {
        soft: "0 20px 60px -25px rgba(0,0,0,0.8)",
        glow: "0 0 40px -10px rgba(212,165,72,0.45)",
      },
      keyframes: {
        fadeUp: {
          "0%": { opacity: 0, transform: "translateY(16px)" },
          "100%": { opacity: 1, transform: "translateY(0)" },
        },
      },
      animation: {
        fadeUp: "fadeUp .6s ease-out both",
      },
    },
  },
  plugins: [],
};
