import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Conviction palette — inky black with electric accent & conviction violet
        ink: {
          900: '#05060A',
          800: '#0B0D14',
          700: '#121521',
          600: '#1B1F2E',
          500: '#262B3C',
        },
        bone: {
          DEFAULT: '#F2F0EA',
          muted: '#C7C4BB',
        },
        volt: {
          // electric accent, chartreuse-lime
          DEFAULT: '#C6FF3D',
          dark: '#9FCC2D',
        },
        conviction: {
          DEFAULT: '#7C5CFF',
          dark: '#5A3FE0',
        },
        yes: {
          DEFAULT: '#22C55E',
          soft: 'rgba(34,197,94,0.15)',
        },
        no: {
          DEFAULT: '#EF4444',
          soft: 'rgba(239,68,68,0.15)',
        },
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
        display: ['var(--font-display)', 'Georgia', 'serif'],
        mono: ['var(--font-mono)', 'ui-monospace', 'monospace'],
      },
      letterSpacing: {
        tightest: '-0.04em',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'marquee': 'marquee 40s linear infinite',
        'fade-up': 'fade-up 0.6s ease-out forwards',
      },
      keyframes: {
        marquee: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
