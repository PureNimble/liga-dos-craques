import containerQueries from '@tailwindcss/container-queries';

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
      // Escala tipográfica FLUIDA: cada tamanho interpola suavemente entre o
      // valor de telemóvel (~360px) e o de desktop (~1280px) via clamp(). Assim
      // o texto adapta-se a qualquer ecrã sem "saltos" e sem mudar o layout.
      // (No topo bate no valor default do Tailwind; em baixo encolhe o suficiente
      // para caber sem quebrar.) line-height unitless para escalar com a fonte.
      fontSize: {
        xs: ['clamp(0.75rem, 0.726rem + 0.11vw, 0.8125rem)', { lineHeight: '1.4' }],
        sm: ['clamp(0.8125rem, 0.788rem + 0.11vw, 0.875rem)', { lineHeight: '1.45' }],
        base: ['clamp(0.9063rem, 0.87rem + 0.16vw, 1rem)', { lineHeight: '1.55' }],
        lg: ['clamp(1rem, 0.951rem + 0.22vw, 1.125rem)', { lineHeight: '1.5' }],
        xl: ['clamp(1.125rem, 1.076rem + 0.22vw, 1.25rem)', { lineHeight: '1.4' }],
        '2xl': ['clamp(1.3125rem, 1.239rem + 0.33vw, 1.5rem)', { lineHeight: '1.25' }],
        '3xl': ['clamp(1.5625rem, 1.44rem + 0.54vw, 1.875rem)', { lineHeight: '1.2' }],
        '4xl': ['clamp(1.8125rem, 1.641rem + 0.76vw, 2.25rem)', { lineHeight: '1.15' }],
        '5xl': ['clamp(2.125rem, 1.783rem + 1.52vw, 3rem)', { lineHeight: '1.05' }],
        '6xl': ['clamp(2.625rem, 2.185rem + 1.96vw, 3.75rem)', { lineHeight: '1' }],
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
  plugins: [
    // Container queries: um componente adapta-se à largura do SEU contentor
    // (não do viewport) — `@container` + variantes `@sm:`/`@lg:`. Deixa as caixas
    // saberem viver no espaço que recebem, em vez de dependerem do ecrã inteiro.
    containerQueries,
  ],
};
