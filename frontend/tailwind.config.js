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
        emerald: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
          950: '#052e16',
        },
        gold: {
          50: '#fbfbf2',
          100: '#f5f4dc',
          200: '#ecebb9',
          300: '#dfdc8d',
          400: '#cfc95d',
          500: '#b8b037',
          600: '#9b9227',
          700: '#7c7320',
          800: '#645c1d',
          900: '#524b1c',
          950: '#2d290c',
        },
        islamic: {
          deep: '#03251d',
          dark: '#05382c',
          emerald: '#086343',
          green: '#109b67',
          light: '#e6f3ee',
          gold: '#c29d38'
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        arabic: ['Amiri', 'serif'],
        tamil: ['"Noto Sans Tamil"', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
