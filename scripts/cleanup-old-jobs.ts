import { PrismaClient } from '@prisma/client';
import { subDays } from 'date-fns';

const prisma = new PrismaClient();

/**
 * Cleanup script to delete jobs older than 30 days
 * This ensures the database doesn't grow indefinitely
 */
async function cleanupOldJobs(): Promise<void> {
  try {
    const thirtyDaysAgo = subDays(new Date(), 30);
    
    console.log(`[Cleanup] Starting cleanup of jobs older than 30 days (before: ${thirtyDaysAgo.toISOString()})`);
    
    // Delete jobs that were found more than 30 days ago
    const result = await prisma.job.deleteMany({
      where: {
        foundAt: {
          lt: thirtyDaysAgo,
        },
      },
    });
    
    console.log(`[Cleanup] ✅ Successfully deleted ${result.count} jobs older than 30 days`);
    
    if (result.count === 0) {
      console.log('[Cleanup] No jobs to clean up.');
    }
  } catch (error) {
    console.error('[Cleanup] ❌ Error during cleanup:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Execute the cleanup
cleanupOldJobs();
