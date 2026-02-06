import { chromium } from 'playwright';

async function debugExtractedJobs() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  });
  const page = await context.newPage();

  await page.goto('https://ar.computrabajo.com/empleos-de-informatica-y-telecom-en-buenos-aires-gba', {
    waitUntil: 'domcontentloaded',
    timeout: 60000
  });

  await page.waitForTimeout(3000);

  const articles = await page.locator('article').all();

  console.log(`\n=== Analyzed ${articles.length} Job Listings ===\n`);

  for (let i = 0; i < Math.min(5, articles.length); i++) {
    const article = articles[i];

    const title = await article.locator('h2 a').textContent();
    const date = await article.locator('p.fc_aux').textContent();
    const href = await article.locator('h2 a').getAttribute('href');

    console.log(`Job #${i + 1}:`);
    console.log(`  Title: ${title?.trim()}`);
    console.log(`  Date: ${date?.trim()}`);
    console.log(`  Link: ${href?.substring(0, 100)}...`);

    // Check if would pass filters
    const titleLower = (title || '').toLowerCase();
    const hasKeyword = ['node', 'javascript', 'typescript', 'js', 'ts', 'python', 'java', 'react', 'angular', 'vue', 'backend', 'frontend', 'fullstack', 'sistemas', 'desarrollador', 'programador', 'soporte técnico', 'infraestructura'].some(kw => titleLower.includes(kw));
    const hasLevel = ['junior', 'trainee', 'ssr', 'semi-senior', 'associate', 'jr', 'jr.', 'semi-sr', 'semi sr', 'nivel inicial', 'iniciante', 'practicante'].some(lv => titleLower.includes(lv));

    console.log(`  Has Keyword: ${hasKeyword}`);
    console.log(`  Has Level: ${hasLevel}`);
    console.log();
  }

  await browser.close();
}

debugExtractedJobs().catch(console.error);
