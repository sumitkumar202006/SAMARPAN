/**
 * Security Middleware Suite
 * Centralised security utilities — import and use in server.js
 */
const rateLimit = require('express-rate-limit');
const crypto    = require('crypto');

// ─── 1. Strict Body Size Limits ───────────────────────────────────────────────
// Applied per route group to prevent payload flooding
const jsonLimit    = '50kb';   // For regular API routes
const uploadLimit  = '5mb';    // For AI/PDF upload routes

// ─── 2. Input Sanitization ────────────────────────────────────────────────────
// Strips prototype-polluting keys ($, .) from req.body / req.query / req.params
function sanitizeInput(req, res, next) {
  const dangerous = /^\$|^\./;
  function clean(obj) {
    if (!obj || typeof obj !== 'object') return obj;
    for (const key of Object.keys(obj)) {
      if (dangerous.test(key)) {
        delete obj[key];
      } else if (typeof obj[key] === 'object') {
        clean(obj[key]);
      } else if (typeof obj[key] === 'string') {
        // Strip null bytes (common injection vector)
        obj[key] = obj[key].replace(/\0/g, '');
      }
    }
    return obj;
  }
  clean(req.body);
  clean(req.query);
  clean(req.params);
  next();
}

// ─── 3. Per-User Brute Force Lockout ─────────────────────────────────────────
// In-memory store (for Redis: replace Map with ioredis)
const failedLogins = new Map(); // key: email → { count, lockedUntil }
const MAX_ATTEMPTS = 5;
const LOCKOUT_MS   = 15 * 60 * 1000; // 15 minutes

function checkBruteForce(email) {
  const key     = email.toLowerCase();
  const record  = failedLogins.get(key);
  const now     = Date.now();
  if (record && record.lockedUntil && now < record.lockedUntil) {
    const minsLeft = Math.ceil((record.lockedUntil - now) / 60000);
    return { locked: true, minsLeft };
  }
  return { locked: false };
}

function recordFailedLogin(email) {
  const key    = email.toLowerCase();
  const record = failedLogins.get(key) || { count: 0, lockedUntil: null };
  record.count++;
  if (record.count >= MAX_ATTEMPTS) {
    record.lockedUntil = Date.now() + LOCKOUT_MS;
    record.count       = 0; // reset for next window
  }
  failedLogins.set(key, record);
}

function clearFailedLogins(email) {
  failedLogins.delete(email.toLowerCase());
}

// ─── 4. Tighter Auth Rate Limiter (per-IP, strict) ───────────────────────────
const strictAuthLimiter = rateLimit({
  windowMs:        10 * 60 * 1000, // 10 min window
  max:             10,              // 10 attempts per IP per window
  standardHeaders: true,
  legacyHeaders:   false,
  message:         { error: 'Too many authentication attempts. Try again in 10 minutes.' },
  skipSuccessfulRequests: true,     // Only count failures
});

// ─── 5. Strict Content-Security-Policy header ─────────────────────────────────
const helmetOptions = {
  contentSecurityPolicy: {
    directives: {
      defaultSrc:  ["'self'"],
      scriptSrc:   ["'self'", "'unsafe-inline'", "'unsafe-eval'",
                    'https://checkout.razorpay.com', 'https://cdn.razorpay.com'],
      styleSrc:    ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      fontSrc:     ["'self'", 'https://fonts.gstatic.com'],
      imgSrc:      ["'self'", 'data:', 'blob:', 'https:', 'http:'],
      connectSrc:  ["'self'", 'https:', 'wss:'],
      frameSrc:    ["'self'", 'https://api.razorpay.com'],
      objectSrc:   ["'none'"],
      upgradeInsecureRequests: process.env.NODE_ENV === 'production' ? [] : null,
    },
  },
  crossOriginEmbedderPolicy: false, // Needed for OAuth redirects
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
};

// ─── 6. Security Response Headers ─────────────────────────────────────────────
function securityHeaders(req, res, next) {
  res.setHeader('X-Content-Type-Options',    'nosniff');
  res.setHeader('X-Frame-Options',           'DENY');
  res.setHeader('X-XSS-Protection',          '1; mode=block');
  res.setHeader('Permissions-Policy',        'geolocation=(), microphone=(), camera=()');
  if (process.env.NODE_ENV === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  }
  next();
}

// ─── 7. Cache-Control for read-heavy GET routes ───────────────────────────────
// Call as middleware: app.use('/api/leaderboard', cacheFor(60), router)
function cacheFor(seconds) {
  return (req, res, next) => {
    if (req.method === 'GET') {
      res.setHeader('Cache-Control', `public, max-age=${seconds}, s-maxage=${seconds}, stale-while-revalidate=${seconds * 2}`);
    }
    next();
  };
}

function noCache(req, res, next) {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  next();
}

// ─── 8. ETag support ──────────────────────────────────────────────────────────
// Express has etag enabled by default; this forces strong ETags
function enableStrongEtag(app) {
  app.set('etag', 'strong');
}

module.exports = {
  sanitizeInput,
  checkBruteForce,
  recordFailedLogin,
  clearFailedLogins,
  strictAuthLimiter,
  helmetOptions,
  securityHeaders,
  cacheFor,
  noCache,
  enableStrongEtag,
  jsonLimit,
  uploadLimit,
};
