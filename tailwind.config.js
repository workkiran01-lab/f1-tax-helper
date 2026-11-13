/** @type {import('tailwindcss').Config} */
const token = (name) => `rgb(var(--${name}) / <alpha-value>)`

export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      // Every colour in the app resolves to a variable defined in src/index.css.
      // Change the palette there; do not add hex values to components.
      colors: {
        bg: token('bg'),
        chrome: token('chrome'),
        surface: token('surface'),
        'surface-2': token('surface-2'),
        'surface-3': token('surface-3'),
        line: token('line'),
        'line-strong': token('line-strong'),
        ink: token('ink'),
        'ink-2': token('ink-2'),
        'ink-3': token('ink-3'),
        'ink-4': token('ink-4'),
        'ink-5': token('ink-5'),
        tint: token('tint'),
        'tint-hover': token('tint-hover'),
        'tint-ink': token('tint-ink'),
        'tint-ink-strong': token('tint-ink-strong'),
        'tint-soft': token('tint-soft'),
        warn: token('warn'),
        'warn-ink': token('warn-ink'),
        'warn-deep': token('warn-deep'),
        ok: token('ok'),
        bad: token('bad'),
        violet: token('violet'),
        'violet-ink': token('violet-ink'),

        // Earlier names, kept so existing components pick up the same palette.
        background: token('bg'),
        foreground: token('ink-2'),
        card: token('surface'),
        'card-foreground': token('ink-2'),
        'muted-foreground': token('ink-3'),
        'surface-soft': token('surface-2'),
        border: token('line'),
        'border-bright': token('line-strong'),
        primary: token('tint'),
        'primary-foreground': '#ffffff',
        secondary: token('line'),
        'secondary-foreground': token('ink'),
        accent: token('surface-2'),
        'accent-foreground': token('ink'),
        ring: token('tint'),
        'primary-soft': 'rgb(var(--tint) / 0.14)',
        success: token('ok'),
        'success-soft': 'rgb(var(--ok) / 0.14)',
        warning: token('warn'),
        'warning-soft': 'rgb(var(--warn) / 0.14)',
        danger: token('bad'),
        'danger-soft': 'rgb(var(--bad) / 0.14)',
        headline: token('ink'),
        body: token('ink-2'),
        muted: token('ink-4'),
        hint: token('ink-5'),
      },
      fontFamily: {
        // The platform's own UI typeface first, so the app feels native on each
        // device; Inter (bundled) everywhere a system UI face is unavailable.
        sans: [
          '-apple-system',
          'BlinkMacSystemFont',
          'Inter',
          'Segoe UI',
          'Roboto',
          'system-ui',
          'sans-serif',
        ],
        mono: ['ui-monospace', 'SF Mono', 'JetBrains Mono', 'Menlo', 'monospace'],
      },
      borderRadius: {
        '4xl': '1.75rem',
      },
      transitionTimingFunction: {
        // Fast start, long settle: used for sheets, drawers and page moves.
        glide: 'cubic-bezier(0.32, 0.72, 0, 1)',
      },
      boxShadow: {
        raised: 'inset 0 1px 0 rgb(255 255 255 / 0.05), 0 12px 32px -12px rgb(0 0 0 / 0.7)',
        sheet: '0 -8px 40px rgb(0 0 0 / 0.55)',
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
        fadeIn: { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
    },
  },
  plugins: [],
}
