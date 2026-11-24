// All interface text in Hebrew. en.ts must have exactly the same keys
// (TypeScript checks it). Text only — {name} marks a value filled with fmt().
// Feminine forms: the users are women in the family.
const he = {
  meta: {
    siteName: "מתכונים משפחתיים",
    description: "כל המתכונים שלך במקום אחד",
  },

  language: {
    // The button that switches to the OTHER language
    switchTo: "English",
    switchLabel: "Switch to English",
  },

  nav: {
    main: "ניווט ראשי",
    recipes: "מתכונים",
    books: "ספרים",
    addRecipe: "מתכון חדש",
    trash: "סל מחזור",
    signOut: "יציאה",
  },

  common: {
    loading: "טוענת...",
    save: "שמירה",
    saving: "שומרת...",
    cancel: "ביטול",
    edit: "עריכה",
    back: "חזרה",
    genericError: "משהו השתבש. כדאי לנסות שוב בעוד רגע.",
  },

  home: {
    hello: "שלום {name}",
    subtitle: "כאן יופיעו בקרוב ספרי הבישול והמתכונים שלך.",
    soon: "בקרוב",
    soonText: "הוספת ספרי בישול ומתכונים, חיפוש וסינון לפי בשרי, חלבי ופרווה.",
  },

  notFound: {
    title: "הדף לא נמצא",
    text: "ייתכן שהקישור שגוי או שהדף הוסר.",
    home: "לדף הבית",
  },

  // ---------------------------------------------------------------
  // Login / sign-up
  // ---------------------------------------------------------------
  authShell: {
    tagline: "המטבח שלך, מסודר",
    headline1: "כל מתכון שאהבת,",
    headline2: "תמיד בהישג יד.",
    blurb: "בלי לחפש בין דפים ובלי פתקים שהולכים לאיבוד. מצלמים, שומרים, ומוצאים בשנייה.",
    featureScan: "מצלמים עמוד מספר, והמתכון נשמר",
    featureSearch: "מוצאים לפי שם, מרכיב או סוג מנה",
    featureFavorites: "שומרים את המועדפים קרוב",
  },

  auth: {
    or: "או",
    google: "המשך עם Google",
    googleRedirecting: "מעבירה ל-Google...",
    name: "שם",
    email: "אימייל",
    password: "סיסמה",
    passwordHint: "לפחות {min} תווים",
  },

  login: {
    metaTitle: "התחברות",
    title: "שמחים שחזרת",
    subtitle: "התחברי כדי לראות את המתכונים שלך",
    submit: "התחברות",
    submitting: "מתחברת...",
    noAccount: "עוד אין לך חשבון?",
    toSignup: "להרשמה",
    noticeLink: "הקישור לא תקין או שפג תוקפו. אפשר פשוט להתחבר.",
    noticeGoogle: "ההתחברות עם Google לא הצליחה. אפשר לנסות שוב.",
  },

  signup: {
    metaTitle: "הרשמה",
    title: "יוצרים חשבון",
    subtitle: "שתי דקות, ואפשר להתחיל לשמור מתכונים",
    submit: "יצירת חשבון",
    submitting: "יוצרת חשבון...",
    hasAccount: "כבר יש לך חשבון?",
    toLogin: "להתחברות",
    checkEmail: "שלחנו מייל אל {email}. לחצי על הקישור שבמייל כדי להיכנס.",
  },

  // Messages returned by the login/sign-up actions (by key)
  authErrors: {
    missingLogin: "צריך למלא אימייל וסיסמה.",
    missingSignup: "צריך למלא שם, אימייל וסיסמה.",
    passwordTooShort: "הסיסמה צריכה להיות לפחות {min} תווים.",
    notRegistered: "האימייל הזה לא רשום.",
    googleOnlyLogin: "החשבון הזה נרשם עם Google. אפשר להתחבר בכפתור Google למעלה.",
    googleOnlySignup: "האימייל הזה כבר רשום דרך Google. אפשר להתחבר בכפתור Google למעלה.",
    wrongPassword: "הסיסמה שגויה.",
    alreadyRegistered: "כבר יש חשבון עם האימייל הזה.",
    invalidCredentials: "האימייל או הסיסמה לא נכונים.",
    emailNotConfirmed:
      "עדיין לא אישרת את כתובת האימייל. חפשי אצלך בתיבה מייל מהמערכת ולחצי על הקישור שבו.",
    weakPassword: "הסיסמה חלשה מדי. כדאי לבחור סיסמה ארוכה יותר.",
    invalidEmail: "כתובת האימייל לא תקינה.",
    signupDisabled: "ההרשמה סגורה כרגע.",
    tooManyEmails: "נשלחו יותר מדי מיילים בזמן קצר. כדאי לחכות כמה דקות ולנסות שוב.",
    tooManyRequests: "יותר מדי ניסיונות. כדאי לחכות כמה דקות ולנסות שוב.",
    unknown: "משהו השתבש. כדאי לנסות שוב בעוד רגע.",
  },
};

export default he;

// Same shape as `he`, with every text widened to `string`.
type Widen<T> = { [K in keyof T]: T[K] extends string ? string : Widen<T[K]> };
export type Dictionary = Widen<typeof he>;
