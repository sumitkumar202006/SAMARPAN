const mongoose = require("mongoose");
require("dotenv").config();

async function check() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB");
    
    const User = require("./models/User");
    const Quiz = require("./models/Quiz");
    
    const userCount = await User.countDocuments();
    const quizCount = await Quiz.countDocuments();
    
    console.log(`Users: ${userCount}`);
    console.log(`Quizzes: ${quizCount}`);
    
    const recentQuizzes = await Quiz.find().sort({ createdAt: -1 }).limit(5).lean();
    console.log("Recent Quizzes:", JSON.stringify(recentQuizzes, null, 2));
    
    const user = await User.findOne();
    if (user) {
      console.log(`Sample User: ${user.email} (${user._id})`);
      const userQuizzes = await Quiz.find({ author: user._id });
      console.log(`Quizzes for ${user.email}: ${userQuizzes.length}`);
    }

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

check();
