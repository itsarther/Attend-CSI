/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#F0F7FF',
          100: '#E0EFFE',
          200: '#BAE0FD',
          300: '#7CC5FC',
          400: '#36A7F9',
          500: '#0C89EB',
          600: '#026DC9',
          700: '#0357A3',
          800: '#074A87',
          900: '#0C3F70',
          950: '#08284B',
        },
        csi: {
          navy: '#0B132B',
          dark: '#1C2541',
          accent: '#3A506B',
          glow: '#48CAE4',
          cyan: '#00B4D8'
        }
      },
      fontFamily: {
        sans: ['Inter', 'Outfit', 'sans-serif'],
      },
      boxShadow: {
        'glow-cyan': '0 0 25px -5px rgba(0, 180, 216, 0.4)',
        'glow-blue': '0 0 25px -5px rgba(12, 137, 235, 0.4)',
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.37)'
      }
    },
  },
  plugins: [],
}
