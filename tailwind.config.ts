import type { Config } from 'tailwindcss'
import forms from '@tailwindcss/forms'

const config: Config = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        green: {
          dark:  '#1A3A2B',   // deep Augusta forest
          mid:   '#2D6147',   // fairway
          light: '#4A8962',   // rough
          pale:  '#C5D9CD',   // sage border
          faint: '#EAF2EC',   // barely-there tint
        },
        fairway: '#A8CCAF',
        gold: {
          DEFAULT: '#A8822A',   // brass
          light:   '#D4AE5C',   // lighter brass
          faint:   '#F7F0E0',   // warm tint
        },
        coral: {
          DEFAULT: '#C85A4A',
          light:   '#E89A90',
          dark:    '#9E3D30',
        },
        sky: {
          DEFAULT: '#7BAFC8',
          light:   '#B8D8E8',
        },
        cream: '#F5F0E8',   // parchment
        bone:  '#EDE6D8',   // deeper parchment
      },
      fontFamily: {
        display: ['"Fraunces"', 'Georgia', 'serif'],
        sans:    ['"Space Grotesk"', 'system-ui', 'sans-serif'],
        serif:   ['"Fraunces"', 'Georgia', 'serif'],   // now actually serif
      },
      boxShadow: {
        card:  '0 2px 8px -2px rgba(26,58,43,0.10), 0 1px 3px rgba(26,58,43,0.06)',
        pop:   '0 8px 24px -4px rgba(26,58,43,0.18)',
        inset: 'inset 0 2px 4px rgba(26,58,43,0.08)',
      },
      borderRadius: {
        'xl':  '14px',
        '2xl': '20px',
        '3xl': '28px',
      },
      keyframes: {
        'slide-up': {
          from: { transform: 'translateY(100%)' },
          to:   { transform: 'translateY(0)' },
        },
      },
      animation: {
        'slide-up': 'slide-up 0.25s cubic-bezier(0.32, 0.72, 0, 1)',
      },
    },
  },
  plugins: [forms],
}

export default config
