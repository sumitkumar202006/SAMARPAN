const express = require("express");
const fs = require("fs");
const path = require("path");
const router = express.Router();
const multer = require("multer");
const debugLog = (msg) => {
  const logMsg = `[${new Date().toISOString()}] ${msg}\n`;
  fs.appendFileSync(path.join(__dirname, "../debug.log"), logMsg);
};
const pdfParse = require("pdf-parse");
const { generateQuizQuestions, generateQuizFromText } = require("../services/gptService");
const Quiz = require("../models/Quiz");
const User = require("../models/user"); 

// Configure multer for memory storage
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// Generate AI Quiz from Topic
router.post("/generate-quiz", async (req, res) => {
  debugLog("POST /api/ai/generate-quiz reached content: " + req.body.topic);
  try {
    const { title, topic, difficulty, count, userId, tags } = req.body;

    if (!title || !topic || !difficulty) {
      return res.status(400).json({ error: "title, topic & difficulty required" });
    }

    // Convert Email OR ID to ObjectId
    let authorId = null;

    if (userId) {
      if (userId.includes("@")) {
        // CASE 1: Email sent
        const user = await User.findOne({ email: userId });
        if (!user) {
          return res.status(400).json({ error: "User not found" });
        }
        authorId = user._id;
      } else {
        // CASE 2: MongoDB ID sent
        authorId = userId;
      }
    }

    const questions = await generateQuizQuestions(
      topic,
      difficulty,
      count || 5
    );

    const quiz = await Quiz.create({
      title,
      topic,
      author: authorId,
      questions,
      aiGenerated: true,
      tags: tags || [],
    });

    res.json({
      message: "AI Quiz Generated Successfully",
      quizId: quiz._id,
      quiz,
    });
  } catch (err) {
    console.error("AI Quiz Error:", err);
    res.status(500).json({ error: "AI Quiz generation failed" });
  }
});

// Generate AI Quiz from PDF
router.post("/generate-from-pdf", upload.single("pdf"), async (req, res) => {
  debugLog("POST /api/ai/generate-from-pdf reached. File: " + (req.file ? req.file.originalname : "NONE"));
  try {
    const { title, difficulty, userId, tags } = req.body;
    let { count } = req.body;
    
    // Explicitly parse count to number
    count = parseInt(count, 10) || 5;

    debugLog(`Parsed constraints -> Title: ${title}, Difficulty: ${difficulty}, Count: ${count}`);

    if (!req.file) {
      debugLog("Error: No PDF file uploaded");
      return res.status(400).json({ error: "No PDF file uploaded" });
    }

    if (!title || !difficulty) {
      debugLog("Error: title & difficulty required");
      return res.status(400).json({ error: "title & difficulty required" });
    }

    // Extract text from PDF
    debugLog("Extracting text from PDF...");
    const pdfData = await pdfParse(req.file.buffer);
    const textContent = pdfData.text;
    debugLog("Extraction complete. Text length: " + (textContent ? textContent.length : 0));

    if (!textContent || textContent.trim().length < 50) {
      debugLog("Error: PDF contains too little text");
      return res.status(400).json({ error: "PDF contains too little text to generate a quiz" });
    }

    // Convert Email OR ID to ObjectId (for author field)
    let authorId = null;
    if (userId) {
      if (userId.includes("@")) {
        const user = await User.findOne({ email: userId });
        if (user) authorId = user._id;
      } else {
        authorId = userId;
      }
    }

    // Generate questions using AI
    debugLog(`Calling AI to generate exactly ${count} quiz questions...`);
    const questions = await generateQuizFromText(
      textContent,
      difficulty,
      count
    );
    debugLog("AI Questions generated successfully. Count: " + questions.length);

    // Save to Database
    debugLog("Saving quiz to database...");
    const quiz = await Quiz.create({
      title,
      topic: "PDF Upload",
      author: authorId,
      questions,
      aiGenerated: true,
      tags: tags || ["pdf-upload"],
    });
    debugLog("Quiz saved with ID: " + quiz._id);

    res.json({
      message: "AI Quiz Generated from PDF Successfully",
      quizId: quiz._id,
      quiz,
    });
  } catch (err) {
    debugLog("PDF AI Quiz Error: " + err.message + "\n" + err.stack);
    console.error("PDF AI Quiz Error:", err);
    res.status(500).json({ error: "AI Quiz generation from PDF failed" });
  }
});

module.exports = router;
