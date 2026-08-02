import { he } from '../../../locales/he';

// כותרת מקטע — תווית אפורה מרווחת + מונה, ופעולה אופציונלית בקצה.
export default function SectionHeader({ label, count, onShowAll }) {
  return (
    <div className="mb-2 flex items-baseline justify-between gap-3 px-4 sm:px-6">
      <h3
        className="text-xs font-bold uppercase text-grayLight"
        style={{ letterSpacing: '0.08em' }}
      >
        {label}
        {count != null && (
          <>
            <span className="mx-2 text-lineDark">·</span>
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
