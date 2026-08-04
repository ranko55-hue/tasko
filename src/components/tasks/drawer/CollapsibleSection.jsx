import { useState } from 'react';
import Icon from '../../ui/Icon';

// מקטע מתקפל — כותרת 50px לחיצה, תג מונה navy, חץ מסתובב,
// פס סימון ימני 4px לפי משמעות (צהוב=דרישות, שחור=פרטים, כחול=מדיה, ירוק=ציר).
const BAR = {
  yellow: 'bg-drYellow',
  black: 'bg-drInk',
  blue: 'bg-drBlue',
  green: 'bg-drGreen',
};

export default function CollapsibleSection({ label, count, color = 'yellow', defaultOpen = false, children }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="relative mx-4 mb-3 overflow-hidden rounded-lg border border-drLine bg-white sm:mx-6">
      <span className={`absolute inset-y-0 right-0 w-1 ${BAR[color] ?? BAR.yellow}`} aria-hidden="true" />
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex h-[50px] w-full items-center gap-2 pe-4 ps-3 text-start"
      >
        <span className="text-sm font-bold text-navy">{label}</span>
        {count != null && (
          <span
            className="rounded-full bg-navy px-2 py-0.5 text-xs font-bold text-white"
            style={{ fontVariantNumeric: 'tabular-nums' }}
          >
            {count}
          </span>
        )}
        <Icon
          name="chevronDown"
          size="sm"
          className={`ms-auto shrink-0 text-grayMid transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </button>
      {open && <div className="pb-3 pe-4 ps-3">{children}</div>}
    </div>
  );
}
