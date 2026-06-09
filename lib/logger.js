// Centralized, dev-only logging. This is the ONLY approved way to log in this
// codebase: raw `console.*` is blocked by the `no-console` ESLint rule (see
// .eslintrc.json), and this module is the single exception. Both helpers are
// completely silent when NODE_ENV === "production", so nothing leaks to prod logs.
/* eslint-disable no-console */
export const log = (...args) => {
  if (process.env.NODE_ENV !== "production") console.log(...args);
};

export const logError = (...args) => {
  if (process.env.NODE_ENV !== "production") console.error(...args);
};
