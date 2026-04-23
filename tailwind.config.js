/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      colors: {
        ink: '#18214d',
        accent: '#695cfb',
        mist: '#f8f7ff',
      },
      boxShadow: {
        hero: '0 42px 80px -44px rgba(24, 33, 77, 0.38)',
      },
    },
  },
  plugins: [],
};

