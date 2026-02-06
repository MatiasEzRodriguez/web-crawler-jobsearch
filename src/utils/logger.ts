/**
 * Logger utility for consistent console output
 */

export const logger = {
  info: (message: string, meta?: any) => {
    console.log(`[INFO] ${new Date().toISOString()} - ${message}`, meta || '');
  },

  success: (message: string, meta?: any) => {
    console.log(`[✓] ${new Date().toISOString()} - ${message}`, meta || '');
  },

  warn: (message: string, meta?: any) => {
    console.warn(`[WARN] ${new Date().toISOString()} - ${message}`, meta || '');
  },

  error: (message: string, error?: any) => {
    console.error(
      `[ERROR] ${new Date().toISOString()} - ${message}`,
      error || ''
    );
  },

  debug: (message: string, meta?: any) => {
    if (process.env.DEBUG) {
      console.log(`[DEBUG] ${new Date().toISOString()} - ${message}`, meta || '');
    }
  },
};
