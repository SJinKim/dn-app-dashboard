/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#2B3A67',
        'primary-hover': '#233060',
        secondary: '#5C6B89',
        tertiary: '#8E9AAF',
        neutral: '#F8F9FA',
        'surface-dark': '#1C2340',
        'surface-card': '#FFFFFF',
      },
      fontFamily: {
        sans: ['Manrope', 'sans-serif'],
      },
      letterSpacing: {
        tight: '-0.02em',
      },
    },
  },
  plugins: [],
}
