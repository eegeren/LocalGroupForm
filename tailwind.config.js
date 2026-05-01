/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: false, // dark mode devre dışı
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      borderRadius: { '2xl': '1rem' },
      boxShadow: { 'soft': '0 8px 30px rgba(0,0,0,0.06)' },
    },
  },
  plugins: [],
}
