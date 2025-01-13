/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'lkl-blue': '#39576D',
        'lkl-light': '#D9E2EC',
        'lkl-neutral': '#F2F4F7',
        'lkl-neutral-light': '#5E778B',
        'lkl-light-grey': '#F5F5F5',
        'lkl-grey': '#C5D0DC',
        'lkl-grey-active': '#E8F2FD',
        'lkl-black': '#1E1E1E'
      },
      fontFamily: {
        'dm-sans': ['DM Sans', 'sans-serif'],
      },
    },
  },
  plugins: [],
}