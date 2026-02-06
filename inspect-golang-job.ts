import { chromium } from 'playwright';

async function inspectGolangDeveloper() {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  await page.goto('https://www.getonbrd.cl/jobs/programacion', {
    waitUntil: 'networkidle'
  });

  // Find the Golang Developer job and get its full location text
  const golangInfo = await page.evaluate(() => {
    const elements = document.querySelectorAll('a.gb-results-list__item');
    
    for (let i = 0; i < elements.length; i++) {
      const elem = elements[i];
      const title = elem.querySelector('.gb-results-list__title strong')?.textContent?.trim() || '';
      
      if (title.toLowerCase().includes('golang developer')) {
        const locationElem = elem.querySelector('span.location');
        if (locationElem) {
          const getTextRecursive = (n: any): string => {
            let text = '';
            for (const child of n.childNodes) {
              if (child.nodeType === 3) {
                const trimmed = (child.textContent || '').trim();
                if (trimmed) {
                  text += (text ? ' ' : '') + trimmed;
                }
              } else if (child.nodeType === 1) {
                text += (text ? ' ' : '') + getTextRecursive(child);
              }
            }
            return text;
          };
          
          const locationText = getTextRecursive(locationElem);
          
          return {
            found: true,
            title,
            locationText,
            locationLower: locationText.toLowerCase(),
            raw_html: locationElem.innerHTML
          };
        }
      }
    }
    
    return { found: false };
  });

  if (golangInfo.found) {
    console.log('Golang Developer Job found:');
    console.log(`Title: ${golangInfo.title}`);
    console.log(`Location (extracted): "${golangInfo.locationText}"`);
    console.log(`Location (lower): "${golangInfo.locationLower || 'N/A'}"`);
    console.log(`Has "hibrido": ${golangInfo.locationLower?.includes('hibrido') || false}`);
    console.log(`Has "hybrid": ${golangInfo.locationLower?.includes('hybrid') || false}`);
    console.log(`\nRaw HTML:\n${golangInfo.raw_html}`);
  } else {
    console.log('Golang Developer job not found on first page');
  }

  await browser.close();
}

inspectGolangDeveloper().catch(console.error);
