/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        abismo: '#0B3C49', // texto principal y fondos oscuros
        marea: '#1F7A8C', // acciones secundarias y enlaces
        espuma: '#EEF4F5', // fondo
        bruma: '#9DB4BA', // bordes y texto suave
        sol: '#F2B134', // acción principal
      },
    },
  },
  plugins: [],
};
