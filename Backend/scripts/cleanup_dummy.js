/**
 * cleanup_dummy.js
 * Script to purge dummy test accounts while preserving real user data.
 */
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function purgeDummyUsers() {
  console.log("🚀 Starting Identity Purge...");

  const dummyDomains = [
    '@example.com',
    '@test.com',
    '@dummy.in',
    '@temp.com',
    '@fake.org'
  ];

  try {
    // 1. Identify users with dummy emails or no activity
    const usersToDelete = await prisma.user.findMany({
      where: {
        OR: dummyDomains.map(domain => ({
          email: { endsWith: domain }
        }))
      },
      select: { id: true, email: true, name: true }
    });

    console.log(`🔍 Found ${usersToDelete.length} dummy identities to decommission.`);

    if (usersToDelete.length === 0) {
      console.log("✅ Digital core is already clean! No dummy data found.");
      return;
    }

    // 2. Delete associated records first (AnswerLogs, RatingHistory, etc.)
    // Note: Quiz and GameSessions might have foreign key constraints
    const userIds = usersToDelete.map(u => u.id);

    // CASCADE-style manual cleanup (Prisma doesn't auto-cascade on all relations by default)
    console.log("⚔️  Decommissioning associated telemetry data...");
    
    await prisma.ratingHistory.deleteMany({ where: { userId: { in: userIds } } });
    await prisma.answerLog.deleteMany({ where: { userId: { in: userIds } } });
    
    // We might want to keep Quizzes but set author to null, or delete them
    // For "Dummy Cleanup", we usually delete the quizzes too
    await prisma.quiz.deleteMany({ where: { authorId: { in: userIds } } });
    await prisma.gameSession.deleteMany({ where: { hostId: { in: userIds } } });

    // 3. Delete the users
    const result = await prisma.user.deleteMany({
      where: { id: { in: userIds } }
    });

    console.log(`🎯 Successfully purged ${result.count} dummy user records.`);
    console.log("🌐 System core integrity restored.");

  } catch (error) {
    console.error("❌ Critical Purge Failure:", error);
  } finally {
    await prisma.$disconnect();
  }
}

purgeDummyUsers();
