// tailwind.config.js
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx,js,jsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          yellow: "#F9C800",
          turq: "#0099CB",
          navy: "#002D72",
        },
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'), // opsiyonel ama tavsiye edilir
  ],
};
