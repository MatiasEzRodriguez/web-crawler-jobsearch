import { chromium } from 'playwright';

async function inspectLinkedIn() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  });
  const page = await context.newPage();

  console.log('Navigating to LinkedIn...\n');

  try {
    await page.goto('https://www.linkedin.com/jobs/search?keywords=Desarrollador&location=Argentina&geoId=100446943', {
      waitUntil: 'domcontentloaded',
      timeout: 60000
    });

    await page.waitForTimeout(5000);

    // Try different selectors
    const selectors = [
      'li.base-search-card__info',
      'section.base-search-card',
      'li.base-search-card',
      'div.base-search-card',
      'div[data-job-id]',
      'a.base-card__full-link',
      'li.jobs-search-results__list-item',
      'div.jobs-search-results__list-item',
    ];

    console.log('Testing selectors:\n');
    for (const sel of selectors) {
      const count = await page.locator(sel).count();
      if (count > 0) {
        console.log(`✓ ${sel}: ${count} elements`);
      }
    }

    // Get first matching element
    console.log('\n\nInspecting first element:\n');
    
    const firstSection = await page.locator('section.base-search-card').first().innerHTML();
    if (firstSection) {
      console.log('First section HTML (first 1000 chars):');
      console.log(firstSection.substring(0, 1000));
    }

    // Try to extract data from first element
    console.log('\n\nTrying to extract data:\n');
    
    const title = await page.locator('section.base-search-card__content h3').first().textContent();
    const date = await page.locator('section.base-search-card time').first().getAttribute('datetime');
    const link = await page.locator('section.base-search-card a.base-card__full-link').first().getAttribute('href');

    console.log(`Title: ${title}`);
    console.log(`Date: ${date}`);
    console.log(`Link: ${link}`);

  } catch (error) {
    console.error('Error:', error);
  }

  await browser.close();
}

inspectLinkedIn().catch(console.error);
