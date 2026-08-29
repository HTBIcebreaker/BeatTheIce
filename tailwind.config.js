/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        begins: {
          sky: '#0EA5E9',
          skyHover: '#0284C7',
          skyLight: '#F0F9FF',
          skyTag: '#E0F2FE',
          pink: '#0EA5E9',       // Remapped to sky blue
          pinkHover: '#0284C7',  // Remapped to deep sky blue
          pinkLight: '#F0F9FF',  // Remapped to light sky tint
          pinkTag: '#E0F2FE',
          purple: '#38BDF8',     // Cyan / Bright sky accent
          dark: '#0F172A',       // Slate dark
          grayBg: '#F8FAFC',     // Clean ice gray background
          cardBorder: '#E2E8F0',
          tagBlue: '#E0F2FE',
          tagGreen: '#DCFCE7',
          tagYellow: '#FEF3C7',
          tagOrange: '#FFEDD5',
        }
      },
      fontFamily: {
        sans: [
          'Pretendard',
          '-apple-system',
          'BlinkMacSystemFont',
          'system-ui',
          'Roboto',
          'sans-serif',
        ],
      },
      boxShadow: {
        'mobile-card': '0 8px 30px rgba(14, 165, 233, 0.08)',
        'nav': '0 -4px 20px rgba(15, 23, 42, 0.05)',
        'popup': '0 12px 35px rgba(14, 165, 233, 0.22)',
      },
      animation: {
        'pulse-subtle': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 3s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-6px)' },
        }
      }
    },
  },
  plugins: [],
}
