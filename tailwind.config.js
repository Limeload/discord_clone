/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        discord: {
          bg: '#313338',
          sidebar: '#2b2d31',
          'channel-bg': '#1e1f22',
          input: '#383a40',
          hover: '#404249',
          text: '#dcddde',
          muted: '#96989d',
          link: '#00a8fc',
          green: '#23a55a',
          red: '#f23f42',
          yellow: '#f0b232',
        },
      },
      fontFamily: {
        sans: [
          'gg sans',
          'Noto Sans',
          'Whitney',
          'Helvetica Neue',
          'Helvetica',
          'Roboto',
          'Arial',
          'sans-serif',
        ],
      },
    },
  },
  plugins: [],
};
