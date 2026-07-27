// כל הטקסטים של המערכת — במקום אחד בלבד (ראו CONVENTIONS.md סעיף 5)
export const he = {
  app: {
    name: 'Tasko',
    tagline: 'ניהול משימות שטח',
  },

  common: {
    loading: 'טוען…',
    logout: 'התנתקות',
    save: 'שמירה',
    required: 'שדה חובה',
  },

  auth: {
    loginTitle: 'התחברות',
    signupTitle: 'הרשמה',
    email: 'אימייל',
    password: 'סיסמה',
    loginButton: 'כניסה',
    signupButton: 'יצירת חשבון',
    switchToSignup: 'אין לך חשבון? הרשמה',
    switchToLogin: 'יש לך חשבון? התחברות',
    signupSuccess: 'נשלח אליך מייל אימות. אשר אותו והתחבר.',
    errors: {
      emailRequired: 'יש להזין אימייל',
      passwordRequired: 'יש להזין סיסמה',
      passwordShort: 'הסיסמה חייבת להכיל לפחות 6 תווים',
      invalid_credentials: 'אימייל או סיסמה שגויים',
      email_exists: 'קיים כבר חשבון עם האימייל הזה',
      generic: 'משהו השתבש. נסה שוב.',
    },
  },

  setup: {
    title: 'הקמת ארגון',
    subtitle: 'עוד כמה פרטים ואנחנו יוצאים לדרך',
    orgName: 'שם הארגון',
    orgNamePlaceholder: 'למשל: חשמל ותקשורת בע״מ',
    fullName: 'השם המלא שלך',
    phone: 'טלפון',
    phonePlaceholder: '050-0000000',
    gender: 'מין',
    genderMale: 'זכר',
    genderFemale: 'נקבה',
    submit: 'יצירת הארגון',
    errors: {
      orgNameRequired: 'יש להזין שם ארגון',
      fullNameRequired: 'יש להזין שם מלא',
      not_authenticated: 'החיבור פג. התחבר מחדש.',
      invalid_org_name: 'שם הארגון קצר מדי (לפחות 2 תווים)',
      already_member: 'כבר קיים לך ארגון במערכת',
      generic: 'יצירת הארגון נכשלה. נסה שוב.',
    },
  },

  welcome: {
    // תבניות — {name} מוחלף בקוד
    greetingMale: 'ברוך הבא, {name}',
    greetingFemale: 'ברוכה הבאה, {name}',
  },
};
