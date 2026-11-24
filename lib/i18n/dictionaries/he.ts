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
  // Shared recipe vocabulary
  // ---------------------------------------------------------------
  kosher: {
    question: "בשרי, חלבי או פרווה?",
    label: "בשרי / חלבי / פרווה",
    meat: "בשרי",
    dairy: "חלבי",
    pareve: "פרווה",
  },

  tagCategories: {
    protein: "עיקר המנה",
    dish: "סוג מנה",
    occasion: "מתי מגישים",
    other: "עוד",
  },

  contentLanguage: {
    he: "עברית",
    en: "אנגלית",
  },


  time: {
    minutes: "{n} דק׳",
    hours: "{n} ש׳",
    hoursMinutes: "{h} ש׳ {m} דק׳",
  },

  formErrors: {
    required: "שדה חובה.",
    kosherRequired: "צריך לבחור בשרי, חלבי או פרווה.",
    wholeNumber: "צריך מספר שלם.",
    positive: "צריך מספר גדול מ-0.",
    quantity: "כמות לא מובנת. אפשר לכתוב למשל 2, 1.5, 1/2 או 2-3.",
    tooLong: "הטקסט ארוך מדי.",
    ingredientName: "חסר שם מרכיב.",
    stepText: "חסר טקסט לשלב.",
    tooMany: "יותר מדי פריטים.",
    summary: "יש שדות שצריך לתקן (מסומנים באדום).",
    notFound: "הפריט לא נמצא. ייתכן שהוא נמחק.",
    generic: "השמירה לא הצליחה. כדאי לנסות שוב בעוד רגע.",
  },

  images: {
    add: "הוספת תמונה",
    addMore: "הוספת תמונות",
    change: "החלפת תמונה",
    uploading: "מעלה...",
    remove: "הסרה",
    cover: "תמונה ראשית",
    makeCover: "לקבוע כתמונה ראשית",
    max: "אפשר עד {max} תמונות.",
    errorType: "את הקובץ הזה אי אפשר לפתוח כתמונה.",
    errorUpload: "העלאת התמונה נכשלה. כדאי לנסות שוב.",
    waitForUpload: "רגע, התמונות עוד עולות.",
  },

  confirm: {
    yes: "כן",
    no: "לא",
  },

  // ---------------------------------------------------------------
  // Cookbooks
  // ---------------------------------------------------------------
  books: {
    title: "ספרי בישול",
    subtitle: "הספרים שמהם המתכונים שלך.",
    add: "ספר חדש",
    emptyTitle: "עוד אין כאן ספרים",
    emptyText: "אפשר להוסיף ספר בישול, ואז לשייך אליו מתכונים.",
    recipesOne: "מתכון אחד",
    recipesOther: "{n} מתכונים",
    recipesNone: "עוד אין מתכונים",
    showRecipes: "למתכונים מהספר",
    metaNew: "ספר חדש",
    metaEdit: "עריכת ספר",
    titleNew: "ספר חדש",
    titleEdit: "עריכת ספר",
    fieldTitle: "שם הספר",
    fieldAuthor: "מחבר/ת",
    fieldLanguage: "שפת הספר",
    fieldNotes: "הערות",
    fieldCover: "תמונת כריכה",
    save: "שמירת הספר",
    delete: "מחיקת הספר",
    deleteConfirm: "למחוק את הספר? אי אפשר לבטל.",
    deleteBlocked: "אי אפשר למחוק ספר שיש בו מתכונים (גם בסל המחזור). אפשר קודם להעביר את המתכונים לספר אחר.",
  },

  // ---------------------------------------------------------------
  // Recipe list (home page)
  // ---------------------------------------------------------------
  list: {
    title: "מתכונים",
    countOne: "מתכון אחד",
    countOther: "{n} מתכונים",
    search: "חיפוש",
    searchPlaceholder: "חיפוש לפי שם המתכון",
    all: "הכול",
    tags: "תוויות",
    book: "ספר",
    allBooks: "כל הספרים",
    clear: "ניקוי הסינון",
    emptyTitle: "עוד אין כאן מתכונים",
    emptyText: "אפשר להתחיל בהוספת המתכון הראשון.",
    noResultsTitle: "לא נמצאו מתכונים",
    noResultsText: "כדאי לנסות מילה אחרת או לנקות את הסינון.",
  },

  // ---------------------------------------------------------------
  // Recipe form
  // ---------------------------------------------------------------
  recipeForm: {
    metaNew: "מתכון חדש",
    metaEdit: "עריכת מתכון",
    titleNew: "מתכון חדש",
    titleEdit: "עריכת מתכון",
    sectionDetails: "פרטים",
    sectionSource: "מקור",
    sectionAmounts: "כמות וזמנים",
    sectionIngredients: "מרכיבים",
    sectionSteps: "אופן ההכנה",
    sectionTags: "תוויות",
    sectionPhotos: "תמונות",
    sectionNotes: "הערות",
    title: "שם המתכון",
    description: "תיאור קצר",
    language: "שפת המתכון",
    languageHint: "המתכון יוצג בכיוון הכתיבה של השפה שלו.",
    book: "ספר",
    noBook: "בלי ספר",
    page: "עמוד",
    sourceNote: "מקור אחר",
    sourceNoteHint: "למשל: מתכון של סבתא",
    yield: "כמות (כמו שכתוב במתכון)",
    yieldHint: "למשל: 24 עוגיות, תבנית 26",
    servings: "מספר מנות",
    prep: "זמן הכנה (דקות)",
    cook: "זמן בישול או אפייה (דקות)",
    total: "זמן כולל (דקות)",
    notes: "הערות וטיפים",
    quantity: "כמות",
    unit: "יחידה",
    ingredient: "מרכיב",
    note: "הערה",
    notePlaceholder: "למשל: מנופה",
    optional: "לא חובה",
    addIngredient: "הוספת מרכיב",
    addHeading: "הוספת כותרת",
    headingPlaceholder: "כותרת, למשל: לבצק",
    heading: "כותרת",
    step: "שלב {n}",
    addStep: "הוספת שלב",
    remove: "הסרה",
    moveUp: "להזיז למעלה",
    moveDown: "להזיז למטה",
    save: "שמירת המתכון",
    noTags: "אין עדיין תוויות.",
  },

  // ---------------------------------------------------------------
  // Recipe page
  // ---------------------------------------------------------------
  recipe: {
    fromBook: "מתוך {book}",
    page: "עמ׳ {n}",
    servingsOne: "מנה אחת",
    servingsOther: "{n} מנות",
    prep: "הכנה",
    cook: "בישול",
    total: "סה״כ",
    optional: "לא חובה",
    noPhoto: "אין תמונה",
    photo: "תמונה {n}",
    moveToTrash: "העברה לסל",
    trashConfirm: "להעביר את המתכון לסל המחזור?",
    trashNote: "אפשר לשחזר אותו מהסל במשך 30 יום.",
  },

  // ---------------------------------------------------------------
  // Trash
  // ---------------------------------------------------------------
  trash: {
    title: "סל מחזור",
    subtitle: "מתכונים שהועברו לסל נשמרים כאן 30 יום, ואז נמחקים לגמרי.",
    emptyTitle: "הסל ריק",
    emptyText: "מתכון שתעבירי לסל יופיע כאן, ואפשר יהיה לשחזר אותו.",
    daysLeftOne: "יימחק בעוד יום",
    daysLeftOther: "יימחק בעוד {n} ימים",
    today: "יימחק בקרוב",
    restore: "שחזור",
    restoring: "משחזרת...",
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
