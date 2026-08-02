import { he } from '../../locales/he';

const t = he.assignments;

// בורר מנהלים — רב-בחירה ללקוח, בחירה יחידה לעובד.
// כל שורה היא מטרת לחיצה של 48px (DESIGN §3.3/§8).
export default function ManagerPicker({
  managers,
  value,
  onChange,
  multiple = true,
  emptyLabel,
}) {
  const selected = multiple ? value ?? [] : value ?? null;

  function toggle(id) {
    if (multiple) {
      onChange(selected.includes(id) ? selected.filter((x) => x !== id) : [...selected, id]);
    } else {
      onChange(selected === id ? null : id);
    }
  }

  if (!managers.length) {
    return <p className="rounded-lg bg-surface px-3 py-3 text-sm text-grayMid">{t.noManagers}</p>;
  }

  return (
    <div className="space-y-2">
      {/* בחירה יחידה: אפשרות "ללא" מפורשת — עובד בלי מנהל כפוף ל-admin */}
      {!multiple && (
        <button
          type="button"
          onClick={() => onChange(null)}
          aria-pressed={selected === null}
          className={`flex min-h-touch w-full items-center rounded-xl border px-3 text-start text-sm font-bold transition-colors ${
            selected === null
              ? 'border-brand bg-brand/5 text-brand'
              : 'border-line bg-white text-inkSoft hover:bg-surface'
          }`}
        >
          {emptyLabel ?? t.noManagerOption}
        </button>
      )}

      {managers.map((m) => {
        const on = multiple ? selected.includes(m.id) : selected === m.id;
        return (
          <button
            key={m.id}
            type="button"
            onClick={() => toggle(m.id)}
            aria-pressed={on}
            className={`flex min-h-touch w-full items-center justify-between gap-2 rounded-xl border px-3 text-start transition-colors ${
              on
                ? 'border-brand bg-brand/5'
                : 'border-line bg-white hover:bg-surface'
            }`}
          >
            <span className="min-w-0 truncate text-sm font-bold text-navy">{m.full_name}</span>
            <span className="shrink-0 text-xs text-grayMid">{he.roles[m.role] ?? m.role}</span>
          </button>
        );
      })}
    </div>
  );
}
