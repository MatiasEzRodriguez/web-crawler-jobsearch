import { chromium } from 'playwright';

async function analyzeAllSites() {
  const browser = await chromium.launch({ headless: true });

  const sites = [
    {
      name: 'GetOnBrd',
      url: 'https://www.getonbrd.cl/jobs/programacion',
      currentSelector: 'a.gb-results-list__item',
    },
    {
      name: 'Chumi-IT',
      url: 'https://chumi-it.com/professional/jobs/search?search=&country=2&category=&modality=',
      currentSelector: 'div.row:has(h6)',
    },
    {
      name: 'LinkedIn',
      url: 'https://www.linkedin.com/jobs/search?keywords=Desarrollador&location=Argentina&geoId=100446943',
      currentSelector: 'li.base-search-card__info',
    },
  ];

  for (const site of sites) {
    console.log(`\n${'='.repeat(50)}`);
    console.log(`${site.name}`);
    console.log(`${'='.repeat(50)}`);

    const context = await browser.newContext({
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    });
    const page = await context.newPage();

    try {
      await page.goto(site.url, { waitUntil: 'domcontentloaded', timeout: 60000 });
      await page.waitForTimeout(3000);

      const count = await page.locator(site.currentSelector).count();
      console.log(`Found ${count} elements with selector: ${site.currentSelector}`);

      if (count > 0) {
        const firstElement = await page.locator(site.currentSelector).first().innerHTML();
        console.log(`\nFirst element HTML (first 500 chars):\n`);
        console.log(firstElement.substring(0, 500));
      }
    } catch (e) {
      console.log(`Error: ${e}`);
    }

    await context.close();
  }

  await browser.close();
}

analyzeAllSites().catch(console.error);
