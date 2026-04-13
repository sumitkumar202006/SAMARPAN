const mongoose = require("mongoose");

const ratingHistorySchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    game: { type: mongoose.Schema.Types.ObjectId, ref: "GameSession" },
    mode: String,
    before: Number,
    after: Number,
    delta: Number
  },
  { timestamps: true }
);

// Performance index for progress charts
ratingHistorySchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model("RatingHistory", ratingHistorySchema);
