import { chromium } from 'playwright';

const sites = [
  {
    name: 'Computrabajo',
    url: 'https://ar.computrabajo.com/empleos-de-informatica-y-telecom-en-buenos-aires-gba',
  },
  {
    name: 'GetOnBrd',
    url: 'https://www.getonbrd.cl/jobs/programacion',
  },
  {
    name: 'Chumi-IT',
    url: 'https://chumi-it.com/professional/jobs/search?search=&country=2&category=&modality=',
  },
  {
    name: 'LinkedIn',
    url: 'https://www.linkedin.com/jobs/search?keywords=Desarrollador&location=Argentina&geoId=100446943',
  },
];

async function debugSelectors() {
  const browser = await chromium.launch({ headless: false });

  for (const site of sites) {
    console.log(`\n\n=== Inspecting ${site.name} ===`);
    console.log(`URL: ${site.url}`);

    const page = await browser.newPage();
    await page.goto(site.url, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(3000);

    // Scroll to load more content
    await page.evaluate(() => window.scrollBy(0, window.innerHeight * 3));
    await page.waitForTimeout(2000);

    // Try different selectors
    const selectors = [
      'article',
      'div[class*="box_offer"]',
      'div[class*="offer"]',
      'div[data-id]',
      'div.job-card',
      'div[class*="job"]',
      'li.base-search-card__info',
      'a.gb-results-list__item',
      'div.job-listing',
      'section[data-job-id]',
      'div[role="button"]',
      '*[data-job-id]',
    ];

    for (const selector of selectors) {
      const count = await page.locator(selector).count();
      if (count > 0) {
        console.log(`✓ Found ${count} elements with: ${selector}`);
      }
    }

    // Log actual HTML sample
    const bodyHTML = await page.innerHTML('body');
    const snippet = bodyHTML.substring(0, 2000);
    console.log(`\nHTML snippet (first 2000 chars):`);
    console.log(snippet);

    await page.close();
  }

  await browser.close();
}

debugSelectors().catch(console.error);
