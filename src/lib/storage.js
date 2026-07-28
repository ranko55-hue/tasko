// קריאה/כתיבה בטוחה ל-localStorage.
// localStorage עלול לזרוק (מצב פרטי, מכסה מלאה, הרשאות חסומות),
// והערך השמור עלול להיות ישן או פגום — לכן כל גישה עטופה ומאומתת.

// מחזיר מערך מחרוזות בלבד. כל ערך אחר (אובייקט/מספר/JSON שבור) → ברירת המחדל.
export function readStringArray(key, fallback = []) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return fallback;
    return parsed.filter((v) => typeof v === 'string');
  } catch {
    return fallback;
  }
}

export function writeJSON(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // מכסה מלאה או אחסון חסום — לא מפילים את המסך בגלל העדפת תצוגה
  }
}
