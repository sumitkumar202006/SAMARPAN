// server.js — cleaned & commented (small, human-friendly comments)
require("dotenv").config();
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
console.log("Setting up Express and Socket.io...");
const app = express();
const server = http.createServer(app);
const allowedOrigins = [
  "https://samarpan-quiz.vercel.app",
  "http://localhost:3000"
];

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true
  }
});
console.log("Middleware setup start...");

const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const FacebookStrategy = require("passport-facebook").Strategy;
const { generateUniqueUsername } = require("./services/identity");

// Prisma Client Singleton
const prisma = require("./services/db");
const { mapId } = require("./services/compatibility");
const RatingEngine = require("./services/RatingEngine");
const { generateQuizQuestions } = require("./services/gptService");

// Routes
const aiQuizRoutes = require("./routes/aiQuiz");
const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/user");
const adminRoutes = require("./routes/admin");
const friendsRoutes = require("./routes/friends");

// Basic middleware
console.log("Registering global middleware...");
app.use(cors({ 
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true 
}));

app.use(express.json());
app.use("/uploads", express.static("uploads"));
app.use(passport.initialize());
console.log("Passport initialized.");

// Global maps for social and presence
const globalOnlineUsers = new Map(); // Map<UserId, SocketId[]>
const socketToUser = new Map(); // Map<SocketId, UserId>

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
// Authentication Routes (Signup, Login, OTP, etc.)
// -------------------------------
app.use("/api/auth", authRoutes);
app.use("/api/friends", friendsRoutes);
// Forward compatible legacy routes (optional, but good for stability)
app.use("/api/signup", (req, res) => res.redirect(307, "/api/auth/signup"));
app.use("/api/login", (req, res) => res.redirect(307, "/api/auth/login"));

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
    const { email } = req.query;
    let user = null;
    if (email) {
      user = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });
    }

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

    // 3. Recommended: Personalized based on user data, or just recent
    const recQuery = {
      where: { isPublished: true },
      orderBy: { createdAt: "desc" },
      take: 6
    };

    if (user) {
      // Prioritize quizzes matching preferredField, college, or course
      recQuery.where.OR = [
        { topic: { contains: user.preferredField || '', mode: 'insensitive' } },
        { topic: { contains: user.course || '', mode: 'insensitive' } },
        { topic: { contains: user.college || '', mode: 'insensitive' } },
        { tags: { hasSome: [user.preferredField, user.customField].filter(Boolean) } }
      ];
    }

    let recommended = await prisma.quiz.findMany(recQuery);
    
    // Fallback if no personalized matches
    if (recommended.length < 3) {
      recommended = await prisma.quiz.findMany({
        where: { isPublished: true },
        orderBy: { createdAt: "desc" },
        take: 6
      });
    }

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

// -------------------------------
// Host / game session (prototype)
// -------------------------------
app.post("/api/host/start", async (req, res) => {
  console.log("POST /api/host/start - Request received", req.body);
  try {
    const { 
      quizId, 
      topic, 
      difficulty, 
      numQuestions, 
      hostEmail, 
      mode, 
      timerSeconds, 
      timerMode,
      totalSessionTime,
      rated, 
      battleType 
    } = req.body;

    if (!hostEmail) {
      return res.status(400).json({ error: "hostEmail required" });
    }

    const user = await prisma.user.findUnique({ where: { email: hostEmail.toLowerCase().trim() } });
    if (!user) {
      return res.status(400).json({ error: "Host user not found." });
    }

    let finalQuizId = quizId;

    // PATH A: AI Synthesis (On-the-spot)
    if (!quizId && topic) {
      console.log(`[AI-Forge] Synthesizing rapid quiz for: ${topic}`);
      try {
        const questions = await generateQuizQuestions(topic, difficulty || 'medium', numQuestions || 10, user.preferredField || 'General');
        const synthQuiz = await prisma.quiz.create({
          data: {
            title: `Rapid Arena: ${topic}`,
            topic,
            authorId: user.id,
            questions,
            aiGenerated: true,
            difficulty: difficulty || 'medium'
          }
        });
        finalQuizId = synthQuiz.id;
      } catch (aiErr) {
        console.error("AI Generation failed during host setup:", aiErr);
        return res.status(500).json({ error: "Tactical Synthesis Failed. Please try an existing quiz or check your topic." });
      }
    }

    if (!finalQuizId) {
      return res.status(400).json({ error: "Please select a quiz or enter a topic for synthesis." });
    }

    const quiz = await prisma.quiz.findUnique({ where: { id: finalQuizId } });
    if (!quiz) return res.status(404).json({ error: "Quiz not found" });

    let pin;
    let attempts = 0;
    while (attempts < 10) {
      pin = String(Math.floor(100000 + Math.random() * 900000));
      const exists = await prisma.gameSession.findUnique({ where: { pin } });
      if (!exists) break;
      attempts++;
    }

    const finalBattleType = mode === 'battle' ? battleType : null;

    const game = await prisma.gameSession.create({
      data: {
        quizId: quiz.id,
        hostId: user.id,
        mode: mode || "rapid",
        timerSeconds: timerSeconds || 30,
        rated: rated !== false,
        battleType: finalBattleType,
        teamScores: finalBattleType && finalBattleType !== '1v1' ? { 'Team A': 0, 'Team B': 0 } : null,
        pin,
        metadata: {
          timerMode: timerMode || 'per-question',
          totalSessionTime: totalSessionTime || 10,
          playAsHost: req.body.playAsHost !== false,
          pointsPerQ: req.body.pointsPerQ || 100,
          penaltyPoints: req.body.penaltyPoints || 50,
          strictFocus: req.body.strictFocus === true,
          allowBacktrack: req.body.allowBacktrack !== false
        }
      }
    });

    return res.json({
      message: "Arena ready",
      gameId: game.id,
      pin: game.pin,
    });
  } catch (err) {
    console.error("CRITICAL Host start error:", err);
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
          incorrect: 0,
          total: 0,
          accuracy: 0,
          totalTime: 0,
          answers: []
        };
      }
      players[log.playerName].total++;
      if (log.isCorrect) players[log.playerName].correct++;
      else players[log.playerName].incorrect++;
      players[log.playerName].totalTime += log.timeTaken;
      players[log.playerName].answers.push(log);
      players[log.playerName].accuracy = (players[log.playerName].correct / players[log.playerName].total) * 100;

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
      leaderboard: session.metadata?.finalLeaderboard || null,
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
      username: user.username,
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
          const username = await generateUniqueUsername(name || email.split('@')[0]);
          user = await prisma.user.create({
            data: {
              name,
              username,
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
          
          // Backfill unique username for legacy users
          if (!user.username) {
            updateData.username = await generateUniqueUsername(user.name || user.email.split('@')[0]);
          }
          
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
          const username = await generateUniqueUsername(name || email.split('@')[0]);
          user = await prisma.user.create({
            data: {
              name,
              username,
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
          
          // Legacy backfill
          if (!user.username) {
            updateData.username = await generateUniqueUsername(user.name || user.email.split('@')[0]);
          }

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
    `&avatar=${encodeURIComponent(user.avatar || "")}` +
    `&username=${encodeURIComponent(user.username || "")}`;

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
      const metadata = dbSession.metadata || {};
      liveSessions.set(pin, {
        pin, 
        hostSocketId: null, 
        password: dbSession.password || null,
        players: {},
        bannedNames: new Set(),
        bannedIPs: new Set(),
        quiz: dbSession.quiz,
        status: dbSession.status || 'waiting',
        currentQ: 0,
        optionStats: [0, 0, 0, 0],
        timerSeconds: dbSession.timerSeconds || 30,
        timeLeft: dbSession.timerSeconds || 30,
        isPaused: false,
        timerHandle: null,
        countdownHandle: null,
        rated: dbSession.rated !== false,
        pointsPerQ: metadata.pointsPerQ || 100,
        penaltyPoints: metadata.penaltyPoints || 50,
        maxPlayers: metadata.maxPlayers || 200,
        battleType: dbSession.battleType || null,
        teamScores: metadata.teamScores || null,
        teamNames: metadata.teamNames || { 'Team A': 'Team A', 'Team B': 'Team B' },
        examSettings: metadata.examSettings || { 
          strictFocus: true, 
          allowBacktrack: false,
          lockdownMode: false,
          randomizeOrder: false,
          randomizeOptions: false,
          ipLock: false,
          escalationMode: true
        }
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
    .filter(p => session.rated === false || !p.isHost)
    .sort((a, b) => b.score - a.score)
    .map((p, i) => ({ 
      rank: i + 1, 
      name: p.name, 
      score: p.score, 
      streak: p.streak || 0,
      correctCount: p.correctCount || 0,
      incorrectCount: p.incorrectCount || 0,
      attemptedCount: (p.correctCount || 0) + (p.incorrectCount || 0),
      penalties: p.penalties || 0,
      penaltyScore: p.penaltyScore || 0
    }));
}

function broadcastStats(pin, session) {
  const players = Object.values(session.players).filter(p => session.rated === false || !p.isHost);
  const responded = players.filter(p => p.answeredThisQ).length;
  io.in(pin).emit("stats_update", {
    stats: session.optionStats,
    responded,
    total: players.length,
    leaderboard: getLeaderboard(session)
  });
  
  // Asynchronous Navigation: In 'total' (self-paced) mode, we NEVER force global question advancement.
  if (session.timerMode === 'total') return;

  // Synchronized Navigation: Auto-advance if everyone answered the current global question.
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
  
  // If in TOTAL timer mode, we don't use per-question timeouts
  if (session.timerMode === 'total') {
    io.in(pin).emit("timer_tick", { timeLeft: null, mode: 'total' });
    return;
  }

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

function endSessionImmediately(pin, reason) {
  const session = liveSessions.get(pin);
  if (!session) return;
  
  if (session.timerHandle) clearTimeout(session.timerHandle);
  if (session.countdownHandle) clearInterval(session.countdownHandle);
  if (session.globalTimerHandle) clearInterval(session.globalTimerHandle);

  session.status = 'finished';
  
  // Persist final leaderboard
  prisma.gameSession.update({
    where: { pin },
    data: { metadata: { finalLeaderboard: getLeaderboard(session), teamScores: session.teamScores, examSettings: session.examSettings } }
  }).catch(console.error);

  io.in(pin).emit("quiz_finished", { 
    leaderboard: getLeaderboard(session),
    reason: reason || "TIME_EXPIRED",
    teamScores: session.teamScores || null
  });
  
  setTimeout(() => liveSessions.delete(pin), 5 * 60 * 1000);
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

  // Auto-advance delay
  setTimeout(() => {
    session.currentQ++;
    session.optionStats = [0, 0, 0, 0];
    Object.values(session.players).forEach(p => { p.answeredThisQ = false; p.optionIdx = -1; });

    if (session.currentQ >= session.quiz.questions.length) {
      const hasMoreSets = session.quizQueue && session.quizQueue.length > 0;
      
      if (hasMoreSets) {
        session.status = 'set_finished'; // Waiting for host to bridge to next set
        io.in(pin).emit("set_finished", { 
          leaderboard: getLeaderboard(session),
          currentSetIndex: (session.currentSet || 0) + 1,
          setsRemaining: session.quizQueue.length
        });
        return;
      }

      session.status = 'finished';
      
      // Persist final leaderboard and exam settings
      prisma.gameSession.update({
        where: { pin },
        data: { metadata: { finalLeaderboard: getLeaderboard(session), teamScores: session.teamScores, examSettings: session.examSettings } }
      }).catch(console.error);

      RatingEngine.processGameResults(pin, session.players, session.rated !== false);
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
      total: session.quiz.questions.length,
      timerMode: session.timerMode
    });
    
    // Only auto-start countdown if in per-question mode
    if (session.timerMode === 'per-question') {
      startCountdown(pin);
    }
  }, 2500);
}

io.on("connection", (socket) => {
  console.log("Socket connected:", socket.id);

  // --- Global Social & Presence ---
  socket.on("social_connect", async (data) => {
    const { userId } = data;
    if (!userId) return;

    socketToUser.set(socket.id, userId);
    
    if (!globalOnlineUsers.has(userId)) {
      globalOnlineUsers.set(userId, []);
    }
    globalOnlineUsers.get(userId).push(socket.id);

    // Notify friends this user is now online
    const friendships = await prisma.friendship.findMany({
      where: {
        OR: [{ userId }, { friendId: userId }],
        status: "accepted"
      }
    });

    friendships.forEach(f => {
      const friendId = f.userId === userId ? f.friendId : f.userId;
      const friendSockets = globalOnlineUsers.get(friendId);
      if (friendSockets) {
        friendSockets.forEach(sid => {
          io.to(sid).emit("friend_status_change", { userId, status: "online" });
        });
      }
    });
  });

  socket.on("private_message", async (data) => {
    const { receiverId, content, type, metadata } = data;
    const senderId = socketToUser.get(socket.id);
    if (!senderId || !receiverId) return;

    try {
      // Persist to DB
      const msg = await prisma.message.create({
        data: {
          senderId,
          receiverId,
          content,
          type: type || "text",
          metadata: metadata || null
        }
      });

      // Unified Broadcast: Deliver to ALL sockets of both parties
      const recipients = [
        ...(globalOnlineUsers.get(senderId) || []),
        ...(globalOnlineUsers.get(receiverId) || [])
      ];
      
      const uniqueRecipients = [...new Set(recipients)];
      
      uniqueRecipients.forEach(sid => {
        io.to(sid).emit("new_private_message", msg);
      });
      
    } catch (err) {
      console.error("Failed to send private message", err);
    }
  });

  socket.on("friend_request", async (data) => {
    const { senderId, receiverId, senderName } = data;
    if (!senderId || !receiverId) return;

    const receiverSockets = globalOnlineUsers.get(receiverId);
    if (receiverSockets) {
      receiverSockets.forEach(sid => {
        io.to(sid).emit("new_notification", {
          type: "friend_request",
          senderId,
          senderName,
          message: `${senderName} wants to bridge neural links with you.`
        });
      });
    }
  });

  socket.on("disconnect", async () => {
    const userId = socketToUser.get(socket.id);
    if (userId) {
      const userSockets = globalOnlineUsers.get(userId);
      if (userSockets) {
        const index = userSockets.indexOf(socket.id);
        if (index > -1) userSockets.splice(index, 1);
        
        if (userSockets.length === 0) {
          globalOnlineUsers.delete(userId);
          
          // Notify friends this user is now offline
          const friendships = await prisma.friendship.findMany({
            where: {
              OR: [{ userId }, { friendId: userId }],
              status: "accepted"
            }
          });

          friendships.forEach(f => {
            const friendId = f.userId === userId ? f.friendId : f.userId;
            const friendSockets = globalOnlineUsers.get(friendId);
            if (friendSockets) {
              friendSockets.forEach(sid => {
                io.to(sid).emit("friend_status_change", { userId, status: "offline" });
              });
            }
          });
        }
      }
      socketToUser.delete(socket.id);
    }
  });

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
        bannedIPs: new Set(),
        quiz: null,
        status: 'waiting',
        currentQ: 0,
        optionStats: [0, 0, 0, 0],
        timerSeconds: 30,
        timeLeft: 30,
        timerHandle: null,
        countdownHandle: null,
        rated: true,
        pointsPerQ: 100,
        penaltyPoints: 50,
        maxPlayers: 200,
        battleType: null,
        teamScores: null,
        examSettings: { 
          strictFocus: true, 
          allowBacktrack: false,
          lockdownMode: false,
          randomizeOrder: false,
          randomizeOptions: false,
          ipLock: false,
          escalationMode: true
        },
        teamNames: { 'Team A': 'Team A', 'Team B': 'Team B' }
      });
      session = liveSessions.get(pin);
    } else {
      session.hostSocketId = socket.id;
      if (password) session.password = password;
    }

    socket.join(pin);

      // Stability: If host is already in players (reconnection), remove old socket entry
      Object.entries(session.players).forEach(([sid, p]) => {
        if (p.isHost || (data.userId && p.userId === data.userId)) {
          delete session.players[sid];
        }
      });

      session.players[socket.id] = { 
        name: data.name || "Host", // Use host's real name if provided
        userId: data.userId || null,
        avatar: data.avatar || null, // Persist host avatar
        team: null,
        slotIndex: null,
        score: 0, 
        answeredThisQ: false, 
        optionIdx: -1, 
        isHost: true, 
        streak: 0,
        correctCount: 0,
        incorrectCount: 0,
        latency: 0,
        penalties: 0,
        penaltyScore: 0,
        strikeCount: 0
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
    if (session.bannedNames.has(name.toLowerCase()) || session.bannedIPs.has(socket.handshake.address)) { 
      socket.emit("join_error", { message: "You are banned from this room." }); 
      return; 
    }
    if (session.status === 'running') { socket.emit("join_error", { message: "Game already started. Wait for next session." }); return; }
    if (session.status === 'finished') { socket.emit("join_error", { message: "This session has ended." }); return; }
    if (Object.keys(session.players).length >= (session.maxPlayers || 200)) { socket.emit("join_error", { message: "Room is full." }); return; }
    
    // Per user request: Names can be duplicate, but we handle same userId as reconnection
    let existingStats = {};
    if (data.userId) {
      const oldSocketId = Object.keys(session.players).find(sid => session.players[sid].userId === data.userId);
      if (oldSocketId) {
        existingStats = { ...session.players[oldSocketId] };
        delete session.players[oldSocketId];
        console.log(`Reconnecting player ${name} (userId: ${data.userId})`);
      }
    }

    socket.join(pin);
    session.players[socket.id] = { 
      name, 
      userId: data.userId || null,
      email: data.email || null,
      avatar: data.avatar || null, // Persist player avatar
      team: data.team || existingStats.team || null, 
      slotIndex: data.slotIndex !== undefined ? data.slotIndex : existingStats.slotIndex,
      score: existingStats.score || 0, 
      streak: existingStats.streak || 0,
      correctCount: existingStats.correctCount || 0,
      incorrectCount: existingStats.incorrectCount || 0,
      answeredThisQ: false, 
      optionIdx: -1, 
      isHost: false, 
      ip: socket.handshake.address,
      isSuspicious: false,
      idleTimeout: null,
      penalties: existingStats.penalties || 0,
      penaltyScore: existingStats.penaltyScore || 0,
      strikeCount: existingStats.strikeCount || 0
    };
    socket.emit("join_success", { pin, name });
    
    // Auto-assign slot for Grand Arena (Standard/Rapid)
    if (!session.battleType || session.battleType === 'Standard' || session.battleType === 'rapid') {
      const takenSlots = Object.values(session.players)
        .filter(p => p.slotIndex !== undefined && p.slotIndex !== null)
        .map(p => Number(p.slotIndex));
      let nextSlot = 0;
      while (takenSlots.includes(nextSlot)) nextSlot++;
      session.players[socket.id].team = 'Team A';
      session.players[socket.id].slotIndex = nextSlot;
    }
    
    // Check if slot specifically requested (overrides auto-assign if provided)
    if (data.team && data.slotIndex !== undefined) {
      session.players[socket.id].team = data.team;
      session.players[socket.id].slotIndex = data.slotIndex;
    }

    broadcastPlayerList(pin, session);
    console.log(`${name} joined room ${pin}`);
  });

  socket.on("start_game", async (data) => {
    const pin = typeof data === 'string' ? data : data.pin;
    const session = liveSessions.get(pin);
    if (!session || session.hostSocketId !== socket.id) return;
    if (session.status !== 'waiting') { socket.emit("error_msg", { message: "Game already started." }); return; }
    
    // Friendly Participation: Count host as player if Friendly session
    const playersAsParticipants = Object.values(session.players);
    const playerCount = playersAsParticipants.filter(p => !p.isHost).length;
    
    if (playerCount === 0 && !session.players[socket.id].isHost) { 
      socket.emit("error_msg", { message: "Need at least 1 player to start." }); 
      return; 
    }

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
      
      // Load Advanced Metadata
      const meta = dbSession.metadata || {};
      session.timerMode = meta.timerMode || 'per-question';
      session.totalSessionTime = meta.totalSessionTime || 10;
      session.sessionTimeLeft = session.totalSessionTime * 60;

      // Shuffling
      if (session.examSettings.randomizeOrder) {
        session.quiz.questions.sort(() => Math.random() - 0.5);
      }
      if (session.examSettings.randomizeOptions) {
        session.quiz.questions.forEach(q => {
          const correct = q.options[q.correctIndex];
          q.options.sort(() => Math.random() - 0.5);
          q.correctIndex = q.options.indexOf(correct);
        });
      }

      session.status = 'running';
      session.currentQ = 0;
      
      const questionsForAll = (session.quiz.questions || []).map(q => ({
        question: q.question,
        options: q.options
      }));

      io.in(pin).emit("game_started", {
        quiz: { 
          id: session.quiz.id, 
          title: session.quiz.title, 
          questions: questionsForAll, 
          totalQuestions: (session.quiz.questions || []).length 
        },
        timerSeconds: session.timerSeconds,
        timerMode: session.timerMode,
        totalSessionTime: session.totalSessionTime,
        rated: session.rated,
        examSettings: session.examSettings
      });

      // Global Session Timer (Fixed termination)
      if (session.timerMode === 'total') {
        session.globalTimerHandle = setInterval(() => {
          if (!liveSessions.has(pin)) { clearInterval(session.globalTimerHandle); return; }
          session.sessionTimeLeft--;
          io.in(pin).emit("global_timer_tick", { timeLeft: session.sessionTimeLeft });
          
          if (session.sessionTimeLeft <= 0) {
            clearInterval(session.globalTimerHandle);
            endSessionImmediately(pin, "SESSION_TIME_EXPIRED");
          }
        }, 1000);
      }

      startCountdown(pin);
    } catch (err) {
      console.error("start_game error:", err);
      socket.emit("error_msg", { message: "Failed to initialize arena." });
    }
  });

  socket.on("submit_answer", (data) => {
    const { pin, optionIdx, timeTaken, questionIndex } = data;
    const session = liveSessions.get(pin);
    if (!session || session.status !== 'running') return;
    const player = session.players[socket.id];
    if (!player) return;
    
    const qIndex = questionIndex !== undefined ? questionIndex : session.currentQ;
    const q = session.quiz.questions[qIndex];
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
      
      const basePoints = session.pointsPerQ || 100;
      const points = basePoints + speedBonus + streakBonus;
      
      player.score += points;

      // Update Team Score if in a team battle
      if (player.team && session.teamScores) {
        session.teamScores[player.team] += points;
      }
      player.correctCount = (player.correctCount || 0) + 1;
    } else {
      player.streak = 0;
      player.incorrectCount = (player.incorrectCount || 0) + 1;
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
    
    // In 'total' mode, players navigate independently. 
    // Global skips would teleport all players, which is a logic violation.
    if (session.timerMode === 'total') {
      socket.emit("error_msg", { message: "Global skips are disabled in Self-Paced (Exam) mode." });
      return;
    }

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
    broadcastPlayerList(pin, session);
  });

  // Helper to safely broadcast player lists
  function broadcastPlayerList(pin, session) {
    if (!session) return;
    
    const publicPlayers = {};
    const hostPlayers = {};
    
    // Detect IP groups (multiple users on same IP)
    const ipGroups = {};
    Object.values(session.players).forEach(p => {
      if (p.ip && !p.isHost) {
        ipGroups[p.ip] = (ipGroups[p.ip] || 0) + 1;
      }
    });

    Object.entries(session.players).forEach(([sid, p]) => {
      const isDuplicateIp = p.ip && ipGroups[p.ip] > 1;
      
      publicPlayers[sid] = { ...p, isSuspicious: p.isSuspicious || isDuplicateIp };
      delete publicPlayers[sid].ip; 
      
      hostPlayers[sid] = { ...p, isSuspicious: p.isSuspicious || isDuplicateIp, ipMatch: isDuplicateIp }; 
    });
    
    // Broadcast public list to room
    io.in(pin).emit("player_list_update", { players: publicPlayers, teamNames: session.teamNames || { 'Team A': 'Team A', 'Team B': 'Team B'} });
    
    // Send privileged list to Host
    if (session.hostSocketId && io.sockets.sockets.get(session.hostSocketId)) {
      io.to(session.hostSocketId).emit("host_player_list_update", { players: hostPlayers });
    }
  }

  socket.on("host_ban", (data) => {
    const { pin, playerId, name, ip } = data;
    const session = liveSessions.get(pin);
    if (!session || session.hostSocketId !== socket.id) return;
    if (name) session.bannedNames.add(name.toLowerCase());
    if (ip) session.bannedIPs.add(ip);
    
    const target = io.sockets.sockets.get(playerId);
    if (target) { target.emit("kicked", { message: "You are permanently banned from this room." }); target.leave(pin); }
    delete session.players[playerId];
    broadcastPlayerList(pin, session);
  });

  socket.on("lobby_chat_message", (data) => {
    const { pin, message } = data;
    const session = liveSessions.get(pin);
    if (!session) return;
    const player = session.players[socket.id];
    if (!player) return; // Only joined players can chat
    io.in(pin).emit("new_lobby_chat_message", { 
      id: Date.now().toString(),
      sender: player.name, 
      message, 
      isHost: player.isHost,
      avatar: player.avatar
    });
  });

  socket.on("host_update_settings", (data) => {
    const { pin, settings } = data;
    const session = liveSessions.get(pin);
    if (!session || session.hostSocketId !== socket.id) return;
    
    session.examSettings = { ...session.examSettings, ...settings };
    if (settings.pointsPerQ) session.pointsPerQ = settings.pointsPerQ;
    if (settings.penaltyPoints) session.penaltyPoints = settings.penaltyPoints;
    if (settings.maxPlayers) session.maxPlayers = settings.maxPlayers;

    io.in(pin).emit("broadcast_message", { message: "Host updated arena configuration parameters.", type: "info" });
  });

  socket.on("host_reduce_score", (data) => {
    const { pin, playerId, amount } = data;
    const session = liveSessions.get(pin);
    if (!session || session.hostSocketId !== socket.id) return;

    const player = session.players[playerId];
    if (player) {
      player.score -= amount;
      socket.to(playerId).emit("error_msg", { message: `ADMIN ACTION: Your score was reduced by ${amount} points for arena violations.` });
      broadcastPlayerList(pin, session);
      broadcastStats(pin, session);
    }
  });

  socket.on("host_broadcast_to_player", (data) => {
    const { pin, playerId, message, type } = data;
    const session = liveSessions.get(pin);
    if (!session || session.hostSocketId !== socket.id) return;
    
    socket.to(playerId).emit("broadcast_message", { message, type });
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

  socket.on("host_start_next_set", async (pin) => {
    const session = liveSessions.get(pin);
    if (!session || session.hostSocketId !== socket.id) return;
    if (session.status !== 'set_finished') return;
    if (!session.quizQueue || session.quizQueue.length === 0) return;

    try {
      const nextQuizId = session.quizQueue.shift();
      const nextQuiz = await prisma.quiz.findUnique({ where: { id: nextQuizId } });
      if (!nextQuiz) throw new Error("Next quiz in queue is missing.");

      session.quiz = nextQuiz;
      session.currentQ = 0;
      session.status = 'running';
      session.currentSet = (session.currentSet || 0) + 1;

      const questionsForAll = (session.quiz.questions || []).map(q => ({
        question: q.question,
        options: q.options
      }));

      io.in(pin).emit("next_set_started", {
        quiz: { 
          id: session.quiz.id, 
          title: session.quiz.title, 
          questions: questionsForAll, 
          totalQuestions: (session.quiz.questions || []).length 
        },
        currentSet: session.currentSet
      });

      startCountdown(pin);
    } catch (err) {
      console.error("Set transition error:", err);
      socket.emit("error_msg", { message: "Failed to bridge to the next arena." });
    }
  });

  socket.on("host_broadcast", (data) => {
    const { pin, message, type } = data;
    const session = liveSessions.get(pin);
    if (!session || session.hostSocketId !== socket.id) return;
    io.in(pin).emit("broadcast_message", { message, type: type || 'info' });
  });

  socket.on("join_team_slot", (data) => {
    const { pin, team, slotIndex } = data;
    const session = liveSessions.get(pin);
    if (!session || session.status !== 'waiting') return;

    const player = session.players[socket.id];
    if (!player) return;

    // Enforce massive 200-player matrix or team-based constraints
    const maxSlots = { '1v1': 1, '2v2': 2, '3v3': 3, '4v4': 4, 'Standard': 200 }[session.battleType || 'Standard'] || 200;
    if (slotIndex >= maxSlots) {
      socket.emit("error_msg", { message: `This arena only supports ${session.battleType || 'Standard'} formatting (${maxSlots} slots).` });
      return;
    }

    // Check if slot taken (check all players including host)
    const slotTaken = Object.values(session.players).some(p => p.team === team && Number(p.slotIndex) === Number(slotIndex));
    if (slotTaken) {
      socket.emit("error_msg", { message: "This slot is already occupied." });
      return;
    }

    player.team = team;
    player.slotIndex = slotIndex;
    broadcastPlayerList(pin, session);
  });

  socket.on("host_move_player", (data) => {
    const { pin, playerId, newTeam, newSlotIndex } = data;
    const session = liveSessions.get(pin);
    if (!session || session.hostSocketId !== socket.id) return;

    const player = session.players[playerId];
    if (!player) return;

    // Check if new slot taken
    const slotTaken = Object.values(session.players).some(p => p.team === newTeam && Number(p.slotIndex) === Number(newSlotIndex));
    if (slotTaken) {
      socket.emit("error_msg", { message: "Target slot is already occupied." });
      return;
    }

    player.team = newTeam;
    player.slotIndex = newSlotIndex;
    broadcastPlayerList(pin, session);
  });

  socket.on("host_edit_team_name", (data) => {
    const { pin, teamKey, newName } = data; // teamKey: 'Team A' or 'Team B'
    const session = liveSessions.get(pin);
    if (!session || session.hostSocketId !== socket.id) return;

    if (!session.teamNames) session.teamNames = { 'Team A': 'Team A', 'Team B': 'Team B' };
    session.teamNames[teamKey] = newName;
    broadcastPlayerList(pin, session);
  });

  socket.on("anti_cheat_violation", (data) => {
    const { pin, type } = data;
    const session = liveSessions.get(pin);
    if (!session || session.status !== 'running') return;
    
    const player = session.players[socket.id];
    if (!player) return;

    if (type === 'tab_switch') {
      const strikeCount = (player.strikeCount || 0) + 1;
      player.strikeCount = strikeCount;
      const escalationMode = session.examSettings?.escalationMode;

      if (escalationMode) {
        if (strikeCount === 1) {
          // Warning
          socket.emit("error_msg", { message: "⚠️ ESCALATION WARNING: Illegal tab switch detected. This is your only warning." });
        } else if (strikeCount === 2) {
          // Penalty
          const penalty = session.penaltyPoints || 50;
          player.score -= penalty;
          player.penalties = (player.penalties || 0) + 1;
          player.penaltyScore = (player.penaltyScore || 0) + penalty;
          socket.emit("error_msg", { message: `🚫 ESCALATION PENALTY: Strike 2! -${penalty} points deducted.` });
        } else {
          // Disqualification
          socket.emit("kicked", { message: "🛑 DISQUALIFIED: Strike 3! You have been removed for multiple integrity violations." });
          if (session.hostSocketId) {
             io.to(session.hostSocketId).emit("broadcast_message", { 
               message: `TERMINATED: ${player.name} disqualified for anti-cheat strikes.`, 
               type: 'error' 
             });
          }
          delete session.players[socket.id];
          socket.leave(pin);
          broadcastPlayerList(pin, session);
          return;
        }
      } else {
        // Standard Penalty Mode
        const penalty = session.penaltyPoints || 50;
        player.score -= penalty;
        player.penalties = (player.penalties || 0) + 1;
        player.penaltyScore = (player.penaltyScore || 0) + penalty;
        socket.emit("error_msg", { message: `WARNING: Tab switch detected! -${penalty} points penalty applied.` });
      }
      
      // Update global host feed
      if (session.hostSocketId) {
        io.to(session.hostSocketId).emit("broadcast_message", { 
          message: `${player.name} focus loss detected (Strike ${strikeCount}).`, 
          type: 'warning' 
        });
      }
      
      // Update global stats
      broadcastStats(pin, session);
    }
  });

  socket.on("disconnect", () => {
    liveSessions.forEach((session, pin) => {
      if (!session.players[socket.id]) return;
      const player = session.players[socket.id];
      const wasActiveHost = (socket.id === session.hostSocketId);
      const playerName = player.name;
      
      delete session.players[socket.id];
      
      if (player.isHost) {
        // If the socket that disconnected was the CURRENT active host socket, end session
        if (wasActiveHost) {
          if (session.timerHandle) clearTimeout(session.timerHandle);
          if (session.countdownHandle) clearInterval(session.countdownHandle);
          io.in(pin).emit("host_left", { message: "Host disconnected. Session ended." });
          liveSessions.delete(pin);
          console.log(`Active Host disconnected, ending room ${pin}`);
        } else {
          console.log(`Inactive/Dangling Host socket ${socket.id} disconnected, PIN ${pin} remains.`);
        }
      } else {
        broadcastPlayerList(pin, session);
        io.in(pin).emit("player_left", { name: playerName });
      }
    });
    console.log("Socket disconnected:", socket.id);
  });
});

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
