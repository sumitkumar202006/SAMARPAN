const Groq = require("groq-sdk");

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

async function generateQuizQuestions(topic, difficulty, count = 5, userContext = {}) {
  const { 
    preferredField = 'General', 
    college = 'Not Specified', 
    course = 'Not Specified',
    customField = '',
    interest = ''
  } = userContext;
  
  const prompt = `
Generate EXACTLY ${count} multiple-choice quiz questions on the topic "${topic}".
Difficulty: ${difficulty}

PERSONALIZATION CONTEXT:
The user is a student/professional with the following background:
- Institution: ${college}
- Program/Course: ${course}
- Specific Expertise: ${preferredField}${customField ? ` (${customField})` : ''}
- Interest/Background: ${interest || 'General interest in the topic'}

TAILORING RULE: 
- Use the "Interest/Background" paragraph to deeply personalize the questions. If the user describes specific projects, goals, or niche interests, incorporate those themes.
- If the topic permits, prioritize examples, terminology, and use-cases that resonate with a student in ${course} at ${college}. 
- Align the complexity and focus with the user's specific expertise node: ${customField || preferredField}.

CRITICAL INSTRUCTIONS:
1. You MUST generate EXACTLY ${count} questions. Do not stop early. Count them to ensure there are exactly ${count}.
2. The difficulty level MUST be strictly: ${difficulty}. Adjust the depth and complexity of the questions accordingly.
3. Return ONLY a raw JSON array. Do not include markdown formatting like \`\`\`json. Do not include any conversational text before or after the JSON.

ACCURACY & CONSISTENCY RULES:
- For every question, you MUST perform any necessary mathematical or logical calculations step-by-step in your internal reasoning.
- The "correctIndex" MUST point to the actual correct answer within the "options" array.
- You MUST double-check that the "correctIndex" matches the specific solution described in your "explanation". 
- Mathematical errors or misaligned indices are UNACCEPTABLE.

[
  {
    "question": "Question text",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctIndex": 0,
    "explanation": "Detailed step-by-step explanation verifying the logic",
    "difficulty": "${difficulty}"
  }
]
`;

  return await callGroq(prompt);
}

async function generateQuizFromText(textContent, difficulty, count = 5) {
  const prompt = `
Based on the following text content, generate EXACTLY ${count} multiple-choice quiz questions.
Difficulty: ${difficulty}

TEXT CONTENT:
${textContent.substring(0, 15000)}

CRITICAL INSTRUCTIONS:
1. You MUST generate EXACTLY ${count} questions. Do not stop early. Even if the text is short, find enough details to make exactly ${count} questions.
2. The difficulty level MUST be strictly: ${difficulty}. Adjust the depth and complexity of the questions accordingly.
3. Return ONLY a raw JSON array. Do not include markdown formatting like \`\`\`json. Do not include any conversational text before or after the JSON.

ACCURACY & CONSISTENCY RULES:
- Every question must be directly verifiable from the provided text.
- The "correctIndex" MUST point to the actual correct answer within the "options" array.
- You MUST double-check that the "correctIndex" matches the specific solution described in your "explanation". 
- Misaligned indices are UNACCEPTABLE.

[
  {
    "question": "Question text",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctIndex": 0,
    "explanation": "Detailed explanation showing which part of the text confirms this answer",
    "difficulty": "${difficulty}"
  }
]
`;

  return await callGroq(prompt);
}

async function callGroq(prompt) {
  const models = ["llama-3.3-70b-versatile", "llama-3.1-8b-instant"];
  let lastError = null;

  for (const model of models) {
    try {
      console.log(`[AI-FORGE] Attempting generation with model: ${model}`);
      const response = await groq.chat.completions.create({
        model,
        messages: [{ role: "user", content: prompt }],
        temperature: 0.4,
        max_tokens: 4096, // Cap output to prevent truncated JSON
      });

      let rawText = response.choices[0].message.content.trim();
      
      // Strip markdown code fences
      rawText = rawText.replace(/```json|```/gi, "").trim();
      
      // Extract the JSON array portion
      const startIdx = rawText.indexOf("[");
      const endIdx = rawText.lastIndexOf("]");
      
      if (startIdx !== -1 && endIdx !== -1) {
        rawText = rawText.substring(startIdx, endIdx + 1);
      }

      // Basic JSON cleanup
      rawText = rawText
        .replace(/,\s*\]/g, "]") 
        .replace(/,\s*\}/g, "}");

      // Primary parse attempt
      try {
        const parsed = JSON.parse(rawText);
        if (Array.isArray(parsed) && parsed.length > 0) {
          console.log(`[AI-FORGE] Success with ${model}. Got ${parsed.length} questions.`);
          return parsed;
        }
      } catch (_parseErr) {
        // Fall through to recovery
      }

      // === RECOVERY: Extract valid question objects one by one via regex ===
      // Handles truncated JSON where the last object is incomplete
      console.warn(`[AI-FORGE] Primary parse failed for ${model}. Attempting object-level extraction...`);
      const questionRegex = /\{[^{}]*"question"[^{}]*"options"[^{}]*"correctIndex"[^{}]*\}/gs;
      const rawMatches = rawText.match(questionRegex) || [];
      const recovered = [];
      for (const match of rawMatches) {
        try {
          const q = JSON.parse(match);
          if (q.question && Array.isArray(q.options) && typeof q.correctIndex === 'number') {
            recovered.push(q);
          }
        } catch (_) { /* skip malformed */ }
      }
      if (recovered.length > 0) {
        console.log(`[AI-FORGE] Recovered ${recovered.length} questions via extraction for ${model}.`);
        return recovered;
      }

      // Could not recover — throw to try next model
      throw new Error(`JSON parse and extraction both failed for ${model}`);
    } catch (err) {
      console.warn(`[AI-FORGE] Model ${model} failed. Error: ${err.message}`);
      lastError = err;
    }
  }

  console.error("AI FORGE - TOTAL ENGINE FAILURE:", lastError);
  throw new Error(`AI System exhausted: ${lastError?.message}`);
}


async function generateSmartTags(title, questions = []) {
  const sampleQs = questions.slice(0, 5).map(q => q.question).join("\n- ");
  const prompt = `
You are a quiz metadata classifier. Analyze this quiz and return ONLY a raw JSON object (no markdown).

Quiz Title: "${title}"
Sample Questions:
- ${sampleQs || "No questions provided"}

Return EXACTLY this JSON structure:
{
  "tags": ["tag1", "tag2", "tag3"],
  "subject": "Primary Subject Area",
  "difficulty": "easy|medium|hard",
  "estimatedMinutes": 5,
  "language": "English"
}

Rules:
- tags: 3-5 concise lowercase tags (e.g. "physics", "newton-laws", "kinematics")
- subject: one of [Mathematics, Computer Science, Physics, Chemistry, Biology, History, Geography, Economics, General Knowledge, Language, Engineering, Medicine]
- difficulty: easy / medium / hard
- estimatedMinutes: realistic time to complete (2-30)
`;

  try {
    const response = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.2,
      max_tokens: 256,
    });

    let raw = response.choices[0].message.content.trim()
      .replace(/```json|```/gi, "").trim();
    const start = raw.indexOf("{");
    const end   = raw.lastIndexOf("}");
    if (start !== -1 && end !== -1) raw = raw.substring(start, end + 1);

    const parsed = JSON.parse(raw);
    return {
      tags:             Array.isArray(parsed.tags) ? parsed.tags : [],
      subject:          parsed.subject          || "General Knowledge",
      difficulty:       parsed.difficulty        || "medium",
      estimatedMinutes: parsed.estimatedMinutes  || 5,
      language:         parsed.language          || "English",
    };
  } catch (err) {
    console.warn("[SmartTag] Tagging failed, using defaults:", err.message);
    return { tags: [], subject: "General Knowledge", difficulty: "medium", estimatedMinutes: 5, language: "English" };
  }
}

module.exports = { generateQuizQuestions, generateQuizFromText, generateSmartTags };

