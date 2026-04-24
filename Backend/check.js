const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  try {
    const result = await prisma.$queryRaw`SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'`;
    const tables = result.map(r => r.table_name);
    console.log("Tables in database:");
    console.log(tables);
    
    if (tables.includes('Subscription') && tables.includes('UsageQuota') && tables.includes('DeviceTrial')) {
      console.log("\nSUCCESS! All subscription tables exist.");
    } else {
      console.log("\nWARNING: Some subscription tables are missing.");
    }
  } catch (e) {
    console.error("Database connection error:", e);
  } finally {
    await prisma.$disconnect();
  }
}

check();
