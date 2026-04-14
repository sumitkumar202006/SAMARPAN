const express = require('express');
const router = express.Router();
const prisma = require("../services/db");

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

// Update User Settings
router.put('/settings', async (req, res) => {
  try {
    const { email, preferredField, settings, college, course } = req.body;
    const user = await prisma.user.update({
      where: { email: email.toLowerCase().trim() },
      data: { 
        preferredField, 
        settings,
        college,
        course
      }
    });
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (err) {
    console.error("User settings update error:", err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
