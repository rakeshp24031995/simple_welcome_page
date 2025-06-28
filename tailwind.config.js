/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}",
  ],
  theme: {
    extend: {
      colors: {
        navy: '#0A1F44',
        gold: {
          DEFAULT: '#FFD700',
          50: '#FFFEF7',
          100: '#FFFDE0',
          200: '#FFFAC2',
          300: '#FFF594',
          400: '#FFED5A',
          500: '#FFD700',
          600: '#E5C100',
          700: '#CCA900',
          800: '#B38F00',
          900: '#997700',
        },
        rust: '#D35400',
        dark: {
          DEFAULT: '#1A1A1A',
          50: '#F5F5F5',
          100: '#E8E8E8',
          200: '#D1D1D1',
          300: '#BABABA',
          400: '#A3A3A3',
          500: '#8C8C8C',
          600: '#757575',
          700: '#5E5E5E',
          800: '#474747',
          900: '#1A1A1A',
        },
        black: {
          DEFAULT: '#000000',
          light: '#1A1A1A',
          medium: '#0D0D0D',
          heavy: '#000000',
        }
      },
      fontFamily: {
        'poppins': ['Poppins', 'sans-serif'],
        'montserrat': ['Montserrat', 'sans-serif'],
        'open-sans': ['Open Sans', 'sans-serif'],
      },
    },
  },
  plugins: [],
}