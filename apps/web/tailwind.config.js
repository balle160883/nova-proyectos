/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        monday: {
          blue: '#0073EA',
          hover: '#0060B9',
          dark: '#111827',
          gray: '#F5F6F8',
          border: '#D0D4E4',
          green: '#00C875',
          yellow: '#FDAB3D',
          red: '#E2445C',
          purple: '#A54EE1',
        },
        m365: {
          blue: '#0F6CBD',
          teal: '#008272',
          purple: '#5C2D91',
        }
      },
    },
  },
  plugins: [],
}
