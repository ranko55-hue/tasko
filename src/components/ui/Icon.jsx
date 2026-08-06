// אייקונים גרפיים (SVG) במקום אימוג'י — צבע יורש מהטקסט, גודל נשלט בפרופ.
// stroke-based, viewBox אחיד 24x24, כדי שכולם ייראו מאותה משפחה.
const PATHS = {
  task: 'M9 5h6a1 1 0 0 1 1 1v1H8V6a1 1 0 0 1 1-1Zm-1 2H6a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-2M9 13h6M9 16h4',
  client: 'M4 20V6a1 1 0 0 1 1-1h7a1 1 0 0 1 1 1v14M13 20V10h6a1 1 0 0 1 1 1v9M3 20h18M7 8h2M7 11h2M7 14h2M16 13h1M16 16h1',
  project: 'M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Z',
  doc: 'M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8l-5-5Zm0 0v5h5',
  finance: 'M6 3h12a1 1 0 0 1 1 1v16l-2.5-1.5L14 20l-2-1.5L10 20l-2.5-1.5L5 20V4a1 1 0 0 1 1-1Zm2 5h8M8 11h8M8 14h5',
  search: 'M11 4a7 7 0 1 1 0 14 7 7 0 0 1 0-14ZM20 20l-4-4',
  check: 'M4 12.5 9 17.5 20 6.5',
  users: 'M16 19v-1a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v1M9.5 5a3.5 3.5 0 1 1 0 7 3.5 3.5 0 0 1 0-7ZM21 19v-1a4 4 0 0 0-3-3.87M16 5.13A4 4 0 0 1 16 12',
  alert: 'M12 4 2.5 20h19L12 4Zm0 6v5m0 3h.01',
  lock: 'M7 11V8a5 5 0 0 1 10 0v3M6 11h12a1 1 0 0 1 1 1v7a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1v-7a1 1 0 0 1 1-1Z',
  pause: 'M9 5v14M15 5v14',
  urgent: 'M12 3s5 4.5 5 9a5 5 0 0 1-10 0c0-1.6.7-3 1.5-4 .2 1.2.9 2 1.8 2 .5-3 1.7-5.4 1.7-7Z',
  ai: 'M8 4h8a2 2 0 0 1 2 2v2h1a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-1v3a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2v-3H5a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1h1V6a2 2 0 0 1 2-2Zm2 7h.01M14 11h.01M10 15h4',
  inbox: 'M4 13h4l1.5 3h5L16 13h4M4 13 6.5 5.5A1 1 0 0 1 7.5 5h9a1 1 0 0 1 1 .5L20 13v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-5Z',
  camera: 'M4 8h3l1.5-2h7L17 8h3a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1Zm8 3a3.5 3.5 0 1 1 0 7 3.5 3.5 0 0 1 0-7Z',
  mic: 'M12 4a3 3 0 0 1 3 3v5a3 3 0 0 1-6 0V7a3 3 0 0 1 3-3ZM6 11a6 6 0 0 0 12 0M12 17v3',
  timeline: 'M6 4v16M6 7h12M6 12h9M6 17h12',
  close: 'M6 6l12 12M18 6 6 18',
  expand: 'M9 4H4v5M15 4h5v5M15 20h5v-5M9 20H4v-5',
  play: 'M8 5.5v13l11-6.5-11-6.5Z',
  pauseBars: 'M9.5 5v14M14.5 5v14',
  chevronDown: 'M6 9l6 6 6-6',
  chevronUp: 'M6 15l6-6 6 6',
  back: 'M15 4l-8 8 8 8',
  menu: 'M4 6h16M4 12h16M4 18h16',
  clock: 'M12 4a8 8 0 1 1 0 16 8 8 0 0 1 0-16Zm0 4v4l3 2',
  report: 'M4 5a1 1 0 0 1 1-1h14a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5Zm4 10v-4m4 4V9m4 6v-2',
  phone: 'M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2Z',
  grid: 'M4 4h6v6H4V4Zm10 0h6v6h-6V4ZM4 14h6v6H4v-6Zm10 0h6v6h-6v-6Z',
  settings: 'M12 9.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5ZM9.8 3.6 9.4 5.9a7 7 0 0 0-1.9 1.1L5.3 6.2 3.1 10l1.8 1.5a7 7 0 0 0 0 1.1L3.1 14l2.2 3.8 2.2-.8a7 7 0 0 0 1.9 1.1l.4 2.3h4.4l.4-2.3a7 7 0 0 0 1.9-1.1l2.2.8 2.2-3.8-1.8-1.5a7 7 0 0 0 0-1.1L20.9 10l-2.2-3.8-2.2.8a7 7 0 0 0-1.9-1.1l-.4-2.3H9.8Z',
  support: 'M12 4a8 8 0 1 1 0 16 8 8 0 0 1 0-16ZM9.8 9.3a2.3 2.3 0 0 1 4.2 1.3c0 1.5-1.9 1.9-2 3.4M12 17h.01',
  org: 'M4 20V7l5-2.5V20M9 10h10a1 1 0 0 1 1 1v9M3 20h18M13 13.5h1.5M13 16.5h1.5M16.5 13.5H18M16.5 16.5H18',
  home: 'M3 11 12 4l9 7M5 10v9a1 1 0 0 0 1 1h4v-5h4v5h4a1 1 0 0 0 1-1v-9',
  logout: 'M14 4h4a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1h-4M9 8l-4 4 4 4M5 12h11',
  bell: 'M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9M10.3 21a2 2 0 0 0 3.4 0',
  priNormal: 'M12 4a8 8 0 1 1 0 16 8 8 0 0 1 0-16ZM8.5 12h7',
  calendar: 'M5 5h14a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1ZM4 9h16M8 3v4M16 3v4',
  // גאנט — קווים אופקיים מדורגים
  gantt: 'M4 6h9M9 12h10M6 18h8',
};

const SIZES = { sm: 'h-4 w-4', md: 'h-5 w-5', lg: 'h-8 w-8', xl: 'h-12 w-12', nav: 'h-[19px] w-[19px]' };

export default function Icon({ name, size = 'md', className = '', strokeWidth = 1.75 }) {
  const d = PATHS[name];
  if (!d) return null;

  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={`${SIZES[size] ?? SIZES.md} shrink-0 ${className}`}
    >
      <path d={d} />
    </svg>
  );
}
