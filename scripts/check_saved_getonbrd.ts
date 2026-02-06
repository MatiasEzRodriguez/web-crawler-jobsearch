import { getAllJobs } from '../src/utils/database';

async function run() {
  const jobs = await getAllJobs();
  const samples = [
    'Full-Stack Developer – React + Java',
    'Full-Stack Developer (Java + Angular)',
    'Marketing Platform Engineer',
  ];

  for (const s of samples) {
    const found = jobs.find(j => j.title && j.title.includes(s));
    console.log(`${s}: ${found ? 'FOUND in DB (ID ' + found.id + ')' : 'NOT FOUND'}`);
  }

  console.log('Total jobs in DB:', jobs.length);
}

run().catch(e => {
  console.error(e);
});
