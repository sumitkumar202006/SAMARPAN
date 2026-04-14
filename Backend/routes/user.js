const express = require('express');
const router = express.Router();
const User = require('../models/User');

// Get User Profile & Settings
router.get('/profile/:email', async (req, res) => {
  try {
    const user = await User.findOne({ email: req.params.email.toLowerCase().trim() });
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update User Settings
router.put('/settings', async (req, res) => {
  try {
    const { email, preferredField, settings, college, course } = req.body;
    const user = await User.findOneAndUpdate(
      { email: email.toLowerCase().trim() },
      { 
        $set: { 
          preferredField, 
          settings,
          college,
          course
        } 
      },
      { new: true }
    );
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
