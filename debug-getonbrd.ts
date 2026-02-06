import { chromium } from 'playwright';

async function debugGetOnBrd() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  });
  const page = await context.newPage();

  await page.goto('https://www.getonbrd.cl/jobs/programacion', {
    waitUntil: 'domcontentloaded',
    timeout: 60000
  });

  await page.waitForTimeout(3000);

  const items = await page.locator('a.gb-results-list__item').all();

  console.log(`Found ${items.length} job items\n`);
  console.log('=== First 3 Items ===\n');

  for (let i = 0; i < Math.min(3, items.length); i++) {
    const item = items[i];

    // Get full HTML
    const html = await item.innerHTML();
    console.log(`\nItem #${i + 1} HTML (first 800 chars):\n`);
    console.log(html.substring(0, 800));
    console.log('\n---\n');

    // Try to extract data
    const title = await item.locator('.gb-results-list__title strong').textContent();
    const date = await item.locator('.gb-results-list__date').textContent();
    const href = await item.getAttribute('href');

    console.log(`Title: ${title}`);
    console.log(`Date: ${date}`);
    console.log(`Href: ${href}\n`);
  }

  await browser.close();
}

debugGetOnBrd().catch(console.error);
