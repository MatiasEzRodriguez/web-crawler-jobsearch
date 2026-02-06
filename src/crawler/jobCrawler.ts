import { chromium, Browser, Page } from 'playwright';
import path from 'path';
import { logger } from '../utils/logger';

export interface SiteConfig {
  url: string;
  job_card_selector: string;
  title_selector: string;
  date_selector: string;
  link_selector: string;
  location_selector?: string; // Optional location selector
}

export interface JobListing {
  title: string;
  company: string;
  url: string;
  postedDate: string;
  location?: string; // Optional location for site-specific filtering
}

/**
 * Web Crawler class using Playwright
 * Handles scraping of job listings from configured websites
 */
export class JobCrawler {
  private browser: any = null; // BrowserContext from launchPersistentContext
  private isInitialized = false;

  /**
   * Initialize the browser
   */
  async initialize(): Promise<void> {
    try {
      // Launch with user agent to avoid being blocked
      this.browser = await chromium.launch({
        headless: true,
      });
      this.isInitialized = true;
      logger.success('Browser initialized');
    } catch (error) {
      logger.error('Failed to initialize browser', error);
      throw error;
    }
  }

  /**
   * Close the browser
   */
  async close(): Promise<void> {
    if (this.browser) {
      await (this.browser as any).close();
      this.isInitialized = false;
      logger.success('Browser closed');
    }
  }

  /**
   * Scrapes job listings from a single website
   */
  async scrapeJobs(config: SiteConfig): Promise<JobListing[]> {
    if (!this.isInitialized) {
      throw new Error('Crawler not initialized. Call initialize() first.');
    }

    let context: any = null;
    let page: Page | null = null;
    const jobs: JobListing[] = [];

    try {
      logger.info(`Scraping jobs from: ${config.url}`);
      
      // Create a context with realistic User-Agent
      context = await (this.browser as any).newContext({
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      });
      
      page = await context.newPage();
      
      if (!page) {
        throw new Error('Failed to create page');
      }
      
      // Set custom headers
      await page.setExtraHTTPHeaders({
        'Accept-Language': 'es-ES,es;q=0.9',
      });

      // Set timeout and navigate
      await page.setDefaultTimeout(30000); // 30 seconds
      await page.goto(config.url, { waitUntil: 'domcontentloaded', timeout: 60000 });

      // Additional wait for dynamically loaded content
      await page.waitForTimeout(3000);

      // Wait for job cards to load
      try {
        await page.waitForSelector(config.job_card_selector, {
          timeout: 15000,
        });
      } catch (e) {
        logger.warn(`Job cards not found with selector: ${config.job_card_selector}`, {
          url: config.url,
        });
        return jobs;
      }

      // Scroll to load more content (useful for LinkedIn and similar sites)
      if (config.url.includes('linkedin')) {
        logger.debug('Scrolling LinkedIn results to load more jobs');
        await this.scrollToLoadMore(page, config.job_card_selector);
      }

      // Extract job listings
      const jobCards = await page.$$(config.job_card_selector);
      logger.info(`Found ${jobCards.length} job cards on ${config.url}`);

      for (const card of jobCards) {
        try {
          const title = await this.extractText(card, config.title_selector);
          const dateStr = await this.extractText(card, config.date_selector);
          const jobUrl = await this.extractAttribute(
            card,
            config.link_selector,
            'href'
          );
          const location = (config.location_selector && config.url.includes('getonbrd'))
            ? await this.extractInnerText(card, config.location_selector)
            : config.location_selector
              ? await this.extractText(card, config.location_selector)
              : '';

          if (title && dateStr && jobUrl) {
            // Resolve relative URLs
            const absoluteUrl = new URL(jobUrl, config.url).href;

            jobs.push({
              title: title.trim(),
              company: this.extractCompanyFromUrl(config.url),
              url: absoluteUrl,
              postedDate: dateStr.trim(),
              location: location ? location.trim() : undefined,
            });
          }
        } catch (error) {
          logger.debug('Error extracting job card data', error);
          continue;
        }
      }

      logger.success(`Successfully scraped ${jobs.length} jobs from ${config.url}`);
      return jobs;
    } catch (error) {
      logger.error(`Error scraping ${config.url}`, error);
      return jobs; // Return partial results
    } finally {
      if (page) {
        await page.close();
      }
      if (context) {
        await context.close();
      }
    }
  }

  /**
   * Extract innerText from an element (preserves visible text including parenthetical modality)
   * This is used specifically for GetOnBrd where location often appears as "City (Híbrido)"
   */
  private async extractInnerText(element: any, selector: string): Promise<string> {
    try {
      const el = await element.$(selector);
      if (!el) return '';
      const text = await el.evaluate((node: any) => {
        // Prefer innerText to capture the rendered text including parentheses and modality markers
        try {
          return (node as HTMLElement).innerText || node.textContent || '';
        } catch (e) {
          return node.textContent || '';
        }
      });
      return (text || '').toString().trim();
    } catch (error) {
      return '';
    }
  }

  /**
   * Extract text content from an element
   * For location fields, this will capture all text including hidden tooltips
   */
  private async extractText(element: any, selector: string): Promise<string> {
    try {
      const el = await element.$(selector);
      if (!el) return '';
      
      // Get all text content including text from hidden elements
      const text = await el.evaluate((node: any) => {
        let result = '';
        
        // Recursively get text from all nodes
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
        
        result = getTextRecursive(node);
        return result || node.textContent || '';
      });
      
      return text;
    } catch (error) {
      return '';
    }
  }

  /**
   * Extract attribute value from an element
   */
  private async extractAttribute(
    element: any,
    selector: string,
    attribute: string
  ): Promise<string> {
    try {
      // If selector is empty or ".", use the element itself
      const el = selector === '' || selector === '.' 
        ? element 
        : await element.$(selector);
      if (!el) return '';
      return await el.getAttribute(attribute);
    } catch (error) {
      return '';
    }
  }

  /**
   * Extract company name from URL (simple fallback)
   */
  private extractCompanyFromUrl(url: string): string {
    try {
      const hostname = new URL(url).hostname;
      return hostname.replace('www.', '').split('.')[0];
    } catch {
      return 'Unknown';
    }
  }

  /**
   * Scroll a page to load more dynamic content
   * Useful for sites like LinkedIn that lazy-load content
   */
  private async scrollToLoadMore(
    page: Page,
    selector: string,
    scrollPause: number = 1000,
    maxScrolls: number = 5
  ): Promise<void> {
    let previousHeight = 0;
    let scrollCount = 0;

    while (scrollCount < maxScrolls) {
      try {
        // Get current page height
        const currentHeight = await page.evaluate(() => {
          return (document as any).documentElement.scrollHeight;
        });

        // If height hasn't changed, we've reached the end
        if (currentHeight === previousHeight) {
          logger.debug('Reached end of scrollable content');
          break;
        }

        // Scroll to bottom
        await page.evaluate(() => {
          (window as any).scrollBy(0, (window as any).innerHeight);
        });

        // Wait for new content to load
        await page.waitForTimeout(scrollPause);

        // Wait for new elements to appear
        try {
          await page.waitForFunction(
            () => {
              const elements = (document as any).querySelectorAll('.gb-results-list__item, li.base-search-card__info');
              return elements.length > 0;
            },
            { timeout: 3000 }
          );
        } catch (e) {
          // Continue even if no new elements found
        }

        previousHeight = currentHeight;
        scrollCount++;
        logger.debug(`Scroll ${scrollCount}/${maxScrolls} - Found items`);
      } catch (error) {
        logger.debug('Error during scroll operation', error);
        break;
      }
    }

    // Scroll back to top
    await page.evaluate(() => {
      (window as any).scrollTo(0, 0);
    });
  }
}
