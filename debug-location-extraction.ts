import { chromium } from 'playwright';

async function debugLocationExtraction() {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  await page.goto('https://www.getonbrd.cl/jobs/programacion', {
    waitUntil: 'networkidle'
  });

  // Get first 5 job cards with detailed location info
  const jobs = await page.evaluate(() => {
    const elements = document.querySelectorAll('a.gb-results-list__item');
    const results = [];
    
    for (let i = 0; i < Math.min(5, elements.length); i++) {
      const elem = elements[i];
      const title = elem.querySelector('.gb-results-list__title strong')?.textContent?.trim() || '';
      
      // Get location element
      const locationElem = elem.querySelector('span.location');
      if (!locationElem) continue;
      
      // Extract full text recursively like our function does
      const getTextRecursive = (n: any): string => {
        let text = '';
        for (const child of n.childNodes) {
          if (child.nodeType === 3) { // Text node
            const trimmed = (child.textContent || '').trim();
            if (trimmed) {
              text += (text ? ' ' : '') + trimmed;
            }
          } else if (child.nodeType === 1) { // Element node
            text += (text ? ' ' : '') + getTextRecursive(child);
          }
        }
        return text;
      };
      
      const locationText = getTextRecursive(locationElem);
      
      results.push({
        title,
        locationText,
        locationLower: locationText.toLowerCase(),
        includes_remoto: locationText.toLowerCase().includes('remoto'),
        includes_argentina: locationText.toLowerCase().includes('argentina'),
        includes_hibrido: locationText.toLowerCase().includes('híbrido') || locationText.toLowerCase().includes('hibrido'),
        includes_santiago: locationText.toLowerCase().includes('santiago'),
      });
    }
    
    return results;
  });

  console.log('Location extraction debug:');
  jobs.forEach((job, i) => {
    console.log(`\n[${i + 1}] ${job.title}`);
    console.log(`    Raw: "${job.locationText}"`);
    console.log(`    Lower: "${job.locationLower}"`);
    console.log(`    Has remoto: ${job.includes_remoto}`);
    console.log(`    Has argentina: ${job.includes_argentina}`);
    console.log(`    Has híbrido: ${job.includes_hibrido}`);
    console.log(`    Has santiago: ${job.includes_santiago}`);
  });

  await browser.close();
}

debugLocationExtraction().catch(console.error);
