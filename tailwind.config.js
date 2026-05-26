/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'luxury-black': '#050505',
        'luxury-dark': '#0f0f0f',
        'luxury-charcoal': '#1a1a1a',
        'luxury-gold': '#c8a46b',
        'luxury-gold-light': '#f0d6a2',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        serif: ['Playfair Display', 'serif'],
      },
      backgroundImage: {
        'radial-glow': 'radial-gradient(circle at center, rgba(200, 164, 107, 0.15) 0%, rgba(5, 5, 5, 0) 70%)',
      },
    },
  },
  plugins: [],
}
