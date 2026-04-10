/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: false,
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: '#6C3FE8',
          secondary: '#FF6B35',
          light: '#F8F7FF',
          soft: '#EDE9FF',
          dark: '#5535C5',
        }
      }
    },
  },
  plugins: [],
}
