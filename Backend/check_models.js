const Groq = require("groq-sdk");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });

async function checkModels() {
  const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY,
  });

  try {
    console.log("Fetching available models...");
    const models = await groq.models.list();
    console.log("--- MODELS ---");
    models.data.forEach(m => console.log("-", m.id));
  } catch (err) {
    console.error("Failed to fetch models:", err.message);
  }
}

checkModels();
