import prisma from '../src/utils/database';

async function run() {
  const jobs = await prisma.job.findMany({ where: { url: { contains: 'getonbrd' } }, orderBy: { postedDate: 'desc' } });
  console.log('GetOnBrd jobs saved count:', jobs.length);
  for (const j of jobs) {
    console.log(`- ID:${j.id} | ${j.title} | ${j.url} | ${j.postedDate}`);
  }
  await prisma.$disconnect();
}

run().catch(e => {
  console.error(e);
});
