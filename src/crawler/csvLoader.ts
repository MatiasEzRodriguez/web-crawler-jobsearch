import fs from 'fs';
import path from 'path';
import csv from 'csv-parser';
import { SiteConfig } from './jobCrawler';
import { logger } from '../utils/logger';

/**
 * Reads and parses the sites.csv configuration file
 */
export async function loadSiteConfigs(csvPath: string): Promise<SiteConfig[]> {
  return new Promise((resolve, reject) => {
    const configs: SiteConfig[] = [];

    // Check if file exists
    if (!fs.existsSync(csvPath)) {
      logger.error(`sites.csv not found at ${csvPath}`);
      reject(new Error(`sites.csv not found at ${csvPath}`));
      return;
    }

    fs.createReadStream(csvPath)
      .pipe(csv())
      .on('data', (row: any) => {
        // Validate required fields
        if (
          row.url &&
          row.job_card_selector &&
          row.title_selector &&
          row.date_selector &&
          row.link_selector
        ) {
          configs.push({
            url: row.url.trim(),
            job_card_selector: row.job_card_selector.trim(),
            title_selector: row.title_selector.trim(),
            date_selector: row.date_selector.trim(),
            link_selector: row.link_selector.trim(),
            location_selector: row.location_selector ? row.location_selector.trim() : undefined,
          });
        } else {
          logger.warn(`Skipping incomplete CSV row:`, row);
        }
      })
      .on('end', () => {
        logger.success(`Loaded ${configs.length} site configurations`);
        resolve(configs);
      })
      .on('error', (error: Error) => {
        logger.error('Error reading sites.csv', error);
        reject(error);
      });
  });
}

/**
 * Gets the path to sites.csv in the project root
 */
export function getSitesCsvPath(): string {
  return path.join(process.cwd(), 'sites.csv');
}
