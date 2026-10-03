/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        marigold: '#E0A93B',
        sky: '#7FB8D6',
        danger: '#B23A30',
        shield: '#18665F',
        teal: '#18665F',
        ink: 'rgb(var(--ink-rgb) / <alpha-value>)',
        paper: 'var(--paper)',
        card: 'var(--card)',
        card2: 'var(--card-2)',
        cream: 'var(--cream)',
        terracotta: '#D9734E',
        sage: '#8FB08A',
        honey: '#8A5300',
        plum: '#5B4B6B',
        mapgreen: '#9BB58A',
        sand: '#E8D9B5',
        river: '#7FB8D6',
      },
      fontFamily: { ui: ['Nunito', 'system-ui', 'sans-serif'], pixel: ['Silkscreen', 'Pixelify Sans', 'monospace'] },
      borderRadius: { card: '20px' },
    },
  },
  plugins: [],
}
