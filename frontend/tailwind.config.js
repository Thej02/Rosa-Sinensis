/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        botanical: {
          50: '#f2f8f4',
          100: '#e4f1e9',
          200: '#cce3d4',
          300: '#a5ceb3',
          400: '#76b18d',
          500: '#4e8865',
          600: '#3e7052',
          700: '#335942',
          800: '#2c4736',
          900: '#253b2d',
          950: '#111e16',
        },
        sage: {
          light: '#e8f3ec',
          DEFAULT: '#4e8865',
          dark: '#3e7052',
        },
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      boxShadow: {
        'subtle': '0 4px 20px rgba(50, 80, 60, 0.04)',
        'card': '0 10px 30px rgba(40, 70, 50, 0.06)',
        'glow-green': '0 0 25px rgba(16, 185, 129, 0.25)',
        'glow-rose': '0 0 25px rgba(225, 29, 72, 0.25)',
      },
      keyframes: {
        scan: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(400%)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '200% 0' },
          '100%': { backgroundPosition: '-200% 0' },
        },
      },
      animation: {
        'scan-beam': 'scan 2.4s ease-in-out infinite alternate',
        'shimmer': 'shimmer 1.5s infinite linear',
      },
    },
  },
  plugins: [],
}
