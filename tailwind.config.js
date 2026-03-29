/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        menuReveal: {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        menuCardIn: {
          '0%': { opacity: '0', transform: 'translateY(18px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        menuModal: {
          '0%': { opacity: '0', transform: 'scale(0.96) translateY(10px)' },
          '100%': { opacity: '1', transform: 'scale(1) translateY(0)' },
        },
        menuBackdrop: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
      animation: {
        fadeIn: 'fadeIn 0.5s ease-out forwards',
        menuReveal: 'menuReveal 0.55s cubic-bezier(0.22, 1, 0.36, 1) forwards',
        menuCardIn: 'menuCardIn 0.45s cubic-bezier(0.22, 1, 0.36, 1) forwards',
        menuModal: 'menuModal 0.38s cubic-bezier(0.22, 1, 0.36, 1) forwards',
        menuBackdrop: 'menuBackdrop 0.28s ease-out forwards',
      },
    },
  },
  plugins: [],
};
