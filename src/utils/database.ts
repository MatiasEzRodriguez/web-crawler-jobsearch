import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Checks if a job URL already exists in the database
 * Used for deduplication
 */
export async function jobExists(url: string): Promise<boolean> {
  const job = await prisma.job.findUnique({
    where: { url },
  });
  return !!job;
}

/**
 * Saves a job to the database
 * Returns null if job already exists (duplicate)
 */
export async function saveJob(
  title: string,
  company: string,
  url: string,
  postedDate: Date
): Promise<{ id: number } | null> {
  try {
    // Check for duplicates
    if (await jobExists(url)) {
      return null; // Duplicate found
    }

    const job = await prisma.job.create({
      data: {
        title,
        company,
        url,
        postedDate,
      },
    });

    return { id: job.id };
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.includes('Unique constraint failed')
    ) {
      return null; // Duplicate
    }
    throw error;
  }
}

/**
 * Retrieves all jobs from the database
 */
export async function getAllJobs() {
  return await prisma.job.findMany({
    orderBy: { postedDate: 'desc' },
  });
}

/**
 * Retrieves jobs from the last N days
 */
export async function getJobsFromLastDays(days: number) {
  const since = new Date();
  since.setDate(since.getDate() - days);

  return await prisma.job.findMany({
    where: {
      postedDate: {
        gte: since,
      },
    },
    orderBy: { postedDate: 'desc' },
  });
}

/**
 * Clears all jobs from the database (use with caution)
 */
export async function clearAllJobs() {
  return await prisma.job.deleteMany({});
}

/**
 * Closes the Prisma connection
 */
export async function closePrisma() {
  await prisma.$disconnect();
}

export default prisma;
