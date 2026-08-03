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
        // ניווט צדי — navy עמוק יותר מהפס העליון, ליצירת היררכיה
        sidebar: '#0A1524',
        sidebarText: '#C9D6E2',
        sidebarLine: '#1D3D5C',
        sidebarLabel: '#8FA3B6',
        brandYellow: '#FACC15',
        statusGreen: '#22C55E',
        statusRed: '#EF4444',
        statusBlue: '#3B82F6',
        line: '#E2E8F0',
        // סקאלת אפורים — ערכי slate מקוריים, שם טוקני
        inkSoft: '#334155',
        grayDark: '#475569',
        grayMid: '#64748B',
        grayLight: '#94A3B8',
        lineDark: '#CBD5E1',
        appBg: '#F1F5F9',
        surface: '#F8FAFC',
        // סקאלת אדומים — danger
        danger: '#DC2626',
        dangerDark: '#7F1D1D',
        dangerLight: '#FEE2E2',
        dangerLine: '#FCA5A5',
        // v2 — טוקני מגירת המשימה (DESIGN.md §7)
        urgentSoft: '#FEF2F2',
        urgentInk: '#B42318',
        dueSoft: '#FEF9C3',
        dueInk: '#854D0E',
        reqSoft: '#EEF2FF',
        reqInk: '#3730A3',
        overrunSoft: '#FFFBFA',
        overrunLine: '#F5DAD7',
        surfaceBar: '#FBFCFD',
      },
      minHeight: {
        // כפתורי שדה — מינימום 48px (עקרונות עיצוב, אנשי שטח)
        touch: '48px',
      },
      keyframes: {
        // הבהוב לתג חריגה (אדום)
        blink: { '0%,100%': { opacity: '1' }, '50%': { opacity: '0.35' } },
        // פעימה רכה לנקודות סטטוס חיות
        softPulse: { '0%,100%': { opacity: '1' }, '50%': { opacity: '0.35' } },
      },
      animation: {
        blink: 'blink 1s steps(2, start) infinite',
        softPulse: 'softPulse 2s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
