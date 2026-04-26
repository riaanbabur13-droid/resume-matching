/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-body)', 'system-ui', 'sans-serif'],
        display: ['var(--font-display)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'monospace'],
      },
      colors: {
        brand: {
          50: '#f0f7ff',
          100: '#e0efff',
          200: '#baddff',
          300: '#7dc0ff',
          400: '#3a9fee',
          500: '#1a82d4',
          600: '#1267b4',
          700: '#105293',
          800: '#134679',
          900: '#153c65',
        },
        surface: {
          50: '#f9fafb',
          100: '#f3f4f6',
          800: '#1e2130',
          900: '#141625',
          950: '#0d0f1c',
        },
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease forwards',
        'slide-up': 'slideUp 0.4s ease forwards',
        'score-fill': 'scoreFill 1.2s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
      },
      keyframes: {
        fadeIn: { from: { opacity: 0 }, to: { opacity: 1 } },
        slideUp: { from: { opacity: 0, transform: 'translateY(20px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
        scoreFill: { from: { 'stroke-dashoffset': '283' }, to: { 'stroke-dashoffset': 'var(--target-offset)' } },
      },
    },
  },
  plugins: [],
};
