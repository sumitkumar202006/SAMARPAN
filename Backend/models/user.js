const mongoose = require("mongoose");

const modeRatingSchema = new mongoose.Schema(
  {
    mode: { type: String, enum: ["rapid", "blitz", "casual"], required: true },
    rating: { type: Number, default: 1200 },
    peak: { type: Number, default: 1200 }
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },

    // normal signup / login 
    passwordHash: { type: String },

    avatar: { type: String },        
    provider: { type: String },    
    googleId: { type: String },
    facebookId: { type: String },

    // rating system
    globalRating: { type: Number, default: 1200 },
    ratings: {
      rapid: { type: Number, default: 1200 },
      blitz: { type: Number, default: 1200 },
      casual: { type: Number, default: 1200 },
    },
    xp: { type: Number, default: 0 },

    // academic & personal metadata
    college: { type: String },
    course: { type: String },
    dob: { type: Date },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);

