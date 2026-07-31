// מקור אמת יחיד להרשאות לפי תפקיד.
// כלל המוצר: לעובד יש מסך אחד — /my — בכל מכשיר.
// המכשיר משנה צפיפות, לא תפקיד.

export const MANAGER_ROLES = ['admin', 'manager'];

export function isManager(member) {
  return MANAGER_ROLES.includes(member?.role);
}

// מנהל מערכת — רואה הכל בארגון ומבצע פעולות ניהוליות (הקצאות, תפקידים)
export function isAdmin(member) {
  return member?.role === 'admin';
}

// המסך שאליו מנותב המשתמש אחרי התחברות ומכל נתיב שאינו מורשה לו
export function homePathFor(member) {
  return isManager(member) ? '/dashboard' : '/my';
}
