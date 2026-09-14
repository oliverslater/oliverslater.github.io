import typography from '@tailwindcss/typography';

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        background: 'var(--background)',
        sec: 'var(--sec)',
        'white-custom': 'var(--white)',
        'white-icon': 'var(--white-icon)',
        'white-icon-tr': 'var(--white-icon-tr)',
        'component-bg': 'var(--component-bg)',
      },
      fontFamily: {
        sans: [
          '"Montserrat Variable"',
          'Montserrat',
          '-apple-system',
          'BlinkMacSystemFont',
          'sans-serif',
        ],
        mono: [
          'JetBrains Mono',
          'ui-monospace',
          'monospace',
        ],
      },
    },
  },
  plugins: [typography],
};
