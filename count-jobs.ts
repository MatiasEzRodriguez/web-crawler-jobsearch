import { PrismaClient } from '@prisma/client';

async function countJobs() {
  const prisma = new PrismaClient();
  
  try {
    const total = await prisma.job.count();
    console.log(`Total jobs in database: ${total}`);
    
    // Group by company
    const jobs = await prisma.job.groupBy({
      by: ['company'],
      _count: {
        id: true
      }
    });
    
    console.log('\nJobs by company:');
    for (const job of jobs) {
      console.log(`  - ${job.company}: ${job._count.id}`);
    }
  } finally {
    await prisma.$disconnect();
  }
}

countJobs().catch(console.error);
