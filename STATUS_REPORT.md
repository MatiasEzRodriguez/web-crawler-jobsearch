## Job Web Crawler - Status Report

**Date**: 2026-02-03
**Status**: ✅ OPERATIONAL

### Summary

The job web crawler is successfully scraping and filtering job listings from multiple sources.

### Results

- **Total Jobs in Database**: 284
- **Total Sites Configured**: 4
- **Active Sites**: 2
  - ✅ Computrabajo (Argentina): 18 jobs
  - ✅ GetOnBrd (Chile): 266 jobs

### Incomplete Sites
- ⏳ Chumi-IT: Selector finding 4 elements (likely banners, not jobs)
- ⏳ LinkedIn: Requires authentication

### Key Implementation Details

**Architecture**:
- Single browser instance with standard launch (no persistent context)
- Modular design: crawler, utilities (filters, date parser, database, logger)
- SQLite database with Prisma ORM

**Filtering Logic**:
- Tech keywords: node, javascript, typescript, backend, frontend, fullstack, engineer, developer, python, java, react, angular, vue, golang, infraestructura, soporte técnico, sistemas, desarrollador, programador
- Level filtering: If no level keywords are found, job is accepted (inclusive approach)
- Date filtering: Last 7 days

**CSS Selectors Configuration**:

```csv
Computrabajo:
  - job_card_selector: article
  - title_selector: h2 a
  - date_selector: p.fc_aux
  - link_selector: h2 a

GetOnBrd:
  - job_card_selector: a.gb-results-list__item
  - title_selector: .gb-results-list__title strong
  - date_selector: .opacity-half.size0
  - link_selector: .  (uses container element itself)
```

### Database Schema

- **Table**: jobs
- **Columns**: id, title, company, url (UNIQUE), postedDate, foundAt
- **Deduplication**: Via UNIQUE constraint on URL

### Error Handling

- Per-site error handling: One site failure doesn't stop the crawler
- Date parsing fallback: Uses current date if parsing fails
- Selector not found: Logs warning, continues to next site
- Filter mismatch: Job is logged as skipped, continues

### Next Steps

1. **Fix Chumi-IT**: Identify correct job card selector (current selector may be picking up page sections)
2. **Add LinkedIn Support**: Implement login mechanism or use authenticated session
3. **Performance**: Consider batch database writes for large-scale scraping
4. **Persistence**: Implement caching to avoid re-scraping same jobs
5. **Scheduling**: Add cron job support for periodic scraping

### Notes

- Browser uses User-Agent header to avoid bot detection
- Graceful timeout handling (30s default, 15s for selector wait)
- Respects site structure changes with wildcard selectors where possible
- All text extraction includes trim() to remove extra whitespace

---
**Last Updated**: 2026-02-03 02:31:49 UTC
