// מקור אמת יחיד להרשאות לפי תפקיד.
// כלל המוצר: לעובד יש מסך אחד — /my — בכל מכשיר.
// המכשיר משנה צפיפות, לא תפקיד.

// ⚠️ גישור בין שני סטי תפקידים.
// מיגרציה 013 שינתה את ערכי ה-enum ב-DB: project_manager→admin,
// work_manager→manager, team_lead→worker. main נפרס עם הרשימה הישנה,
// ולכן isManager החזיר false לכל אחד — כל המנהלים נחתו ב-/my עם ניווט
// של עובד. הרשימה כאן מכירה את שני הסטים כדי שהתיקון לא יהיה תלוי
// בסדר הפריסה מול המיגרציה. הערכים הישנים כבר אינם קיימים ב-DB והם
// נשארים כרשת ביטחון בלבד — אפשר להסירם אחרי מיזוג feature/org-structure.
export const MANAGER_ROLES = [
  'admin',
  'manager',
  'project_manager', // ישן
  'work_manager', // ישן
];

export function isManager(member) {
  return MANAGER_ROLES.includes(member?.role);
}

// מנהל מערכת — רואה הכל בארגון ומבצע פעולות ניהוליות (הקצאות, תפקידים)
export function isAdmin(member) {
  return member?.role === 'admin' || member?.role === 'project_manager';
}

// המסך שאליו מנותב המשתמש אחרי התחברות ומכל נתיב שאינו מורשה לו
export function homePathFor(member) {
  return isManager(member) ? '/dashboard' : '/my';
}
