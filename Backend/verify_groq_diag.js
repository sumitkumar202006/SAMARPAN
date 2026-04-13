const Groq = require("groq-sdk");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });

async function checkGroq() {
  console.log("--- GROQ API DIAGNOSTIC ---");
  console.log("Using API Key:", process.env.GROQ_API_KEY ? "EXISTS" : "MISSING");
  
  const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY,
  });

  try {
    console.log("Sending test request to lama-3.1-8b-instant...");
    const response = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [{ role: "user", content: "Say 'OK' if you can read this." }],
      max_tokens: 10
    });
    console.log("✅ API Success! Response:", response.choices[0].message.content);
  } catch (err) {
    console.error("❌ API ERROR:", err.name, "-", err.message);
    if (err.status) console.error("Status Code:", err.status);
  }
}

checkGroq();
