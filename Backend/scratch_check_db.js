const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    take: 5,
    select: {
      email: true,
      role: true,
      name: true
    }
  });
  console.log('Recent Users:', users);
  
  const quizzes = await prisma.quiz.findMany({
    take: 5
  });
  console.log('Recent Quizzes Count:', quizzes.length);
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
