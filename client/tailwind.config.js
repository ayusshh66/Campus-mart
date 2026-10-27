/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Shop Design Tokens
        shop: {
          canvas: '#090B09',
          surface: '#12160F',
          ink: '#F5F7F0',
          border: 'rgba(198, 222, 65, 0.2)',
          hairline: 'rgba(198, 222, 65, 0.15)',
          muted: '#B5B9AB',
          stone: '#B5B9AB',
          'stone-light': '#2A3322',
          fog: '#7E8676',
          violet: '#C6DE41',
          'violet-hover': '#D7EF59',
          'violet-wash': 'rgba(198, 222, 65, 0.15)',
          'violet-light': 'rgba(198, 222, 65, 0.25)',
          slate: '#1A2116',
          veil: '#10140D',
        },
        // CampusMart colors updated for Black & #C6DE41 Theme
        campus: {
          primary: '#C6DE41',
          'primary-hover': '#D7EF59',
          dark: '#090B09',
          light: '#12160F',
          soft: '#161B12',
          muted: '#B5B9AB',
          surface: '#12160F',
          border: 'rgba(198, 222, 65, 0.2)',
          text: '#F5F7F0',
          emerald: '#C6DE41',
        },
        // Violet & Purple re-routed to brand #C6DE41 palette
        violet: {
          50: '#F7FBE8',
          100: '#EEF7CE',
          200: '#DDF09E',
          300: '#D2EA6E',
          400: '#C6DE41',
          500: '#B0CA2E',
          600: '#C6DE41',
          700: '#94AC1D',
          800: '#758819',
          900: '#526014',
          950: '#151C06',
        },
        purple: {
          50: '#F7FBE8',
          100: '#EEF7CE',
          200: '#DDF09E',
          300: '#D2EA6E',
          400: '#C6DE41',
          500: '#B0CA2E',
          600: '#C6DE41',
          700: '#94AC1D',
          800: '#758819',
          900: '#526014',
          950: '#151C06',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
      },
      letterSpacing: {
        tightest: '-0.05em',
        tighter: '-0.031em',
        tight: '-0.02em',
      },
      borderRadius: {
        'card': '28px',
        'image': '20px',
        'pill': '9999px',
        'button': '9999px',
      },
      boxShadow: {
        'shop-card': '0 4px 20px -2px rgba(0, 0, 0, 0.5), 0 2px 6px -1px rgba(198, 222, 65, 0.05)',
        'shop-card-hover': '0 12px 30px -4px rgba(0, 0, 0, 0.6), 0 4px 14px -2px rgba(198, 222, 65, 0.15)',
        'shop-pill': '0 2px 8px 0 rgba(0, 0, 0, 0.3)',
        'shop-violet': '0 4px 24px 0 rgba(198, 222, 65, 0.35)',
        'shop-float': '0 16px 36px -6px rgba(0, 0, 0, 0.6), 0 6px 16px -4px rgba(198, 222, 65, 0.1)',
        'shop-arrow': '0 4px 24px 0 rgba(0, 0, 0, 0.3)',
        'subtle': '0 2px 8px rgba(0, 0, 0, 0.2)',
        'card': '0 4px 20px -1px rgba(0, 0, 0, 0.5)',
        'card-hover': '0 12px 28px -4px rgba(198, 222, 65, 0.15)',
        'hero': '0 4px 24px 0 rgba(198, 222, 65, 0.35)',
      }
    },
  },
  plugins: [],
}

