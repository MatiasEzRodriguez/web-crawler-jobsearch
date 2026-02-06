import { chromium } from 'playwright';

async function findDateSelector() {
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

  // Get full article HTML
  const fullHTML = await page.locator('article').first().innerHTML();

  console.log('===== FULL FIRST ARTICLE HTML =====\n');
  console.log(fullHTML);
  console.log('\n===========================================\n');

  // Try to find date patterns
  console.log('Looking for date-related elements:\n');
  
  const dateSelectors = [
    'span.fc_aux',
    'span[class*="date"]',
    'span[class*="fecha"]',
    'span[class*="time"]',
    'span[class*="hace"]',
    'div[class*="date"]',
    'time',
    '.fechaHasta',
    '.fechaCreacion',
    'article span:contains("Hace")',
  ];

  for (const sel of dateSelectors) {
    try {
      const count = await page.locator(`article ${sel}`).count();
      if (count > 0) {
        const text = await page.locator(`article ${sel}`).first().textContent();
        console.log(`✓ ${sel}: "${text}"`);
      }
    } catch (e) {
      // Ignore invalid selectors
    }
  }

  // Get all text nodes to find where the date is
  console.log('\n\nAll text content in first article:');
  const allText = await page.locator('article').first().allTextContents();
  console.log(allText.join('\n---\n'));

  await browser.close();
}

findDateSelector().catch(console.error);
