import { he } from '../../../locales/he';

// כותרת מקטע — תווית אפורה מרווחת + מונה, ופעולה אופציונלית בקצה.
export default function SectionHeader({ label, count, onShowAll }) {
  return (
    <div className="mb-2 flex items-baseline justify-between gap-3 px-4 sm:px-5">
      <h3
        className="text-[11px] font-bold uppercase text-slate-400"
        style={{ letterSpacing: '0.08em' }}
      >
        {label}
        {count != null && (
          <>
            <span className="mx-1.5 text-slate-300">·</span>
            <span style={{ fontVariantNumeric: 'tabular-nums' }}>{count}</span>
          </>
        )}
      </h3>

      {onShowAll && (
        <button
          type="button"
          onClick={onShowAll}
          className="-my-2 min-h-touch px-2 py-2 text-xs font-bold text-brand hover:underline"
        >
          {he.tasks.drawer.showAll}
        </button>
      )}
    </div>
  );
}
