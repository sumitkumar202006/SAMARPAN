const Groq = require("groq-sdk");

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

async function generateQuizQuestions(topic, difficulty, count = 5) {
  const prompt = `
Generate EXACTLY ${count} multiple-choice quiz questions on the topic "${topic}".
Difficulty: ${difficulty}

CRITICAL INSTRUCTIONS:
1. You MUST generate EXACTLY ${count} questions. Do not stop early. Count them to ensure there are exactly ${count}.
2. The difficulty level MUST be strictly: ${difficulty}. Adjust the depth and complexity of the questions accordingly.
3. Return ONLY a raw JSON array. Do not include markdown formatting like \`\`\`json. Do not include any conversational text before or after the JSON.

[
  {
    "question": "Question text",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctIndex": 0,
    "explanation": "Short explanation",
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

[
  {
    "question": "Question text",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctIndex": 0,
    "explanation": "Short explanation",
    "difficulty": "${difficulty}"
  }
]
`;

  return await callGroq(prompt);
}

async function callGroq(prompt) {
  const models = ["llama-3.3-70b-specdec", "llama-3.1-8b-instant"];
  let lastError = null;

  for (const model of models) {
    try {
      console.log(`[AI-FORGE] Attempting generation with model: ${model}`);
      const response = await groq.chat.completions.create({
        model,
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
      });

      let rawText = response.choices[0].message.content.trim();
      
      // Sanitizer 2.0: Aggressively clean JSON
      // Handle markdown code blocks
      rawText = rawText.replace(/```json|```/gi, "");
      
      // Extract array between first [ and last ]
      const startIdx = rawText.indexOf("[");
      const endIdx = rawText.lastIndexOf("]");
      
      if (startIdx !== -1 && endIdx !== -1) {
        rawText = rawText.substring(startIdx, endIdx + 1);
      }

      // Final cleanup of common parsing blockers
      rawText = rawText
        .replace(/,\s*\]/g, "]") // remove trailing comma before array end
        .replace(/,\s*\}/g, "}"); // remove trailing comma before object end

      return JSON.parse(rawText);
    } catch (err) {
      console.warn(`[AI-FORGE] Model ${model} failed. Error: ${err.message}`);
      lastError = err;
      // Continue to next model
    }
  }

  // If all models fail
  console.error("AI FORGE - TOTAL ENGINE FAILURE:", lastError);
  throw new Error(`AI System exhausted: ${lastError?.message}`);
}

module.exports = { generateQuizQuestions, generateQuizFromText };
