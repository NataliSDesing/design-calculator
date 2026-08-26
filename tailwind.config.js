/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        cream: '#FAFAF8',
        charcoal: '#1A1A1A',
        stone: '#2D2D2D',
        lime: '#CCE94B',
        'lime-light': '#D9F06E',
        'lime-dark': '#A8C93A',
        coral: '#FF525C',
        'coral-light': '#FF7A82',
        'coral-dark': '#E03A44',
        muted: '#8A8A8A',
        surface: '#FFFFFF',
        'surface-hover': '#F5F5F3',
        border: '#E8E8E6',
        'border-dark': '#3A3A3A',
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
        display: ['Unbounded', 'Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
