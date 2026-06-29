import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        mtech: {
          navy: '#1D2A3A',
          'navy-secondary': '#2E425B',
          grey: '#8F9194',
          'grey-light': '#B4B6B9',
          orange: '#F9701F',
          'orange-hover': '#e05e10',
        },
        surface: {
          DEFAULT: '#1D2A3A',
          2: '#2E425B',
          3: '#243347',
        },
        border: '#3a4f6a',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Syne', 'sans-serif'],
      },
      animation: {
        'sway': 'sway 3s ease-in-out infinite',
        'float': 'float 6s ease-in-out infinite',
        'pulse-dot': 'pulse-dot 2s ease-in-out infinite',
        'think': 'think 1.5s ease-in-out infinite',
        'steam': 'steam 2s ease-out infinite',
      },
      keyframes: {
        sway: {
          '0%, 100%': { transform: 'rotate(-1.5deg)' },
          '50%': { transform: 'rotate(1.5deg)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        'pulse-dot': {
          '0%, 100%': { transform: 'scale(1)', opacity: '1' },
          '50%': { transform: 'scale(1.35)', opacity: '0.7' },
        },
        think: {
          '0%': { opacity: '0.2', transform: 'translateY(0px)' },
          '50%': { opacity: '1', transform: 'translateY(-4px)' },
          '100%': { opacity: '0.2', transform: 'translateY(0px)' },
        },
        steam: {
          '0%': { opacity: '0', transform: 'translateY(0) scaleX(1)' },
          '50%': { opacity: '0.6', transform: 'translateY(-8px) scaleX(1.2)' },
          '100%': { opacity: '0', transform: 'translateY(-16px) scaleX(0.8)' },
        },
      },
      boxShadow: {
        'desk': '0 4px 24px rgba(0,0,0,0.4)',
        'desk-hover': '0 8px 32px rgba(0,0,0,0.5)',
        'glow-orange': '0 0 20px rgba(249,112,31,0.3)',
      },
    },
  },
  plugins: [],
}

export default config
