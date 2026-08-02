// מתג תצוגה גנרי — משמש את הלוח ואת "המשימות שלי", על המסך ובהגדרות.
//
// הפקד נראה קומפקטי (~32px) אבל אזור הלחיצה הוא 48px — המינימום בכל
// המערכת (DESIGN §3.3/§8): הכפתור עצמו בגובה מלא ונמשך פנימה ב-margin
// שלילי, והמראה יושב על ה-span הפנימי. כך העין רואה פקד נמוך והאצבע
// מקבלת מטרה מלאה.
//
// options: [{ key, label }] — התוויות מגיעות מ-he.js אצל הקורא ולא מכאן,
// כדי שיישאר פרימיטיב מתג אחד במערכת ולא ייווצר מתג נפרד לכל מסך.
export default function ViewToggle({ options, view, onChange }) {
  return (
    <div className="inline-flex items-center gap-1 rounded-lg bg-white p-1 ring-1 ring-line">
      {options.map((opt) => (
        <button
          key={opt.key}
          type="button"
          onClick={() => onChange(opt.key)}
          aria-pressed={view === opt.key}
          className="-my-2 flex min-h-touch items-center"
        >
          <span
            className={`flex h-7 items-center rounded-md px-3 text-sm font-bold transition-colors ${
              view === opt.key ? 'bg-navy text-white' : 'text-grayDark hover:bg-appBg'
            }`}
          >
            {opt.label}
          </span>
        </button>
      ))}
    </div>
  );
}
