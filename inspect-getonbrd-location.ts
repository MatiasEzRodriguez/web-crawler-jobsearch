import { chromium } from 'playwright';

async function inspectGetOnBrdLocation() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  });
  const page = await context.newPage();

  console.log('Inspecting GetOnBrd location/modality...\n');

  try {
    await page.goto('https://www.getonbrd.cl/jobs/programacion', {
      waitUntil: 'domcontentloaded',
      timeout: 60000
    });

    await page.waitForTimeout(3000);

    const items = await page.locator('a.gb-results-list__item').all();
    console.log(`Found ${items.length} items\n`);

    console.log('=== First 5 Items - Full HTML ===\n');

    for (let i = 0; i < Math.min(5, items.length); i++) {
      const item = items[i];
      const html = await item.innerHTML();
      
      const title = await item.locator('.gb-results-list__title strong').textContent();
      const location = await item.locator('.location').textContent();
      const perks = await item.locator('.gb-perks-list i').count();

      console.log(`\n--- Item #${i + 1}: ${title?.trim()} ---`);
      console.log(`Location text: "${location?.trim()}"`);
      console.log(`Perks count: ${perks}`);
      
      // Show HTML snippet
      const locationSection = html.substring(
        html.indexOf('location'),
        html.indexOf('location') + 300
      );
      console.log(`Location HTML: ${locationSection}`);
    }

  } catch (error) {
    console.error('Error:', error);
  }

  await browser.close();
}

inspectGetOnBrdLocation().catch(console.error);
