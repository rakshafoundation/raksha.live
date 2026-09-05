import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-sans)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      colors: {
        // Status pill / semantic colors per build brief §8. Red is reserved
        // for critical/emergency — never used decoratively elsewhere.
        critical: '#DC2626',
        urgent: '#D97706',
        success: '#16A34A',
        info: '#2563EB',
        ai: '#9333EA',
        canvas: '#FAFAF9',
      },
      borderRadius: {
        card: '14px',
      },
      boxShadow: {
        soft: '0 1px 2px 0 rgb(0 0 0 / 0.03), 0 1px 8px -2px rgb(0 0 0 / 0.06)',
        floating: '0 8px 24px -6px rgb(0 0 0 / 0.12)',
      },
      keyframes: {
        'fade-slide-in': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'pop-in': {
          '0%': { opacity: '0', transform: 'scale(0.96)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
      },
      animation: {
        'fade-slide-in': 'fade-slide-in 0.28s ease-out',
        'pop-in': 'pop-in 0.18s ease-out',
      },
    },
  },
  plugins: [],
};

export default config;
