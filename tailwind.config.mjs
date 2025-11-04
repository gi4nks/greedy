/** @type {import('tailwindcss').Config} */
const config = {
  theme: {
    extend: {},
  },
  plugins: [require('@tailwindcss/typography'), 'daisyui'],
  daisyui: {
    themes: ['corporate'],
  },
};

export default config;
