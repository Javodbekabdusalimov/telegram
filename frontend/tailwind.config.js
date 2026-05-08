/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#e8f4fd',
          100: '#c5e2f8',
          200: '#9dcff3',
          300: '#72bbee',
          400: '#52aceb',
          500: '#309ce8',
          600: '#2090e5',
          700: '#1381e0',
          800: '#0a72d8',
          900: '#0057c9',
        },
        dark: {
          50: '#e8eaed',
          100: '#c5cbd2',
          200: '#9eaab5',
          300: '#778898',
          400: '#5a6f81',
          500: '#3d576b',
          600: '#2f4a5f',
          700: '#1f3a50',
          800: '#152b40',
          900: '#0e1c2f',
          950: '#0a1628',
        },
      },
      animation: {
        'slide-in': 'slideIn 0.2s ease-out',
        'fade-in': 'fadeIn 0.15s ease-out',
        'bounce-in': 'bounceIn 0.3s ease-out',
      },
      keyframes: {
        slideIn: {
          from: { transform: 'translateX(100%)', opacity: 0 },
          to: { transform: 'translateX(0)', opacity: 1 },
        },
        fadeIn: {
          from: { opacity: 0, transform: 'translateY(4px)' },
          to: { opacity: 1, transform: 'translateY(0)' },
        },
        bounceIn: {
          '0%': { transform: 'scale(0.8)', opacity: 0 },
          '70%': { transform: 'scale(1.05)' },
          '100%': { transform: 'scale(1)', opacity: 1 },
        },
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

