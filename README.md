# Job Web Crawler Bot

A powerful, production-ready Node.js web crawler for scraping job listings using TypeScript, Playwright, and Prisma ORM.

## Features

✨ **Technology Stack**
- **Crawling**: Playwright for robust handling of dynamic JavaScript websites
- **Database**: SQLite with Prisma ORM for type-safe database operations
- **Input**: CSV-based configuration for flexible site setup
- **Utilities**: date-fns for advanced date parsing and comparison

🔧 **Business Logic**
- **Smart Filtering**: Matches jobs by technology keywords (Node, JavaScript, TypeScript, JS, TS) AND junior levels (Junior, Trainee, SSR, Semi-Senior, Associate)
- **Date Filtering**: Automatically filters jobs from the last 7 days with support for:
  - Relative dates (e.g., "2 days ago", "1 hour ago")
  - Absolute dates (e.g., "2024-01-28", "01/28/2024")
  - Various date formats
- **Deduplication**: Prevents duplicate job entries using unique URL constraints
- **Error Handling**: Graceful error recovery ensures one failing site doesn't stop the entire crawler
- **Structured Logging**: Console logging with timestamps and severity levels

📊 **Output**
- Saves filtered jobs to SQLite database
- Detailed console logging with job counts and processing status
- Database includes: id, title, company, url, postedDate, foundAt

## Project Structure

```
job-web-crawler/
├── src/
│   ├── index.ts                 # Main entry point and orchestration
│   ├── crawler/
│   │   ├── jobCrawler.ts        # Playwright-based web scraper
│   │   └── csvLoader.ts         # CSV configuration loader
│   └── utils/
│       ├── dateParser.ts        # Date parsing and filtering
│       ├── filters.ts           # Job filtering logic
│       ├── database.ts          # Prisma database operations
│       └── logger.ts            # Logging utility
├── prisma/
│   └── schema.prisma            # Database schema
├── dist/                        # Compiled JavaScript (generated)
├── sites.csv                    # Job site configurations
├── package.json
├── tsconfig.json
├── .env                         # Environment variables
└── README.md
```

## Installation

### Prerequisites
- Node.js 18+ and npm/yarn
- SQLite (usually included with Node.js)

### Setup Steps

1. **Clone/Navigate to the project**
```bash
cd job-web-crawler-bot-jobsearch
```

2. **Install dependencies**
```bash
npm install
```

3. **Setup Prisma and database**
```bash
npm run prisma:generate
npm run prisma:migrate
```

This will:
- Generate the Prisma client
- Create the SQLite database
- Set up the jobs table

## Configuration

### sites.csv Format

Edit `sites.csv` to add job sites to scrape. The file requires these columns:

| Column | Description | Example |
|--------|-------------|---------|
| `url` | The website URL to scrape | `https://jobs.example.com` |
| `job_card_selector` | CSS selector for job listings container | `.job-card` |
| `title_selector` | CSS selector for job title within card | `.job-title` |
| `date_selector` | CSS selector for posted date | `.date-posted` |
| `link_selector` | CSS selector for job link (href attribute) | `a.job-link` |

### Example sites.csv

```csv
url,job_card_selector,title_selector,date_selector,link_selector
https://jobs.example.com/listings,.job-item,.title-text,.posted-date,a.job-url
https://careers.company.com,.vacancy,.position-title,.date,a.apply-link
```

### Environment Variables

Update `.env` as needed:

```env
DATABASE_URL="file:./prisma/dev.db"
DEBUG=false  # Set to true for detailed debug logs
```

## Usage

### Run the Crawler

```bash
# Using ts-node (recommended for development)
npm run dev

# Or compile and run compiled JavaScript
npm run build
npm start
```

### Output Example

```
[INFO] 2024-01-28T10:30:45.123Z - === Job Web Crawler Started ===
[INFO] 2024-01-28T10:30:45.123Z - Configuration:
[INFO] 2024-01-28T10:30:45.123Z -   - Days to check: 7
[INFO] 2024-01-28T10:30:45.123Z -   - CSV file: /path/to/sites.csv
[✓] 2024-01-28T10:30:46.234Z - Browser initialized
[✓] 2024-01-28T10:30:46.567Z - Loaded 2 site configurations

[INFO] 2024-01-28T10:30:47.123Z - Processing: https://jobs.example.com
[INFO] 2024-01-28T10:30:52.456Z - Found 45 job cards on https://jobs.example.com
[✓] 2024-01-28T10:30:52.789Z - Successfully scraped 45 jobs
[✓] 2024-01-28T10:30:53.123Z - ✓ Saved: Senior JavaScript Developer (ID: 1)
[✓] 2024-01-28T10:30:53.456Z - ✓ Saved: Junior Node.js Engineer (ID: 2)

[INFO] 2024-01-28T10:31:02.123Z - === Crawler Summary ===
[INFO] 2024-01-28T10:31:02.123Z - Total jobs found: 90
[✓] 2024-01-28T10:31:02.123Z - Total jobs saved: 12
[WARN] 2024-01-28T10:31:02.123Z - Total jobs skipped: 78

[✓] 2024-01-28T10:31:02.456Z - === Job Web Crawler Completed ===
```

### Database Operations

```bash
# View database in Prisma Studio
npm run prisma:studio

# Create a migration after changing schema.prisma
npm run prisma:migrate
```

## How It Works

### 1. **Configuration Loading**
- Reads `sites.csv` with job site selectors
- Validates all required fields are present

### 2. **Web Scraping**
- Initializes Playwright browser (Chromium)
- Navigates to each site URL
- Waits for job cards to load (networkidle)
- Extracts data using CSS selectors

### 3. **Data Processing**
- **Date Parsing**: Converts relative and absolute dates to Date objects
- **Filtering**: Checks if job matches required keywords AND levels
- **Date Range**: Ensures job is from the last 7 days
- **Deduplication**: Prevents duplicate entries by URL

### 4. **Database Storage**
- Checks if job URL already exists
- Saves new jobs to SQLite
- Captures timestamp for tracking

### 5. **Error Handling**
- Try-catch blocks on each site to prevent cascade failures
- Partial results returned even if some sites fail
- Detailed error logging for debugging

## Filtering Logic

### Technology Keywords (at least 1 match required)
- node
- javascript
- typescript
- js
- ts

### Junior Level Keywords (at least 1 match required)
- junior
- trainee
- ssr
- semi-senior
- associate

**A job is ONLY saved if it matches BOTH criteria** (case-insensitive, whole-word matching).

### Date Handling

Supports multiple date formats:
- Relative: "2 days ago", "1 hour ago", "3 weeks ago"
- ISO: "2024-01-28"
- US Format: "01/28/2024"
- Other: "January 28, 2024", "Jan 28, 2024"

Jobs must be posted within the last 7 days (configurable in `src/index.ts`).

## Advanced Usage

### Debugging

Enable debug logging:
```bash
DEBUG=true npm run dev
```

### Modifying Filter Criteria

Edit `src/utils/filters.ts` to change keywords or levels:

```typescript
const TECH_KEYWORDS = ['node', 'javascript', 'typescript', 'js', 'ts'];
const JUNIOR_LEVELS = ['junior', 'trainee', 'ssr', 'semi-senior', 'associate'];
```

### Changing Date Range

Edit `src/index.ts`:

```typescript
const DAYS_TO_CHECK = 7; // Change this value
```

### Adding Database Queries

Add new functions in `src/utils/database.ts`:

```typescript
export async function getJobsByCompany(company: string) {
  return await prisma.job.findMany({
    where: { company },
  });
}
```

## Error Scenarios & Recovery

| Scenario | Behavior |
|----------|----------|
| CSV file not found | Crawler exits with error message |
| Site unreachable | Logs error, continues with next site |
| Selectors not found | Returns empty jobs for that site |
| Date parsing fails | Skips job, logs debug message |
| Database write fails | Logs error, continues with next job |
| Duplicate URL | Silently skips, counted as skipped |

## Performance Considerations

- **Network calls**: Respects servers with 1s delay between sites
- **Browser resources**: Single browser instance for all sites
- **Database**: Batch operations would improve with large datasets
- **Memory**: Streams CSV to avoid loading entire file

## Security Notes

⚠️ **Important Considerations**:
- Always respect website `robots.txt` and Terms of Service
- Add delays between requests (already implemented)
- Consider legal implications of scraping
- Use appropriate User-Agent headers if needed

## Troubleshooting

### "sites.csv not found"
```bash
# Make sure sites.csv exists in the project root
ls sites.csv  # Unix/Linux/Mac
dir sites.csv # Windows
```

### "No sites found in sites.csv"
- Verify CSV format (commas, no extra spaces)
- Check all required columns are present
- Ensure no empty rows

### "Job cards not found"
- Inspect the website to find correct CSS selectors
- Website structure may have changed
- Some sites may require JavaScript to render (Playwright handles this)

### Database errors
```bash
# Reset the database
rm prisma/dev.db
npm run prisma:migrate
```

### Port 5555 in use (Prisma Studio)
```bash
# Use a different port
npx prisma studio --port 5556
```

## Development

### Building

```bash
npm run build
```

Output will be in `dist/` directory.

### Code Quality

```bash
# TypeScript will catch type errors during development
npm run dev
```

## License

MIT

## Author

Senior Backend Developer

---

**Last Updated**: January 28, 2024  
**Version**: 1.0.0
