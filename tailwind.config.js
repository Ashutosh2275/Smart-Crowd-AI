/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Manrope', 'system-ui', 'sans-serif'],
        display: ['Space Grotesk', 'Manrope', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      colors: {
        background:   '#05050a',
        surface:      '#111118',
        surfaceHover: '#1a1a24',
        border:       '#1e1e2e',
        primary: {
          DEFAULT: '#6366f1',
          hover:   '#4f46e5',
          muted:   'rgba(99,102,241,0.15)',
        },
        cyan: {
          DEFAULT: '#22d3ee',
          muted:   'rgba(34,211,238,0.15)',
        },
        violet: {
          DEFAULT: '#a855f7',
          muted:   'rgba(168,85,247,0.15)',
        },
        textMain:  '#f4f4f5',
        textMuted: '#71717a',
        textDim:   '#52525b',
      },
      backgroundImage: {
        'gradient-radial':    'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic':     'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        'grid-pattern':       "radial-gradient(circle, rgba(255,255,255,0.028) 1px, transparent 1px)",
      },
      backgroundSize: {
        'grid-sm': '20px 20px',
        'grid-md': '28px 28px',
        'grid-lg': '40px 40px',
      },
      boxShadow: {
        'glow-primary':  '0 0 20px rgba(99,102,241,0.4), 0 0 60px rgba(99,102,241,0.12)',
        'glow-cyan':     '0 0 20px rgba(34,211,238,0.4), 0 0 60px rgba(34,211,238,0.10)',
        'glow-emerald':  '0 0 20px rgba(16,185,129,0.4), 0 0 60px rgba(16,185,129,0.10)',
        'glow-red':      '0 0 20px rgba(239,68,68,0.5), 0 0 60px rgba(239,68,68,0.15)',
        'glow-amber':    '0 0 20px rgba(245,158,11,0.4), 0 0 60px rgba(245,158,11,0.10)',
        'card':          '0 8px 32px rgba(0,0,0,0.4), 0 2px 8px rgba(0,0,0,0.2)',
        'card-hover':    '0 20px 60px rgba(0,0,0,0.6), 0 0 0 1px rgba(99,102,241,0.15)',
        'inset-glow':    'inset 0 1px 0 rgba(255,255,255,0.08)',
      },
      animation: {
        'float':          'float 6s ease-in-out infinite',
        'float-slow':     'floatSlow 9s ease-in-out infinite',
        'live-pulse':     'livePulse 2s ease-in-out infinite',
        'count-flash':    'countFlash 0.4s ease both',
        'orb-drift':      'orbDrift 18s ease-in-out infinite',
        'data-border':    'dataBorder 3s linear infinite',
        'scanline':       'scanline 6s linear infinite',
        'glow-pulse':     'glowPulse 2.8s ease-in-out infinite',
        'critical-pulse': 'criticalPulse 0.9s ease-in-out infinite',
        'ring-pulse':     'ringPulse 1.8s ease-out infinite',
        'mesh-gradient':  'meshGradient 18s ease infinite',
        'gradient-shift': 'gradientShift 8s ease infinite',
        'shimmer':        'shimmer 1.7s linear infinite',
        'spin-slow':      'spin 3s linear infinite',
        'spin-reverse':   'spinReverse 4s linear infinite',
      },
      transitionTimingFunction: {
        'spring': 'cubic-bezier(0.22, 1, 0.36, 1)',
      },
      borderRadius: {
        '4xl': '2rem',
        '5xl': '2.5rem',
      },
    },
  },
  plugins: [],
}
