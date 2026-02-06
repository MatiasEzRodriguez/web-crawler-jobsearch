import { chromium } from 'playwright';

async function inspectStructure() {
  const browser = await chromium.launch({ headless: true });

  // Computrabajo
  console.log('\n=== COMPUTRABAJO ===');
  let page = await browser.newPage();
  await page.goto('https://ar.computrabajo.com/empleos-de-informatica-y-telecom-en-buenos-aires-gba', { 
    waitUntil: 'domcontentloaded', 
    timeout: 30000 
  });
  await page.waitForTimeout(3000);
  
  const ctCount = await page.locator('article').count();
  console.log(`Found ${ctCount} article elements`);
  
  if (ctCount > 0) {
    const ctElements = await page.locator('article').first().innerHTML();
    console.log('First article HTML:');
    console.log(ctElements.substring(0, 1500));
  }
  await page.close();

  // GetOnBrd
  console.log('\n=== GETONBRD ===');
  page = await browser.newPage();
  await page.goto('https://www.getonbrd.cl/jobs/programacion', { 
    waitUntil: 'domcontentloaded', 
    timeout: 30000 
  });
  await page.waitForTimeout(3000);
  
  const gobCount = await page.locator('a.gb-results-list__item').count();
  console.log(`Found ${gobCount} job items`);
  
  if (gobCount > 0) {
    const gobElements = await page.locator('a.gb-results-list__item').first().innerHTML();
    console.log('First job item HTML:');
    console.log(gobElements.substring(0, 1500));
  }
  await page.close();

  // Chumi-IT
  console.log('\n=== CHUMI-IT ===');
  page = await browser.newPage();
  await page.goto('https://chumi-it.com/professional/jobs/search?search=&country=2&category=&modality=', { 
    waitUntil: 'domcontentloaded', 
    timeout: 30000 
  });
  await page.waitForTimeout(3000);
  
  const chumiCount = await page.locator('div[class*="job"]').count();
  console.log(`Found ${chumiCount} job divs`);
  
  if (chumiCount > 0) {
    const chumiElements = await page.locator('div[class*="job"]').first().innerHTML();
    console.log('First job div HTML:');
    console.log(chumiElements.substring(0, 1500));
  }
  await page.close();

  // LinkedIn
  console.log('\n=== LINKEDIN ===');
  page = await browser.newPage();
  await page.goto('https://www.linkedin.com/jobs/search?keywords=Desarrollador&location=Argentina&geoId=100446943', { 
    waitUntil: 'domcontentloaded', 
    timeout: 30000 
  });
  await page.waitForTimeout(3000);
  
  const liCount = await page.locator('div[class*="job"]').count();
  console.log(`Found ${liCount} job divs`);
  
  if (liCount > 0) {
    const liElements = await page.locator('div[class*="job"]').first().innerHTML();
    console.log('First job div HTML:');
    console.log(liElements.substring(0, 1500));
  }
  await page.close();

  await browser.close();
}

inspectStructure().catch(console.error);
