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
    scan: "סריקה",
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


  errorPage: {
    title: "משהו השתבש",
    text: "לא הצלחנו לטעון את הדף. כדאי לנסות שוב בעוד רגע.",
    retry: "לנסות שוב",
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
    scan: "סריקת מתכון",
    metaNew: "ספר חדש",
    metaEdit: "עריכת ספר",
    titleNew: "ספר חדש",
    titleEdit: "עריכת ספר",
    fieldTitle: "שם הספר",
    fieldAuthor: "מחבר/ת",
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
    scanPages: "לעמודי הסריקה",
  },

  // ---------------------------------------------------------------
  // Trash
  // ---------------------------------------------------------------
  scan: {
    meta: "סריקת מתכון",
    title: "סריקת מתכון",
    subtitle: "מצלמים את עמוד המתכון, וה-AI ממלא בשבילך את הטופס. שום דבר לא נשמר בלי שתאשרי.",
    book: "מאיזה ספר?",
    noBook: "לא מספר (דף בכתב יד, גזיר וכו')",
    pages: "עמודי המתכון",
    pagesHint: "מתכון שנמשך על כמה עמודים? אפשר להוסיף עד {max}, לפי הסדר. כדאי לצלם ישר ובאור טוב.",
    page: "עמוד {n}",
    addPage: "הוספת עמוד",
    addPages: "הוספת עמודים",
    uploading: "מעלה...",
    moveEarlier: "להקדים",
    moveLater: "לדחות",
    remove: "הסרה",
    max: "אפשר עד {max} עמודים למתכון אחד.",
    needPage: "צריך להוסיף לפחות עמוד אחד.",
    continue: "המשך",
    continuing: "שומרת...",
    error: "שמירת העמודים לא הצליחה. כדאי לנסות שוב.",
    reviewTitle: "בדיקת המתכון",
    fromBook: "מתוך: {book}",
    notFromBook: "לא מספר",
    pageOf: "עמוד {n} מתוך {total}",
    newScan: "סריקה חדשה",
    openTitle: "ממשיכים מאיפה שעצרת",
    openText: "סריקות שיש בהן מתכונים שעוד לא נשמרו.",
    openLeftOne: "נשאר מתכון אחד לשמור",
    openLeftOther: "נשארו {n} מתכונים לשמור",
    openContinue: "להמשך",
    openDismiss: "הסרה מהרשימה",
    openDismissQuestion: "להסיר מהרשימה? אפשר עדיין להגיע לסריקה מדף של מתכון שנשמר ממנה.",
    openDismissError: "ההסרה לא הצליחה. כדאי לנסות שוב.",
  },

  // ---------------------------------------------------------------
  // Scan review: the free path (copy instructions, paste the answer)
  // and the filled-in form next to the page photo
  // ---------------------------------------------------------------
  scanReview: {
    pasteTitle: "מילוי הטופס דרך שיחה עם Claude",
    pasteIntro: "בלי מפתח ובלי עלות: מעתיקים הוראות לשיחה עם Claude יחד עם תמונות העמודים, ומדביקים כאן את התשובה.",
    step1: "מעתיקים את ההוראות",
    copy: "העתקת ההוראות",
    copied: "ההוראות הועתקו.",
    copyFailed: "ההעתקה לא הצליחה. אפשר לסמן את הטקסט כאן ולהעתיק בעצמך.",
    instructionsLabel: "ההוראות",
    step2: "פותחים שיחה חדשה עם Claude",
    step2Text: "מדביקים את ההוראות ומצרפים את התמונות של העמודים, לפי הסדר. אם התמונות לא אצלך במחשב, אפשר לפתוח אותן מכאן ולשמור.",
    openChat: "פתיחת שיחה חדשה",
    openPage: "פתיחת עמוד {n}",
    step3: "מדביקים כאן את התשובה",
    answerLabel: "התשובה מהשיחה",
    answerHint: "את כל התשובה, כמו שהיא. לא צריך לנקות אותה.",
    read: "מילוי הטופס",
    reading: "קוראת...",
    notStored: "התשובה לא נשמרה לפעם הבאה (בעיית חיבור). אפשר להמשיך, אבל כדאי לשמור עכשיו את כל המתכונים.",
    pasteErrors: {
      empty: "צריך להדביק את התשובה מהשיחה.",
      tooLong: "הטקסט ארוך מדי. כדאי לבדוק שהודבקה התשובה הנכונה.",
      notJson: "לא מצאנו בטקסט את התשובה. כדאי להעתיק את כל התשובה מהשיחה, מההתחלה ועד הסוף.",
      wrongShape: "התשובה לא במבנה הנכון. אפשר לבקש בשיחה: \"תחזיר רק JSON לפי המבנה שבהוראות\", ולהדביק שוב.",
    },
    notRecipe: "לא נמצא מתכון בתמונות",
    unreadable: "לא הצליחו לקרוא את התמונות",
    noRecipeHint: "אפשר לצלם שוב ישר ובאור טוב, ולהתחיל סריקה חדשה.",
    pasteAgain: "הדבקת תשובה אחרת",
    chooseTitleOne: "נמצא מתכון אחד",
    chooseTitle: "נמצאו {n} מתכונים",
    chooseText: "בחרי מתכון לבדיקה ולשמירה. אחרי השמירה אפשר לחזור לכאן לשאר.",
    choose: "לבדיקה",
    saved: "נשמר",
    viewSaved: "לצפייה",
    savedNotice: "המתכון נשמר.",
    ingredientsOne: "מרכיב אחד",
    ingredientsOther: "{n} מרכיבים",
    pageNumber: "עמ׳ {n}",
    back: "חזרה",
    summaryNone: "לא נמצא משהו מיוחד לבדוק. בכל זאת כדאי לעבור על הטופס מול התמונה.",
    summaryOne: "נמצא דבר אחד לבדוק",
    summaryOther: "נמצאו {n} דברים לבדוק",
    summaryHint: "לחיצה על שורה מעבירה לשדה. שום דבר לא נשמר עד שתלחצי על \"שמירת המתכון\".",
    unreadableParts: "לא נקרא: {text}",
    continues: "המתכון ממשיך בעמוד שלא צורף. כדאי להתחיל סריקה חדשה עם כל העמודים.",
    checkLabel: "לבדוק",
    kosherReason: "סיבת ההצעה: {reason}",
    handwritten: "תוקן בכתב יד. במודפס: {text}",
    placeIngredient: "מרכיב {n}",
    placeIngredientNamed: "מרכיב {n} ({name})",
    placeStep: "שלב {n}",
    placeGeneral: "כללי",
    reasons: {
      quantity: "הכמות לא ברורה. כדאי לכתוב אותה במספרים, למשל 1/2.",
      number: "צריך מספר שלם בלבד.",
      kosherMissing: "לא הוצע בשרי, חלבי או פרווה. צריך לבחור.",
      titleMissing: "לא נמצא שם למתכון.",
      titleSuggested: "לא היה שם מודפס. זה שם מוצע.",
      ingredientName: "חסר שם למרכיב.",
      empty: "לא נמצאו מרכיבים או שלבים.",
    },
    duplicate: "כבר שמור מתכון בשם \"{title}\" מאותו מקור. לשמור עוד עותק?",
    duplicateView: "לצפייה במתכון השמור",
    duplicateSave: "לשמור בכל זאת",
    photos: "תמונות העמודים",
    zoomIn: "הגדלה",
    zoomOut: "הקטנה",
    openFull: "פתיחה בחלון חדש",
    handwrittenSource: "בכתב יד",
  },

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
