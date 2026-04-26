/**
 * Logger utility — replaces bare console.log in production.
 * In development: full coloured output.
 * In production: only warn/error (no debug noise).
 */

const isDev = process.env.NODE_ENV !== 'production';

export const logger = {
  /** Debug info — silenced in production */
  debug: (...args: unknown[]) => {
    if (isDev) console.debug('[DEBUG]', ...args);
  },

  /** General info — silenced in production */
  info: (...args: unknown[]) => {
    if (isDev) console.info('[INFO]', ...args);
  },

  /** Warnings — shown in all environments */
  warn: (...args: unknown[]) => {
    console.warn('[WARN]', ...args);
  },

  /** Errors — always shown */
  error: (...args: unknown[]) => {
    console.error('[ERROR]', ...args);
  },
};
