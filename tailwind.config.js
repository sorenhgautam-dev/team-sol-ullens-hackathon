/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'media',
  theme: {
    extend: {
      colors: {
        marigold: '#F5A524',
        sky: '#6EC6FF',
        danger: '#FF4D6D',
        shield: '#4ADE80',
        ink: 'rgb(var(--ink-rgb) / <alpha-value>)',
        paper: 'var(--paper)',
        card: 'var(--card)',
        cream: 'var(--cream)',
        terracotta: '#D9734E',
        sage: '#8FB08A',
        honey: '#F5C26B',
        plum: '#5B4B6B',
        mapgreen: '#9BB58A',
        sand: '#E8D9B5',
        river: '#7FB8D6',
      },
      fontFamily: { ui: ['Nunito', 'system-ui', 'sans-serif'] },
      borderRadius: { card: '20px' },
    },
  },
  plugins: [],
}
