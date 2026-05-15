/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'dh-bg': '#0a0a0f',
        'dh-card': '#12121a',
        'dh-card-hover': '#1a1a28',
        'dh-border': '#1e1e32',
        'dh-text': '#e4e4e7',
        'dh-text-muted': '#71717a',
        'dh-accent': '#c77dff',
        'dh-accent-dim': '#7b2ff7',
        'dh-rose': '#fb7185',
        'dh-rose-dim': '#e11d48',
        'dh-warm': '#f59e0b',
        'dh-success': '#34d399',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'breathe': 'breathe 4s ease-in-out infinite',
        'blink': 'blink 3s ease-in-out infinite',
        'typing': 'typing 1.4s infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        breathe: {
          '0%, 100%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.02)' },
        },
        blink: {
          '0%, 90%, 100%': { transform: 'scaleY(1)' },
          '95%': { transform: 'scaleY(0.1)' },
        },
        typing: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.3' },
        },
      },
    },
  },
  plugins: [],
};
