const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

// Import Models
const User = require('../models/User');
const Quiz = require('../models/Quiz');

const sampleQuizzes = [
  {
    title: "React Mastery: The Hook Architecture",
    topic: "React",
    tags: ["React", "Frontend", "Advanced"],
    questions: [
      {
        question: "What is the primary benefit of using useMemo() in a complex calculation?",
        options: [
          "To force a re-render of the parent",
          "To memoize a value and avoid expensive recalculations on every render",
          "To store state persistently between sessions",
          "To handle side effects like API calls"
        ],
        correctIndex: 1,
        explanation: "useMemo caches the result of an expensive calculation so it only runs when dependencies change.",
        difficulty: "medium"
      },
      {
        question: "Which hook should be used for operations that must happen AFTER the browser has finished painting?",
        options: ["useLayoutEffect", "useEffect", "useInsertionEffect", "useState"],
        correctIndex: 1,
        explanation: "useEffect is deferred until after the paint, making it suitable for non-blocking operations.",
        difficulty: "easy"
      }
    ]
  },
  {
    title: "Next.js 16: The Turbopack Era",
    topic: "Next.js",
    tags: ["Next.js", "Server-Side", "Vercel"],
    questions: [
      {
        question: "How does Turbopack differ from Webpack in development?",
        options: [
          "It uses a Rust-based engine for ultra-fast incremental builds",
          "It is written in Python for easier debugging",
          "It only supports client-side components",
          "It requires a separate license to use"
        ],
        correctIndex: 0,
        explanation: "Turbopack is a Rust-based successor to Webpack designed for modern Next.js scalability.",
        difficulty: "hard"
      }
    ]
  },
  {
    title: "Elite Recruitment: Arena Protocols",
    topic: "Elite Recruitment",
    tags: ["Culture", "Onboarding", "Arena"],
    questions: [
      {
        question: "What is the starting Elo for a standard Level 1 Agent?",
        options: ["1000", "1200", "1500", "500"],
        correctIndex: 1,
        explanation: "As per the Recruitment Briefing, all Level 1 Agents begin with a 1200 ELO Starting Package.",
        difficulty: "easy"
      }
    ]
  }
];

async function seed() {
  try {
    console.log('--- PROJECT GENESIS: Database Restoration ---');
    console.log('Connecting to Atlas Cluster...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connection established.');

    // 1. Clean existing data (safety first)
    console.log('Clearing existing documents...');
    await User.deleteMany({});
    await Quiz.deleteMany({});
    console.log('✅ Collections cleared.');

    // 2. Create Elite Admin User
    console.log('Creating Elite Administrator...');
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash('agent-pass-2026', salt);
    
    const admin = new User({
      name: "Elite Commander",
      email: "admin@samarpan.com",
      passwordHash: passwordHash,
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Commander",
      globalRating: 2500,
      xp: 15000,
      college: "Global Gaming Institute",
      course: "Neural Gaming Strategy",
      dob: new Date('1998-05-15')
    });
    
    const savedAdmin = await admin.save();
    console.log(`✅ Admin Created: ${savedAdmin.email} (Password: agent-pass-2026)`);

    // 3. Create Quizzes
    console.log('Seeding Premium Quizzes...');
    for (const quizData of sampleQuizzes) {
      const quiz = new Quiz({
        ...quizData,
        author: savedAdmin._id
      });
      await quiz.save();
    }
    console.log(`✅ ${sampleQuizzes.length} Quizzes Seeded.`);

    console.log('\n--- RESTORATION COMPLETE ---');
    console.log('Arena is now populated with real-fidelity data.');
    process.exit(0);
  } catch (err) {
    console.error('❌ SEEDING FAILED:', err);
    process.exit(1);
  }
}

seed();
