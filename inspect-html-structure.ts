import { chromium } from 'playwright';

async function inspectHTML() {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  await page.goto('https://www.getonbrd.cl/jobs/programacion', {
    waitUntil: 'networkidle'
  });

  // Get HTML of first 3 job cards
  const htmls = await page.evaluate(() => {
    const elements = document.querySelectorAll('a.gb-results-list__item');
    const results = [];
    
    for (let i = 0; i < Math.min(3, elements.length); i++) {
      const elem = elements[i];
      // Get inner HTML (not too much, just relevant part)
      let html = elem.innerHTML;
      // Truncate to 1000 chars to see structure
      if (html.length > 1500) {
        html = html.substring(0, 1500) + '...TRUNCATED...';
      }
      results.push({
        jobNum: i + 1,
        html: html
      });
    }
    
    return results;
  });

  htmls.forEach(item => {
    console.log(`\n========== JOB ${item.jobNum} ==========`);
    console.log(item.html);
  });

  await browser.close();
}

inspectHTML().catch(console.error);
