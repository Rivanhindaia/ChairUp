import type { Config } from 'tailwindcss'
export default {
  content: ['./app/**/*.{ts,tsx}','./components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily:{ display:['ui-sans-serif','system-ui','Inter','sans-serif'] },
      boxShadow:{ soft:'0 10px 30px -10px rgba(0,0,0,0.15)' }
    },
  },
  plugins: [],
} satisfies Config
