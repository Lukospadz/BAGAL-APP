import type { Config } from 'tailwindcss'
import forms from '@tailwindcss/forms'

const config: Config = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        green: {
          dark:  '#1a3d1f',
          mid:   '#2d6a35',
          light: '#3b8c45',
          pale:  '#d4edda',
          faint: '#eaf4ec',
        },
        fairway: '#c8e6c9',
        gold: {
          DEFAULT: '#c9a84c',
          light:   '#f0d98a',
          faint:   '#fdf6e3',
        },
        cream: '#fdfaf4',
      },
      fontFamily: {
        serif: ['"EB Garamond"', 'Georgia', 'Times New Roman', 'serif'],
        sans:  ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 3px 0 rgba(26,61,31,0.08)',
      },
    },
  },
  plugins: [forms],
}

export default config
