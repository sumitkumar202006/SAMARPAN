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

const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const FacebookStrategy = require("passport-facebook").Strategy;

// Models
const User = require("./models/User");
const Quiz = require("./models/Quiz");
const RatingHistory = require("./models/RatingHistory");
const GameSession = require("./models/GameSession");

// Routes
const aiQuizRoutes = require("./routes/aiQuiz");

// Basic middleware
console.log("Registering global middleware...");
app.use(cors({ 
  origin: "*", 
  credentials: true 
}));

app.use(express.json());
app.use(passport.initialize());
console.log("Passport initialized.");

// ---------- MongoDB ----------
async function connectDB() {
  console.log("Attempting to connect to MongoDB...");
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000, 
    });
    console.log("✅ MongoDB connected successfully");
    return true;
  } catch (err) {
    console.error("❌ MongoDB connection error:", err.message);
    console.error("Please check if your IP is whitelisted on MongoDB Atlas.");
    return false;
  }
}
// Moved call to start sequence

// ---------- Helpers ----------
function createJwtForUser(user) {
  return jwt.sign(
    {
      userId: user._id,
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

    const exists = await User.findOne({ email });
    if (exists) {
      return res.status(400).json({ error: "Email already registered" });
    }

    const hash = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      passwordHash: hash,
      provider: "local",
      college,
      course,
      dob
    });

    const token = createJwtForUser(user);

    return res.json({
      message: "Signup successful",
      user: {
        userId: user._id,
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
    const user = await User.findOne({ email });
    if (!user || !user.passwordHash) {
      return res.status(400).json({ error: "User not found" });
    }

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(400).json({ error: "Invalid password" });

    const token = createJwtForUser(user);

    return res.json({
      message: "Login successful",
      userId: user._id,
      name: user.name,
      email: user.email,
      globalRating: user.globalRating,
      ratings: user.ratings,
      xp: user.xp,
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

    // If caller passed an email instead of ObjectId, resolve it to the user's _id
    if (typeof authorId === "string" && authorId.includes("@")) {
      const user = await User.findOne({ email: authorId });
      if (!user) {
        return res
          .status(400)
          .json({ error: "User not found for this authorId" });
      }
      resolvedAuthorId = user._id;
    }

    const quiz = await Quiz.create({
      title,
      topic: topic || "",
      author: resolvedAuthorId,
      questions,
      aiGenerated: !!aiGenerated,
      tags: tags || (topic ? [topic.toLowerCase()] : []),
    });

    return res.json({ message: "Quiz created", quizId: quiz._id, quiz });
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
    const user = await User.findOne({ email: req.params.email });
    if (!user) return res.status(404).json({ error: "User not found" });
    const quizzes = await Quiz.find({ author: user._id }).sort({ createdAt: -1 });
    return res.json({ quizzes });
  } catch (err) {
    return res.status(500).json({ error: "Failed to fetch user quizzes" });
  }
});

// Get public/trending quizzes for Explore
app.get("/api/quizzes/public", async (req, res) => {
  try {
    // Return all quizzes for now, in a real app we'd filter for public or trending
    const quizzes = await Quiz.find({}).limit(20).sort({ createdAt: -1 });
    return res.json({ quizzes });
  } catch (err) {
    return res.status(500).json({ error: "Failed to fetch public quizzes" });
  }
});

// Get individual quiz by ID
app.get("/api/quizzes/:id", async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id);
    if (!quiz) return res.status(404).json({ error: "Quiz not found" });
    return res.json(quiz);
  } catch (err) {
    console.error("Fetch quiz by ID error:", err);
    return res.status(500).json({ error: "Failed to fetch quiz" });
  }
});

// -------------------------------
// Host / game session (prototype)
// -------------------------------
app.post("/api/host/start", async (req, res) => {
  console.log("POST /api/host/start - Request received", req.body);
  try {
    const { quizId, hostEmail, mode, timerSeconds, rated } = req.body;

    if (!quizId || !hostEmail) {
      return res.status(400).json({ error: "quizId and hostEmail required" });
    }

    // Validate that quizId is a valid MongoDB ObjectId to avoid CastError
    if (!mongoose.Types.ObjectId.isValid(quizId)) {
      console.warn("Invalid Quiz ID attempted for hosting:", quizId);
      return res.status(400).json({ 
        error: "Invalid Quiz ID. If you created this quiz manually, please ensure you have 'Saved' it to your account first." 
      });
    }

    console.log("Looking for host user:", hostEmail);
    const user = await User.findOne({ email: hostEmail });
    if (!user) {
      console.warn("Host user not found:", hostEmail);
      return res.status(400).json({ error: "Host user not found" });
    }

    console.log("Looking for quiz:", quizId);
    const quiz = await Quiz.findById(quizId);
    if (!quiz) {
      console.warn("Quiz not found:", quizId);
      return res.status(404).json({ error: "Quiz not found" });
    }

    // Try to create a unique 6-digit PIN
    let pin;
    let attempts = 0;
    let pinFound = false;
    console.log("Generating unique PIN...");
    while (attempts < 10) {
      pin = String(Math.floor(100000 + Math.random() * 900000));
      const exists = await GameSession.findOne({ pin });
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
    const game = await GameSession.create({
      quiz: quiz._id,
      host: user._id,
      mode: mode || "rapid",
      timerSeconds: timerSeconds || 30,
      rated: rated !== false,
      pin,
    });

    console.log("Game Session created successfully:", game._id);
    return res.json({
      message: "Game session created",
      gameId: game._id,
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

// Added explicit game start endpoint for robustness if needed, 
// but primarily we use socket start_game.
app.get("/api/host/session/:pin", async (req, res) => {
  try {
    const game = await GameSession.findOne({ pin: req.params.pin }).populate("quiz");
    if (!game) return res.status(404).json({ error: "Session not found" });
    return res.json(game);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// -------------------------------
// Public leaderboard (top 50)
// -------------------------------
app.get("/leaderboard", async (_req, res) => {
  try {
    const users = await User.find({})
      .sort({ globalRating: -1 })
      .limit(50)
      .select("name globalRating xp");

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
    const user = await User.findOne({ email: req.params.email });
    if (!user) return res.status(404).json({ error: "User not found" });
    
    const quizzesCount = await Quiz.countDocuments({ author: user._id });
    
    return res.json({
      name: user.name,
      email: user.email,
      globalRating: user.globalRating,
      ratings: user.ratings,
      xp: user.xp,
      quizzesCount,
      avatar: user.avatar
    });
  } catch (err) {
    return res.status(500).json({ error: "Failed to load profile" });
  }
});

// Rating history by email
app.get("/ratings/:email", async (req, res) => {
  try {
    const email = req.params.email;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ error: "User not found" });

    const history = await RatingHistory.find({ user: user._id })
      .sort({ createdAt: -1 })
      .lean();

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

        let user = await User.findOne({ email });
        if (!user) {
          user = await User.create({
            name,
            email,
            avatar,
            provider: "google",
            googleId: profile.id,
          });
        } else {
          // update missing pieces, keep it idempotent
          let changed = false;
          if (!user.provider) {
            user.provider = "google";
            changed = true;
          }
          if (!user.googleId) {
            user.googleId = profile.id;
            changed = true;
          }
          if (!user.avatar && avatar) {
            user.avatar = avatar;
            changed = true;
          }
          if (changed) await user.save();
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

        let user = await User.findOne({ email });
        if (!user) {
          user = await User.create({
            name,
            email,
            avatar,
            provider: "facebook",
            facebookId: profile.id,
          });
        } else {
          let changed = false;
          if (!user.provider) {
            user.provider = "facebook";
            changed = true;
          }
          if (!user.facebookId) {
            user.facebookId = profile.id;
            changed = true;
          }
          if (!user.avatar && avatar) {
            user.avatar = avatar;
            changed = true;
          }
          if (changed) await user.save();
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
    const session = await GameSession.findOne({ pin: req.params.pin })
      .populate("quiz")
      .lean();
    if (!session) return res.status(404).json({ error: "Session not found" });
    return res.json(session);
  } catch (err) {
    console.error("Session fetch error:", err);
    return res.status(500).json({ error: "Failed to fetch session" });
  }
});

// -------------------------------
// AI quiz routes (mounted)
// -------------------------------
app.use("/api/ai", aiQuizRoutes);

// -------------------------------
// Start server
// ============================================================
// SOCKET.IO — Multiplayer Quiz Engine
// ============================================================

const liveSessions = new Map();

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
      io.in(pin).emit("quiz_finished", { leaderboard: getLeaderboard(session) });
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

  socket.on("host_join", (data) => {
    const { pin, password } = data;
    liveSessions.set(pin, {
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
      countdownHandle: null
    });
    socket.join(pin);
    const session = liveSessions.get(pin);
    session.players[socket.id] = { name: "Host", score: 0, answeredThisQ: true, optionIdx: -1, isHost: true, streak: 0 };
    socket.emit("host_ready", { pin });
    console.log(`Host created room ${pin}`);
  });

  socket.on("join_room", (data) => {
    const { pin, name, password } = data;
    if (!pin || !name) { socket.emit("join_error", { message: "PIN and name required." }); return; }
    if (!liveSessions.has(pin)) { socket.emit("join_error", { message: "Room not found. Check the PIN." }); return; }
    const session = liveSessions.get(pin);
    if (session.password && session.password !== password) { socket.emit("join_error", { message: "Wrong room password." }); return; }
    if (session.bannedNames.has(name.toLowerCase())) { socket.emit("join_error", { message: "You are banned from this room." }); return; }
    if (session.status === 'running') { socket.emit("join_error", { message: "Game already started. Wait for next session." }); return; }
    if (session.status === 'finished') { socket.emit("join_error", { message: "This session has ended." }); return; }
    const nameTaken = Object.values(session.players).some(p => p.name.toLowerCase() === name.toLowerCase() && !p.isHost);
    if (nameTaken) { socket.emit("join_error", { message: "Name already taken. Choose another." }); return; }
    socket.join(pin);
    session.players[socket.id] = { name, score: 0, answeredThisQ: false, optionIdx: -1, isHost: false, streak: 0 };
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
      const dbSession = await GameSession.findOne({ pin }).populate("quiz").lean();
      if (!dbSession || !dbSession.quiz) { socket.emit("error_msg", { message: "Quiz not found in database." }); return; }
      session.quiz = dbSession.quiz;
      session.timerSeconds = dbSession.timerSeconds || 30;
      session.status = 'running';
      session.currentQ = 0;
      const questionsForAll = session.quiz.questions.map(q => ({
        question: q.question,
        options: q.options
      }));
      io.in(pin).emit("game_started", {
        quiz: { _id: session.quiz._id, title: session.quiz.title, topic: session.quiz.topic, questions: questionsForAll, totalQuestions: session.quiz.questions.length },
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
    if (optionIdx === q.correctIndex) {
      const t = Math.min(timeTaken || session.timerSeconds, session.timerSeconds);
      const speedBonus = Math.max(0, Math.floor(50 * (1 - t / session.timerSeconds)));
      player.streak = (player.streak || 0) + 1;
      const streakBonus = Math.min(player.streak - 1, 5) * 10;
      player.score += 100 + speedBonus + streakBonus;
    } else {
      player.streak = 0;
    }
    broadcastStats(pin, session);
    socket.emit("answer_confirmed", { optionIdx, isCorrect: optionIdx === q.correctIndex });
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
async function startServer() {
  const dbConnected = await connectDB();
  
  // Even if DB fails, we might want to start server for health checks, 
  // but let's be strict for now to debug the hang.
  if (!dbConnected) {
    console.error("🛑 Not starting server due to DB connection failure.");
    // Wait a bit and try again or exit
    return;
  }

  const PORT = process.env.PORT || 5000;
  console.log(`Starting server on port ${PORT}...`);
  server.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
  });
}

startServer();
