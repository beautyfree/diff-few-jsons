import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Theme colors using CSS variables
        background: 'rgb(var(--color-background))',
        foreground: 'rgb(var(--color-foreground))',
        card: {
          DEFAULT: 'rgb(var(--color-card))',
          foreground: 'rgb(var(--color-card-foreground))',
        },
        muted: {
          DEFAULT: 'rgb(var(--color-muted))',
          foreground: 'rgb(var(--color-muted-foreground))',
        },
        border: 'rgb(var(--color-border))',
        primary: {
          DEFAULT: 'rgb(var(--color-primary))',
          foreground: 'rgb(var(--color-primary-foreground))',
        },
        secondary: {
          DEFAULT: 'rgb(var(--color-secondary))',
          foreground: 'rgb(var(--color-secondary-foreground))',
        },
        accent: {
          DEFAULT: 'rgb(var(--color-accent))',
          foreground: 'rgb(var(--color-accent-foreground))',
        },
        // Diff colors using CSS variables
        'diff-added': {
          DEFAULT: 'rgb(var(--color-diff-added))',
          bg: 'rgb(var(--color-diff-added-bg))',
          text: 'rgb(var(--color-diff-added-text))',
        },
        'diff-removed': {
          DEFAULT: 'rgb(var(--color-diff-removed))',
          bg: 'rgb(var(--color-diff-removed-bg))',
          text: 'rgb(var(--color-diff-removed-text))',
        },
        'diff-modified': {
          DEFAULT: 'rgb(var(--color-diff-modified))',
          bg: 'rgb(var(--color-diff-modified-bg))',
          text: 'rgb(var(--color-diff-modified-text))',
        },
        'diff-unchanged': {
          DEFAULT: 'rgb(var(--color-diff-unchanged))',
          bg: 'rgb(var(--color-diff-unchanged-bg))',
        },
      },
      animation: {
        'fade-in': 'fadeIn 0.2s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}

export default config
