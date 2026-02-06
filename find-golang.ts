import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function findGolangJobs() {
  const jobs = await prisma.job.findMany({
    where: {
      title: {
        contains: 'Golang'
      }
    },
    select: {
      id: true,
      title: true,
      company: true,
    }
  });

  console.log(`Found ${jobs.length} Golang jobs:`);
  jobs.forEach(job => {
    console.log(`  [${job.id}] ${job.title} (${job.company})`);
  });

  await prisma.$disconnect();
}

findGolangJobs().catch(console.error);
