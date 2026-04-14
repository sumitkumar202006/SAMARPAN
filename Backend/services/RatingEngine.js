const prisma = require("./db");

/**
 * RatingEngine - Handles XP calculation and streak logic
 */
class RatingEngine {
  /**
   * Calculate XP for a player based on performance
   */
  static async processGameResults(pin, players, rated = true) {
    console.log(`[RatingEngine] Processing results for PIN: ${pin} (Rated: ${rated})`);
    
    try {
      const dbSession = await prisma.gameSession.findUnique({
        where: { pin },
        include: { quiz: true }
      });

      if (!dbSession) return;

      const playerScores = Object.values(players).filter(p => !p.isHost);
      const totalQuestions = dbSession.quiz.questions.length;

      // Sort by score to find winners
      const sortedPlayers = [...playerScores].sort((a, b) => b.score - a.score);
      const topScore = sortedPlayers[0]?.score || 0;

      for (const player of playerScores) {
        // Skip guest players or players without user records in socket state
        // In this implementation, players have IDs if they are logged in
        if (!player.userId && !player.email) continue;

        const isWinner = player.score === topScore && topScore > 0;
        const xpGain = this.calculateXPGain(player, totalQuestions, isWinner);
        
        // Find user by email (most reliable in our current context)
        const user = await prisma.user.findFirst({
          where: { 
            OR: [
              { email: player.email || "" },
              { name: player.name } // Fallback to name if email missing in socket player object
            ]
          }
        });

        if (user) {
          await this.updateUserStats(user, xpGain, rated);
        }
      }

      // Update Session status in DB
      await prisma.gameSession.update({
        where: { id: dbSession.id },
        data: { status: 'finished' }
      });

    } catch (err) {
      console.error("[RatingEngine] Error processing results:", err);
    }
  }

  static calculateXPGain(player, totalQuestions, isWinner) {
    let xp = 20; // Base participation XP
    
    // Accuracy bonus: 2 XP per 10% accuracy
    const accuracy = player.score / (totalQuestions * 150); // Rough estimate based on scoring logic
    xp += Math.round(accuracy * 50);

    // Winner bonus
    if (isWinner) xp += 50;

    return Math.max(10, Math.min(200, xp));
  }

  static async updateUserStats(user, xpGain, rated) {
    const now = new Date();
    let { dailyStreak, lastPlayedAt, xp, globalRating } = user;

    // 1. Streak Logic
    if (!lastPlayedAt) {
      dailyStreak = 1;
    } else {
      const diffInHours = (now - new Date(lastPlayedAt)) / (1000 * 60 * 60);
      
      if (diffInHours > 48) {
        // Reset streak if missed more than a day
        dailyStreak = 1;
      } else if (diffInHours >= 24) {
        // Increment streak if played on a new day
        dailyStreak += 1;
      }
      // If played multiple times on the same day (<24h), keep streak as is
    }

    // 2. Rating Logic (XP based, simple)
    // Always update XP regardless of rated status
    const newXp = (xp || 0) + xpGain;
    
    // Only update Global Rating if it was a RATED session
    let newRating = globalRating || 1200;
    if (rated) {
      // In an XP system, rating can just be a factor of XP or a separate competitive score
      // Here we increment rating by a smaller amount for ranked matches
      newRating += Math.floor(xpGain / 4);
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        xp: newXp,
        globalRating: newRating,
        dailyStreak,
        lastPlayedAt: now
      }
    });

    console.log(`[RatingEngine] Updated User ${user.email}: +${xpGain}XP, Streak: ${dailyStreak}, Rating: ${newRating}`);
  }
}

module.exports = RatingEngine;
