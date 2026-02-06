import { JobCrawler } from './crawler/jobCrawler';
import { loadSiteConfigs, getSitesCsvPath } from './crawler/csvLoader';
import { isValidJob, isValidGetOnBrdJob } from './utils/filters';
import { parseJobDate, isDateWithinDays } from './utils/dateParser';
import { saveJob, closePrisma } from './utils/database';
import { logger } from './utils/logger';

const DAYS_TO_CHECK = 7; // Only save jobs from the last 7 days

/**
 * Determine if a job is valid based on site-specific rules
 */
function isJobValid(job: any, siteUrl: string): boolean {
  // Special filtering for GetOnBrd
  if (siteUrl.includes('getonbrd')) {
    return isValidGetOnBrdJob(job.title, job.location);
  }
  
  // Default filtering for other sites
  return isValidJob(job.title);
}

/**
 * Main crawler function
 */
async function runCrawler(): Promise<void> {
  logger.info('=== Job Web Crawler Started ===');
  logger.info(`Configuration:`);
  logger.info(`  - Days to check: ${DAYS_TO_CHECK}`);
  logger.info(`  - CSV file: ${getSitesCsvPath()}`);

  const crawler = new JobCrawler();
  let totalJobsFound = 0;
  let totalJobsSaved = 0;
  let totalJobsSkipped = 0;
  let totalErrors = 0;

  try {
    // Initialize the crawler
    await crawler.initialize();

    // Load site configurations
    let siteConfigs;
    try {
      siteConfigs = await loadSiteConfigs(getSitesCsvPath());
    } catch (error) {
      logger.error('Failed to load sites.csv. Make sure the file exists and is properly formatted.');
      throw error;
    }

    if (siteConfigs.length === 0) {
      logger.warn('No sites found in sites.csv');
      return;
    }

    // Process each site
    for (const config of siteConfigs) {
      try {
        logger.info(`\nProcessing: ${config.url}`);

        // Scrape jobs from this site
        const jobs = await crawler.scrapeJobs(config);
        totalJobsFound += jobs.length;

        // Process each job
        for (const job of jobs) {
          try {
            // Parse the posted date
            const postedDate = parseJobDate(job.postedDate);

            if (!postedDate) {
              logger.debug(`Could not parse date for: ${job.title}`, {
                dateStr: job.postedDate,
              });
              // Use today's date as fallback for sites without date info
              const fallbackDate = new Date();
              
              // Check if job matches keywords and level filters
              if (!isJobValid(job, config.url)) {
                logger.debug(`Job does not match filters: ${job.title}`);
                totalJobsSkipped++;
                continue;
              }

              // Try to save the job with today's date
              const result = await saveJob(
                job.title,
                job.company,
                job.url,
                fallbackDate
              );

              if (result) {
                logger.success(`✓ Saved: ${job.title} (ID: ${result.id})`);
                totalJobsSaved++;
              } else {
                logger.debug(`Duplicate job skipped: ${job.url}`);
                totalJobsSkipped++;
              }
              continue;
            }

            // Check if job is from the last N days
            if (!isDateWithinDays(postedDate, DAYS_TO_CHECK)) {
              logger.debug(`Job outside date range: ${job.title}`, {
                postedDate: postedDate.toISOString(),
              });
              totalJobsSkipped++;
              continue;
            }

            // Check if job matches keywords and level filters
            if (!isJobValid(job, config.url)) {
              logger.debug(`Job does not match filters: ${job.title}`);
              totalJobsSkipped++;
              continue;
            }

            // Try to save the job
            const result = await saveJob(
              job.title,
              job.company,
              job.url,
              postedDate
            );

            if (result) {
              logger.success(`✓ Saved: ${job.title} (ID: ${result.id})`);
              totalJobsSaved++;
            } else {
              logger.debug(`Duplicate job skipped: ${job.url}`);
              totalJobsSkipped++;
            }
          } catch (error) {
            logger.error(`Error processing job: ${job.title}`, error);
            totalErrors++;
          }
        }

        // Small delay between sites to be respectful to servers
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        logger.error(`Error scraping site: ${config.url}`, error);
        totalErrors++;
        // Continue with next site instead of stopping
        continue;
      }
    }

    // Final summary
    logger.info('\n=== Crawler Summary ===');
    logger.info(`Total jobs found: ${totalJobsFound}`);
    logger.success(`Total jobs saved: ${totalJobsSaved}`);
    logger.warn(`Total jobs skipped: ${totalJobsSkipped}`);
    if (totalErrors > 0) {
      logger.warn(`Total errors encountered: ${totalErrors}`);
    }

    logger.success('\n=== Job Web Crawler Completed ===');
  } catch (error) {
    logger.error('Critical error in crawler', error);
    process.exit(1);
  } finally {
    // Clean up resources
    await crawler.close();
    await closePrisma();
  }
}

// Run the crawler
runCrawler().catch(error => {
  logger.error('Uncaught error', error);
  process.exit(1);
});
