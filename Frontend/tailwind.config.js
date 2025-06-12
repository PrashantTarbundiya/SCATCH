/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class', // Enable class-based dark mode
  theme: {
    extend: {
      fontFamily: {
        'helvetica_now_display': ['Helvetica Now Display', 'sans-serif'], // Add this if you have a custom font
      }
    },
  },
  plugins: [],
}