/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        /** Main titles — warm cream (easier on the eyes than full yellow) */
        heading: {
          primary: '#f5f0e8',
          /** Section / card headings — muted warm stone */
          secondary: '#b8aea0',
        },
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        menuReveal: {
          '0%': { opacity: '0', transform: 'scale(0.82) translateY(8px)' },
          '50%': { opacity: '1', transform: 'scale(1.03) translateY(0)' },
          '62%': { transform: 'scale(1) rotate(-2.5deg)' },
          '74%': { transform: 'scale(1) rotate(2.5deg)' },
          '86%': { transform: 'scale(1) rotate(-1.2deg)' },
          '100%': { opacity: '1', transform: 'scale(1) rotate(0deg)' },
        },
        menuCardIn: {
          '0%': { opacity: '0', transform: 'scale(0.58) translateY(14px)' },
          '42%': { opacity: '1', transform: 'scale(1.06) translateY(0)' },
          '54%': { transform: 'scale(1) rotate(-4deg)' },
          '66%': { transform: 'scale(1) rotate(4deg)' },
          '78%': { transform: 'scale(1) rotate(-2.5deg)' },
          '90%': { transform: 'scale(1) rotate(1.2deg)' },
          '100%': { opacity: '1', transform: 'scale(1) rotate(0deg)' },
        },
        menuModal: {
          '0%': { opacity: '0', transform: 'scale(0.65) translateY(14px)' },
          '45%': { opacity: '1', transform: 'scale(1.04) translateY(0)' },
          '56%': { transform: 'scale(1) rotate(-3deg)' },
          '68%': { transform: 'scale(1) rotate(3deg)' },
          '80%': { transform: 'scale(1) rotate(-1.5deg)' },
          '100%': { opacity: '1', transform: 'scale(1) rotate(0deg)' },
        },
        menuBackdrop: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
      animation: {
        fadeIn: 'fadeIn 0.5s ease-out forwards',
        menuReveal: 'menuReveal 0.58s cubic-bezier(0.34, 1.25, 0.64, 1) forwards',
        menuCardIn: 'menuCardIn 0.65s cubic-bezier(0.34, 1.25, 0.64, 1) forwards',
        menuModal: 'menuModal 0.48s cubic-bezier(0.34, 1.25, 0.64, 1) forwards',
        menuBackdrop: 'menuBackdrop 0.28s ease-out forwards',
      },
    },
  },
  plugins: [],
};
