import { chromium } from 'playwright';

async function debugGetOnBrdExtraction() {
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

  console.log(`Found ${items.length} items\n`);
  console.log('=== First 5 Extracted Jobs ===\n');

  for (let i = 0; i < Math.min(5, items.length); i++) {
    const item = items[i];

    const title = await item.locator('.gb-results-list__title strong').textContent();
    const date = await item.locator('.opacity-half.size0').textContent();
    const href = await item.getAttribute('href');

    console.log(`Job #${i + 1}:`);
    console.log(`  Title: ${title?.trim()}`);
    console.log(`  Date: ${date?.trim()}`);
    console.log(`  Link: ${href?.substring(0, 80)}...`);

    // Check filters
    const titleLower = (title || '').toLowerCase();
    const hasKeyword = ['node', 'javascript', 'typescript', 'js', 'ts', 'python', 'java', 'react', 'angular', 'vue', 'backend', 'frontend', 'fullstack', 'sistemas', 'desarrollador', 'programador', 'soporte técnico', 'infraestructura'].some(kw => titleLower.includes(kw));
    const hasLevel = ['junior', 'trainee', 'ssr', 'semi-senior', 'associate', 'jr', 'jr.', 'semi-sr', 'semi sr', 'nivel inicial', 'iniciante', 'practicante'].some(lv => titleLower.includes(lv));

    console.log(`  Has Keyword: ${hasKeyword}`);
    console.log(`  Has Level: ${hasLevel}`);
    console.log(`  Valid: ${hasKeyword}`);
    console.log();
  }

  await browser.close();
}

debugGetOnBrdExtraction().catch(console.error);
