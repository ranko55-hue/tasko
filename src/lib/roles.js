// מקור אמת יחיד להרשאות לפי תפקיד.
// כלל המוצר: לעובד ולראש צוות יש מסך אחד — /my — בכל מכשיר.
// המכשיר משנה צפיפות, לא תפקיד.

export const MANAGER_ROLES = ['admin', 'manager'];

export function isManager(member) {
  return MANAGER_ROLES.includes(member?.role);
}

// המסך שאליו מנותב המשתמש אחרי התחברות ומכל נתיב שאינו מורשה לו
export function homePathFor(member) {
  return isManager(member) ? '/dashboard' : '/my';
}

// מנהל מערכת — רואה הכל בארגון ומבצע פעולות ניהוליות (הקצאות, תפקידים)
export function isAdmin(member) {
  return member?.role === 'admin';
}
