import { chromium } from 'playwright';

async function testComputrabajo() {
  console.log('Testing Computrabajo without persistent context...\n');

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  });
  const page = await context.newPage();
  
  try {
    console.log('Navigating to Computrabajo...');
    await page.goto('https://ar.computrabajo.com/empleos-de-informatica-y-telecom-en-buenos-aires-gba', {
      waitUntil: 'domcontentloaded',
      timeout: 60000
    });

    await page.waitForTimeout(5000);

    // Test selectors
    const articlesCount = await page.locator('article').count();
    const lisCount = await page.locator('li').count();
    const divsCount = await page.locator('div[class*="result"]').count();

    console.log(`Found:
  - article elements: ${articlesCount}
  - li elements: ${lisCount}
  - div[class*="result"] elements: ${divsCount}
    `);

    // Get a sample of the page structure
    if (articlesCount > 0) {
      const firstArticle = await page.locator('article').first().innerHTML();
      console.log('\nFirst article HTML (first 1500 chars):');
      console.log(firstArticle.substring(0, 1500));

      // Test text extraction
      const titleText = await page.locator('article h2 a').first().textContent();
      const dateText = await page.locator('article span.fecha, article .fecha, article time, article span.date').first().textContent();
      const href = await page.locator('article h2 a').first().getAttribute('href');

      console.log(`\nExtracted data from first article:
  - Title: ${titleText}
  - Date: ${dateText}
  - Href: ${href}
      `);
    } else if (lisCount > 0) {
      const firstLi = await page.locator('li').first().innerHTML();
      console.log('\nFirst li HTML (first 500 chars):');
      console.log(firstLi.substring(0, 500));
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await browser.close();
  }
}

testComputrabajo();
