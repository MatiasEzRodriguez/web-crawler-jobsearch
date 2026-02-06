# Architecture & Technical Details

## System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Main Orchestrator                    │
│                     (src/index.ts)                      │
└──────────────┬──────────────────────────────────────────┘
               │
       ┌───────┴────────┬──────────────┬──────────────┐
       │                │              │              │
   ┌───▼──┐    ┌────────▼────┐  ┌─────▼────┐   ┌───▼────┐
   │ CSV  │    │  Playwright │  │Prisma ORM│   │Logger  │
   │Loader│    │   Crawler   │  │ Database │   │Utility │
   └──────┘    └─────────────┘  └──────────┘   └────────┘
       │             │                │
       └──────┬──────┴────┬───────────┘
              │           │
          ┌───▼────────┬──▼──┐
          │  Filters   │Date │
          │   Utils    │Parse│
          └────────────┴─────┘
```

## Data Flow

### 1. Initialization Phase
```
Start → Load CSV → Initialize Browser → Generate Prisma Client
                                            ↓
                                    Ready for Scraping
```

### 2. Scraping Phase (Per Site)
```
For each site in CSV:
  1. Navigate to URL
  2. Wait for DOM load (networkidle)
  3. Find job cards using selector
  4. For each card:
     - Extract title, date, URL
     - Store raw data
  5. Return job list
```

### 3. Processing Phase (Per Job)
```
For each scraped job:
  1. Parse date → Date object
  2. Check date range (within 7 days)
  3. Filter by keywords AND level
  4. Check duplicate (URL unique constraint)
  5. Save to database OR skip
```

### 4. Cleanup Phase
```
Close browser → Close database connection → Exit with summary
```

## Module Breakdown

### src/index.ts (Main Orchestrator)
- **Responsibility**: Coordinate entire workflow
- **Key Logic**: 
  - Error handling wrapper for all modules
  - Progress tracking and logging
  - Graceful degradation (one site failure doesn't stop all)
  - Resource cleanup (browser, database)

**Dependencies**: All other modules

### src/crawler/jobCrawler.ts (Web Scraper)
- **Responsibility**: Handle browser automation
- **Key Methods**:
  - `initialize()`: Launch Chromium browser
  - `scrapeJobs(config)`: Scrape single site
  - `extractText()`: CSS selector extraction
  - `extractAttribute()`: Get href attributes
- **Error Handling**: Timeouts, missing selectors, page navigation failures

**Dependencies**: Playwright

### src/crawler/csvLoader.ts (Configuration Parser)
- **Responsibility**: Load and validate CSV configuration
- **Key Methods**:
  - `loadSiteConfigs(path)`: Stream-based CSV parsing
  - `getSitesCsvPath()`: Get default CSV location
- **Validation**: All required columns present before adding to config list

**Dependencies**: csv-parser

### src/utils/filters.ts (Job Validation)
- **Responsibility**: Validate jobs against business criteria
- **Key Methods**:
  - `isValidJob()`: Check both keywords AND level
  - `matchesTechKeywords()`: Regex matching for tech
  - `matchesJuniorLevel()`: Regex matching for levels
  - `getMatchedKeywords()`: Extract matched terms
- **Matching Logic**: Case-insensitive, whole-word regex patterns

**Keywords**:
- Tech: node, javascript, typescript, js, ts
- Level: junior, trainee, ssr, semi-senior, associate

### src/utils/dateParser.ts (Date Handling)
- **Responsibility**: Parse and validate job posting dates
- **Key Methods**:
  - `parseJobDate(string)`: Convert string to Date
  - `isDateWithinDays(date, days)`: Range validation
- **Supported Formats**:
  - Relative: "2 days ago", "1 hour ago"
  - ISO: "2024-01-28"
  - US: "01/28/2024"
  - Verbose: "January 28, 2024"

**Dependencies**: date-fns

### src/utils/database.ts (Data Persistence)
- **Responsibility**: Database operations via Prisma
- **Key Methods**:
  - `saveJob()`: Insert new job (handles duplicates)
  - `jobExists()`: Check for duplicates
  - `getAllJobs()`: Query all jobs
  - `getJobsFromLastDays()`: Range query
  - `closePrisma()`: Cleanup connection
- **Safety**: Unique constraint on URL prevents duplicates at DB level

**Dependencies**: @prisma/client

### src/utils/logger.ts (Logging)
- **Responsibility**: Consistent console output
- **Methods**:
  - `info()`: General information
  - `success()`: Operation successful
  - `warn()`: Warning conditions
  - `error()`: Error conditions
  - `debug()`: Debug info (conditional on DEBUG env var)
- **Format**: `[LEVEL] ISO_TIMESTAMP - message`

## Type System

### SiteConfig Interface
```typescript
interface SiteConfig {
  url: string;                    // Website to scrape
  job_card_selector: string;      // CSS selector for job container
  title_selector: string;         // CSS selector for job title
  date_selector: string;          // CSS selector for posted date
  link_selector: string;          // CSS selector for job URL
}
```

### JobListing Interface
```typescript
interface JobListing {
  title: string;                  // Raw job title
  company: string;                // Company name (from URL)
  url: string;                    // Full job URL
  postedDate: string;             // Raw date string from site
}
```

### Prisma Job Model
```typescript
model Job {
  id        Int       @id @default(autoincrement())
  title     String                          // Job title
  company   String                          // Company name
  url       String    @unique               // Unique constraint
  postedDate DateTime                       // When job was posted
  foundAt   DateTime  @default(now())       // When we found it
}
```

## Error Handling Strategy

### Critical Errors (Exit)
- CSV file not found or unreadable
- Database connection failed
- Browser initialization failed

**Handling**: Log error and exit process with code 1

### Recoverable Errors (Continue)
- Site unreachable
- CSS selector not found
- Date parsing failed
- Job filtering failed
- Database write error

**Handling**: Log warning/error, skip item, continue with next

**Benefits**:
- One failing site doesn't stop entire crawler
- Partial results are valuable
- System remains resilient

## Performance Characteristics

### Time Complexity
- Loading CSV: O(n) where n = number of sites
- Scraping per site: O(m) where m = jobs on site
- Date parsing: O(1) per job
- Filtering: O(1) per job
- Database save: O(1) with index on URL
- **Total: O(n × m)** per run

### Space Complexity
- CSV buffer: O(n) sites in memory
- Jobs buffer: O(m) jobs per site
- Browser context: ~100-150MB (Chromium instance)
- **Total: O(n + m)** memory usage

### Network
- 1 request per site (main page)
- Some sites lazy-load (handled by networkidle)
- 1s delay between sites (rate limiting)

## Extensibility Points

### Adding New Filters
```typescript
// src/utils/filters.ts
export function matchesCustomCriteria(text: string): boolean {
  // Your logic here
}

// src/index.ts
if (!matchesCustomCriteria(job.title)) {
  totalJobsSkipped++;
  continue;
}
```

### Adding New Date Formats
```typescript
// src/utils/dateParser.ts
const formats = [
  'yyyy-MM-dd',
  'MM/dd/yyyy',
  'YOUR_NEW_FORMAT', // Add here
];
```

### Adding Database Fields
```typescript
// prisma/schema.prisma
model Job {
  // ... existing fields
  description String?  // Optional description
}

// Then:
npm run prisma:migrate
// Update saveJob() in database.ts
```

### Adding Job Details Scraping
```typescript
// src/crawler/jobCrawler.ts
interface JobListing {
  // ... existing fields
  description?: string;
  salary?: string;
}

// Update scrapeJobs() to extract additional fields
```

## Database Transactions

Currently each job is saved individually (single transaction).

For improvement with batch operations:
```typescript
// Not yet implemented
const jobs = await Promise.all(jobList.map(job => saveJob(...)));

// Or using Prisma's createMany()
await prisma.job.createMany({
  data: jobList,
  skipDuplicates: true,
});
```

## Configuration Management

### sites.csv
- Plain text CSV format
- No special escaping needed
- One site per row
- Headers: url, job_card_selector, title_selector, date_selector, link_selector

### Environment Variables (.env)
```env
DATABASE_URL="file:./prisma/dev.db"  # SQLite file path
DEBUG=false                           # Enable debug logging
```

## Deployment Considerations

### For Production:
1. Use environment-specific .env files
2. Set up regular scheduling (cron, GitHub Actions, etc.)
3. Consider cloud database (Prisma supports PostgreSQL, MySQL)
4. Implement rate limiting headers
5. Add User-Agent headers
6. Cache results to avoid re-scraping
7. Monitor error rates and job quality

### Docker Deployment:
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY . .
RUN npm install && npm run build
RUN npx playwright install-deps
CMD ["npm", "start"]
```

---

**Version**: 1.0.0  
**Last Updated**: January 28, 2024
