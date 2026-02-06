import { chromium } from 'playwright';

async function deepInspect() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  console.log('=== Computrabajo Deep Inspection ===');
  
  await page.goto('https://ar.computrabajo.com/empleos-de-informatica-y-telecom-en-buenos-aires-gba', {
    waitUntil: 'networkidle'
  });

  // Esperar más tiempo y hacer scroll
  await page.waitForTimeout(5000);
  await page.evaluate(() => window.scrollBy(0, window.innerHeight * 3));
  await page.waitForTimeout(2000);

  // Buscar todos los elementos posibles que contengan ofertas
  const selectors = [
    'article',
    'li',
    'div.result',
    'div[id*="offer"]',
    'div[id*="job"]',
    'div[data-offer]',
    'a[href*="/empleos/"]',
    '*[role="article"]',
    'section',
    'div.box',
  ];

  console.log('\nContando elementos por selector:');
  for (const sel of selectors) {
    try {
      const count = await page.locator(sel).count();
      if (count > 0) {
        console.log(`  ${sel}: ${count}`);
      }
    } catch (e) {
      // Ignorar errores de selector inválido
    }
  }

  // Obtener el HTML del main content area
  const mainContent = await page.innerHTML('main') || await page.innerHTML('[role="main"]') || '';
  if (mainContent) {
    console.log('\nMain content sample:');
    console.log(mainContent.substring(0, 2000));
  }

  // Intentar obtener info sobre la estructura
  const htmlStructure = await page.evaluate(() => {
    const main = document.querySelector('main') || document.querySelector('[role="main"]') || document.querySelector('body > *');
    if (main) {
      return {
        tag: main.tagName,
        class: main.className,
        children: main.children.length,
        childTags: Array.from(main.children).slice(0, 10).map(c => ({ tag: c.tagName, class: c.className }))
      };
    }
    return null;
  });

  console.log('\nHTML Structure:');
  console.log(JSON.stringify(htmlStructure, null, 2));

  await browser.close();
}

deepInspect().catch(console.error);
