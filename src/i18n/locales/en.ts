/**
 * English translations.
 *
 * NOTE: i18n baseline ships English-only by design (per ENTERPRISE_PLAN.md).
 * Adding a new locale = drop a sibling file (e.g. `es.ts`) and register it
 * in `src/i18n/index.ts`. No component changes required.
 */
export const en = {
  common: {
    appName: "DML Arena",
    loading: "Loading…",
    error: "Something went wrong",
    retry: "Retry",
    cancel: "Cancel",
    save: "Save",
    delete: "Delete",
    confirm: "Confirm",
    close: "Close",
    skipToContent: "Skip to main content",
  },
  nav: {
    home: "Home",
    chat: "Arena",
    history: "History",
    community: "Community",
    insights: "Insights",
    pinned: "Pinned",
    settings: "Settings",
    dashboard: "Dashboard",
    pricing: "Pricing",
    signIn: "Sign in",
    signOut: "Sign out",
  },
  arena: {
    placeholder: "Ask anything — compare answers across AI models…",
    send: "Send",
    deepMode: "Deep Mode",
    selectModels: "Select models",
    emptyTitle: "Ready when you are",
    emptySubtitle: "Pick models, ask a question, and see how each one thinks.",
  },
  auth: {
    signInTitle: "Welcome back",
    signUpTitle: "Create your account",
    email: "Email",
    password: "Password",
    submit: "Continue",
    googleContinue: "Continue with Google",
  },
  errors: {
    network: "Network error. Please check your connection.",
    unauthorized: "You need to sign in to do that.",
    rateLimited: "You're going a bit fast — please slow down.",
    unknown: "An unexpected error occurred.",
  },
} as const;

export type Translations = typeof en;
