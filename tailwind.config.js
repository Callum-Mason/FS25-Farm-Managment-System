/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: 'hsl(var(--colour-primary) / <alpha-value>)',
        secondary: 'hsl(var(--colour-secondary) / <alpha-value>)',
        surface: 'hsl(var(--colour-surface) / <alpha-value>)',
        text: 'hsl(var(--colour-text) / <alpha-value>)'
      },
      fontFamily: {
        sans: ['var(--font-sans)']
      },
      borderRadius: {
        card: '1.5rem'
      }
    },
  },
  plugins: [],
}
