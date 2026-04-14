// server.js — cleaned & commented (small, human-friendly comments)
require("dotenv").config();
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
console.log("Setting up Express and Socket.io...");
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});
console.log("Middleware setup start...");

const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const FacebookStrategy = require("passport-facebook").Strategy;

// Prisma Client Singleton
const prisma = require("./services/db");
const { mapId } = require("./services/compatibility");
const RatingEngine = require("./services/RatingEngine");

// Routes
const aiQuizRoutes = require("./routes/aiQuiz");
const userRoutes = require("./routes/user");
const adminRoutes = require("./routes/admin");

// Basic middleware
console.log("Registering global middleware...");
app.use(cors({ 
  origin: "*", 
  credentials: true 
}));

app.use(express.json());
app.use(passport.initialize());
console.log("Passport initialized.");

// ---------- PostgreSQL (Prisma) ----------
// Database connection handled by startServer with retries


// ---------- Helpers ----------
function createJwtForUser(user) {
  return jwt.sign(
    {
      userId: user.id || user._id, // Support both during migration if needed
      email: user.email,
      name: user.name,
    },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
}

const FRONTEND_URL =
  process.env.FRONTEND_URL || "https://samarpan-quiz.vercel.app";

// ---------- Health ----------
app.get("/api/health", (_req, res) => {
  res.json({ server: "Samarpan Backend", status: "running" });
});

// -------------------------------
// Email/password auth (basic)
// -------------------------------

// Signup
app.post("/api/signup", async (req, res) => {
  try {
    const { name, email, password, college, course, dob } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: "All required fields must be filled" });
    }

    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists) {
      return res.status(400).json({ error: "Email already registered" });
    }

    const hash = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash: hash,
        provider: "local",
        college,
        course,
        dob: dob ? new Date(dob) : null
      }
    });

    const token = createJwtForUser(user);

    return res.json({
      message: "Signup successful",
      user: {
        userId: user.id,
        name: user.name,
        email: user.email,
        globalRating: user.globalRating,
        ratings: user.ratings,
        xp: user.xp,
      },
      token,
    });
  } catch (err) {
    console.error("Signup error:", err);
    return res.status(500).json({ error: "Registrations are temporarily unavailable. Please try again later." });
  }
});

// Login
app.post("/api/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.passwordHash) {
      return res.status(400).json({ error: "User not found" });
    }

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(400).json({ error: "Invalid password" });

    const token = createJwtForUser(user);

    return res.json({
      message: "Login successful",
      user: mapId(user),
      token,
    });
  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).json({ error: "Login failed" });
  }
});

// -------------------------------
// Quiz creation (manual)
// -------------------------------
app.post("/api/quizzes", async (req, res) => {
  try {
    const { title, topic, authorId, questions, tags, aiGenerated } = req.body;

    if (!title || !authorId || !questions || !questions.length) {
      return res
        .status(400)
        .json({ error: "title, authorId and at least 1 question required" });
    }

    let resolvedAuthorId = authorId;

    // If caller passed an email instead of UUID/ObjectId, resolve it
    if (typeof authorId === "string" && authorId.includes("@")) {
      const user = await prisma.user.findUnique({ where: { email: authorId.toLowerCase().trim() } });
      if (!user) {
        return res
          .status(400)
          .json({ error: "User not found for this authorId" });
      }
      resolvedAuthorId = user.id;
    }

    const quiz = await prisma.quiz.create({
      data: {
        title,
        topic: topic || "",
        authorId: resolvedAuthorId,
        questions,
        aiGenerated: !!aiGenerated,
        tags: tags || (topic ? [topic.toLowerCase()] : []),
      }
    });

    return res.json({ message: "Quiz created", quizId: quiz.id, quiz: mapId(quiz) });
  } catch (err) {
    console.error("Create quiz error:", err);
    return res.status(500).json({ error: "Failed to create quiz" });
  }
});

// -------------------------------
// Quiz fetching
// -------------------------------

// Get all quizzes for a user by email
app.get("/api/quizzes/user/:email", async (req, res) => {
  try {
    const user = await prisma.user.findUnique({ where: { email: req.params.email.toLowerCase().trim() } });
    if (!user) {
      return res.json({ quizzes: [] });
    }
    const quizzes = await prisma.quiz.findMany({ 
      where: { authorId: user.id },
      orderBy: { createdAt: "desc" }
    });
    return res.json({ quizzes: mapId(quizzes) });
  } catch (err) {
    return res.status(500).json({ error: "Failed to fetch user quizzes" });
  }
});

// Get public/trending quizzes for Explore
app.get("/api/quizzes/public", async (req, res) => {
  try {
    const quizzes = await prisma.quiz.findMany({
      take: 20,
      orderBy: { createdAt: "desc" }
    });
    return res.json({ quizzes: mapId(quizzes) });
  } catch (err) {
    return res.status(500).json({ error: "Failed to fetch public quizzes" });
  }
});

// Get individual quiz by ID
app.get("/api/quizzes/:id", async (req, res) => {
  try {
    const quiz = await prisma.quiz.findUnique({ where: { id: req.params.id } });
    if (!quiz) return res.status(404).json({ error: "Quiz not found" });
    return res.json(mapId(quiz));
  } catch (err) {
    console.error("Fetch quiz by ID error:", err);
    return res.status(500).json({ error: "Failed to fetch quiz" });
  }
});

// SEARCH & EXPLORE
app.get("/api/quizzes/search", async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) return res.json({ quizzes: [] });
    
    // Prisma search with contains
    const quizzes = await prisma.quiz.findMany({
      where: {
        OR: [
          { title: { contains: q, mode: "insensitive" } },
          { topic: { contains: q, mode: "insensitive" } },
          { tags: { has: q } } // For exact tag match, or use a more complex filter
        ],
        isPublished: true
      },
      take: 30,
      orderBy: { playCount: "desc" }
    });

    return res.json({ quizzes: mapId(quizzes) });
  } catch (err) {
    console.error("Search error:", err);
    return res.status(500).json({ error: "Search failed" });
  }
});

app.get("/api/explore/home", async (req, res) => {
  try {
    // 1. Trending: Top 5 by playCount
    const trending = await prisma.quiz.findMany({
      where: { isPublished: true },
      orderBy: { playCount: "desc" },
      take: 5
    });

    // 2. Upcoming Events: Active waiting sessions
    const events = await prisma.gameSession.findMany({
      where: { status: "waiting" },
      include: { quiz: true },
      take: 5,
      orderBy: { createdAt: "desc" }
    });

    // 3. Recommended: Recent
    const recommended = await prisma.quiz.findMany({
      where: { isPublished: true },
      orderBy: { createdAt: "desc" },
      take: 3
    });

    return res.json({ 
      trending: mapId(trending), 
      events: mapId(events), 
      recommended: mapId(recommended) 
    });
  } catch (err) {
    console.error("Explore home error:", err);
    return res.status(500).json({ error: "Failed to load explore feed" });
  }
});

app.get("/api/explore/categories", async (req, res) => {
  try {
    const categories = ["Computer Science", "Aptitude", "Mathematics", "GATE", "General Knowledge"];
    const results = await Promise.all(categories.map(async (cat) => {
      const count = await prisma.quiz.count({
        where: { topic: { contains: cat, mode: "insensitive" } }
      });
      return { name: cat, count };
    }));
    return res.json({ categories: results });
  } catch (err) {
    console.error("Categories error:", err);
    return res.status(500).json({ error: "Failed to load categories" });
  }
});

// -------------------------------
// Host / game session (prototype)
// -------------------------------
app.post("/api/host/start", async (req, res) => {
  console.log("POST /api/host/start - Request received", req.body);
  try {
    const { quizId, hostEmail, mode, timerSeconds, rated, battleType } = req.body;

    if (!quizId || !hostEmail) {
      return res.status(400).json({ error: "quizId and hostEmail required" });
    }

    // For UUID/ID validation, we'll let Prisma handle it or just check if it's a string
    // In Postgres, IDs can be arbitrary strings (we used UUID as default)
    console.log("Looking for host user:", hostEmail);
    const user = await prisma.user.findUnique({ where: { email: hostEmail.toLowerCase().trim() } });
    if (!user) {
      console.warn("Host user not found:", hostEmail);
      return res.status(400).json({ error: "Host user not found. Please ensure you are logged in correctly." });
    }

    console.log("Looking for quiz:", quizId);
    const quiz = await prisma.quiz.findUnique({ where: { id: quizId } });
    if (!quiz) {
      console.warn("Quiz not found:", quizId);
      return res.status(404).json({ error: "Quiz not found" });
    }

    let pin;
    let attempts = 0;
    let pinFound = false;
    console.log("Generating unique PIN...");
    while (attempts < 10) {
      pin = String(Math.floor(100000 + Math.random() * 900000));
      const exists = await prisma.gameSession.findUnique({ where: { pin } });
      if (!exists) {
        pinFound = true;
        break;
      }
      attempts++;
    }

    if (!pinFound) {
      throw new Error("Unable to generate a unique room PIN. The arena is currently at full capacity.");
    }

    console.log("Creating GameSession with PIN:", pin);
    const game = await prisma.gameSession.create({
      data: {
        quizId: quiz.id,
        hostId: user.id,
        mode: mode || "rapid",
        timerSeconds: timerSeconds || 30,
        rated: rated !== false,
        battleType: battleType || null,
        teamScores: battleType && battleType !== '1v1' ? { 'Team A': 0, 'Team B': 0 } : null,
        pin,
      }
    });

    console.log("Game Session created successfully:", game.id);
    return res.json({
      message: "Game session created",
      gameId: game.id,
      pin: game.pin,
    });
  } catch (err) {
    console.error("CRITICAL Host start error:", err);
    if (err.name === "ValidationError") {
      console.error("Validation Errors:", Object.keys(err.errors).map(key => ({
        field: key,
        message: err.errors[key].message
      })));
    }
    return res.status(500).json({ error: "Could not start game", details: err.message });
  }
});

app.get("/api/host/analytics/:pin", async (req, res) => {
  const { pin } = req.params;
  try {
    const session = await prisma.gameSession.findUnique({
      where: { pin },
      include: {
        quiz: true,
        answerLogs: true
      }
    });

    if (!session) return res.status(404).json({ error: "Session not found" });

    // Aggregate Data
    const players = {};
    const questionPerformance = [];
    const questions = session.quiz.questions;

    // Initialize question performance array
    questions.forEach((_q, index) => {
      questionPerformance[index] = {
        correct: 0,
        incorrect: 0,
        totalTime: 0,
        responses: 0
      };
    });

    session.answerLogs.forEach(log => {
      // Player aggregation
      if (!players[log.playerName]) {
        players[log.playerName] = {
          name: log.playerName,
          correct: 0,
          total: 0,
          totalTime: 0,
          answers: []
        };
      }
      players[log.playerName].total++;
      if (log.isCorrect) players[log.playerName].correct++;
      players[log.playerName].totalTime += log.timeTaken;
      players[log.playerName].answers.push(log);

      // Question aggregation
      if (questionPerformance[log.questionIndex]) {
        questionPerformance[log.questionIndex].responses++;
        if (log.isCorrect) questionPerformance[log.questionIndex].correct++;
        else questionPerformance[log.questionIndex].incorrect++;
        questionPerformance[log.questionIndex].totalTime += log.timeTaken;
      }
    });

    return res.json({
      session: {
        pin: session.pin,
        title: session.quiz.title,
        mode: session.mode,
        createdAt: session.createdAt
      },
      playerPerformance: Object.values(players),
      questionPerformance: questionPerformance.map((q, idx) => ({
        ...q,
        accuracy: q.responses > 0 ? (q.correct / q.responses) * 100 : 0,
        avgTime: q.responses > 0 ? q.totalTime / q.responses : 0,
        question: questions[idx].question
      }))
    });
  } catch (err) {
    console.error("Analytics error:", err);
    res.status(500).json({ error: "Failed to load analytics" });
  }
});

// -------------------------------
// Public leaderboard (top 50)
// -------------------------------
app.get("/leaderboard", async (_req, res) => {
  try {
    const users = await prisma.user.findMany({
      orderBy: { globalRating: "desc" },
      take: 50,
      select: { name: true, globalRating: true, xp: true }
    });

    const scores = users.map((u, idx) => ({
      rank: idx + 1,
      name: u.name,
      score: u.globalRating,
      xp: u.xp,
    }));

    return res.json({ scores });
  } catch (err) {
    console.error("Leaderboard error:", err);
    return res.status(500).json({ error: "Failed to load leaderboard" });
  }
});

// -------------------------------
// User Profile & History
// -------------------------------

// Full profile stats by email
app.get("/api/profile/:email", async (req, res) => {
  try {
    const user = await prisma.user.findUnique({ 
      where: { email: req.params.email.toLowerCase().trim() },
      include: { _count: { select: { quizzes: true } } }
    });
    if (!user) {
      return res.json({
        name: "Anonymous Player",
        email: req.params.email,
        globalRating: 1200,
        ratings: { rapid: 1200, blitz: 1200, casual: 1200 },
        xp: 0,
        quizzesCount: 0,
        avatar: null
      });
    }
    
    return res.json({
      name: user.name,
      email: user.email,
      globalRating: user.globalRating,
      ratings: user.ratings,
      xp: user.xp,
      quizzesCount: user._count.quizzes,
      avatar: user.avatar,
      _id: user.id
    });
  } catch (err) {
    console.error("Profile fetch error:", err);
    return res.status(500).json({ error: "Failed to load profile" });
  }
});

// Rating history by email
app.get("/ratings/:email", async (req, res) => {
  try {
    const email = req.params.email;
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(404).json({ error: "User not found" });

    const history = await prisma.ratingHistory.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" }
    });

    return res.json({ history });
  } catch (err) {
    console.error("Rating history error:", err);
    return res.status(500).json({ error: "Failed to load rating history" });
  }
});

// -------------------------------
// Passport social strategies
// -------------------------------

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
    },
    async (accessToken, _refreshToken, profile, done) => {
      try {
        const email = profile.emails?.[0]?.value;
        const name = profile.displayName;
        const avatar = profile.photos?.[0]?.value || null;

        if (!email) return done(new Error("No email from Google"), null);

        let user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
          user = await prisma.user.create({
            data: {
              name,
              email,
              avatar,
              provider: "google",
              googleId: profile.id,
            }
          });
        } else {
          // update missing pieces
          const updateData = {};
          if (!user.provider) updateData.provider = "google";
          if (!user.googleId) updateData.googleId = profile.id;
          if (!user.avatar && avatar) updateData.avatar = avatar;
          
          if (Object.keys(updateData).length > 0) {
            user = await prisma.user.update({
              where: { id: user.id },
              data: updateData
            });
          }
        }

        done(null, user);
      } catch (err) {
        done(err, null);
      }
    }
  )
);

passport.use(
  new FacebookStrategy(
    {
      clientID: process.env.FACEBOOK_CLIENT_ID,
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET,
      callbackURL: process.env.FACEBOOK_CALLBACK_URL,
      profileFields: ["id", "displayName", "emails", "picture.type(large)"],
    },
    async (accessToken, _refreshToken, profile, done) => {
      try {
        const email = profile.emails?.[0]?.value;
        const name = profile.displayName;
        const avatar =
          profile.photos && profile.photos[0] && profile.photos[0].value
            ? profile.photos[0].value
            : null;

        if (!email) return done(new Error("No email from Facebook"), null);

        let user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
          user = await prisma.user.create({
            data: {
              name,
              email,
              avatar,
              provider: "facebook",
              facebookId: profile.id,
            }
          });
        } else {
          const updateData = {};
          if (!user.provider) updateData.provider = "facebook";
          if (!user.facebookId) updateData.facebookId = profile.id;
          if (!user.avatar && avatar) updateData.avatar = avatar;
          
          if (Object.keys(updateData).length > 0) {
            user = await prisma.user.update({
              where: { id: user.id },
              data: updateData
            });
          }
        }

        done(null, user);
      } catch (err) {
        done(err, null);
      }
    }
  )
);

// Helper used after successful social auth to send user back to frontend with a token
function sendSocialLoginRedirect(req, res) {
  const user = req.user;
  const token = createJwtForUser(user);

  const redirectUrl =
    FRONTEND_URL +
    `?token=${encodeURIComponent(token)}` +
    `&userId=${encodeURIComponent(user.id.toString())}` +
    `&name=${encodeURIComponent(user.name || "")}` +
    `&email=${encodeURIComponent(user.email || "")}` +
    `&avatar=${encodeURIComponent(user.avatar || "")}`;

  return res.redirect(redirectUrl);
}

// Social auth routes
app.get(
  "/auth/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

app.get(
  "/auth/google/callback",
  passport.authenticate("google", { session: false, failureRedirect: FRONTEND_URL }),
  (req, res) => sendSocialLoginRedirect(req, res)
);

app.get(
  "/auth/facebook",
  passport.authenticate("facebook", { scope: ["email"] })
);

app.get(
  "/auth/facebook/callback",
  passport.authenticate("facebook", { session: false, failureRedirect: FRONTEND_URL }),
  (req, res) => sendSocialLoginRedirect(req, res)
);

// -------------------------------
// Get session by PIN (used by frontend after game_started)
// -------------------------------
app.get("/api/host/session/:pin", async (req, res) => {
  try {
    const session = await prisma.gameSession.findUnique({
      where: { pin: req.params.pin },
      include: { quiz: true }
    });
    if (!session) return res.status(404).json({ error: "Session not found" });
    return res.json(mapId(session));
  } catch (err) {
    console.error("Session fetch error:", err);
    return res.status(500).json({ error: "Failed to fetch session" });
  }
});

// -------------------------------
// AI & User routes (mounted)
// -------------------------------
app.use("/api/ai", aiQuizRoutes);
app.use("/api/user", userRoutes);

// Admin Auth Middleware
async function isAdmin(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: "No token" });
  
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await prisma.user.findUnique({ where: { id: decoded.userId } });
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ error: "Access denied. Admin only." });
    }
    req.user = user;
    next();
  } catch (err) {
    res.status(401).json({ error: "Invalid token" });
  }
}

app.use("/api/admin", isAdmin, adminRoutes);

// -------------------------------
// Start server
// ============================================================
// SOCKET.IO — Multiplayer Quiz Engine
// ============================================================

const liveSessions = new Map();

/**
 * HELPER: Log Answer to Database
 */
async function logAnswerToDb(session, player, data) {
  try {
    const pin = session.pin;
    if (!pin) {
      console.warn("[Analytics] Cannot log answer: Session PIN is missing from memory object.");
      return;
    }

    const dbSession = await prisma.gameSession.findUnique({ where: { pin } });
    if (!dbSession) {
      console.warn(`[Analytics] Cannot log answer: No database record found for PIN ${pin}. Ensure 'npx prisma db push' was run.`);
      return;
    }

    await prisma.answerLog.create({
      data: {
        sessionId: dbSession.id,
        questionIndex: session.currentQ,
        userId: player.id || null,
        playerName: player.name,
        selectedIdx: data.optionIdx,
        isCorrect: data.isCorrect,
        timeTaken: data.timeTaken || 0,
        ipAddress: data.ipAddress || null
      }
    });
    console.log(`[Analytics] Logged answer for ${player.name} in PIN ${pin} (Correct: ${data.isCorrect})`);
  } catch (err) {
    console.error(`[Analytics] Critical error logging answer for PIN ${session.pin}:`, err);
  }
}

/**
 * HELPER: Persistent Session Recovery
 * If a PIN exists in DB but not in memory, we re-initialize it.
 */
async function ensureSessionInMemory(pin) {
  if (liveSessions.has(pin)) return liveSessions.get(pin);

  try {
    const dbSession = await prisma.gameSession.findUnique({
      where: { pin },
      include: { quiz: true }
    });

    if (dbSession) {
      console.log(`♻️ Rehydrating session ${pin} from database...`);
      liveSessions.set(pin, {
        pin, // Store the pin internally so helpers can access it
        hostSocketId: null, 
        password: null,
        players: {},
        bannedNames: new Set(),
        quiz: dbSession.quiz,
        status: dbSession.status || 'waiting',
        currentQ: 0,
        optionStats: [0, 0, 0, 0],
        timerSeconds: dbSession.timerSeconds || 30,
        timeLeft: dbSession.timerSeconds || 30,
        isPaused: false,
        timerHandle: null,
        countdownHandle: null
      });
      return liveSessions.get(pin);
    }
  } catch (err) {
    console.error(`Session recovery error for PIN ${pin}:`, err);
  }
  return null;
}

function getLeaderboard(session) {
  return Object.values(session.players)
    .filter(p => !p.isHost)
    .sort((a, b) => b.score - a.score)
    .map((p, i) => ({ rank: i + 1, name: p.name, score: p.score, streak: p.streak || 0 }));
}

function broadcastStats(pin, session) {
  const players = Object.values(session.players).filter(p => !p.isHost);
  const responded = players.filter(p => p.answeredThisQ).length;
  io.in(pin).emit("stats_update", {
    stats: session.optionStats,
    responded,
    total: players.length,
    leaderboard: getLeaderboard(session)
  });
  // Auto-advance if everyone answered
  if (responded === players.length && players.length > 0 && session.status === 'running') {
    if (session.timerHandle) clearTimeout(session.timerHandle);
    if (session.countdownHandle) clearInterval(session.countdownHandle);
    setTimeout(() => advanceQuestion(pin), 1500);
  }
}

function startCountdown(pin) {
  const session = liveSessions.get(pin);
  if (!session) return;
  if (session.timerHandle) clearTimeout(session.timerHandle);
  if (session.countdownHandle) clearInterval(session.countdownHandle);
  session.timeLeft = session.timerSeconds;
  session.countdownHandle = setInterval(() => {
    if (!liveSessions.has(pin)) { clearInterval(session.countdownHandle); return; }
    session.timeLeft--;
    io.in(pin).emit("timer_tick", { timeLeft: session.timeLeft });
    if (session.timeLeft <= 0) clearInterval(session.countdownHandle);
  }, 1000);
  session.timerHandle = setTimeout(() => {
    clearInterval(session.countdownHandle);
    advanceQuestion(pin);
  }, (session.timerSeconds + 1) * 1000);
}

function advanceQuestion(pin) {
  const session = liveSessions.get(pin);
  if (!session || session.status !== 'running') return;
  if (session.timerHandle) clearTimeout(session.timerHandle);
  if (session.countdownHandle) clearInterval(session.countdownHandle);

  const q = session.quiz.questions[session.currentQ];
  if (q) {
    io.in(pin).emit("question_result", {
      correctIndex: q.correctIndex,
      explanation: q.explanation || null,
      leaderboard: getLeaderboard(session)
    });
  }

  setTimeout(() => {
    session.currentQ++;
    session.optionStats = [0, 0, 0, 0];
    Object.values(session.players).forEach(p => { p.answeredThisQ = false; p.optionIdx = -1; });

    if (session.currentQ >= session.quiz.questions.length) {
      session.status = 'finished';
      
      // Determine Rated status and Battle configuration
      const isRated = session.rated !== false; // Default to rated
      RatingEngine.processGameResults(pin, session.players, isRated);

      io.in(pin).emit("quiz_finished", { 
        leaderboard: getLeaderboard(session),
        teamScores: session.teamScores || null
      });
      setTimeout(() => liveSessions.delete(pin), 10 * 60 * 1000);
      return;
    }

    io.in(pin).emit("next_question", {
      index: session.currentQ,
      timerSeconds: session.timerSeconds,
      total: session.quiz.questions.length
    });
    startCountdown(pin);
  }, 2500);
}

io.on("connection", (socket) => {
  console.log("Socket connected:", socket.id);

  socket.on("host_join", async (data) => {
    const { pin, password } = data;
    
    // Recovery: Check if session exists in DB if not in memory
    let session = await ensureSessionInMemory(pin);
    
    if (!session) {
      liveSessions.set(pin, {
        pin, // Store the pin internally
        hostSocketId: socket.id,
        password: password || null,
        players: {},
        bannedNames: new Set(),
        quiz: null,
        status: 'waiting',
        currentQ: 0,
        optionStats: [0, 0, 0, 0],
        timerSeconds: 30,
        timeLeft: 30,
        timerHandle: null,
        countdownHandle: null,
        rated: true,
        battleType: null,
        teamScores: null
      });
      session = liveSessions.get(pin);
    } else {
      session.hostSocketId = socket.id;
      if (password) session.password = password;
    }

    socket.join(pin);
      session.players[socket.id] = { 
        name: "Host", 
        score: 0, 
        answeredThisQ: true, 
        optionIdx: -1, 
        isHost: true, 
        streak: 0,
        latency: 0 
      };
    socket.emit("host_ready", { pin });
    console.log(`Host joined/created room ${pin}`);
  });

  socket.on("join_room", async (data) => {
    const { pin, name, password } = data;
    if (!pin || !name) { socket.emit("join_error", { message: "PIN and name required." }); return; }
    
    // Recovery check
    const session = await ensureSessionInMemory(pin);
    
    if (!session) { socket.emit("join_error", { message: "Room not found. Check the PIN." }); return; }
    
    if (session.password && session.password !== password) { socket.emit("join_error", { message: "Wrong room password." }); return; }
    if (session.bannedNames.has(name.toLowerCase())) { socket.emit("join_error", { message: "You are banned from this room." }); return; }
    if (session.status === 'running') { socket.emit("join_error", { message: "Game already started. Wait for next session." }); return; }
    if (session.status === 'finished') { socket.emit("join_error", { message: "This session has ended." }); return; }
    const nameTaken = Object.values(session.players).some(p => p.name.toLowerCase() === name.toLowerCase() && !p.isHost);
    if (nameTaken) { socket.emit("join_error", { message: "Name already taken. Choose another." }); return; }
    socket.join(pin);
    session.players[socket.id] = { 
      name, 
      userId: data.userId || null,
      email: data.email || null,
      team: data.team || null, // Team A or Team B
      score: 0, 
      answeredThisQ: false, 
      optionIdx: -1, 
      isHost: false, 
      streak: 0,
      ip: socket.handshake.address,
      isSuspicious: false,
      idleTimeout: null
    };
    socket.emit("join_success", { pin, name });
    io.in(pin).emit("player_list_update", { players: session.players });
    console.log(`${name} joined room ${pin}`);
  });

  socket.on("start_game", async (data) => {
    const pin = typeof data === 'string' ? data : data.pin;
    const session = liveSessions.get(pin);
    if (!session || session.hostSocketId !== socket.id) return;
    if (session.status !== 'waiting') { socket.emit("error_msg", { message: "Game already started." }); return; }
    const playerCount = Object.values(session.players).filter(p => !p.isHost).length;
    if (playerCount === 0) { socket.emit("error_msg", { message: "Need at least 1 player to start." }); return; }
    try {
      const dbSession = await prisma.gameSession.findUnique({
        where: { pin },
        include: { quiz: true }
      });
      if (!dbSession || !dbSession.quiz) { 
        socket.emit("error_msg", { message: "Quiz not found in database." }); 
        return; 
      }
      session.quiz = dbSession.quiz;
      session.timerSeconds = dbSession.timerSeconds || 30;
      session.rated = dbSession.rated;
      session.battleType = dbSession.battleType;
      session.teamScores = dbSession.teamScores;
      session.status = 'running';
      session.currentQ = 0;
      const questionsForAll = (session.quiz.questions || []).map(q => ({
        question: q.question,
        options: q.options
      }));
      io.in(pin).emit("game_started", {
        quiz: { 
          id: session.quiz.id, 
          _id: session.quiz.id,
          title: session.quiz.title, 
          topic: session.quiz.topic, 
          questions: questionsForAll, 
          totalQuestions: (session.quiz.questions || []).length 
        },
        timerSeconds: session.timerSeconds
      });
      startCountdown(pin);
      console.log(`Game started in room ${pin} with ${playerCount} players`);
    } catch (err) {
      console.error("start_game error:", err);
      socket.emit("error_msg", { message: "Failed to start game." });
    }
  });

  socket.on("submit_answer", (data) => {
    const { pin, optionIdx, timeTaken } = data;
    const session = liveSessions.get(pin);
    if (!session || session.status !== 'running') return;
    const player = session.players[socket.id];
    if (!player || player.isHost) return;
    const q = session.quiz.questions[session.currentQ];
    if (!q) return;
    if (player.answeredThisQ && player.optionIdx >= 0 && player.optionIdx < session.optionStats.length) {
      session.optionStats[player.optionIdx] = Math.max(0, session.optionStats[player.optionIdx] - 1);
    }
    player.optionIdx = optionIdx;
    player.answeredThisQ = true;
    if (optionIdx >= 0 && optionIdx < session.optionStats.length) session.optionStats[optionIdx]++;
    const isCorrect = optionIdx === q.correctIndex;
    
    // Suspicious Activity Detection
    if (timeTaken < 1.5) { // 1.5s threshold
      player.isSuspicious = true;
    }

    if (isCorrect) {
      const t = Math.min(timeTaken || session.timerSeconds, session.timerSeconds);
      const speedBonus = Math.max(0, Math.floor(50 * (1 - t / session.timerSeconds)));
      player.streak = (player.streak || 0) + 1;
      const streakBonus = Math.min(player.streak - 1, 5) * 10;
      const points = 100 + speedBonus + streakBonus;
      player.score += points;

      // Update Team Score if in a team battle
      if (player.team && session.teamScores) {
        if (!session.teamScores[player.team]) session.teamScores[player.team] = 0;
        session.teamScores[player.team] += points;
      }
    } else {
      player.streak = 0;
    }

    logAnswerToDb(session, player, { optionIdx, isCorrect, timeTaken, ipAddress: socket.handshake.address });
    broadcastStats(pin, session);
    socket.emit("answer_confirmed", { optionIdx, isCorrect });
    
    // Notify host of the choice in real-time (Oversight feature)
    if (session.hostSocketId) {
      io.to(session.hostSocketId).emit("player_choice", {
        playerId: socket.id,
        name: player.name,
        optionIdx,
        timeTaken
      });
    }
  });

  socket.on("host_next", (pin) => {
    const session = liveSessions.get(pin);
    if (!session || session.hostSocketId !== socket.id) return;
    advanceQuestion(pin);
  });

  socket.on("host_show_results", (pin) => {
    const session = liveSessions.get(pin);
    if (!session || session.hostSocketId !== socket.id) return;
    io.in(pin).emit("reveal_results", { leaderboard: getLeaderboard(session) });
  });

  socket.on("host_cancel", (pin) => {
    const session = liveSessions.get(pin);
    if (!session || session.hostSocketId !== socket.id) return;
    if (session.timerHandle) clearTimeout(session.timerHandle);
    if (session.countdownHandle) clearInterval(session.countdownHandle);
    io.in(pin).emit("host_left", { message: "Host ended the session." });
    liveSessions.delete(pin);
    console.log(`Host cancelled room ${pin}`);
  });

  socket.on("host_kick", (data) => {
    const { pin, playerId } = data;
    const session = liveSessions.get(pin);
    if (!session || session.hostSocketId !== socket.id) return;
    const target = io.sockets.sockets.get(playerId);
    if (target) { target.emit("kicked", { message: "You were removed by the host." }); target.leave(pin); }
    delete session.players[playerId];
    io.in(pin).emit("player_list_update", { players: session.players });
  });

  socket.on("host_ban", (data) => {
    const { pin, playerId, name } = data;
    const session = liveSessions.get(pin);
    if (!session || session.hostSocketId !== socket.id) return;
    if (name) session.bannedNames.add(name.toLowerCase());
    const target = io.sockets.sockets.get(playerId);
    if (target) { target.emit("kicked", { message: "You are banned from this room." }); target.leave(pin); }
    delete session.players[playerId];
    io.in(pin).emit("player_list_update", { players: session.players });
  });

  socket.on("host_patch_quiz", (data) => {
    const { pin, questions } = data;
    const session = liveSessions.get(pin);
    if (!session || session.hostSocketId !== socket.id) return;
    if (session.status !== 'waiting') return; // Only patch before start for stability
    
    session.quiz.questions = questions;
    // Notify all players that the quiz has been updated/prepared
    io.in(pin).emit("quiz_updated", { title: session.quiz.title });
  });

  socket.on("host_pause", (pin) => {
    const session = liveSessions.get(pin);
    if (!session || session.hostSocketId !== socket.id) return;
    session.isPaused = true;
    if (session.timerHandle) clearTimeout(session.timerHandle);
    if (session.countdownHandle) clearInterval(session.countdownHandle);
    io.in(pin).emit("game_paused");
  });

  socket.on("host_resume", (pin) => {
    const session = liveSessions.get(pin);
    if (!session || !session.isPaused || session.hostSocketId !== socket.id) return;
    session.isPaused = false;
    startCountdown(pin);
    io.in(pin).emit("game_resumed");
  });

  socket.on("host_broadcast", (data) => {
    const { pin, message, type } = data;
    const session = liveSessions.get(pin);
    if (!session || session.hostSocketId !== socket.id) return;
    io.in(pin).emit("broadcast_message", { message, type: type || 'info' });
  });

  socket.on("disconnect", () => {
    liveSessions.forEach((session, pin) => {
      if (!session.players[socket.id]) return;
      const wasHost = session.players[socket.id].isHost;
      const playerName = session.players[socket.id].name;
      delete session.players[socket.id];
      if (wasHost) {
        if (session.timerHandle) clearTimeout(session.timerHandle);
        if (session.countdownHandle) clearInterval(session.countdownHandle);
        io.in(pin).emit("host_left", { message: "Host disconnected. Session ended." });
        liveSessions.delete(pin);
      } else {
        io.in(pin).emit("player_list_update", { players: session.players });
        io.in(pin).emit("player_left", { name: playerName });
      }
    });
    console.log("Socket disconnected:", socket.id);
  });
});
// ---------- Start server ----------
// ---------- Start server ----------
async function startServer() {
  const MAX_RETRIES = 5;
  const RETRY_DELAY = 5000; // 5 seconds
  let retryCount = 0;
  let dbConnected = false;

  console.log("🚀 Initializing Samarpan Backend...");

  while (retryCount < MAX_RETRIES && !dbConnected) {
    try {
      if (retryCount > 0) {
        console.log(`🔄 Connection retry ${retryCount}/${MAX_RETRIES} in ${RETRY_DELAY/1000}s...`);
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
      }

      console.log("📡 Attempting to connect to PostgreSQL via Prisma...");
      await prisma.$connect();
      console.log("✅ PostgreSQL connected successfully");
      dbConnected = true;
    } catch (err) {
      retryCount++;
      console.error(`❌ DB Connection Attempt ${retryCount} failed:`, err.message);
      
      if (retryCount >= MAX_RETRIES) {
        console.error("🛑 CRITICAL: Maximum database connection retries reached.");
        console.error("Please verify your DATABASE_URL in .env and ensure Neon PostgreSQL is active.");
      }
    }
  }

  // We start the server regardless of DB status for health checks, 
  // but most routes will fail without it.
  const PORT = process.env.PORT || 5001;
  server.listen(PORT, () => {
    console.log(`🚀 Samarpan Server running on port ${PORT}`);
    if (!dbConnected) {
      console.warn("⚠️ Server started but DATABASE CONNECTION IS NOT ESTABLISHED.");
    }
  });
}

startServer();
