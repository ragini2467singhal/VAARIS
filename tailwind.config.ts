import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ['var(--font-display)', 'serif'],
        body: ['var(--font-body)', 'sans-serif'],
        mono: ['var(--font-mono)', 'monospace'],
      },
      colors: {
        ink: '#0A0A0F',
        paper: '#F5F0E8',
        gold: {
          DEFAULT: '#C9A84C',
          light: '#E8D5A3',
          dark: '#8B6914',
          glow: 'rgba(201, 168, 76, 0.4)',
        },
        vault: {
          DEFAULT: '#FAF6F0',
          mid: '#F5F0E8',
          light: '#EDE4D5',
          dark: '#E2D5C0',
        },
        ember: '#8B2635',
        sage: '#1A5C3A',
        ash: '#6B7280',
      },
      backgroundImage: {
        'grain': "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E\")",
        'gold-shimmer': 'linear-gradient(90deg, transparent, rgba(201, 168, 76, 0.2), transparent)',
        'premium-glass-grad': 'linear-gradient(145deg, rgba(245, 240, 232, 0.1), rgba(245, 240, 232, 0.05))',
      },
      boxShadow: {
        'gold-glow': '0 0 20px rgba(201, 168, 76, 0.15)',
        'gold-glow-strong': '0 0 30px rgba(201, 168, 76, 0.3)',
        'inner-gold': 'inset 0 0 10px rgba(201, 168, 76, 0.1)',
        'vault-deep': '0 10px 40px -10px rgba(8, 16, 24, 0.8)',
      },
      animation: {
        'fade-up': 'fadeUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'fade-in': 'fadeIn 0.6s ease forwards',
        'fade-up-slow': 'fadeUp 1.2s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'shimmer': 'shimmer 2.5s infinite',
        'pulse-gold': 'pulseGold 3s ease-in-out infinite',
        'float': 'float 6s ease-in-out infinite',
        'float-slow': 'float 8s ease-in-out infinite',
        'glow-pulse': 'glowPulse 4s ease-in-out infinite',
      },
      keyframes: {
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(30px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        pulseGold: {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(201, 168, 76, 0.4)' },
          '50%': { boxShadow: '0 0 0 16px rgba(201, 168, 76, 0)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-12px)' },
        },
        glowPulse: {
          '0%, 100%': { opacity: '0.5' },
          '50%': { opacity: '0.8' },
        },
      },
    },
  },
  plugins: [],
}

export default config
