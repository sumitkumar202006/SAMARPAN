const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const User = require('../models/User');
const Quiz = require('../models/Quiz');

const sampleQuizzes = [
  {
    title: "React Mastery: Advanced Rendering",
    topic: "React",
    difficulty: "hard",
    playCount: 450,
    tags: ["React", "Performance", "Frontend"],
    questions: [
      {
        question: "How does the Concurrent Renderer prioritize updates in React 18+?",
        options: ["Strict FIFO queue", "Using transition priorities (startTransition)", "Random selection", "Only based on component depth"],
        correctIndex: 1,
        explanation: "React uses Lanes to differentiate between high-priority (input) and low-priority (transitions).",
        difficulty: "hard"
      }
    ]
  },
  {
    title: "Next.js 16 Architecture",
    topic: "Next.js",
    difficulty: "elite",
    playCount: 1200,
    tags: ["Next.js", "Architecture", "Vercel"],
    questions: [
      {
        question: "What is the primary difference between a Server Component and a Client Component in Turbopack?",
        options: ["Client components don't support state", "Server components never send JS to the browser", "Turbopack ignores client components", "Server components require a separate binary"],
        correctIndex: 1,
        explanation: "Server components execute exclusively on the server and stream a JSON-like representation to the client.",
        difficulty: "hard"
      }
    ]
  },
  {
    title: "Tailwind v4: The Engine Rewrite",
    topic: "CSS",
    difficulty: "medium",
    playCount: 890,
    tags: ["Tailwind", "CSS", "Styling"],
    questions: [
      {
        question: "Tailwind v4's new 'Lightning CSS' core improves build speed by roughly what factor?",
        options: ["2x", "10x", "No difference", "1.5x"],
        correctIndex: 1,
        explanation: "Lightning CSS provides massive performance gains over previous JavaScript-based PostCSS implementations.",
        difficulty: "medium"
      }
    ]
  },
  {
    title: "MongoDB: Extreme Aggregation",
    topic: "Database",
    difficulty: "hard",
    playCount: 320,
    tags: ["MongoDB", "Backend", "Performance"],
    questions: [
      {
        question: "Which stage in an aggregation pipeline is most effective for reducing the dataset size before a join?",
        options: ["$lookup", "$match", "$group", "$project"],
        correctIndex: 1,
        explanation: "Filtering early with $match prevents unnecessary processing of documents down the pipeline.",
        difficulty: "medium"
      }
    ]
  },
  {
    title: "AI Forge: Model Fine-tuning",
    topic: "AI",
    difficulty: "elite",
    playCount: 1540,
    tags: ["AI", "LLM", "Deep Learning"],
    questions: [
      {
        question: "What is the primary role of LoRA in model fine-tuning?",
        options: ["Replacing the entire weights matrix", "Adding low-rank adapters to pre-trained weights", "Increasing model size by 2x", "Speeding up inference only"],
        correctIndex: 1,
        explanation: "Low-Rank Adaptation (LoRA) allows training a small subset of parameters for specific tasks.",
        difficulty: "hard"
      }
    ]
  }
];

const grandmasters = [
  {
    name: "Magnus Techson",
    email: "magnus@mit.edu",
    college: "MIT (Massachusetts Institute of Technology)",
    rating: 3200,
    course: "Computer Science & AI"
  },
  {
    name: "Sergey Dev",
    email: "sergey@stanford.edu",
    college: "Stanford University",
    rating: 2950,
    course: "Electrical Engineering"
  },
  {
    name: "Anish Code",
    email: "anish@iitk.ac.in",
    college: "IIT Kanpur",
    rating: 2880,
    course: "Computer Science"
  },
  {
    name: "Fiona Framer",
    email: "fiona@cmu.edu",
    college: "Carnegie Mellon",
    rating: 3050,
    course: "Human-Computer Interaction"
  },
  {
    name: "Vercel Master",
    email: "shubh@berkeley.edu",
    college: "UC Berkeley",
    rating: 2810,
    course: "Distributed Systems"
  }
];

async function seed() {
  try {
    console.log('--- PROJECT ZENITH: Elite Optimization & Mega-Seed ---');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to Atlas.');

    // Clear existing to ensure "Best" state from scratch
    await User.deleteMany({});
    await Quiz.deleteMany({});
    console.log('✅ Collections reset to Zero-Point.');

    // Create Admin
    const salt = await bcrypt.genSalt(10);
    const pass = await bcrypt.hash('agent-pass-2026', salt);
    
    const admin = await new User({
      name: "Elite Commander",
      email: "admin@samarpan.com",
      passwordHash: pass,
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Commander",
      globalRating: 2500,
      xp: 45000,
      college: "International Gaming League",
      course: "Neural Strategy"
    }).save();
    console.log('✅ Commander Initialized.');

    // Create Grandmasters (Ultra-High Ratings)
    console.log('Deploying the Pro-League Grandmasters...');
    for (const gm of grandmasters) {
      await new User({
        name: gm.name,
        email: gm.email,
        college: gm.college,
        course: gm.course,
        globalRating: gm.rating,
        xp: gm.rating * 10,
        passwordHash: pass,
        avatar: `https://api.dicebear.com/7.x/pixel-art/svg?seed=${gm.name}`
      }).save();
    }
    console.log(`✅ ${grandmasters.length} Grandmasters Deployed.`);

    // Create Quizzes
    console.log('Seeding Professional Content Hub...');
    for (const q of sampleQuizzes) {
      await new Quiz({
        ...q,
        author: admin._id
      }).save();
    }
    console.log(`✅ ${sampleQuizzes.length} Professional Quizzes Seeding.`);

    console.log('\n--- PROJECT ZENITH COMPLETE ---');
    console.log('The Arena is now optimized and populated with the Best data.');
    process.exit(0);
  } catch (err) {
    console.error('❌ ZENITH FAILED:', err);
    process.exit(1);
  }
}

seed();
