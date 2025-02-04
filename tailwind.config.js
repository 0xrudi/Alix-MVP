/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Primary Colors
        'cream-white': '#F8F7F4',
        'rich-black': '#2F2F2F',
        'warm-brown': '#8B735A',
        'deep-brown': '#6A5642',
        
        // Secondary Colors
        'paper-white': '#EFEDE8',
        'ink-grey': '#575757',
        'shadow': '#D8D3CC',
        'highlight': '#E5DED5',
      },
      fontFamily: {
        heading: ['Space Grotesk', 'sans-serif'],
        fraunces: ['Fraunces', 'serif'],
        inter: ['Inter', 'sans-serif'],
      },
      spacing: {
        'xs': '8px',
        'sm': '16px',
        'md': '24px',
        'lg': '32px',
        'xl': '48px',
        '2xl': '64px',
        '3xl': '96px',
      },
      fontSize: {
        'h1': ['48px', { lineHeight: '1.2', letterSpacing: '-0.02em' }],
        'h2': ['40px', { lineHeight: '1.2', letterSpacing: '-0.02em' }],
        'h3': ['32px', { lineHeight: '1.2', letterSpacing: '-0.02em' }],
        'h4': ['24px', { lineHeight: '1.2', letterSpacing: '-0.02em' }],
        'body-lg': ['18px', { lineHeight: '1.6', letterSpacing: '-0.01em' }],
        'body': ['16px', { lineHeight: '1.6', letterSpacing: '-0.01em' }],
        'ui': ['14px', { lineHeight: '1.4', letterSpacing: '0' }],
      },
      boxShadow: {
        'card': '0 2px 4px rgba(47, 47, 47, 0.05)',
        'card-hover': '0 4px 8px rgba(47, 47, 47, 0.05)',
      },
      borderRadius: {
        'card': '12px',
      },
      animation: {
        'fade-up': 'fadeUp 0.6s ease-out forwards',
        'float': 'float 1s ease-out forwards',
      },
      keyframes: {
        fadeUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        float: {
          '0%': { transform: 'translateY(-20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
      transitionTimingFunction: {
        'bounce-soft': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
      },
    },
  },
  plugins: [],
}