// All interface text in English. Must match he.ts key by key
// (the `Dictionary` type makes TypeScript complain about anything missing or extra).
import type { Dictionary } from "./he";

const en: Dictionary = {
  meta: {
    siteName: "Family Recipes",
    description: "All your recipes in one place",
  },

  language: {
    switchTo: "עברית",
    switchLabel: "החלפה לעברית",
  },

  nav: {
    main: "Main navigation",
    recipes: "Recipes",
    books: "Cookbooks",
    addRecipe: "New recipe",
    trash: "Trash",
    signOut: "Sign out",
  },

  common: {
    loading: "Loading...",
    save: "Save",
    saving: "Saving...",
    cancel: "Cancel",
    edit: "Edit",
    back: "Back",
    genericError: "Something went wrong. Please try again in a moment.",
  },

  home: {
    hello: "Hello {name}",
    subtitle: "Your cookbooks and recipes will appear here soon.",
    soon: "Coming soon",
    soonText: "Adding cookbooks and recipes, search, and filtering by meat, dairy and pareve.",
  },

  notFound: {
    title: "Page not found",
    text: "The link may be wrong, or the page was removed.",
    home: "Go to home page",
  },

  authShell: {
    tagline: "Your kitchen, organized",
    headline1: "Every recipe you love,",
    headline2: "always within reach.",
    blurb: "No more flipping through pages or losing notes. Snap, save, and find it in a second.",
    featureScan: "Photograph a cookbook page, and the recipe is saved",
    featureSearch: "Find by name, ingredient or type of dish",
    featureFavorites: "Keep your favorites close",
  },

  auth: {
    or: "or",
    google: "Continue with Google",
    googleRedirecting: "Redirecting to Google...",
    name: "Name",
    email: "Email",
    password: "Password",
    passwordHint: "At least {min} characters",
  },

  login: {
    metaTitle: "Sign in",
    title: "Welcome back",
    subtitle: "Sign in to see your recipes",
    submit: "Sign in",
    submitting: "Signing in...",
    noAccount: "Don't have an account yet?",
    toSignup: "Sign up",
    noticeLink: "The link is invalid or has expired. You can simply sign in.",
    noticeGoogle: "Signing in with Google didn't work. Please try again.",
  },

  signup: {
    metaTitle: "Sign up",
    title: "Create an account",
    subtitle: "Two minutes, and you can start saving recipes",
    submit: "Create account",
    submitting: "Creating account...",
    hasAccount: "Already have an account?",
    toLogin: "Sign in",
    checkEmail: "We sent an email to {email}. Click the link in it to sign in.",
  },

  authErrors: {
    missingLogin: "Please enter your email and password.",
    missingSignup: "Please enter your name, email and password.",
    passwordTooShort: "The password must be at least {min} characters.",
    notRegistered: "This email isn't registered.",
    googleOnlyLogin: "This account was created with Google. Use the Google button above.",
    googleOnlySignup: "This email is already registered with Google. Use the Google button above.",
    wrongPassword: "The password is incorrect.",
    alreadyRegistered: "There's already an account with this email.",
    invalidCredentials: "The email or password is incorrect.",
    emailNotConfirmed:
      "You haven't confirmed your email address yet. Look for an email from us and click the link in it.",
    weakPassword: "The password is too weak. Please choose a longer one.",
    invalidEmail: "The email address isn't valid.",
    signupDisabled: "Sign-up is closed right now.",
    tooManyEmails: "Too many emails were sent in a short time. Please wait a few minutes.",
    tooManyRequests: "Too many attempts. Please wait a few minutes and try again.",
    unknown: "Something went wrong. Please try again in a moment.",
  },
};

export default en;
