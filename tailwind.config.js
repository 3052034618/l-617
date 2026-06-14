/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    container: {
      center: true,
    },
    extend: {
      colors: {
        space: {
          50: '#f0f7ff',
          100: '#e0efff',
          200: '#bad9ff',
          300: '#7cb8ff',
          400: '#3694ff',
          500: '#1E90FF',
          600: '#0b6fe0',
          700: '#0a58b4',
          800: '#0e4a90',
          900: '#0A1628',
          950: '#070f1c',
        },
        cyan: {
          400: '#00E5FF',
          500: '#00D4FF',
          600: '#00b0d4',
        },
        deep: {
          900: '#0A1628',
          800: '#112240',
          700: '#1a2d4d',
          600: '#233a5e',
        }
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'glow-blue': 'linear-gradient(135deg, rgba(30, 144, 255, 0.1) 0%, rgba(0, 212, 255, 0.05) 100%)',
      },
      boxShadow: {
        'glow': '0 0 20px rgba(30, 144, 255, 0.3)',
        'glow-cyan': '0 0 20px rgba(0, 212, 255, 0.4)',
        'glow-red': '0 0 20px rgba(239, 68, 68, 0.4)',
        'inner-glow': 'inset 0 1px 0 0 rgba(255, 255, 255, 0.1)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow-pulse': 'glow-pulse 2s ease-in-out infinite',
        'float': 'float 6s ease-in-out infinite',
        'shimmer': 'shimmer 2s linear infinite',
        'slide-up': 'slide-up 0.4s ease-out',
        'fade-in': 'fade-in 0.3s ease-out',
      },
      keyframes: {
        'glow-pulse': {
          '0%, 100%': { boxShadow: '0 0 10px rgba(30, 144, 255, 0.3)' },
          '50%': { boxShadow: '0 0 25px rgba(30, 144, 255, 0.6)' },
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        'shimmer': {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        'slide-up': {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
      fontFamily: {
        sans: ['"SF Pro Display"', '"PingFang SC"', '"Microsoft YaHei"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', '"Fira Code"', 'monospace'],
      },
    },
  },
  plugins: [],
};
