import { chromium } from 'playwright';

async function findJobSelectors() {
  const browser = await chromium.launch({ headless: false }); // Headless false para ver el navegador
  const page = await browser.newPage();

  // Computrabajo
  console.log('=== Inspeccionando Computrabajo ===');
  await page.goto('https://ar.computrabajo.com/empleos-de-informatica-y-telecom-en-buenos-aires-gba', {
    waitUntil: 'domcontentloaded'
  });

  // Esperar a que cargue
  await page.waitForTimeout(5000);

  // Aceptar cookies si es necesario
  const cookieBtn = await page.locator('button.cc-dismiss').count();
  if (cookieBtn > 0) {
    await page.click('button.cc-dismiss');
    await page.waitForTimeout(1000);
  }

  // Buscar selectores
  const selectors = [
    'article',
    'div.box_offer',
    'div[class*="box_offer"]',
    'div[data-offer-id]',
    'li[data-job-id]',
    '.job-card',
    'div.result',
    '[role="article"]',
    'div.vacante',
  ];

  console.log('\nProbando selectores:');
  for (const sel of selectors) {
    const count = await page.locator(sel).count();
    if (count > 0) {
      console.log(`✓ ${sel}: ${count} elementos`);
    }
  }

  // Inspeccionar el HTML de la página para ver estructura real
  const bodyHTML = await page.innerHTML('body');
  const jobSection = bodyHTML.substring(
    bodyHTML.indexOf('empleos-de-informatica'),
    bodyHTML.indexOf('empleos-de-informatica') + 3000
  );
  console.log('\nHTML cercano a búsqueda:\n', jobSection.substring(0, 800));

  await browser.close();
}

findJobSelectors().catch(console.error);
