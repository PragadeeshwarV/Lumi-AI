/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        lumi: {
          bg: "#FAF9FF",
          surface: "#FFFFFF",
          secondary: "#F5F1FF",
          lavender: "#EDE5FF",
          soft: "#D8C8F5",
          primary: "#7654B8",
          hover: "#6543A0",
          deep: "#49356F",
          text: "#292638",
          muted: "#777386",
          border: "#E9E4F0",
        }
      },
      fontFamily: {
        sans: ["Inter", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "sans-serif"],
      },
      boxShadow: {
        subtle: "0 1px 3px rgba(118, 84, 184, 0.05), 0 1px 2px rgba(0, 0, 0, 0.03)",
        card: "0 4px 16px -2px rgba(73, 53, 111, 0.06), 0 2px 6px -1px rgba(73, 53, 111, 0.03)",
        dropdown: "0 10px 25px -3px rgba(73, 53, 111, 0.1), 0 4px 10px -2px rgba(73, 53, 111, 0.05)",
      }
    },
  },
  plugins: [],
}
