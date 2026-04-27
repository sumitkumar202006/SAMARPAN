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
const mammoth  = require("mammoth");
const { generateQuizQuestions, generateQuizFromText, generateSmartTags, generateQuizFromImage, extractQuizFromText } = require("../services/gptService");

// ─── Multer for extraction: PDF + DOCX, 10MB ──────────────────────────────────
const ALLOWED_DOC_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
  'application/msword', // .doc (older)
];

const uploadDoc = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const isAllowed = ALLOWED_DOC_TYPES.includes(file.mimetype)
      || file.originalname.match(/\.(pdf|docx|doc)$/i);
    if (isAllowed) cb(null, true);
    else cb(new Error('Only PDF or DOCX files are allowed'), false);
  },
});

// ─── Configure multer: memory storage, 5MB limit ──────────────────────────────
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

const uploadImage = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (ALLOWED_IMAGE_TYPES.includes(file.mimetype)) cb(null, true);
    else cb(new Error('Only JPG, PNG, WEBP, or GIF images are allowed'), false);
  },
});


// ─── POST /api/ai/auto-tag — AI smart tagging for any quiz ────────────────────
router.post("/auto-tag", authenticate, async (req, res) => {
  try {
    const { quizId } = req.body;
    if (!quizId) return res.status(400).json({ error: "quizId required" });

    const quiz = await prisma.quiz.findUnique({ where: { id: quizId } });
    if (!quiz) return res.status(404).json({ error: "Quiz not found" });
    if (quiz.authorId !== req.user.id) return res.status(403).json({ error: "Not your quiz" });

    const tags = await generateSmartTags(quiz.title, quiz.questions);

    await prisma.quiz.update({
      where: { id: quizId },
      data: {
        tags:       tags.tags,
        difficulty: tags.difficulty,
        topic:      quiz.topic || tags.subject,
      }
    });

    return res.json({ tags });
  } catch (err) {
    console.error("Auto-tag error:", err);
    res.status(500).json({ error: "Auto-tagging failed" });
  }
});


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


// Generate AI Quiz from Image (vision)
// 🔒 Gated: authenticate + pdfUploads quota (shared upload budget)
router.post("/generate-from-image", authenticate, checkQuota("pdfUploads"), uploadImage.single("image"), async (req, res) => {
  debugLog(`POST /api/ai/generate-from-image | File: ${req.file ? req.file.originalname : "NONE"} | UserID: ${req.body.userId}`);
  try {
    const { title, difficulty, userId } = req.body;
    let { count } = req.body;
    count = parseInt(count, 10) || 5;

    if (!req.file) {
      return res.status(400).json({ error: "No image uploaded", details: "Please attach a JPG, PNG, or WEBP image." });
    }
    if (!title || !difficulty) {
      return res.status(400).json({ error: "title & difficulty required" });
    }

    const base64Image = req.file.buffer.toString("base64");
    const mimeType    = req.file.mimetype;

    debugLog(`Calling vision AI with ${mimeType}, ${req.file.buffer.length} bytes...`);
    const questions = await generateQuizFromImage(base64Image, mimeType, difficulty, count);
    debugLog(`Vision AI generated ${questions.length} questions.`);

    const authorId = await ensureAuthorId(userId);
    const newQuiz  = await prisma.quiz.create({
      data: {
        title,
        topic:       `Image: ${req.file.originalname}`,
        authorId,
        questions,
        difficulty,
        aiGenerated: true,
        tags:        ["image-upload"],
      }
    });

    res.json({
      message: "AI Image Questions Generated & Saved Successfully",
      quiz:    require("../services/compatibility").mapId(newQuiz),
    });
  } catch (err) {
    debugLog(`IMAGE AI GEN ERROR: ${err.message}\nStack: ${err.stack}`);
    console.error("Image AI Quiz Error:", err);
    res.status(500).json({ error: "AI Quiz generation from image failed", details: err.message });
  }
});


// ─── POST /api/ai/extract-quiz ─────────────────────────────────────────────────
// Extract EXISTING Q&A from a PDF or DOCX doc. No quota consumed — just parsing.
// Returns raw question array for client-side review before saving.
router.post("/extract-quiz", authenticate, uploadDoc.single("doc"), async (req, res) => {
  debugLog(`POST /api/ai/extract-quiz | File: ${req.file?.originalname || 'NONE'} | User: ${req.user?.id}`);
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded", details: "Please attach a PDF or DOCX file." });
    }

    let textContent = '';
    const mime = req.file.mimetype;
    const name = req.file.originalname.toLowerCase();

    if (mime === 'application/pdf' || name.endsWith('.pdf')) {
      debugLog('Parsing PDF...');
      const pdfData = await pdfParse(req.file.buffer);
      textContent = pdfData.text;
    } else {
      debugLog('Parsing DOCX via mammoth...');
      const result = await mammoth.extractRawText({ buffer: req.file.buffer });
      textContent = result.value;
    }

    debugLog(`Text extracted. Length: ${textContent?.length || 0}`);

    if (!textContent || textContent.trim().length < 30) {
      return res.status(400).json({ error: 'Document appears to be empty or unreadable.' });
    }

    const questions = await extractQuizFromText(textContent);
    debugLog(`Extracted ${questions.length} questions.`);

    // Return questions for client review — NOT saved to DB yet
    res.json({ questions, count: questions.length });
  } catch (err) {
    debugLog(`EXTRACT ERROR: ${err.message}`);
    console.error('Extract quiz error:', err);
    res.status(500).json({ error: 'Extraction failed', details: err.message });
  }
});

module.exports = router;


