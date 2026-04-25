/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        dourado: {
          50:  '#fdf8ec',
          100: '#f9edcc',
          200: '#f3d98a',
          300: '#edc248',
          400: '#C9A84C',
          500: '#b8922a',
          600: '#9a7520',
          700: '#7a5a18',
          800: '#5f4413',
          900: '#432f0e',
        },
        escuro: {
          50:  '#f0f0f5',
          100: '#d9d9e8',
          200: '#b3b3d1',
          300: '#8080b5',
          400: '#4d4d90',
          500: '#2d2d6a',
          600: '#1A1A2E',
          700: '#14142a',
          800: '#0e0e1e',
          900: '#080812',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
