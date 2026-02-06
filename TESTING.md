# Testing Guide

## Manual Testing

### 1. Verify Project Setup

```bash
# Check TypeScript compilation
npm run build

# Should complete without errors and create dist/ folder
```

### 2. Test Database

```bash
# Open Prisma Studio to inspect the database
npm run prisma:studio

# This opens http://localhost:5555 in your browser
# You can view the Job table (should be empty initially)
```

### 3. Test Utilities

```bash
# Create a test file to verify individual functions
cat > test-utils.js << 'EOF'
const { parseJobDate, isDateWithinDays } = require('./dist/utils/dateParser');

// Test date parsing
const testDates = [
  '2 days ago',
  '1 hour ago',
  '2024-01-28',
  '01/28/2024',
  'January 28, 2024'
];

console.log('Testing date parser:');
testDates.forEach(dateStr => {
  const parsed = parseJobDate(dateStr);
  console.log(`"${dateStr}" -> ${parsed?.toISOString()}`);
});

// Test date range
const recentDate = new Date();
console.log('\nDate within 7 days:', isDateWithinDays(recentDate, 7)); // true
EOF

node test-utils.js
```

### 4. Test Filters

```bash
# Create test file for filters
cat > test-filters.js << 'EOF'
const { isValidJob, matchesTechKeywords, matchesJuniorLevel } = require('./dist/utils/filters');

// Test cases
const testJobs = [
  'Senior JavaScript Developer',
  'Junior Node.js Engineer',
  'Senior React Developer', // Should fail - no junior level
  'Python Junior Developer', // Should fail - no tech keyword
  'Trainee TypeScript Full-Stack Developer', // Should pass
];

console.log('Testing job filters:');
testJobs.forEach(title => {
  const valid = isValidJob(title);
  const hasTech = matchesTechKeywords(title);
  const hasLevel = matchesJuniorLevel(title);
  console.log(`"${title}"`);
  console.log(`  - Valid: ${valid}, Tech: ${hasTech}, Level: ${hasLevel}\n`);
});
EOF

node test-filters.js
```

## End-to-End Testing

### Setup Test Site Configuration

Create a test `sites.csv` with a simple site:

```csv
url,job_card_selector,title_selector,date_selector,link_selector
https://www.linkedin.com/jobs/search?keywords=javascript,.base-card,.base-search-card__title,.job-search-card__listdate
```

### Run the Crawler

```bash
npm run dev
```

Monitor the output for:
- Browser initialization
- Site loading
- Job scraping
- Filtering results
- Database saves
- Summary statistics

### Check Results

```bash
# View saved jobs
npm run prisma:studio

# Or query via npm
npm run build
node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.job.findMany().then(jobs => {
  console.log('Saved jobs:', jobs);
  prisma.\$disconnect();
});
"
```

## Performance Testing

### Large Dataset

If using a site with many jobs:

```typescript
// Edit src/index.ts to add timing
const startTime = Date.now();
// ... crawler code ...
const duration = ((Date.now() - startTime) / 1000).toFixed(2);
console.log(`Total time: ${duration}s`);
```

### Memory Usage

```bash
node --max-old-space-size=512 dist/index.js
```

## Debugging

### Enable Debug Logging

```bash
DEBUG=true npm run dev
```

This will show:
- Date parsing details
- Filter evaluations
- Job card extraction attempts

### Inspect Page Content

Edit `src/crawler/jobCrawler.ts` to save page HTML:

```typescript
const html = await page.content();
console.log(html); // View in terminal or save to file
```

### Test Selectors

```bash
# Create a selector testing script
cat > test-selectors.js << 'EOF'
const { chromium } = require('playwright');

async function testSelectors() {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  await page.goto('https://example-site.com/jobs');
  
  // Test your selectors
  const jobs = await page.$$('.job-card'); // Your selector
  console.log(`Found ${jobs.length} elements`);
  
  await browser.close();
}

testSelectors().catch(console.error);
EOF

node test-selectors.js
```

## CI/CD Considerations

For running in CI/CD pipeline:

```bash
# Install Playwright browsers
npx playwright install

# Run crawler headlessly (already default)
npm run dev

# Check exit code
echo $? # Should be 0 for success
```

## Troubleshooting Common Issues

### Issue: No jobs saved but jobs found

**Cause**: Filters are too strict

**Solution**:
```bash
# Add DEBUG logging to see what's being filtered
DEBUG=true npm run dev

# Review filter criteria in src/utils/filters.ts
```

### Issue: Playwright hangs

**Cause**: Site is slow or interactive elements

**Solution**:
- Increase timeout in `src/crawler/jobCrawler.ts`
- Use `waitForNavigation` instead of `networkidle`
- Check site's robots.txt and rate limits

### Issue: Database locked

**Cause**: Multiple instances running or previous crash

**Solution**:
```bash
# Close all Node processes
# Windows
taskkill /F /IM node.exe

# Then delete database
rm prisma/dev.db
npm run prisma:migrate
```

## Expected Output Example

```
[INFO] 2024-01-28T12:00:00.000Z - === Job Web Crawler Started ===
[INFO] 2024-01-28T12:00:00.000Z - Configuration:
[INFO] 2024-01-28T12:00:00.000Z -   - Days to check: 7
[INFO] 2024-01-28T12:00:00.000Z -   - CSV file: /path/to/sites.csv
[✓] 2024-01-28T12:00:01.000Z - Browser initialized
[✓] 2024-01-28T12:00:01.500Z - Loaded 1 site configurations

[INFO] 2024-01-28T12:00:02.000Z - Processing: https://example.com/jobs
[INFO] 2024-01-28T12:00:05.000Z - Found 50 job cards on https://example.com/jobs
[✓] 2024-01-28T12:00:05.500Z - Successfully scraped 50 jobs
[✓] 2024-01-28T12:00:05.750Z - ✓ Saved: Junior JavaScript Developer (ID: 1)
[✓] 2024-01-28T12:00:06.000Z - ✓ Saved: Node.js Junior Engineer (ID: 2)

[INFO] 2024-01-28T12:00:10.000Z - === Crawler Summary ===
[INFO] 2024-01-28T12:00:10.000Z - Total jobs found: 50
[✓] 2024-01-28T12:00:10.000Z - Total jobs saved: 5
[WARN] 2024-01-28T12:00:10.000Z - Total jobs skipped: 45

[✓] 2024-01-28T12:00:10.500Z - === Job Web Crawler Completed ===
```

---

**Last Updated**: January 28, 2024
