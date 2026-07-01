/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      colors: {
        primary: {
          DEFAULT: "#F06E4B",
          dark: "#D85A38",
        },
        /* brand scale centered on primary #F06E4B */
        brand: {
          50: "#fef5f2",
          100: "#fde8e1",
          200: "#facfc2",
          300: "#f7b09c",
          400: "#f38968",
          500: "#F06E4B",
          600: "#D85A38",
          700: "#b8482c",
          800: "#963822",
          900: "#752b1a",
        },
      },
      keyframes: {
        "fade-in": {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-12px)" },
        },
        shimmer: {
          "100%": { transform: "translateX(100%)" },
        },
      },
      animation: {
        "fade-in": "fade-in 0.5s ease-out",
        float: "float 6s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
