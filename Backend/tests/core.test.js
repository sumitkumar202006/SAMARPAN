/**
 * Samarpan — Core Route Tests
 * Run: npm test
 * All DB calls are mocked — no real database needed.
 */

jest.mock('../services/db', () => ({
  user:       { findUnique: jest.fn(), create: jest.fn(), update: jest.fn() },
  quiz:       { findMany: jest.fn(), findUnique: jest.fn(), count: jest.fn(), update: jest.fn(), create: jest.fn() },
  quizReview: { upsert: jest.fn(), aggregate: jest.fn() },
  message:    { count: jest.fn(), updateMany: jest.fn(), findMany: jest.fn() },
  friendship: { findMany: jest.fn() },
}));

jest.mock('../services/validateEnv', () => ({ validateEnv: jest.fn() }));
jest.mock('../services/emailService', () => ({ sendOtpEmail: jest.fn() }));

process.env.JWT_SECRET   = 'test-secret-that-is-long-enough-here';
process.env.DATABASE_URL = 'postgresql://localhost/test';
process.env.CLIENT_URL   = 'http://localhost:3000';
process.env.PORT         = '5001';
process.env.NODE_ENV     = 'test';

const request = require('supertest');
const express = require('express');
const prisma  = require('../services/db');

// ─── Helper: create minimal express app ──────────────────────────────────────
function makeApp(router, prefix) {
  const app = express();
  app.use(express.json());
  app.use(prefix, router);
  return app;
}

// ─── Auth Route Tests ─────────────────────────────────────────────────────────
describe('Auth Routes (/api/auth)', () => {
  let app;

  beforeAll(() => {
    app = makeApp(require('../routes/auth'), '/api/auth');
  });

  beforeEach(() => { jest.clearAllMocks(); });

  describe('POST /api/auth/signup', () => {
    it('returns 400 if name is missing', async () => {
      const res = await request(app).post('/api/auth/signup').send({ email: 't@t.com', password: 'pass123' });
      expect(res.status).toBe(400);
    });

    it('returns 400 if password is missing', async () => {
      const res = await request(app).post('/api/auth/signup').send({ name: 'Test', email: 'test@example.com' });
      expect(res.status).toBe(400);
    });

    it('returns 409 if email already exists', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: '1', email: 'existing@example.com' });
      const res = await request(app).post('/api/auth/signup').send({
        name: 'Test', email: 'existing@example.com', password: 'password123'
      });
      expect([409, 400]).toContain(res.status);
    });
  });

  describe('POST /api/auth/login', () => {
    it('returns 4xx if user does not exist', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      const res = await request(app).post('/api/auth/login').send({ email: 'ghost@example.com', password: 'pass' });
      expect(res.status).toBeGreaterThanOrEqual(400);
      expect(res.status).toBeLessThan(500);
    });

    it('returns 400 if email is missing', async () => {
      const res = await request(app).post('/api/auth/login').send({ password: 'pass' });
      expect(res.status).toBe(400);
    });

    it('returns 400 if password is missing', async () => {
      const res = await request(app).post('/api/auth/login').send({ email: 't@t.com' });
      expect(res.status).toBe(400);
    });
  });
});

// ─── Marketplace Route Tests ──────────────────────────────────────────────────
describe('Marketplace Routes (/api/marketplace)', () => {
  let app;

  beforeAll(() => {
    app = makeApp(require('../routes/marketplace'), '/api/marketplace');
  });

  beforeEach(() => { jest.clearAllMocks(); });

  it('GET / — returns paginated quiz list', async () => {
    prisma.quiz.findMany.mockResolvedValue([{ id: '1', title: 'Test Quiz', isMarketplace: true }]);
    prisma.quiz.count.mockResolvedValue(1);
    const res = await request(app).get('/api/marketplace');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('quizzes');
    expect(res.body).toHaveProperty('total');
    expect(res.body).toHaveProperty('pages');
  });

  it('GET /?sort=newest — accepts sort param without error', async () => {
    prisma.quiz.findMany.mockResolvedValue([]);
    prisma.quiz.count.mockResolvedValue(0);
    const res = await request(app).get('/api/marketplace?sort=newest');
    expect(res.status).toBe(200);
  });

  it('GET /?sort=rating — accepts rating sort', async () => {
    prisma.quiz.findMany.mockResolvedValue([]);
    prisma.quiz.count.mockResolvedValue(0);
    const res = await request(app).get('/api/marketplace?sort=rating');
    expect(res.status).toBe(200);
  });

  it('GET /:id — returns 404 for missing quiz', async () => {
    prisma.quiz.findUnique.mockResolvedValue(null);
    const res = await request(app).get('/api/marketplace/does-not-exist');
    expect(res.status).toBe(404);
  });

  it('GET /:id — returns quiz data when found', async () => {
    prisma.quiz.findUnique.mockResolvedValue({ id: 'abc', title: 'Test', reviews: [], _count: { reviews: 0, sessions: 0 } });
    const res = await request(app).get('/api/marketplace/abc');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('quiz');
  });
});

// ─── Friends Route Tests ──────────────────────────────────────────────────────
describe('Friends Routes (/api/friends)', () => {
  let app;

  beforeAll(() => {
    app = makeApp(require('../routes/friends'), '/api/friends');
  });

  beforeEach(() => { jest.clearAllMocks(); });

  it('GET /unread/:userId — returns unread count object', async () => {
    prisma.message.count.mockResolvedValue(5);
    const res = await request(app).get('/api/friends/unread/user-123');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('unread');
    expect(typeof res.body.unread).toBe('number');
  });

  it('GET /unread/:userId — returns 0 when no unread', async () => {
    prisma.message.count.mockResolvedValue(0);
    const res = await request(app).get('/api/friends/unread/user-abc');
    expect(res.status).toBe(200);
    expect(res.body.unread).toBe(0);
  });

  it('POST /messages/mark-read — marks messages and returns ok', async () => {
    prisma.message.updateMany.mockResolvedValue({ count: 3 });
    const res = await request(app).post('/api/friends/messages/mark-read').send({ userId: 'u1', friendId: 'u2' });
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
  });

  it('POST /messages/mark-read — returns 400 if IDs missing', async () => {
    const res = await request(app).post('/api/friends/messages/mark-read').send({});
    expect(res.status).toBe(400);
  });

  it('GET /list/:userId — returns friends array', async () => {
    prisma.friendship.findMany.mockResolvedValue([]);
    const res = await request(app).get('/api/friends/list/user-123');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('GET /messages/:userId/:friendId — returns messages array', async () => {
    prisma.message.findMany.mockResolvedValue([]);
    const res = await request(app).get('/api/friends/messages/u1/u2');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});
