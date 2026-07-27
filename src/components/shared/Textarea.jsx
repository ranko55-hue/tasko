// שדה טקסט רב-שורתי
export default function Textarea({ label, value, onChange, placeholder, rows = 3 }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-base font-medium text-slate-700">
        {label}
      </span>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3
                   text-lg text-slate-900 placeholder:text-slate-400
                   focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/20"
      />
    </label>
  );
}
