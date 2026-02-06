import { chromium } from 'playwright';

async function debugMultiLocationExtraction() {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  await page.goto('https://www.getonbrd.cl/jobs/programacion', {
    waitUntil: 'networkidle'
  });

  // Get job cards with multiple locations
  const jobs = await page.evaluate(() => {
    const elements = document.querySelectorAll('a.gb-results-list__item');
    const results = [];
    
    for (let i = 0; i < Math.min(20, elements.length); i++) {
      const elem = elements[i];
      const title = elem.querySelector('.gb-results-list__title strong')?.textContent?.trim() || '';
      
      // Get location element
      const locationElem = elem.querySelector('span.location');
      if (!locationElem) continue;
      
      // Extract full text recursively
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
      
      // Check for Hibrido variations
      const hasHibrido = locationText.toLowerCase().includes('hibrido');
      const hasHybrid = locationText.toLowerCase().includes('hybrid');
      
      results.push({
        title,
        locationText,
        hasHibrido,
        hasHybrid,
        shouldReject: hasHibrido || hasHybrid
      });
    }
    
    return results;
  });

  console.log('Multi-location extraction debug:');
  jobs.forEach((job, i) => {
    if (job.shouldReject) {
      console.log(`\n[${i + 1}] ${job.title}`);
      console.log(`    Location: "${job.locationText}"`);
      console.log(`    Has hibrido: ${job.hasHibrido}`);
      console.log(`    Has hybrid: ${job.hasHybrid}`);
      console.log(`    SHOULD REJECT: YES`);
    }
  });

  await browser.close();
}

debugMultiLocationExtraction().catch(console.error);
