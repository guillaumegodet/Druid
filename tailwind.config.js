
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        pixel: ['VT323', 'monospace'],
      },
      colors: {
        primary: {
          light: '#6d75c5',
          DEFAULT: '#3f46ad',
          dark: '#13100d',
        },
        background: '#f8f4f9', // Slightly purplish white
        surface: '#ffffff',
        'pixel-blue': '#3452ff',
        'pixel-gray': '#929393',
        'pixel-pink': '#f20066', // Rose Magenta
        'pixel-teal': '#03c15e', // Vert Émeraude
        'pixel-cyan': '#00c6ff',
        'pixel-yellow': '#ffcc01', // Jaune
        'pixel-violet': '#9c1ef1',
        'pixel-red': '#ff1200',
        'pixel-teal-dark': '#0b7479', // Bleu Canard
        'pixel-raspberry': '#bb016f', // Bordeaux / Framboise
      },
      boxShadow: {
        'pixel': '4px 4px 0px 0px rgba(0, 0, 0, 0.2)',
        'pixel-hover': '6px 6px 0px 0px rgba(0, 0, 0, 0.3)',
      }
    },
  },
  plugins: [],
}
