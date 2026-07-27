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
      },
      minHeight: {
        // כפתורי שדה — מינימום 48px (עקרונות עיצוב, אנשי שטח)
        touch: '48px',
      },
    },
  },
  plugins: [],
};
