import type { Config } from 'tailwindcss'
import forms from '@tailwindcss/forms'

const config: Config = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        green: {
          dark:  '#0f2b14',   // deep forest
          mid:   '#1e5128',   // fairway
          light: '#4a9b5c',   // fresh grass
          pale:  '#cfebd4',
          faint: '#edf6ef',
        },
        fairway: '#b8e0bc',
        gold: {
          DEFAULT: '#d4a520',
          light:   '#f5d970',
          faint:   '#fdf6e3',
        },
        coral: {
          DEFAULT: '#ff6b5b',
          light:   '#ffb8b0',
          dark:    '#d94e3f',
        },
        sky: {
          DEFAULT: '#a8d8f0',
          light:   '#d6ecf7',
        },
        cream: '#fbf8f1',
        bone:  '#f4efe4',
      },
      fontFamily: {
        // Everything defaults to Space Grotesk (modern, geometric, friendly).
        // Use font-display (Fraunces) sparingly for hero moments only.
        display: ['"Fraunces"', 'Georgia', 'serif'],
        sans:    ['"Space Grotesk"', 'system-ui', 'sans-serif'],
        serif:   ['"Space Grotesk"', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card:   '0 2px 8px -2px rgba(15,43,20,0.12), 0 1px 3px rgba(15,43,20,0.06)',
        pop:    '0 8px 24px -4px rgba(15,43,20,0.2)',
        inset:  'inset 0 2px 4px rgba(15,43,20,0.08)',
      },
      borderRadius: {
        'xl':  '14px',
        '2xl': '20px',
        '3xl': '28px',
      },
    },
  },
  plugins: [forms],
}

export default config
