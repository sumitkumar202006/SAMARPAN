const prisma = require('./db');

/**
 * Generates a unique username based on name or email
 * Example: "Maury Nexus" -> "maury_nexus_12s4"
 */
async function generateUniqueUsername(base) {
  const cleanBase = base.toLowerCase().replace(/[^a-z0-9]/g, '_').substring(0, 15);
  let isUnique = false;
  let username = cleanBase;
  let counter = 0;

  while (!isUnique) {
    const suffix = counter === 0 ? '' : `_${Math.floor(Math.random() * 10000).toString(16)}`;
    const candidate = `${cleanBase}${suffix}`.substring(0, 20);
    
    const existing = await prisma.user.findUnique({
      where: { username: candidate }
    });

    if (!existing) {
      username = candidate;
      isUnique = true;
    }
    counter++;
    if (counter > 10) { // Fallback to random
        username = `user_${Math.random().toString(36).substring(2, 8)}`;
        isUnique = true;
    }
  }

  return username;
}

module.exports = { generateUniqueUsername };
