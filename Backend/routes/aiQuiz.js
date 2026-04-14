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
const User = require("../models/User"); 

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
      return res.status(400).json({ 
        error: "title, topic & difficulty required", 
        details: `Missing fields: ${!title ? 'title ' : ''}${!topic ? 'topic ' : ''}${!difficulty ? 'difficulty' : ''}`
      });
    }

    // Convert Email OR ID to ObjectId (Optional association)
    let authorId = null;
    if (userId) {
      if (typeof userId === "string" && userId.includes("@")) {
        const user = await User.findOne({ email: userId.toLowerCase().trim() });
        if (user) authorId = user._id;
      } else {
        authorId = userId;
      }
    }

    const questions = await generateQuizQuestions(
      topic,
      difficulty,
      count || 5
    );

    // PERSISTENCE: Save to Cloud DB 
    const newQuiz = await Quiz.create({
      title,
      topic,
      author: authorId,
      questions,
      aiGenerated: true,
      difficulty,
      tags: tags || []
    });

    res.json({
      message: "AI Questions Generated & Saved Successfully",
      quiz: newQuiz,
    });
  } catch (err) {
    debugLog(`TOPIC AI GEN CRITICAL ERROR: ${err.message}\nStack: ${err.stack}`);
    console.error("AI Quiz Error:", err);
    res.status(500).json({ error: "AI Quiz generation failed", details: err.message });
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
      return res.status(400).json({ error: "No PDF file uploaded", details: "File buffer was empty or missing." });
    }

    if (!title || !difficulty) {
      debugLog("Error: title & difficulty required");
      return res.status(400).json({ error: "title & difficulty required", details: "A valid title and difficulty tier are mandatory for PDF Forge." });
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

    // Convert Email OR ID to ObjectId (Optional association)
    let authorId = null;
    if (userId) {
      if (typeof userId === "string" && userId.includes("@")) {
        const user = await User.findOne({ email: userId.toLowerCase().trim() });
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

    // PERSISTENCE: Save to Cloud DB
    const newQuiz = await Quiz.create({
      title,
      topic: `PDF: ${req.file.originalname}`,
      author: authorId,
      questions,
      difficulty,
      aiGenerated: true,
      tags: tags || ["pdf-upload"]
    });

    res.json({
      message: "AI PDF Questions Generated & Saved Successfully",
      quiz: newQuiz,
    });
  } catch (err) {
    debugLog(`PDF AI GEN CRITICAL ERROR: ${err.message}\nStack: ${err.stack}`);
    console.error("PDF AI Quiz Error:", err);
    res.status(500).json({ error: "AI Quiz generation from PDF failed", details: err.message });
  }
});

module.exports = router;
