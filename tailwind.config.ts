import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Status pill colors per design language (§8 of the build brief)
        critical: '#DC2626', // red — critical/emergency
        urgent: '#D97706', // amber — urgent/active/treatment
        success: '#16A34A', // green — available/recovered/success
        info: '#2563EB', // blue — assigned/info
        ai: '#9333EA', // purple — following/AI/notifications
      },
      borderRadius: {
        card: '12px',
      },
    },
  },
  plugins: [],
};

export default config;
