import { JobCrawler } from '../src/crawler/jobCrawler';
import { loadSiteConfigs, getSitesCsvPath } from '../src/crawler/csvLoader';

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

    const browserJobs = await crawler.scrapeJobs(geton);
    console.log(`Scraped ${browserJobs.length} jobs (high-level). Now fetching raw HTML of first 5 cards...`);

    // Re-open a page to fetch raw card HTML and selectors
    // We'll use Playwright directly via the crawler internals
    const context: any = (crawler as any).browser.newContext ? await (crawler as any).browser.newContext() : null;
    const page = context ? await context.newPage() : null;
    if (!page) {
      console.error('Failed to create page for inspection');
      return;
    }
    await page.goto(geton.url, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);
    const cards = await page.$$(geton.job_card_selector);
    console.log(`Found ${cards.length} elements with job_card_selector`);
    for (let i = 0; i < Math.min(5, cards.length); i++) {
      const html = await cards[i].evaluate((n: any) => n.innerHTML);
      const hasLocation = await cards[i].evaluate((n: any) => !!n.querySelector('span.location'));
      const locationText = await cards[i].evaluate((n: any) => {
        const el = n.querySelector('span.location');
        return el ? el.innerText : null;
      });
      console.log(`--- Card ${i + 1} ---`);
      console.log('has span.location:', hasLocation);
      console.log('locationText:', locationText);
      console.log('innerHTML snippet:', html.substring(0, 400));
    }

    if (page) await page.close();
    if (context) await context.close();
  } catch (e) {
    console.error(e);
  } finally {
    await crawler.close();
  }
}

run();
