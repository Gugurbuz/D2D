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
  safelist: [
  'bg-green-100', 'text-green-800',
  'bg-blue-100', 'text-blue-800',
  'bg-yellow-100', 'text-yellow-800',
  'bg-red-100', 'text-red-800'
]
};

