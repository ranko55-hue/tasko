import { he } from '../../locales/he';
import Button from '../shared/Button';
import Icon from '../ui/Icon';

// עורך דרישות דינמי — מוסיפים/מסירים שורות. הערך: מערך מחרוזות.
export default function RequirementsEditor({ items, onChange }) {
  function update(i, val) {
    const next = items.slice();
    next[i] = val;
    onChange(next);
  }
  function remove(i) {
    onChange(items.filter((_, idx) => idx !== i));
  }
  function add() {
    onChange([...items, '']);
  }

  return (
    <div>
      <span className="mb-1.5 block text-base font-medium text-slate-700">
        {he.tasks.requirements}
      </span>

      <div className="space-y-2">
        {items.map((item, i) => (
          <div key={i} className="flex gap-2">
            <input
              value={item}
              onChange={(e) => update(i, e.target.value)}
              placeholder={he.tasks.requirementPlaceholder}
              className="w-full min-h-touch rounded-xl border border-slate-300 bg-white px-4
                         text-lg text-slate-900 placeholder:text-slate-400
                         focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/20"
            />
            <button
              type="button"
              onClick={() => remove(i)}
              aria-label="הסרה"
              className="min-h-touch shrink-0 rounded-xl border border-slate-300 px-4 text-slate-400 hover:text-red-600"
            >
              <Icon name="close" size="md" />
            </button>
          </div>
        ))}
      </div>

      <Button variant="link" fullWidth={false} className="mt-2" onClick={add}>
        + {he.tasks.addRequirement}
      </Button>
    </div>
  );
}
