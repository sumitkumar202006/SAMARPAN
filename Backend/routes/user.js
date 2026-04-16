const express = require('express');
const router = express.Router();
const prisma = require("../services/db");
const { mapId } = require("../services/compatibility");

// Get User Profile & Settings
router.get('/profile/:email', async (req, res) => {
  try {
    const user = await prisma.user.findUnique({ 
      where: { email: req.params.email.toLowerCase().trim() } 
    });
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (err) {
    console.error("User profile fetch error:", err);
    res.status(500).json({ error: err.message });
  }
});

const multer = require('multer');
const path = require('path');

// Configure Multer for Avatar Uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'avatar-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB Limit
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

// Physical Avatar Upload
router.post('/upload-avatar', upload.single('avatar'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    
    // Return the stable URL path
    const avatarUrl = `${process.env.BACKEND_URL || 'http://localhost:5000'}/uploads/${req.file.filename}`;
    res.json({ url: avatarUrl });
  } catch (err) {
    console.error("Avatar upload error:", err);
    res.status(500).json({ error: 'Upload failed' });
  }
});

// Update User Settings (Already exists, but keeping for compatibility)
router.put('/settings', async (req, res) => {
  try {
    const { email, preferredField, settings, college, course, customField, name, avatar, dob, username } = req.body;
    
    const existingUser = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });
    if (!existingUser) return res.status(404).json({ error: 'User not found' });

    const updateData = { 
        preferredField, 
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
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
