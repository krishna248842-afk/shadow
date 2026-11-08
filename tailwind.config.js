/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        ink: '#0B0B12',
        panel: '#13131D',
        panel2: '#191926',
        line: '#23232F',
        brand: { 300: '#A3E635', 400: '#84CC16', 500: '#65A30D' },
        violet: { 400: '#A78BFA', 500: '#8B5CF6', 600: '#7C3AED' },
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        body: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        glow: '0 0 40px rgba(139, 92, 246, 0.25)',
        lime: '0 0 32px rgba(163, 230, 53, 0.18)',
      },
    },
  },
  plugins: [],
};
