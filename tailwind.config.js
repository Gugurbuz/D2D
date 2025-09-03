/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          yellow: '#F9C800',
          turq: '#0099CB',
          navy: '#002D72',
        },
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'), // (önerilir) form elemanlarını normalize eder
  ],
};
