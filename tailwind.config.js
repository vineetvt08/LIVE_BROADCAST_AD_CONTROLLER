/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        mcr: {
          bg: '#f8fafc',
          panel: '#ffffff',
          panelHover: '#f1f5f9',
          border: '#e2e8f0',
          darkBorder: '#cbd5e1',
          accent: '#2563eb',
          gold: '#d97706',
          silver: '#64748b',
          bronze: '#b45309',
          live: '#dc2626',
          safe: '#16a34a',
          warning: '#d97706',
        }
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Consolas', 'Fira Code', 'monospace'],
        display: ['Inter', 'system-ui', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
