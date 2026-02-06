import { chromium } from 'playwright';

async function findSelectors() {
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

  console.log('=== GetOnBrd Structure ===\n');

  // Get first item
  const firstItem = await page.locator('a.gb-results-list__item').first().innerHTML();
  console.log(firstItem);

  await browser.close();
}

findSelectors().catch(console.error);
