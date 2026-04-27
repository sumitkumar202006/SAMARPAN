const express  = require('express');
const router   = express.Router();
const bcrypt   = require('bcrypt');
const jwt      = require('jsonwebtoken');
const prisma   = require('../services/db');
const { mapId } = require('../services/compatibility');
const { sendOTPEmail } = require('../services/emailService');
const { checkBruteForce, recordFailedLogin, clearFailedLogins } = require('../middleware/security');

// Helper: Create JWT
function createJwtForUser(user) {
  return jwt.sign(
    {
      userId: user.id,
      email: user.email,
      name: user.name,
      username: user.username
    },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
}

// 1. Check Username Availability
router.get('/check-username', async (req, res) => {
  const { username } = req.query;
  if (!username) return res.status(400).json({ error: 'Username required' });
  
  const user = await prisma.user.findUnique({ where: { username: username.toLowerCase() } });
  res.json({ available: !user });
});

// 2. Check Email Availability
router.get('/check-email', async (req, res) => {
  const { email } = req.query;
  if (!email) return res.status(400).json({ error: 'Email required' });
  
  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  res.json({ available: !user });
});

// 3. Signup
router.post('/signup', async (req, res) => {
  try {
    const { name, username, email, password, college, course, dob, preferredField, avatar } = req.body;

    if (!name || !username || !email || !password) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Username validation: lowercase, alphanumeric, no special chars
    const usernameRegex = /^[a-z0-9]+$/;
    if (!usernameRegex.test(username)) {
      return res.status(400).json({ error: "Username must be lowercase alphanumeric only" });
    }

    // Password validation: 6-8 chars, 1+ special char, 1+ number
    const passwordRegex = /^(?=.*[0-9])(?=.*[!@#$%^&*])[a-zA-Z0-9!@#$%^&*]{6,20}$/; 
    // Allowing more than 8 if they want, but the user said 6-8. 
    // Let's stick closer to user request but maybe be a bit flexible if they want longer.
    // User said: "pass should be of min 6-8 chars with a min one special character and numbers compulsory"
    if (password.length < 6 || password.length > 20) {
       return res.status(400).json({ error: "Password must be 6-20 characters long" });
    }
    if (!/(?=.*[0-9])/.test(password)) {
       return res.status(400).json({ error: "Password must include at least one number" });
    }
    if (!/(?=.*[!@#$%^&*])/.test(password)) {
       return res.status(400).json({ error: "Password must include at least one special character" });
    }

    // Availability check
    const existingEmail = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (existingEmail) return res.status(400).json({ error: "Email already exists" });

    const existingUser = await prisma.user.findUnique({ where: { username: username.toLowerCase() } });
    if (existingUser) return res.status(400).json({ error: "Username already taken" });

    const hash = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name,
        username: username.toLowerCase(),
        email: email.toLowerCase(),
        passwordHash: hash,
        provider: "local",
        college,
        course,
        dob: dob ? new Date(dob) : null,
        preferredField: preferredField || "General",
        avatar: avatar || `https://api.dicebear.com/7.x/pixel-art/svg?seed=${username}`
      }
    });

    const token = createJwtForUser(user);
    res.json({
      message: "Signup successful",
      user: mapId(user),
      token
    });
  } catch (err) {
    console.error("Signup error:", err);
    res.status(500).json({ error: "Signup failed" });
  }
});

// 4. Login
router.post('/login', async (req, res) => {
  try {
    const { identifier, password } = req.body;
    if (!identifier || !password) return res.status(400).json({ error: 'Missing identifier or password' });

    // — Brute-force lockout check —
    const bf = checkBruteForce(identifier);
    if (bf.locked) {
      return res.status(429).json({
        error: `Account temporarily locked after too many failed attempts. Try again in ${bf.minsLeft} minute(s).`
      });
    }

    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: identifier.toLowerCase() },
          { username: identifier.toLowerCase() }
        ]
      }
    });

    if (!user || !user.passwordHash) {
      recordFailedLogin(identifier);
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    // — Check if account is suspended —
    if (user.status === 'suspended') {
      return res.status(403).json({ error: 'Your account has been suspended. Contact support.' });
    }

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      recordFailedLogin(identifier);
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    // — Success: clear lockout —
    clearFailedLogins(identifier);

    const token = createJwtForUser(user);
    res.json({
      message: 'Login successful',
      user: mapId(user),
      token
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Login failed' });
  }
});

// 5. Forgot Password
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: "Email required" });

    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (!user) return res.status(400).json({ error: "User not found" });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 mins

    await prisma.user.update({
      where: { id: user.id },
      data: { otp, otpExpires }
    });

    const sent = await sendOTPEmail(user.email, otp);
    if (!sent) return res.status(500).json({ error: "Failed to send OTP email" });

    res.json({ message: "OTP sent to your email" });
  } catch (err) {
    console.error("Forgot password error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// 6a. Verify OTP (pre-flight before reset-password — prevents client-side bypass)
router.post('/verify-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) return res.status(400).json({ error: 'Email and OTP required' });

    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (!user || user.otp !== otp || user.otpExpires < new Date()) {
      return res.status(400).json({ error: 'Invalid or expired OTP' });
    }

    res.json({ message: 'OTP verified' });
  } catch (err) {
    console.error('Verify OTP error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 6b. Reset Password
router.post('/reset-password', async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    if (!email || !otp || !newPassword) return res.status(400).json({ error: "Missing fields" });

    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (!user || user.otp !== otp || user.otpExpires < new Date()) {
      return res.status(400).json({ error: "Invalid or expired OTP" });
    }

    const hash = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash: hash,
        otp: null,
        otpExpires: null
      }
    });

    res.json({ message: "Password reset successful" });
  } catch (err) {
    console.error("Reset password error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
