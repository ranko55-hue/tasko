// רצועת מידע — כרטיס לבן, מסגרת דקה, פס סימון ימני 4px לפי משמעות.
// כחול=מידע/כתובת, צהוב=זמן/הנחיות. שילוט קטן + תוכן + פעולה אופציונלית.
const BAR = {
  yellow: 'bg-drYellow',
  blue: 'bg-drBlue',
  green: 'bg-drGreen',
  red: 'bg-drRed',
  black: 'bg-drInk',
};

export default function InfoStrip({ label, color = 'yellow', action, children }) {
  return (
    <div className="relative mx-4 mb-3 overflow-hidden rounded-lg border border-drLine bg-white sm:mx-6">
      <span className={`absolute inset-y-0 right-0 w-1 ${BAR[color] ?? BAR.yellow}`} aria-hidden="true" />
      <div className="p-3 pe-4">
        <div className="mb-1 text-[10.5px] font-bold tracking-wide text-grayMid">{label}</div>
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0 flex-1">{children}</div>
          {action}
        </div>
      </div>
    </div>
  );
}
