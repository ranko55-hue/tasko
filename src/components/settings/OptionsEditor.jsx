import { useState } from 'react';
import { he } from '../../locales/he';
import Button from '../shared/Button';
import Icon from '../ui/Icon';

const cf = he.customFields;

export default function OptionsEditor({ options, onChange }) {
  const [draft, setDraft] = useState('');

  function add() {
    const v = draft.trim();
    if (!v || options.includes(v)) return;
    onChange([...options, v]);
    setDraft('');
  }

  function remove(idx) {
    onChange(options.filter((_, i) => i !== idx));
  }

  return (
    <div>
      <span className="mb-1.5 block text-base font-medium text-slate-700">
        {cf.options.title}
      </span>

      {options.length > 0 && (
        <ul className="mb-2 space-y-1">
          {options.map((opt, i) => (
            <li
              key={i}
              className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2"
            >
              <span className="text-slate-900">{opt}</span>
              <button
                type="button"
                onClick={() => remove(i)}
                className="text-slate-400 hover:text-red-500"
              >
                <Icon name="close" size="sm" />
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="flex gap-2">
        <input
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), add())}
          placeholder={cf.options.placeholder}
          className="min-h-touch flex-1 rounded-xl border border-line bg-white px-4 text-lg
                     text-slate-900 focus:border-brand focus:outline-none focus:ring-4
                     focus:ring-brand/20"
        />
        <Button variant="secondary" size="sm" fullWidth={false} onClick={add}>
          {cf.options.add}
        </Button>
      </div>
    </div>
  );
}
