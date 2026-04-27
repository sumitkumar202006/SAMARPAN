/**
 * gptService.js — Samarpan AI Quiz Engine
 *
 * Tri-provider fallback chain (in priority order):
 *   1. Groq       → llama-3.3-70b-versatile  (primary, fastest, free tier)
 *                 → llama-3.1-8b-instant      (groq secondary model)
 *   2. Gemini     → gemini-2.0-flash          (secondary, if groq rate-limits)
 *                 → gemini-1.5-flash           (gemini fallback model)
 *   3. OpenAI     → gpt-4o-mini               (last resort)
 *
 * Any provider that isn't configured (no API key) is skipped silently.
 * The chain only moves to the next provider on rate-limit / quota errors.
 */

'use strict';

require('dotenv').config();

// ─── Provider 1: Groq ─────────────────────────────────────────────────────────
const Groq = require('groq-sdk');
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// ─── Provider 2: Gemini ───────────────────────────────────────────────────────
let gemini = null;
try {
  if (process.env.GEMINI_API_KEY) {
    const { GoogleGenerativeAI } = require('@google/generative-ai');
    gemini = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    console.log('[AI-FORGE] ✅ Gemini secondary provider initialized.');
  } else {
    console.log('[AI-FORGE] ⚠️  GEMINI_API_KEY not set — Gemini fallback disabled.');
  }
} catch (e) {
  console.warn('[AI-FORGE] Gemini SDK not available:', e.message);
}

// ─── Provider 3: OpenAI ───────────────────────────────────────────────────────
let openai = null;
try {
  if (process.env.OPENAI_API_KEY) {
    const { OpenAI } = require('openai');
    openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    console.log('[AI-FORGE] ✅ OpenAI tertiary provider initialized.');
  } else {
    console.log('[AI-FORGE] ⚠️  OPENAI_API_KEY not set — OpenAI fallback disabled.');
  }
} catch (e) {
  console.warn('[AI-FORGE] OpenAI SDK not available:', e.message);
}

// ─── Rate-Limit Error Detection ───────────────────────────────────────────────
// Returns true if the error is a quota / rate-limit error (worth trying next provider)
function isRateLimitError(err) {
  if (!err) return false;
  const msg   = (err.message || '').toLowerCase();
  const status = err.status || err.statusCode || err?.error?.status || 0;
  return (
    status === 429 ||
    status === 503 ||
    msg.includes('rate limit') ||
    msg.includes('quota') ||
    msg.includes('too many requests') ||
    msg.includes('overloaded') ||
    msg.includes('capacity') ||
    msg.includes('model_decommissioned') ||
    msg.includes('resource_exhausted')
  );
}

// ─── JSON Extraction Helper ───────────────────────────────────────────────────
// Robustly extracts a valid JSON array from any raw LLM text response
function extractJsonArray(rawText) {
  // Strip markdown code fences
  let text = rawText.replace(/```json|```/gi, '').trim();

  // Isolate the outermost array
  const start = text.indexOf('[');
  const end   = text.lastIndexOf(']');
  if (start !== -1 && end !== -1) {
    text = text.substring(start, end + 1);
  }

  // Cleanup trailing commas (common LLM mistake)
  text = text.replace(/,\s*]/g, ']').replace(/,\s*}/g, '}');

  // Primary parse
  try {
    const parsed = JSON.parse(text);
    if (Array.isArray(parsed) && parsed.length > 0) return parsed;
  } catch (_) { /* fall through to recovery */ }

  // Recovery — extract valid question objects one at a time via regex
  const questionRegex = /\{[^{}]*"question"[^{}]*"options"[^{}]*"correctIndex"[^{}]*\}/gs;
  const matches = text.match(questionRegex) || [];
  const recovered = [];
  for (const m of matches) {
    try {
      const q = JSON.parse(m);
      if (q.question && Array.isArray(q.options) && typeof q.correctIndex === 'number') {
        recovered.push(q);
      }
    } catch (_) { /* skip malformed */ }
  }
  if (recovered.length > 0) return recovered;

  return null;
}

// ─────────────────────────────────────────────────────────────────────────────
// PRIMARY ENGINE: callAI(prompt)
// Tries providers in order: Groq → Gemini → OpenAI
// Returns a parsed question array or throws if all providers fail.
// ─────────────────────────────────────────────────────────────────────────────
async function callAI(prompt) {
  const errors = [];

  // ══════════════════════════════════════════
  // TIER 1 — GROQ (default)
  // ══════════════════════════════════════════
  const groqModels = ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant'];
  for (const model of groqModels) {
    try {
      console.log(`[AI-FORGE] 🔵 Groq → ${model}`);
      const response = await groq.chat.completions.create({
        model,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.4,
        max_tokens: 4096,
      });

      const raw = response.choices[0].message.content.trim();
      const result = extractJsonArray(raw);
      if (result) {
        console.log(`[AI-FORGE] ✅ Groq/${model} succeeded — ${result.length} questions.`);
        return result;
      }
      throw new Error(`Groq/${model} returned unparseable JSON`);
    } catch (err) {
      console.warn(`[AI-FORGE] ❌ Groq/${model} failed: ${err.message}`);
      errors.push({ provider: `Groq/${model}`, error: err.message, isRateLimit: isRateLimitError(err) });
      // If it's NOT a rate-limit error (e.g. bad JSON), still try next Groq model
    }
  }

  // ══════════════════════════════════════════
  // TIER 2 — GEMINI (secondary)
  // ══════════════════════════════════════════
  if (gemini) {
    const geminiModels = ['gemini-2.0-flash', 'gemini-1.5-flash'];
    for (const modelName of geminiModels) {
      try {
        console.log(`[AI-FORGE] 🟡 Gemini → ${modelName}`);
        const model    = gemini.getGenerativeModel({ model: modelName });
        const result   = await model.generateContent(prompt);
        const raw      = result.response.text().trim();
        const parsed   = extractJsonArray(raw);
        if (parsed) {
          console.log(`[AI-FORGE] ✅ Gemini/${modelName} succeeded — ${parsed.length} questions.`);
          return parsed;
        }
        throw new Error(`Gemini/${modelName} returned unparseable JSON`);
      } catch (err) {
        console.warn(`[AI-FORGE] ❌ Gemini/${modelName} failed: ${err.message}`);
        errors.push({ provider: `Gemini/${modelName}`, error: err.message, isRateLimit: isRateLimitError(err) });
      }
    }
  } else {
    console.log('[AI-FORGE] ⏭️  Gemini not configured — skipping to OpenAI.');
  }

  // ══════════════════════════════════════════
  // TIER 3 — OPENAI (last resort)
  // ══════════════════════════════════════════
  if (openai) {
    try {
      console.log('[AI-FORGE] 🔴 OpenAI → gpt-4o-mini (last resort)');
      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.4,
        max_tokens: 4096,
      });

      const raw    = response.choices[0].message.content.trim();
      const parsed = extractJsonArray(raw);
      if (parsed) {
        console.log(`[AI-FORGE] ✅ OpenAI/gpt-4o-mini succeeded — ${parsed.length} questions.`);
        return parsed;
      }
      throw new Error('OpenAI/gpt-4o-mini returned unparseable JSON');
    } catch (err) {
      console.error(`[AI-FORGE] ❌ OpenAI failed: ${err.message}`);
      errors.push({ provider: 'OpenAI/gpt-4o-mini', error: err.message, isRateLimit: isRateLimitError(err) });
    }
  } else {
    console.log('[AI-FORGE] ⏭️  OpenAI not configured — all providers exhausted.');
  }

  // ══════════════════════════════════════════
  // ALL PROVIDERS FAILED
  // ══════════════════════════════════════════
  const rateLimited = errors.filter(e => e.isRateLimit).map(e => e.provider);
  const summary     = errors.map(e => `${e.provider}: ${e.error}`).join(' | ');
  console.error('[AI-FORGE] 🚨 Total engine failure:', summary);

  const errMsg = rateLimited.length > 0
    ? `AI quota reached on: ${rateLimited.join(', ')}. All fallback providers also failed. Please try again in a few minutes.`
    : `AI engine failed on all providers. Details: ${summary}`;

  throw new Error(errMsg);
}

// ─────────────────────────────────────────────────────────────────────────────
// PUBLIC: generateQuizQuestions
// ─────────────────────────────────────────────────────────────────────────────
async function generateQuizQuestions(topic, difficulty, count = 5, userContext = {}) {
  const {
    preferredField = 'General',
    college        = 'Not Specified',
    course         = 'Not Specified',
    customField    = '',
    interest       = '',
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
- Use the "Interest/Background" paragraph to deeply personalize the questions.
- If the topic permits, prioritize examples and terminology relevant to a student in ${course} at ${college}.
- Align the complexity and focus with the user's specific expertise: ${customField || preferredField}.

CRITICAL INSTRUCTIONS:
1. You MUST generate EXACTLY ${count} questions. Do not stop early. Count them.
2. The difficulty level MUST be strictly: ${difficulty}.
3. Return ONLY a raw JSON array. No markdown, no extra text.
4. Every "correctIndex" MUST point to the actual correct answer. Double-check.

[
  {
    "question": "Question text",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctIndex": 0,
    "explanation": "Detailed step-by-step explanation",
    "difficulty": "${difficulty}"
  }
]
`;

  return callAI(prompt);
}

// ─────────────────────────────────────────────────────────────────────────────
// PUBLIC: generateQuizFromText (PDF / plain text source)
// ─────────────────────────────────────────────────────────────────────────────
async function generateQuizFromText(textContent, difficulty, count = 5) {
  const prompt = `
Based on the following text content, generate EXACTLY ${count} multiple-choice quiz questions.
Difficulty: ${difficulty}

TEXT CONTENT:
${textContent.substring(0, 15000)}

CRITICAL INSTRUCTIONS:
1. Generate EXACTLY ${count} questions from the provided text.
2. Difficulty must be strictly: ${difficulty}.
3. Return ONLY a raw JSON array. No markdown, no extra text.
4. Each "correctIndex" MUST be verifiable from the text above.

[
  {
    "question": "Question text",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctIndex": 0,
    "explanation": "Which part of the text confirms this answer",
    "difficulty": "${difficulty}"
  }
]
`;

  return callAI(prompt);
}

// ─────────────────────────────────────────────────────────────────────────────
// PUBLIC: extractQuizFromText (existing Q&A in document — extract, don't create)
// ─────────────────────────────────────────────────────────────────────────────
async function extractQuizFromText(textContent) {
  const prompt = `You are a quiz data extractor. The following text already contains quiz questions, options, and answers. Extract ALL of them exactly as written — do NOT rephrase or generate new questions.

TEXT:
${textContent.substring(0, 20000)}

EXTRACTION RULES:
1. Extract every question you find, preserving original wording exactly.
2. Each question must have exactly 4 options. If fewer, pad with empty strings.
3. correctIndex is 0-based (0=A, 1=B, 2=C, 3=D).
4. If the document marks the correct answer, map it to correctIndex. Otherwise use 0.
5. Include any explanation/rationale found in the document, else use "".
6. Return ONLY a raw JSON array. No markdown. No extra text.

[
  {
    "question": "Exact question text from document",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctIndex": 1,
    "explanation": "Any explanation found in the document, or empty string"
  }
]`;

  return callAI(prompt);
}

// ─────────────────────────────────────────────────────────────────────────────
// PUBLIC: generateSmartTags
// Uses the fastest available provider (Groq first, then Gemini, then OpenAI)
// ─────────────────────────────────────────────────────────────────────────────
async function generateSmartTags(title, questions = []) {
  const sampleQs = questions.slice(0, 5).map(q => q.question).join('\n- ');
  const prompt = `You are a quiz metadata classifier. Analyze this quiz and return ONLY a raw JSON object (no markdown).

Quiz Title: "${title}"
Sample Questions:
- ${sampleQs || 'No questions provided'}

Return EXACTLY this JSON structure:
{
  "tags": ["tag1", "tag2", "tag3"],
  "subject": "Primary Subject Area",
  "difficulty": "easy|medium|hard",
  "estimatedMinutes": 5,
  "language": "English"
}

Rules:
- tags: 3-5 concise lowercase tags
- subject: one of [Mathematics, Computer Science, Physics, Chemistry, Biology, History, Geography, Economics, General Knowledge, Language, Engineering, Medicine]
- difficulty: easy / medium / hard
- estimatedMinutes: realistic time to complete (2-30)`;

  // For tagging, try Groq first (lightest call), then fall back
  const groqModels = ['llama-3.1-8b-instant', 'llama-3.3-70b-versatile'];
  for (const model of groqModels) {
    try {
      const response = await groq.chat.completions.create({
        model,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.2,
        max_tokens: 256,
      });
      let raw = response.choices[0].message.content.trim().replace(/```json|```/gi, '').trim();
      const s = raw.indexOf('{'); const e = raw.lastIndexOf('}');
      if (s !== -1 && e !== -1) raw = raw.substring(s, e + 1);
      const parsed = JSON.parse(raw);
      return {
        tags:             Array.isArray(parsed.tags) ? parsed.tags : [],
        subject:          parsed.subject             || 'General Knowledge',
        difficulty:       parsed.difficulty           || 'medium',
        estimatedMinutes: parsed.estimatedMinutes     || 5,
        language:         parsed.language             || 'English',
      };
    } catch (_) { /* try next */ }
  }

  // Gemini tagging fallback
  if (gemini) {
    try {
      const model  = gemini.getGenerativeModel({ model: 'gemini-2.0-flash' });
      const result = await model.generateContent(prompt);
      let raw      = result.response.text().trim().replace(/```json|```/gi, '').trim();
      const s = raw.indexOf('{'); const e = raw.lastIndexOf('}');
      if (s !== -1 && e !== -1) raw = raw.substring(s, e + 1);
      const parsed = JSON.parse(raw);
      return {
        tags:             Array.isArray(parsed.tags) ? parsed.tags : [],
        subject:          parsed.subject             || 'General Knowledge',
        difficulty:       parsed.difficulty           || 'medium',
        estimatedMinutes: parsed.estimatedMinutes     || 5,
        language:         parsed.language             || 'English',
      };
    } catch (_) { /* continue */ }
  }

  // Defaults on total failure
  console.warn('[SmartTag] All providers failed — using defaults.');
  return { tags: [], subject: 'General Knowledge', difficulty: 'medium', estimatedMinutes: 5, language: 'English' };
}

// ─────────────────────────────────────────────────────────────────────────────
// PUBLIC: generateQuizFromImage (vision — Groq vision models, then Gemini vision)
// ─────────────────────────────────────────────────────────────────────────────
async function generateQuizFromImage(base64Image, mimeType, difficulty, count = 5) {
  const textPrompt = `You are a quiz generator. Analyze this image carefully and generate EXACTLY ${count} multiple-choice quiz questions based on the visible content.
Difficulty: ${difficulty}

CRITICAL INSTRUCTIONS:
1. Generate EXACTLY ${count} questions based on what you see.
2. Questions must be directly answerable from the image content.
3. Return ONLY a raw JSON array. No markdown, no extra text.

[
  {
    "question": "Question based on image content",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctIndex": 0,
    "explanation": "Explanation referencing what is visible in the image",
    "difficulty": "${difficulty}"
  }
]`;

  // ── Groq Vision models ──
  const groqVisionModels = ['llama-3.2-11b-vision-preview', 'llama-3.2-90b-vision-preview'];
  for (const model of groqVisionModels) {
    try {
      console.log(`[AI-VISION] 🔵 Groq Vision → ${model}`);
      const response = await groq.chat.completions.create({
        model,
        messages: [{
          role: 'user',
          content: [
            { type: 'image_url', image_url: { url: `data:${mimeType};base64,${base64Image}` } },
            { type: 'text', text: textPrompt },
          ],
        }],
        temperature: 0.4,
        max_tokens: 4096,
      });
      const raw    = response.choices[0].message.content.trim();
      const parsed = extractJsonArray(raw);
      if (parsed) {
        console.log(`[AI-VISION] ✅ Groq Vision/${model} — ${parsed.length} questions.`);
        return parsed;
      }
      throw new Error('Unparseable JSON from Groq Vision');
    } catch (err) {
      console.warn(`[AI-VISION] ❌ Groq Vision/${model}: ${err.message}`);
    }
  }

  // ── Gemini Vision fallback ──
  if (gemini) {
    try {
      console.log('[AI-VISION] 🟡 Gemini Vision → gemini-2.0-flash');
      const model  = gemini.getGenerativeModel({ model: 'gemini-2.0-flash' });
      const result = await model.generateContent([
        { inlineData: { data: base64Image, mimeType } },
        { text: textPrompt },
      ]);
      const raw    = result.response.text().trim();
      const parsed = extractJsonArray(raw);
      if (parsed) {
        console.log(`[AI-VISION] ✅ Gemini Vision — ${parsed.length} questions.`);
        return parsed;
      }
      throw new Error('Unparseable JSON from Gemini Vision');
    } catch (err) {
      console.warn(`[AI-VISION] ❌ Gemini Vision: ${err.message}`);
    }
  }

  throw new Error('All vision AI providers failed. Please try a text-based quiz instead.');
}

module.exports = {
  generateQuizQuestions,
  generateQuizFromText,
  generateSmartTags,
  generateQuizFromImage,
  extractQuizFromText,
};
