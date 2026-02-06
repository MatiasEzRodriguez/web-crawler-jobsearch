# Job Web Crawler - Development Guide

## Project Overview

This is a production-ready Node.js web crawler for scraping job listings using TypeScript, Playwright, and Prisma ORM.

## Tech Stack

- **Runtime**: Node.js 18+
- **Language**: TypeScript 5.3
- **Scraping**: Playwright 1.40
- **Database**: SQLite + Prisma 5.8
- **Input**: CSV Parser 3.0
- **Utilities**: date-fns 3.0

## Architecture

```
├── src/
│   ├── index.ts                 # Main orchestration
│   ├── crawler/                 # Scraping logic
│   │   ├── jobCrawler.ts        # Playwright wrapper
│   │   └── csvLoader.ts         # CSV configuration
│   └── utils/                   # Business logic
│       ├── dateParser.ts        # Date handling
│       ├── filters.ts           # Job filtering
│       ├── database.ts          # Prisma operations
│       └── logger.ts            # Logging
├── prisma/
│   └── schema.prisma            # Database schema
└── sites.csv                    # Job sites config
```

## Quick Start

```bash
npm install
npm run prisma:generate
npm run prisma:migrate
npm run dev
```

## Available Scripts

- `npm run dev` - Run with ts-node (development)
- `npm run build` - Compile TypeScript
- `npm start` - Run compiled JavaScript
- `npm run prisma:generate` - Generate Prisma client
- `npm run prisma:migrate` - Create/update database
- `npm run prisma:studio` - Open Prisma admin UI

## Key Features

✅ **Business Logic**
- Filter by tech keywords: node, javascript, typescript, js, ts
- Filter by level: junior, trainee, ssr, semi-senior, associate
- Parse multiple date formats including relative dates
- Prevent duplicates via unique URL constraint
- Graceful error handling per-site

✅ **Code Quality**
- Full TypeScript strict mode
- Comprehensive error handling
- Structured logging with timestamps
- Database transactions with Prisma
- Type-safe database operations

✅ **Configuration**
- CSV-based site configuration
- Environment variables support
- Flexible CSS selectors
- Configurable date range (default: 7 days)

## Important Files

- [src/index.ts](src/index.ts) - Main crawler logic
- [src/utils/filters.ts](src/utils/filters.ts) - Job filtering
- [src/utils/dateParser.ts](src/utils/dateParser.ts) - Date parsing
- [src/crawler/jobCrawler.ts](src/crawler/jobCrawler.ts) - Playwright wrapper
- [prisma/schema.prisma](prisma/schema.prisma) - Database schema
- [README.md](README.md) - Full documentation

## Development Guidelines

### Adding New Sites

Edit `sites.csv` with job site URLs and CSS selectors. Format:
```csv
url,job_card_selector,title_selector,date_selector,link_selector
```

### Modifying Filters

Edit `src/utils/filters.ts` to change tech keywords or level filters:
```typescript
const TECH_KEYWORDS = ['node', 'javascript', ...];
const JUNIOR_LEVELS = ['junior', 'trainee', ...];
```

### Changing Date Range

Edit `src/index.ts`:
```typescript
const DAYS_TO_CHECK = 7; // Change this value
```

### Database Schema Changes

1. Edit `prisma/schema.prisma`
2. Run `npm run prisma:migrate`
3. Answer migration name prompt
4. Regenerate types: `npm run prisma:generate`

## Database

SQLite database located at `prisma/dev.db`

Job table schema:
```sql
CREATE TABLE jobs (
  id INTEGER PRIMARY KEY,
  title TEXT NOT NULL,
  company TEXT NOT NULL,
  url TEXT UNIQUE NOT NULL,
  postedDate DATETIME NOT NULL,
  foundAt DATETIME DEFAULT NOW()
);
```

## Debugging

Enable detailed logging:
```bash
DEBUG=true npm run dev
```

View database:
```bash
npm run prisma:studio
```

## Error Handling Strategy

- **CSV Load Failure**: Exits with error (critical)
- **Site Scrape Failure**: Logs error, continues to next site
- **Selector Not Found**: Returns 0 jobs for that site, continues
- **Date Parse Failure**: Skips individual job, continues
- **DB Write Failure**: Logs error, continues to next job

This ensures one failing site doesn't stop the entire crawler.

## Testing

See [TESTING.md](TESTING.md) for detailed testing guide including:
- Unit testing utilities
- Integration testing
- Selector validation
- Performance testing

## Performance Notes

- Browser initialized once, reused for all sites
- CSV parsed as stream (memory efficient)
- 1-second delay between sites (respectful)
- Single database transaction per job
- No batch operations (room for optimization)

## Security Considerations

- Always check site's `robots.txt`
- Review Terms of Service before scraping
- Respectful delays already implemented
- Consider legal implications
- User-Agent can be added if needed

## Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| No selectors found | Inspect site HTML, update CSV |
| Browser hangs | Increase timeout, check site speed |
| Duplicate saves | Check unique constraint on URL |
| Date not parsing | Add format to dateParser.ts |
| Database locked | Kill node, delete dev.db, remigrate |

## Next Steps for Enhancement

- [ ] Add batch database writes
- [ ] Implement caching to avoid re-scraping
- [ ] Add API endpoint to query jobs
- [ ] Implement scheduling (cron jobs)
- [ ] Add job description scraping
- [ ] Support multi-page pagination
- [ ] Add proxy rotation for large-scale scraping
- [ ] Email notifications for matching jobs

## Code Quality Checklist

- ✅ TypeScript strict mode enabled
- ✅ Error handling with try-catch blocks
- ✅ Logging at all major steps
- ✅ Input validation before processing
- ✅ Graceful degradation (partial failures OK)
- ✅ Type safety with Prisma
- ✅ Environment variables configured
- ✅ Database migrations tracked

---

**Version**: 1.0.0  
**Last Updated**: January 28, 2024  
**Maintainer**: Senior Backend Developer
