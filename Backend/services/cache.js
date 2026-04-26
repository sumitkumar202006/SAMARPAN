/**
 * In-Memory Performance Cache
 * Lightweight TTL cache for read-heavy endpoints (leaderboard, marketplace stats).
 * Zero dependencies — pure Node.js Map.
 * 
 * For production at scale: swap store with ioredis (Redis) — same API.
 * 
 * Usage:
 *   const { cache } = require('./services/cache');
 *   const data = await cache.getOrSet('leaderboard:global', 60, () => expensiveQuery());
 */

class MemCache {
  constructor() {
    this.store = new Map();
    // Periodic sweep to avoid memory leaks
    setInterval(() => this._sweep(), 5 * 60 * 1000);
  }

  /**
   * Get a cached value, or compute + cache it.
   * @param {string}   key     - Cache key
   * @param {number}   ttlSecs - Time-to-live in seconds
   * @param {Function} fn      - Async function to compute value on miss
   */
  async getOrSet(key, ttlSecs, fn) {
    const entry = this.store.get(key);
    if (entry && entry.expiresAt > Date.now()) {
      return entry.value;
    }
    const value = await fn();
    this.store.set(key, { value, expiresAt: Date.now() + ttlSecs * 1000 });
    return value;
  }

  /** Manually invalidate a cache entry */
  invalidate(key) {
    this.store.delete(key);
  }

  /** Invalidate all keys matching a prefix */
  invalidatePrefix(prefix) {
    for (const key of this.store.keys()) {
      if (key.startsWith(prefix)) this.store.delete(key);
    }
  }

  /** Remove all expired entries */
  _sweep() {
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      if (entry.expiresAt <= now) this.store.delete(key);
    }
  }

  /** Cache size (for monitoring) */
  get size() { return this.store.size; }
}

const cache = new MemCache();

/**
 * Express middleware factory — caches entire JSON responses.
 * @param {string} key     - Cache key
 * @param {number} ttlSecs - TTL in seconds
 */
function cacheResponse(key, ttlSecs) {
  return async (req, res, next) => {
    // Skip caching for authenticated / personalised routes
    if (req.headers.authorization) return next();
    
    const entry = cache.store.get(key);
    if (entry && entry.expiresAt > Date.now()) {
      return res.json(entry.value);
    }

    // Intercept res.json to capture the response
    const originalJson = res.json.bind(res);
    res.json = (data) => {
      if (res.statusCode === 200) {
        cache.store.set(key, { value: data, expiresAt: Date.now() + ttlSecs * 1000 });
      }
      return originalJson(data);
    };
    next();
  };
}

module.exports = { cache, cacheResponse };
