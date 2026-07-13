/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
        display: ['Sora', 'Inter', 'system-ui', 'sans-serif'],
      },
      letterSpacing: {
        tightest: '-0.03em',
      },
      colors: {
        // Verde "relvado" — cor de marca / acção. Emerald refinado (menos "doce").
        pitch: {
          50: '#ecfdf5',
          300: '#6ee7b7',
          400: '#34d399',
          500: '#10b981',
          600: '#059669',
          700: '#047857',
          900: '#064e3b',
        },
        // Base escura neutra (charcoal com um toque frio) — leitura profissional.
        // 975 = fundo da página, 900/850 = superfícies, 800/700 = bordas.
        navy: {
          975: '#08090c',
          950: '#0c0e12',
          900: '#131519',
          850: '#191c22',
          800: '#23262e',
          700: '#31353f',
          600: '#464b57',
        },
      },
      boxShadow: {
        card: 'inset 0 1px 0 0 rgba(255, 255, 255, 0.05), 0 1px 1px 0 rgba(0, 0, 0, 0.2), 0 10px 30px -18px rgba(0, 0, 0, 0.55)',
        elevated: '0 20px 48px -20px rgba(0, 0, 0, 0.75)',
        modal: '0 32px 80px -24px rgba(0, 0, 0, 0.85)',
        glow: '0 6px 22px -8px rgba(16, 185, 129, 0.4)',
      },
      keyframes: {
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        'scale-in': {
          from: { opacity: '0', transform: 'translateY(8px) scale(0.97)' },
          to: { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
        'slide-up': {
          from: { transform: 'translateY(100%)' },
          to: { transform: 'translateY(0)' },
        },
        shimmer: {
          '100%': { transform: 'translateX(100%)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.18s ease-out',
        'scale-in': 'scale-in 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
        'slide-up': 'slide-up 0.28s cubic-bezier(0.16, 1, 0.3, 1)',
      },
    },
  },
  plugins: [],
};
