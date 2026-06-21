/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'mixologist-dark': '#1a1a2e',
        'mixologist-card': '#252542',
        'mixologist-gold': '#facc15',
        'mixologist-gold-light': '#fdf08a',
        'mixologist-gold-dark': '#ca8a04',
        'mixologist-text': '#f3f4f6',
        'mixologist-text-muted': '#9ca3af'
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        serif: ['Playfair Display', 'serif'],
      }
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
}
