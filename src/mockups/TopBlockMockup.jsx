import { useState } from 'react';
import { mk } from './mockStrings';
import Icon from '../components/ui/Icon';

const NUM = { fontVariantNumeric: 'tabular-nums' };

// שורת הניווט — זהה למה שקיים היום: לוגו משמאל, ניווט, חיפוש גלוי, משתמש.
function NavRow({ active }) {
  return (
    <div className="flex items-center gap-3 bg-navy px-4 py-2.5">
      <nav className="flex shrink-0 items-center">
        {mk.top.nav.map((label) => (
          <span
            key={label}
            className={`border-b-2 px-3 py-1 text-sm font-bold ${
              label === active
                ? 'border-brandYellow text-white'
                : 'border-transparent text-slate-300'
            }`}
          >
            {label}
          </span>
        ))}
      </nav>

      <div className="hidden min-w-0 flex-1 items-center gap-2 rounded-full border border-white/20 bg-white/[0.14] px-3 md:flex">
        <Icon name="search" size="sm" className="text-slate-300" />
        <span className="truncate py-2 text-sm text-slate-300">{mk.top.searchPlaceholder}</span>
      </div>

      <span className="hidden shrink-0 text-sm text-slate-300 sm:inline">{mk.top.user}</span>
      <span className="hidden shrink-0 text-sm text-slate-300 md:inline">{mk.top.logout}</span>

      <img
        src="/brand/tasko-header-dark.png"
        alt=""
        className="ms-auto h-6 w-auto shrink-0"
      />
    </div>
  );
}

// שורת תדריך דחוסה — חריגים בלבד. במצב נקי: נקודה ירוקה ו"הכל תקין".
function BriefRow({ clean }) {
  const chip = 'inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold';

  return (
    <div className="flex items-center gap-2 overflow-x-auto border-t border-white/10 bg-navy2 px-4 py-2">
      {clean ? (
        <span className={`${chip} bg-statusGreen/15 text-statusGreen`}>
          <span className="h-1.5 w-1.5 rounded-full bg-statusGreen animate-softPulse" />
          {mk.top.allClear}
        </span>
      ) : (
        <>
          <span className={`${chip} bg-statusRed text-white`} style={NUM}>
            2 {mk.chips.overrun}
          </span>
          <span className="text-white/25">·</span>
          <span className={`${chip} bg-red-500/20 text-red-300`} style={NUM}>
            1 {mk.chips.late}
          </span>
          <span className="text-white/25">·</span>
          <span className={`${chip} bg-brandYellow/20 text-brandYellow`}>
            {mk.chips.newCall}
          </span>
        </>
      )}
    </div>
  );
}

// הבלוק העליון האחיד — שתי שורות שמלוות כל מסך במערכת.
export function TopBlock({ active, clean = false }) {
  return (
    <div className="overflow-hidden rounded-xl border border-line">
      <NavRow active={active} />
      <BriefRow clean={clean} />
    </div>
  );
}

// הדגמה: אותו בלוק על שלושה מסכים + מדידת גובה.
export default function TopBlockMockup() {
  const [clean, setClean] = useState(false);

  const screens = [
    { key: 'board', active: mk.top.nav[0] },
    { key: 'clients', active: mk.top.nav[1] },
    { key: 'settings', active: mk.top.nav[2] },
  ];

  return (
    <div className="space-y-6">
      <button
        type="button"
        onClick={() => setClean((v) => !v)}
        className="min-h-touch rounded-xl border-2 border-line px-4 font-bold text-slate-700 hover:bg-slate-50"
      >
        {clean ? mk.chips.overrun : mk.top.allClear}
      </button>

      {screens.map((s) => (
        <section key={s.key}>
          <h3 className="mb-2 text-sm font-black text-slate-500">{mk.top.screens[s.key]}</h3>
          <div ref={(el) => el && el.setAttribute('data-h', Math.round(el.getBoundingClientRect().height))}>
            <TopBlock active={s.active} clean={clean} />
          </div>
          <p className="mt-1.5 text-xs text-slate-500">{mk.top.screenNote[s.key]}</p>

          {s.key === 'board' && (
            <div className="mt-2 rounded-xl border border-dashed border-line bg-slate-50 p-4">
              <div className="text-sm font-black text-slate-500">{mk.top.fullBriefing}</div>
              <p className="mt-1 text-xs text-slate-500">{mk.top.fullBriefingNote}</p>
            </div>
          )}
        </section>
      ))}
    </div>
  );
}
