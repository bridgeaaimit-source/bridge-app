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
          primary: '#0D9488',
          secondary: '#FF6B35',
          light: '#F0FDFA',
          soft: '#CCFBF1',
          dark: '#0F766E',
        }
      },
      fontFamily: {
        display: ['Syne', 'sans-serif'],
        body: ['DM Sans', 'sans-serif'],
      },
      boxShadow: {
        brand: '0 4px 24px rgba(13,148,136,0.08)',
        'brand-hover': '0 12px 40px rgba(13,148,136,0.18)',
      }
    },
  },
  plugins: [],
}
