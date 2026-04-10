// server.js — cleaned & commented (small, human-friendly comments)
require("dotenv").config();
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});
app.use(cors({ origin: process.env.FRONTEND_URL || '*' }));
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const FacebookStrategy = require("passport-facebook").Strategy;

// Models
const User = require("./models/user");
const Quiz = require("./models/Quiz");
const RatingHistory = require("./models/RatingHistory");
const GameSession = require("./models/GameSession");

// Routes
const aiQuizRoutes = require("./routes/aiQuiz");

// Basic middleware
const allowedOrigins = [
  process.env.FRONTEND_URL,          // e.g. https://your-frontend.vercel.app
  "http://127.0.0.1:5500",     // local live server
  "http://127.0.0.1:5501",
  "http://127.0.0.1:3000",
  "http://localhost:5500",
  "http://localhost:5501",
  "http://localhost:3000",
  "https://samarpan-quiz.vercel.app",       
  "https://samarpan-9rt8.onrender.com"    
];

app.use(cors({ origin: '*', credentials: true }));

app.use(express.json());
app.use(passport.initialize());

// ---------- MongoDB ----------
async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("MongoDB connected");
  } catch (err) {
    console.error("MongoDB connection error:", err.message);
    process.exit(1);
  }
}
connectDB();

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
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: "All fields required" });
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
    });

    const token = createJwtForUser(user);

    return res.json({
      message: "Signup successful",
      userId: user._id,
      name: user.name,
      email: user.email,
      globalRating: user.globalRating,
      ratings: user.ratings,
      xp: user.xp,
      token,
    });
  } catch (err) {
    console.error("Signup error:", err);
    return res.status(500).json({ error: "Signup failed" });
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
    console.log("Generating PIN...");
    do {
      pin = String(Math.floor(100000 + Math.random() * 900000));
      const exists = await GameSession.findOne({ pin });
      if (!exists) break;
      attempts++;
    } while (attempts < 5);

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
// Rating history by email
// -------------------------------
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
// AI quiz routes (mounted)
// -------------------------------
app.use("/api/ai", aiQuizRoutes);

// -------------------------------
// Start server
// ---------- Socket.io Logic ----------
const liveSessions = new Map(); // pin -> { players: {socketId: {name, score}}, currentQuestion: 0 }

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  // Join a game room using PIN
  socket.on("join_room", (data) => {
    const { pin, name } = data;
    socket.join(pin);
    console.log(`User ${name} (ID: ${socket.id}) joined room: ${pin}`);

    // Track session metadata
    if (!liveSessions.has(pin)) {
      liveSessions.set(pin, { 
        players: {}, 
        currentQuestion: 0, 
        leaderboardVisible: false,
        bannedUsers: new Set(),
        optionStats: [0, 0, 0, 0] // Count per option index
      });
    }
    const session = liveSessions.get(pin);
    
    // Check if banned (checking by a unique name/id combination if needed, but socket.id is temporary)
    // For a better ban, we'd use user identity if available.
    if (session.bannedUsers.has(name)) { // Using name as a simple unique identifier in this context
      socket.emit("kicked", { message: "You are permanently banned from this room." });
      socket.disconnect();
      return;
    }

    session.players[socket.id] = { name, score: 0, currentAnswer: -1 };
    
    // Notify room that someone joined
    io.in(pin).emit("user_joined", { name, id: socket.id, players: session.players });
    
    // If game already started, send current state to new joiner
    if (session.currentQuestion > 0) {
      socket.emit("sync_state", { index: session.currentQuestion });
    }
  });

  // Host starts the game
  socket.on("start_game", (pin) => {
    console.log(`Starting game for room: ${pin}`);
    const session = liveSessions.get(pin);
    if (session) session.currentQuestion = 0; // reset
    io.in(pin).emit("game_started");
  });

  // Host: Ban player
  socket.on("host_ban", (data) => {
    const { pin, playerId, name } = data;
    console.log(`Host banning user ${name} (${playerId}) from room ${pin}`);
    const session = liveSessions.get(pin);
    if (session) {
      session.bannedUsers.add(name);
      const playerSocket = io.sockets.sockets.get(playerId);
      if (playerSocket) {
        playerSocket.emit("kicked", { message: "You have been banned from this room." });
        playerSocket.disconnect();
      }
      delete session.players[playerId];
      io.in(pin).emit("player_list_update", { players: session.players });
    }
  });

  // Host: Next Question
  socket.on("host_next", (pin) => {
    const session = liveSessions.get(pin);
    if (session) {
      session.currentQuestion++;
      session.optionStats = [0, 0, 0, 0]; // Reset stats for new question
      io.in(pin).emit("next_question", { index: session.currentQuestion });
    }
  });

  // Host: Toggle Leaderboard
  socket.on("host_leaderboard", (data) => {
    const { pin, visible } = data;
    const session = liveSessions.get(pin);
    if (session) {
      session.leaderboardVisible = visible;
      io.in(pin).emit("sync_leaderboard", { 
        visible, 
        leaderboard: Object.values(session.players).sort((a,b) => b.score - a.score) 
      });
    }
  });

  // Player: Submit Answer
  socket.on("submit_answer", (data) => {
    const { pin, isCorrect, timeTaken, optionIdx } = data;
    const session = liveSessions.get(pin);
    if (session && session.players[socket.id]) {
      const player = session.players[socket.id];
      
      // Handle re-selection: decrement old, increment new
      if (player.currentAnswer !== -1 && session.optionStats[player.currentAnswer] > 0) {
         session.optionStats[player.currentAnswer]--;
      }
      player.currentAnswer = optionIdx;
      if (optionIdx !== -1) {
         session.optionStats[optionIdx]++;
      }

      if (isCorrect) {
        // Base 100 points + speed bonus (max 100)
        const points = 100 + Math.max(0, Math.floor(100 - (timeTaken * 2)));
        player.score += points;
      }
      
      // Update Host with new tallies
      io.in(pin).emit("stats_update", { stats: session.optionStats });
    }
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
    // Cleanup if host or handle player removal?
    // For now, let's keep it simple.
  });
});

// ---------- Start server ----------
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
