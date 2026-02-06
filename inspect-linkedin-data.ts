import { chromium } from 'playwright';

async function inspectLinkedInData() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  });
  const page = await context.newPage();

  console.log('Inspecting LinkedIn data...\n');

  try {
    await page.goto('https://www.linkedin.com/jobs/search?keywords=Desarrollador&location=Argentina&geoId=100446943', {
      waitUntil: 'domcontentloaded',
      timeout: 60000
    });

    await page.waitForTimeout(5000);

    const cards = await page.locator('div.base-search-card').all();
    console.log(`Found ${cards.length} job cards\n`);

    console.log('=== First 3 Jobs ===\n');

    for (let i = 0; i < Math.min(3, cards.length); i++) {
      const card = cards[i];
      
      const title = await card.locator('h3').first().textContent();
      const company = await card.locator('h4').first().textContent();
      const date = await card.locator('time').first().getAttribute('datetime');
      const link = await card.locator('a.base-card__full-link').first().getAttribute('href');

      console.log(`Job #${i + 1}:`);
      console.log(`  Title: ${title?.trim()}`);
      console.log(`  Company: ${company?.trim()}`);
      console.log(`  Date: ${date}`);
      console.log(`  Link: ${link}\n`);
    }

  } catch (error) {
    console.error('Error:', error);
  }

  await browser.close();
}

inspectLinkedInData().catch(console.error);
