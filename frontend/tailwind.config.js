/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      colors: {
        background: '#090a0f',
        surface: 'rgba(15, 23, 42, 0.75)',
        'surface-card': '#0f172a',
        'surface-hover': 'rgba(30, 41, 59, 0.8)',
        border: 'rgba(51, 65, 85, 0.6)',
        'border-focus': 'rgba(14, 165, 233, 0.5)',
        primary: '#f8fafc',
        muted: '#94a3b8',
        accent: '#0ea5e9', // Sky/Cyan 500
        'accent-hover': '#0284c7',
        'accent-glow': 'rgba(14, 165, 233, 0.35)',
        cyan: {
          400: '#22d3ee',
          500: '#06b6d4',
          600: '#0891b2',
        },
        emerald: {
          400: '#34d399',
          500: '#10b981',
          600: '#059669',
        },
        amber: {
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
        },
        rose: {
          400: '#fb7185',
          500: '#f43f5e',
          600: '#e11d48',
        }
      },
      boxShadow: {
        'soft': '0 4px 24px -2px rgba(0, 0, 0, 0.45)',
        'elevated': '0 12px 36px -4px rgba(0, 0, 0, 0.6)',
        'glow-cyan': '0 0 25px -3px rgba(14, 165, 233, 0.3)',
        'glow-rose': '0 0 25px -3px rgba(244, 63, 94, 0.3)',
      }
    },
  },
  plugins: [],
}
