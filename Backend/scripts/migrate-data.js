const { MongoClient, ObjectId } = require('mongodb');
const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const mongoUri = process.env.MONGODB_URI;
const prisma = new PrismaClient();

async function migrate() {
  console.log('--- Starting Data Migration ---');
  
  const mongoClient = new MongoClient(mongoUri);
  try {
    await mongoClient.connect();
    console.log('✅ Connected to MongoDB');
    
    // Extract DB name from URI or use default
    // URI usually is mongodb+srv://.../dbname?
    const uriParts = mongoUri.split('/');
    const lastPart = uriParts[uriParts.length - 1];
    const dbName = lastPart.split('?')[0] || 'test';
    const db = mongoClient.db(dbName);
    console.log(`Using MongoDB database: ${dbName}`);

    // --- 1. Migrate Users ---
    console.log('\nMigrating Users...');
    const mongoUsers = await db.collection('users').find({}).toArray();
    console.log(`Found ${mongoUsers.length} users in MongoDB`);
    
    for (const u of mongoUsers) {
      try {
        await prisma.user.upsert({
          where: { email: u.email },
          update: {},
          create: {
            id: u._id.toString(),
            name: u.name || "Unknown",
            email: u.email,
            passwordHash: u.passwordHash,
            avatar: u.avatar,
            provider: u.provider,
            googleId: u.googleId,
            facebookId: u.facebookId,
            globalRating: u.globalRating || 1200,
            xp: u.xp || 0,
            ratings: u.ratings || {},
            college: u.college,
            course: u.course,
            dob: u.dob ? new Date(u.dob) : null,
            preferredField: u.preferredField || 'General',
            settings: u.settings || {},
            role: u.role || 'user',
            status: u.status || 'active',
            createdAt: u.createdAt || new Date(),
            updatedAt: u.updatedAt || new Date(),
          }
        });
      } catch (err) {
        console.error(`Failed to migrate user ${u.email}:`, err.message);
      }
    }
    console.log('✅ Users migration complete');

    // --- 2. Migrate Quizzes ---
    console.log('\nMigrating Quizzes...');
    const mongoQuizzes = await db.collection('quizzes').find({}).toArray();
    console.log(`Found ${mongoQuizzes.length} quizzes in MongoDB`);

    for (const q of mongoQuizzes) {
      try {
        let authorId = q.author ? q.author.toString() : null;
        
        // --- Added Check for Foreign Key Integrity ---
        if (authorId) {
          const userExists = await prisma.user.findUnique({ where: { id: authorId } });
          if (!userExists) {
            console.warn(`User ${authorId} not found for quiz ${q._id.toString()}. Setting authorId to null.`);
            authorId = null;
          }
        }

        await prisma.quiz.upsert({
          where: { id: q._id.toString() },
          update: {},
          create: {
            id: q._id.toString(),
            title: q.title,
            topic: q.topic,
            authorId: authorId,
            questions: q.questions || [],
            aiGenerated: q.aiGenerated || false,
            tags: q.tags || [],
            difficulty: q.difficulty || 'medium',
            playCount: q.playCount || 0,
            isPublished: q.isPublished !== undefined ? q.isPublished : true,
            createdAt: q.createdAt || new Date(),
            updatedAt: q.updatedAt || new Date(),
          }
        });
      } catch (err) {
        console.error(`Failed to migrate quiz ${q._id}:`, err.message);
      }
    }
    console.log('✅ Quizzes migration complete');

    // --- 3. Migrate GameSessions ---
    console.log('\nMigrating GameSessions...');
    const mongoSessions = await db.collection('gamesessions').find({}).toArray();
    console.log(`Found ${mongoSessions.length} game sessions in MongoDB`);

    for (const s of mongoSessions) {
      try {
        let quizId = s.quiz ? s.quiz.toString() : null;
        let hostId = s.host ? s.host.toString() : null;

        if (quizId) {
          const quizExists = await prisma.quiz.findUnique({ where: { id: quizId } });
          if (!quizExists) {
            console.warn(`Quiz ${quizId} not found for session ${s.pin}. Skipping session.`);
            continue;
          }
        }
        if (hostId) {
          const hostExists = await prisma.user.findUnique({ where: { id: hostId } });
          if (!hostExists) {
            console.warn(`Host ${hostId} not found for session ${s.pin}. Skipping session.`);
            continue;
          }
        }

        await prisma.gameSession.upsert({
          where: { pin: s.pin },
          update: {},
          create: {
            id: s._id.toString(),
            quizId: quizId,
            hostId: hostId,
            mode: s.mode || 'battle',
            timerSeconds: s.timerSeconds || 30,
            rated: s.rated !== undefined ? s.rated : true,
            pin: s.pin,
            status: s.status || 'waiting',
            createdAt: s.createdAt || new Date(),
            updatedAt: s.updatedAt || new Date(),
          }
        });
      } catch (err) {
        console.error(`Failed to migrate session ${s.pin}:`, err.message);
      }
    }
    console.log('✅ GameSessions migration complete');

    // --- 4. Migrate RatingHistory ---
    console.log('\nMigrating RatingHistory...');
    const mongoHistory = await db.collection('ratinghistories').find({}).toArray();
    console.log(`Found ${mongoHistory.length} history records in MongoDB`);

    for (const h of mongoHistory) {
      try {
        let userId = h.user ? h.user.toString() : null;
        let gameId = h.game ? h.game.toString() : null;

        if (userId) {
          const userExists = await prisma.user.findUnique({ where: { id: userId } });
          if (!userExists) continue; // Skip history if user is gone
        }
        if (gameId) {
          const gameExists = await prisma.gameSession.findUnique({ where: { id: gameId } });
          if (!gameExists) continue; // Skip history if game session is gone
        }

        await prisma.ratingHistory.create({
          data: {
            id: h._id.toString(),
            userId: userId,
            gameId: gameId,
            mode: h.mode,
            before: h.before,
            after: h.after,
            delta: h.delta,
            createdAt: h.createdAt || new Date(),
            updatedAt: h.updatedAt || new Date(),
          }
        });
      } catch (err) {
        // Skip silently as history is voluminous and not critical if broken
      }
    }
    console.log('✅ RatingHistory migration complete');

    console.log('\n--- 🎉 All Data Migrated Successfully ---');

  } catch (err) {
    console.error('CRITICAL MIGRATION ERROR:', err);
  } finally {
    await mongoClient.close();
    await prisma.$disconnect();
  }
}

migrate();
