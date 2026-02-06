import { JobCrawler } from '../src/crawler/jobCrawler';
import { loadSiteConfigs, getSitesCsvPath } from '../src/crawler/csvLoader';
import { isValidGetOnBrdJob } from '../src/utils/filters';
import { parseJobDate, isDateWithinDays } from '../src/utils/dateParser';
import { logger } from '../src/utils/logger';

async function run() {
  const crawler = new JobCrawler();
  try {
    await crawler.initialize();
    const configs = await loadSiteConfigs(getSitesCsvPath());
    const geton = configs.find(c => c.url.includes('getonbrd'));
    if (!geton) {
      console.error('GetOnBrd config not found in sites.csv');
      return;
    }

    logger.info(`Scraping single site for debug: ${geton.url}`);
    const jobs = await crawler.scrapeJobs(geton);
    console.log(`Found ${jobs.length} jobs. Showing first 100:`);
    for (let i = 0; i < Math.min(100, jobs.length); i++) {
      const j = jobs[i];
      const valid = isValidGetOnBrdJob(j.title, j.location, undefined, undefined);
      const parsed = parseJobDate(j.postedDate);
      const inRange = parsed ? isDateWithinDays(parsed, 7) : false;
      console.log(`${i + 1}. [${valid ? 'KEEP' : 'DROP'}] Title: ${j.title} | Location: ${j.location} | Date: ${j.postedDate} | parsed: ${parsed ? parsed.toISOString() : 'null'} | inRange: ${inRange}`);
    }
  } catch (error) {
    console.error('Debug run failed', error);
  } finally {
    await crawler.close();
  }
}

run();
