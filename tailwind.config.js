/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}",
  ],
  theme: {
    extend: {
      colors: {
        primary: 'var(--color-primary)',
        'primary-hover': 'var(--color-primary-hover)',
        secondary: 'var(--color-secondary)',
        tertiary: 'var(--color-tertiary)',
        neutral: 'var(--color-neutral)',
        'surface-dark': 'var(--color-surface-dark)',
        'surface-card': 'var(--color-surface-card)',
      },
      fontFamily: {
        sans: ['Manrope', 'sans-serif'],
      },
      letterSpacing: {
        brand: '-0.02em',
      },
    },
  },
  plugins: [],
}
