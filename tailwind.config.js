/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        taras: {
          dark: '#07080b',
          card: '#0d0f17',
          red: '#e11d48',
          blue: '#2563eb',
        }
      }
    },
  },
  plugins: [],
}
