// models/GameSession.js
const mongoose = require("mongoose");

const gameSessionSchema = new mongoose.Schema(
  {
    quiz: { type: mongoose.Schema.Types.ObjectId, ref: "Quiz", required: true },
    host: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    mode: {
      type: String,
      enum: ["rapid", "blitz", "casual", "battle", "quiz"],
      default: "battle",
    },

    timerSeconds: { type: Number, default: 30 },
    rated: { type: Boolean, default: true },

    pin: { type: String, unique: true },
    status: {
      type: String,
      enum: ["waiting", "running", "finished"],
      default: "waiting",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("GameSession", gameSessionSchema);
