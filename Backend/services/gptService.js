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
  try {
    const response = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
    });

    let rawText = response.choices[0].message.content.trim();
    
    // 1. Log the attempt
    console.log(`[AI-GEN] Raw output received. Length: ${rawText.length}`);

    // 2. Robustly extract JSON array if AI wrapped it in markdown or added text
    // Matches everything between the first [ and the last ]
    const jsonMatch = rawText.match(/\[\s*\{[\s\S]*\}\s*\]/);
    if (jsonMatch) {
      rawText = jsonMatch[0];
    } else {
      console.warn("[AI-GEN] No JSON array detected in raw output. Attempting direct parse.");
    }

    // 3. Try to parse
    return JSON.parse(rawText);
  } catch (err) {
    console.error("AI GENERATION OR PARSE ERROR:", err);
    // Rethrow with context to be caught by the route handler
    throw new Error(`AI Forge Error: ${err.message}`);
  }
}

module.exports = { generateQuizQuestions, generateQuizFromText };
