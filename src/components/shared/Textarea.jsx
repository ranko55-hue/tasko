// שדה טקסט רב-שורתי
export default function Textarea({ label, value, onChange, placeholder, rows = 3 }) {
  return (
    <label className="block">
      <span className="mb-2 block text-base font-medium text-inkSoft">
        {label}
      </span>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        className="w-full rounded-xl border border-lineDark bg-white px-4 py-3
                   text-lg text-navy placeholder:text-grayLight
                   focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/20"
      />
    </label>
  );
}
