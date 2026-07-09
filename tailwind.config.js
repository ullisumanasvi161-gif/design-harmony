/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#171816",
        linen: "#f4f0e8",
        brass: "#ad895d",
        clay: "#8f6f52",
        moss: "#65705c"
      },
      fontFamily: {
        sans: ["Manrope", "system-ui", "sans-serif"],
        display: ["Cormorant Garamond", "Georgia", "serif"]
      }
    }
  },
  plugins: []
};
