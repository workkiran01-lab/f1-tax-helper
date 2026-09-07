/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        background: '#080c14',
        foreground: '#cbd5e1',
        card: '#0f172a',
        'card-foreground': '#cbd5e1',
        'muted-foreground': '#94a3b8',
        surface: '#0f172a',
        'surface-soft': '#111827',
        border: '#1e293b',
        'border-bright': '#2d4a6e',
        primary: '#3b82f6',
        'primary-soft': 'rgba(59, 130, 246, 0.12)',
        success: '#22c55e',
        'success-soft': 'rgba(34, 197, 94, 0.12)',
        warning: '#f59e0b',
        'warning-soft': 'rgba(245, 158, 11, 0.12)',
        danger: '#ef4444',
        'danger-soft': 'rgba(239, 68, 68, 0.12)',
        headline: '#f8fafc',
        body: '#cbd5e1',
        muted: '#64748b',
        hint: '#475569',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      animation: {
        'fade-up': 'fadeUp 0.4s ease-out forwards',
        'fade-in': 'fadeIn 0.3s ease-out forwards',
        shimmer: 'shimmer 2s infinite',
      },
      keyframes: {
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
    },
  },
  plugins: [],
}
