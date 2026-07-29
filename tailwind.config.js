/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ['var(--font-display)', 'serif'],
        ui: ['var(--font-ui)', 'sans-serif'],
        code: ['var(--font-code)', 'monospace'],
        sans: ['var(--font-ui)', 'sans-serif'],
        serif: ['var(--font-display)', 'serif'],
        mono: ['var(--font-code)', 'monospace'],
      },
      colors: {
        amber: {
          600: '#d97706',
        }
      }
    },
  },
  plugins: [],
}
