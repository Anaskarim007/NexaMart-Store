/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          50: '#f7f7f7',
          100: '#ededed',
          200: '#d6d6d6',
          300: '#a6a6a6',
          400: '#737373',
          500: '#525252',
          600: '#3d3d3d',
          700: '#2a2a2a',
          800: '#1a1a1a',
          900: '#0d0d0d',
          950: '#050505',
        },
        ivory: {
          50: '#fdfdfb',
          100: '#faf9f5',
          200: '#f4f2ea',
          300: '#ebe7d9',
          400: '#ded8c4',
          500: '#c9c0a3',
        },
        champagne: {
          50: '#fbf8f1',
          100: '#f5ecd6',
          200: '#ebd9ad',
          300: '#dcc07a',
          400: '#cda84e',
          500: '#bf9240',
          600: '#a8763a',
          700: '#875a32',
          800: '#6e482f',
          900: '#5b3c2a',
        },
      },
      fontFamily: {
        serif: ['"Cormorant Garamond"', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        '2xs': ['0.625rem', { lineHeight: '0.9rem' }],
      },
      letterSpacing: {
        widest: '0.2em',
      },
      maxWidth: {
        '8xl': '88rem',
      },
      animation: {
        'fade-in': 'fadeIn 0.4s ease-out',
        'slide-up': 'slideUp 0.5s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
};
