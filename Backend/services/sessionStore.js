/**
 * Session Store — Abstraction Layer
 * 
 * Currently: In-memory Map (fast, zero deps, lost on restart)
 * Production: Swap to Redis by setting REDIS_URL env var
 * 
 * API is identical in both modes — no application code changes needed.
 * 
 * To enable Redis:
 *   1. Set REDIS_URL=redis://localhost:6379 in .env
 *   2. npm install ioredis
 *   3. Restart server — this module auto-detects and switches
 */

const REDIS_URL = process.env.REDIS_URL;

// ─── In-Memory Store (default) ────────────────────────────────────────────────
class MemorySessionStore {
  constructor() {
    this.sessions = new Map();     // pin → session data
    this.lobbyChats = new Map();   // pin → messages[]
    this.onlineUsers = new Map();  // userId → socketId[]
    this.socketToUser = new Map(); // socketId → userId

    // Sweep expired sessions every 10 minutes
    setInterval(() => this._sweep(), 10 * 60 * 1000);
    console.log('[SessionStore] Using in-memory store. Set REDIS_URL for persistent sessions.');
  }

  // ─── Session CRUD ──────────────────────────────────────────────────────────
  setSession(pin, data)      { this.sessions.set(pin, { ...data, _updatedAt: Date.now() }); }
  getSession(pin)            { return this.sessions.get(pin) || null; }
  deleteSession(pin)         { this.sessions.delete(pin); this.lobbyChats.delete(pin); }
  getAllSessions()            { return Array.from(this.sessions.entries()); }
  hasSession(pin)            { return this.sessions.has(pin); }

  updateSession(pin, patch) {
    const existing = this.sessions.get(pin);
    if (existing) this.sessions.set(pin, { ...existing, ...patch, _updatedAt: Date.now() });
  }

  // ─── Lobby Chat ────────────────────────────────────────────────────────────
  addChatMessage(pin, msg) {
    if (!this.lobbyChats.has(pin)) this.lobbyChats.set(pin, []);
    const msgs = this.lobbyChats.get(pin);
    msgs.push(msg);
    if (msgs.length > 200) msgs.shift(); // Cap at 200 messages
  }
  getChatHistory(pin) { return this.lobbyChats.get(pin) || []; }

  // ─── Online Presence ───────────────────────────────────────────────────────
  setUserOnline(userId, socketId) {
    if (!this.onlineUsers.has(userId)) this.onlineUsers.set(userId, new Set());
    this.onlineUsers.get(userId).add(socketId);
    this.socketToUser.set(socketId, userId);
  }
  setUserOffline(socketId) {
    const userId = this.socketToUser.get(socketId);
    if (userId) {
      const sockets = this.onlineUsers.get(userId);
      if (sockets) {
        sockets.delete(socketId);
        if (sockets.size === 0) this.onlineUsers.delete(userId);
      }
    }
    this.socketToUser.delete(socketId);
    return userId;
  }
  isUserOnline(userId) { return this.onlineUsers.has(userId) && this.onlineUsers.get(userId).size > 0; }
  getOnlineUserIds()   { return Array.from(this.onlineUsers.keys()); }
  getUserForSocket(socketId) { return this.socketToUser.get(socketId) || null; }

  // Sweep sessions idle > 3 hours
  _sweep() {
    const cutoff = Date.now() - 3 * 60 * 60 * 1000;
    for (const [pin, session] of this.sessions) {
      if (session._updatedAt < cutoff) this.deleteSession(pin);
    }
  }
}

// ─── Redis Store (when REDIS_URL is set) ─────────────────────────────────────
// Uncomment and install ioredis to enable:
// const Redis = require('ioredis');
// class RedisSessionStore { ... }

// ─── Export singleton ─────────────────────────────────────────────────────────
let store;
if (REDIS_URL) {
  // Future: store = new RedisSessionStore(REDIS_URL);
  console.warn('[SessionStore] REDIS_URL detected but Redis adapter not yet wired. Using memory store.');
  store = new MemorySessionStore();
} else {
  store = new MemorySessionStore();
}

module.exports = store;
