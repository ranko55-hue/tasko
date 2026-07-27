/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        // Heebo — פונט המערכת, נטען ב-index.html
        sans: ['Heebo', 'system-ui', 'sans-serif'],
      },
      colors: {
        // צבע המותג הראשי של Tasko
        brand: {
          DEFAULT: '#2563eb',
          dark: '#1d4ed8',
        },
        // טוקני DESIGN.md — אין להמציא צבעים
        navy: '#0F172A',
        navy2: '#1E293B',
        brandYellow: '#FACC15',
        statusGreen: '#22C55E',
        statusRed: '#EF4444',
        statusBlue: '#3B82F6',
        line: '#E2E8F0',
      },
      minHeight: {
        // כפתורי שדה — מינימום 48px (עקרונות עיצוב, אנשי שטח)
        touch: '48px',
      },
      keyframes: {
        // הבהוב לתג חריגה (אדום)
        blink: { '0%,100%': { opacity: '1' }, '50%': { opacity: '0.35' } },
      },
      animation: {
        blink: 'blink 1s steps(2, start) infinite',
      },
    },
  },
  plugins: [],
};
