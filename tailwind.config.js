/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/frontend/index.html', './src/frontend/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        'neptuna-ocean': '#5bc2e7',
        'deep-ocean': '#4ba8d1',
        'deep-space': '#11111f',
        'trident-steel': '#c0c5ce',
        'dark-bg': '#0a0a0f',
        'card-bg': '#1a1a2e',
        'table-head': '#0f0f1c',
        'muted': '#6b7280',
        'terminal-green': '#00ff88',
        'session-purple': '#9b59b6',
        'warning-amber': '#ffc107',
        'warning-coral': '#ff6b6b',
      },
      borderColor: {
        'neptuna/20': 'rgba(91, 194, 231, 0.2)',
        'neptuna/8': 'rgba(91, 194, 231, 0.08)',
      },
    },
  },
  plugins: [],
};
