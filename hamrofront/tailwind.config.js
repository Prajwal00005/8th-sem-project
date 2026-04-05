/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
      hgreen: {
        DEFAULT: '#395917',
      },
      bgreen: {
        DEFAULT: '#85aa9b',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
      },
    },
  },
  },
  plugins: [],
}

