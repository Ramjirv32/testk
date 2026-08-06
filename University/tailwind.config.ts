import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'beige': '#f8f5f0',
        'dark-text': '#2d2d2d',
        'light-text': '#5a5a5a',
        'magenta': '#e61a8d',
        'border-color': '#ede9e4',
        'footer-text': '#8a8a8a',
      },
    },
  },
  plugins: [],
};

export default config;
