const express = require('express');
const router = express.Router();
const prisma = require("../services/db");
const { mapId } = require("../services/compatibility");

// Safe user fields to expose publicly
const USER_PUBLIC_SELECT = {
  id:                true,
  name:              true,
  username:          true,
  email:             true,
  avatar:            true,
  avatarFrame:       true,
  college:           true,
  course:            true,
  customField:       true,
  preferredField:    true,
  interest:          true,
  globalRating:      true,
  xp:                true,
  totalWins:         true,
  totalLosses:       true,
  winStreak:         true,
  bestWinStreak:     true,
  dailyStreak:       true,
  role:              true,
  status:            true,
  settings:          true,
  dob:               true,
  publicKey:         true,
  provider:          true,
  lastUsernameChange:true,
  lastPlayedAt:      true,
  createdAt:         true,
  updatedAt:         true,
  // passwordHash, otp, otpExpires, googleId, facebookId intentionally omitted
};

// Get User Profile & Settings
router.get('/profile/:email', async (req, res) => {
  try {
    const user = await prisma.user.findUnique({ 
      where:  { email: req.params.email.toLowerCase().trim() },
      select: USER_PUBLIC_SELECT,
    });
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(mapId(user));
  } catch (err) {
    console.error("User profile fetch error:", err);
    res.status(500).json({ error: 'Failed to fetch profile' }); // no err.message leak
  }
});

const multer = require('multer');
const { uploadToCloudinary } = require('../services/cloudinary');
const USE_CLOUDINARY = !!(process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY);

// Multer: memory storage (buffer passed to Cloudinary, or saved locally as fallback)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Only images are allowed'));
  }
});

// Update User Profile (Name, Avatar, Bio, etc.)
router.put('/profile', async (req, res) => {
  try {
    const { email, name, avatar, username } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required' });

    const existingUser = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });
    if (!existingUser) return res.status(404).json({ error: 'User not found' });

    const updateData = { name, avatar };

    // Username cooldown logic
    if (username && username !== existingUser.username) {
      if (existingUser.lastUsernameChange) {
        const thirtyDaysInMs = 30 * 24 * 60 * 60 * 1000;
        const diff = Date.now() - new Date(existingUser.lastUsernameChange).getTime();
        
        if (diff < thirtyDaysInMs) {
          const daysLeft = Math.ceil((thirtyDaysInMs - diff) / (24 * 60 * 60 * 1000));
          return res.status(403).json({ 
            error: `Username change locked. Try again in ${daysLeft} days.` 
          });
        }
      }
      
      // Check if username is already taken
      const taken = await prisma.user.findUnique({ where: { username: username.toLowerCase() } });
      if (taken) return res.status(400).json({ error: "Username already taken" });

      updateData.username = username.toLowerCase();
      updateData.lastUsernameChange = new Date();
    }

    const user = await prisma.user.update({
      where: { email: email.toLowerCase().trim() },
      data: updateData
    });
    
    res.json(mapId(user));
  } catch (err) {
    console.error("Profile update error:", err);
    res.status(500).json({ error: 'Failed to update identity' });
  }
});

// Avatar Upload — Cloudinary (prod) or local /uploads (dev)
router.post('/upload-avatar', upload.single('avatar'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    let avatarUrl;
    if (USE_CLOUDINARY) {
      // Upload buffer to Cloudinary — persistent, CDN-served
      avatarUrl = await uploadToCloudinary(req.file.buffer, 'samarpan/avatars');
    } else {
      // Fallback: save locally (dev only — not persistent across server restarts)
      const fs   = require('fs');
      const path = require('path');
      const filename = `avatar-${Date.now()}-${Math.random().toString(36).slice(2)}${path.extname(req.file.originalname)}`;
      fs.writeFileSync(path.join('uploads', filename), req.file.buffer);
      avatarUrl = `${process.env.BACKEND_URL || 'http://localhost:5000'}/uploads/${filename}`;
    }

    res.json({ url: avatarUrl });
  } catch (err) {
    console.error('Avatar upload error:', err);
    res.status(500).json({ error: 'Upload failed' });
  }
});

// Update User Settings (Already exists, but keeping for compatibility)
router.put('/settings', async (req, res) => {
  try {
    const { email, preferredField, interest, settings, college, course, customField, name, avatar, dob, username } = req.body;
    
    const existingUser = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });
    if (!existingUser) return res.status(404).json({ error: 'User not found' });

    const updateData = { 
        preferredField, 
        interest,
        settings,
        college,
        course,
        customField,
        name,
        avatar,
        dob: dob ? new Date(dob) : null
    };

    // Username cooldown logic
    if (username && username !== existingUser.username) {
      if (existingUser.lastUsernameChange) {
        const thirtyDaysInMs = 30 * 24 * 60 * 60 * 1000;
        const diff = Date.now() - new Date(existingUser.lastUsernameChange).getTime();
        
        if (diff < thirtyDaysInMs) {
          const daysLeft = Math.ceil((thirtyDaysInMs - diff) / (24 * 60 * 60 * 1000));
          return res.status(403).json({ 
            error: `Username change locked. Try again in ${daysLeft} days.` 
          });
        }
      }
      
      const taken = await prisma.user.findUnique({ where: { username: username.toLowerCase() } });
      if (taken) return res.status(400).json({ error: "Username already taken" });

      updateData.username = username.toLowerCase();
      updateData.lastUsernameChange = new Date();
    }

    const user = await prisma.user.update({
      where: { email: email.toLowerCase().trim() },
      data: updateData
    });
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(mapId(user));
  } catch (err) {
    console.error("User settings update error:", err);
    res.status(500).json({ error: 'Failed to update settings' }); // no err.message leak
  }
});

// Register E2EE Public Key
router.put('/public-key', async (req, res) => {
  try {
    const { email, publicKey } = req.body;
    if (!email || !publicKey) return res.status(400).json({ error: 'Missing sync data' });

    const user = await prisma.user.update({
      where: { email: email.toLowerCase().trim() },
      data: { publicKey }
    });
    
    res.json({ success: true, publicKey: user.publicKey });
  } catch (err) {
    console.error("Public key registration failed", err);
    res.status(500).json({ error: 'Sync failed' });
  }
});

module.exports = router;
