import { chromium } from 'playwright';

async function inspectLocation() {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  await page.goto('https://www.getonbrd.cl/jobs/programacion', {
    waitUntil: 'networkidle'
  });

  // Get first 10 job cards with their location data
  const jobs = await page.evaluate(() => {
    const elements = document.querySelectorAll('a.gb-results-list__item');
    const results = [];
    
    for (let i = 0; i < Math.min(10, elements.length); i++) {
      const elem = elements[i];
      const title = elem.querySelector('.gb-results-list__title strong')?.textContent?.trim() || '';
      
      // Try different selectors for location
      const location1 = elem.querySelector('span.location')?.textContent?.trim() || '';
      const location2 = elem.querySelector('[class*="location"]')?.textContent?.trim() || '';
      const location3 = elem.textContent?.match(/Santiago|Remoto|Híbrido|Argentina|hybrid/gi)?.join(', ') || '';
      
      // Get all text content to see what's there
      const allText = elem.textContent?.trim().split('\n').slice(0, 10) || [];
      
      results.push({
        title,
        'span.location': location1,
        '[class*="location"]': location2,
        'regex_match': location3,
        'first_10_lines': allText
      });
    }
    
    return results;
  });

  console.log('Job locations found:');
  jobs.forEach((job, i) => {
    console.log(`\n[Job ${i + 1}] ${job.title}`);
    console.log('  span.location:', job['span.location']);
    console.log('  [class*="location"]:', job['[class*="location"]']);
    console.log('  regex_match:', job.regex_match);
    console.log('  text_preview:', job.first_10_lines.slice(0, 5).join(' | '));
  });

  await browser.close();
}

inspectLocation().catch(console.error);
