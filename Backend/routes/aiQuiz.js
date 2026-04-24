const express = require("express");
const fs = require("fs");
const path = require("path");
const router = express.Router();
const multer = require("multer");
const prisma = require("../services/db");
const { mapId } = require("../services/compatibility");
const { authenticate, checkQuota } = require("../middleware/planGate");
const debugLog = (msg) => {
  const logMsg = `[${new Date().toISOString()}] ${msg}\n`;
  fs.appendFileSync(path.join(__dirname, "../debug.log"), logMsg);
};
const pdfParse = require("pdf-parse");
const { generateQuizQuestions, generateQuizFromText } = require("../services/gptService");

// Configure multer for memory storage
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

/**
 * HELPER: Robust User Association
 * Ensures a user document exists before saving a quiz.
 */
async function ensureAuthorId(userId) {
  if (!userId) return null;
  
  try {
    if (typeof userId === "string" && userId.includes("@")) {
      const normalizedEmail = userId.toLowerCase().trim();
      let user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
      
      if (!user) {
        debugLog(`User record missing for ${normalizedEmail}. AUTO-CREATING...`);
        // Extract a name from email if possible
        const guessedName = normalizedEmail.split('@')[0].split(/[._+-]/).map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' ');
        
        user = await prisma.user.create({
          data: {
            name: guessedName || "New Player",
            email: normalizedEmail,
            provider: "automatic",
            globalRating: 1200,
            xp: 0
          }
        });
        debugLog(`Auto-created user: ${user.email} (${user.id})`);
      }
      return user.id;
    }
    
    // If it's an ID string, verify it's valid (already a UUID in our new system)
    return userId; 
  } catch (err) {
    debugLog(`Error in ensureAuthorId for ${userId}: ${err.message}`);
    return null;
  }
}

// Generate AI Quiz from Topic
// 🔒 Gated: authenticate + aiGenerations quota
router.post("/generate-quiz", authenticate, checkQuota("aiGenerations"), async (req, res) => {
  debugLog(`POST /api/ai/generate-quiz | Topic: ${req.body.topic} | UserID: ${req.body.userId}`);
  try {
    const { title, topic, difficulty, count, userId, tags } = req.body;

    if (!title || !topic || !difficulty) {
      return res.status(400).json({ 
        error: "title, topic & difficulty required", 
        details: `Missing fields: ${!title ? 'title ' : ''}${!topic ? 'topic ' : ''}${!difficulty ? 'difficulty' : ''}`
      });
    }

    // Ensure we have a valid DB record for the author
    const authorId = await ensureAuthorId(userId);
    const user = authorId ? await prisma.user.findUnique({ where: { id: authorId } }) : null;

    const questions = await generateQuizQuestions(
      topic,
      difficulty,
      count || 5,
      {
        preferredField: user?.preferredField || 'General',
        college: user?.college || 'Not Specified',
        course: user?.course || 'Not Specified',
        customField: user?.customField || ''
      }
    );

    // PERSISTENCE: Save to Cloud DB 
    const newQuiz = await prisma.quiz.create({
      data: {
        title,
        topic,
        authorId: authorId,
        questions, // Stored as JSON
        aiGenerated: true,
        difficulty,
        tags: tags || []
      }
    });

    res.json({
      message: "AI Questions Generated & Saved Successfully",
      quiz: mapId(newQuiz),
    });
  } catch (err) {
    debugLog(`TOPIC AI GEN CRITICAL ERROR: ${err.message}\nStack: ${err.stack}`);
    console.error("AI Quiz Error:", err);
    res.status(500).json({ error: "AI Quiz generation failed", details: err.message });
  }
});

// Generate AI Quiz from PDF
// 🔒 Gated: authenticate + pdfUploads quota
router.post("/generate-from-pdf", authenticate, checkQuota("pdfUploads"), upload.single("pdf"), async (req, res) => {
  debugLog(`POST /api/ai/generate-from-pdf | File: ${req.file ? req.file.originalname : "NONE"} | UserID: ${req.body.userId}`);
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

    // Ensure we have a valid DB record for the author
    const authorId = await ensureAuthorId(userId);

    // Generate questions using AI
    debugLog(`Calling AI to generate exactly ${count} quiz questions...`);
    const questions = await generateQuizFromText(
      textContent,
      difficulty,
      count
    );
    debugLog("AI Questions generated successfully. Count: " + questions.length);

    // PERSISTENCE: Save to Cloud DB
    const newQuiz = await prisma.quiz.create({
      data: {
        title,
        topic: `PDF: ${req.file.originalname}`,
        authorId: authorId,
        questions,
        difficulty,
        aiGenerated: true,
        tags: tags || ["pdf-upload"]
      }
    });

    res.json({
      message: "AI PDF Questions Generated & Saved Successfully",
      quiz: mapId(newQuiz),
    });
  } catch (err) {
    debugLog(`PDF AI GEN CRITICAL ERROR: ${err.message}\nStack: ${err.stack}`);
    console.error("PDF AI Quiz Error:", err);
    res.status(500).json({ error: "AI Quiz generation from PDF failed", details: err.message });
  }
});

module.exports = router;
