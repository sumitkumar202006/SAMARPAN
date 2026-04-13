const mongoose = require("mongoose");

const questionSchema = new mongoose.Schema(
  {
    question: String,
    options: [String],
    correctIndex: Number,
    explanation: String,
    difficulty: { type: String, enum: ["easy", "medium", "hard"], default: "medium" }
  },
  { _id: false }
);

const quizSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    topic: { type: String, trim: true, index: true },
    author: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true },
    questions: [questionSchema],
    aiGenerated: { type: Boolean, default: false },
    tags: [{ type: String, trim: true }],
    
    // Zenith metadata
    difficulty: { 
      type: String, 
      enum: ["easy", "medium", "hard", "elite"], 
      default: "medium",
      index: true
    },
    playCount: { type: Number, default: 0, index: -1 },
    isPublished: { type: Boolean, default: true, index: true },
  },
  { timestamps: true }
);

// Search optimization index
quizSchema.index({ topic: 1, difficulty: 1, playCount: -1 });

module.exports = mongoose.model("Quiz", quizSchema);
