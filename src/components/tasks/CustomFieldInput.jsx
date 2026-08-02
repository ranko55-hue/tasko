import { he } from '../../locales/he';
import Field from '../ui/Field';
import Select from '../shared/Select';

const cf = he.customFields;

const DATE_INPUT =
  'min-h-touch rounded-xl border border-line bg-white px-4 text-lg text-slate-900 ' +
  'focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/20';

export default function CustomFieldInput({ def, value, onChange }) {
  const label = def.is_required ? def.label : `${def.label} ${he.common.optional}`;

  if (def.field_type === 'text') {
    return <Field label={label} value={value ?? ''} onChange={onChange} />;
  }

  if (def.field_type === 'number') {
    return (
      <Field
        label={label}
        type="number"
        inputMode="numeric"
        value={value ?? ''}
        onChange={onChange}
      />
    );
  }

  if (def.field_type === 'date') {
    return (
      <label className="block">
        <span className="mb-1.5 block text-base font-medium text-slate-700">{label}</span>
        <input
          type="date"
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value)}
          className={DATE_INPUT + ' w-full'}
        />
      </label>
    );
  }

  if (def.field_type === 'select') {
    return (
      <Select label={label} value={value ?? ''} onChange={onChange}>
        <option value="">{cf.noValue}</option>
        {(def.options ?? []).map((opt) => (
          <option key={opt} value={opt}>{opt}</option>
        ))}
      </Select>
    );
  }

  return null;
}
