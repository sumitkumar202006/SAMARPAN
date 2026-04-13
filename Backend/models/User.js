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
    name: { type: String, required: true, trim: true },
    email: { 
      type: String, 
      required: true, 
      unique: true, 
      trim: true, 
      lowercase: true,
      index: true 
    },

    // normal signup / login 
    passwordHash: { type: String },

    avatar: { type: String },        
    provider: { type: String },    
    googleId: { type: String },
    facebookId: { type: String },

    // rating system
    globalRating: { type: Number, default: 1200, min: 0, index: -1 },
    ratings: {
      rapid: { type: Number, default: 1200, min: 0 },
      blitz: { type: Number, default: 1200, min: 0 },
      casual: { type: Number, default: 1200, min: 0 },
    },
    xp: { type: Number, default: 0, min: 0, index: -1 },

    // academic & personal metadata
    college: { type: String, trim: true },
    course: { type: String, trim: true },
    dob: { type: Date },
  },
  { timestamps: true }
);

// Compound index for academic searches
userSchema.index({ college: 1, globalRating: -1 });

module.exports = mongoose.model("User", userSchema);

