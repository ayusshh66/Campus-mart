/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        campus: {
          primary: '#00A878',
          'primary-hover': '#009268',
          dark: '#063B32',
          light: '#D9F7EF',
          soft: '#EBFBF6',
          muted: '#F4FBF8',
          surface: '#FFFFFF',
          border: '#E2E8F0',
          text: '#1E293B',
        }
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'subtle': '0 2px 10px rgba(0, 0, 0, 0.04)',
        'card': '0 4px 20px -2px rgba(6, 59, 50, 0.08)',
        'card-hover': '0 12px 28px -4px rgba(6, 59, 50, 0.15)',
        'hero': '0 20px 40px -15px rgba(0, 168, 120, 0.25)',
      }
    },
  },
  plugins: [],
}
