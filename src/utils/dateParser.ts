import { differenceInDays, parseISO, parse } from 'date-fns';

/**
 * Parses relative and absolute date strings
 * Handles formats like:
 * - "2 days ago"
 * - "1 hour ago"
 * - "Hace 2 días" (Spanish)
 * - "Ayer" (Yesterday in Spanish)
 * - "2024-01-28"
 * - "01/28/2024"
 */
export function parseJobDate(dateString: string): Date | null {
  if (!dateString || typeof dateString !== 'string') {
    return null;
  }

  const trimmed = dateString.trim().toLowerCase();
  
  // Clean up extra spaces
  const cleaned = trimmed.replace(/\s+/g, ' ');

  // Handle "Ayer" (Yesterday in Spanish)
  if (cleaned === 'ayer') {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return yesterday;
  }

  // Handle "Hoy" (Today in Spanish)
  if (cleaned === 'hoy') {
    return new Date();
  }

  // Handle relative dates with spaces (e.g., "Hace  5  horas" or "hace 2 dias")
  const relativeRegexSpanish = /^hace\s+(\d+)\s+(horas?|dias?|semanas?)$/;
  const relativeSpanishMatch = cleaned.match(relativeRegexSpanish);

  if (relativeSpanishMatch) {
    const amount = parseInt(relativeSpanishMatch[1], 10);
    const unit = relativeSpanishMatch[2];
    const now = new Date();

    switch (unit) {
      case 'hora':
      case 'horas':
        return new Date(now.getTime() - amount * 60 * 60 * 1000);
      case 'dia':
      case 'dias':
        return new Date(now.getTime() - amount * 24 * 60 * 60 * 1000);
      case 'semana':
      case 'semanas':
        return new Date(now.getTime() - amount * 7 * 24 * 60 * 60 * 1000);
      default:
        return null;
    }
  }

  // Handle relative dates in English (e.g., "2 days ago")
  const relativeRegex = /^(\d+)\s+(days?|hours?|weeks?|minutes?)\s+ago$/;
  const relativeMatch = cleaned.match(relativeRegex);

  if (relativeMatch) {
    const amount = parseInt(relativeMatch[1], 10);
    const unit = relativeMatch[2];
    const now = new Date();

    switch (unit) {
      case 'day':
      case 'days':
        return new Date(now.getTime() - amount * 24 * 60 * 60 * 1000);
      case 'hour':
      case 'hours':
        return new Date(now.getTime() - amount * 60 * 60 * 1000);
      case 'week':
      case 'weeks':
        return new Date(now.getTime() - amount * 7 * 24 * 60 * 60 * 1000);
      case 'minute':
      case 'minutes':
        return new Date(now.getTime() - amount * 60 * 1000);
      default:
        return null;
    }
  }

  // Try ISO format (YYYY-MM-DD)
  try {
    const isoDate = parseISO(cleaned);
    if (!isNaN(isoDate.getTime())) {
      return isoDate;
    }
  } catch (e) {
    // Continue to next format
  }

  // Try common formats
  const formats = [
    'yyyy-MM-dd',
    'MM/dd/yyyy',
    'dd/MM/yyyy',
    'yyyy/MM/dd',
    'MMMM dd, yyyy',
    'MMM dd, yyyy',
  ];

  for (const format of formats) {
    try {
      const parsed = parse(cleaned, format, new Date());
      if (!isNaN(parsed.getTime())) {
        return parsed;
      }
    } catch (e) {
      // Continue to next format
    }
  }

  // Handle month name + day patterns (English and Spanish abbreviations), e.g. "feb 04" or "ene 29"
  const monthMap: { [key: string]: number } = {
    jan: 1, january: 1, ene: 1, enero: 1,
    feb: 2, february: 2, febrero: 2,
    mar: 3, march: 3, marzo: 3,
    apr: 4, april: 4, abr: 4, abril: 4,
    may: 5, mayo: 5,
    jun: 6, june: 6, junio: 6,
    jul: 7, july: 7, julio: 7,
    aug: 8, august: 8, ago: 8, agosto: 8,
    sep: 9, sept: 9, september: 9, septiembre: 9,
    oct: 10, october: 10, octubre: 10,
    nov: 11, november: 11, noviembre: 11,
    dec: 12, december: 12, dic: 12, diciembre: 12,
  };

  const monthDayRegex = /^([a-záéíóúñ]+)\s+(\d{1,2})(?:,?\s*(\d{4}))?$/i;
  const mdMatch = cleaned.match(monthDayRegex);
  if (mdMatch) {
    const monthName = mdMatch[1].toLowerCase();
    const day = parseInt(mdMatch[2], 10);
    const year = mdMatch[3] ? parseInt(mdMatch[3], 10) : new Date().getFullYear();
    const monthNum = monthMap[monthName];
    if (monthNum) {
      const candidate = new Date(year, monthNum - 1, day);
      if (!isNaN(candidate.getTime())) return candidate;
    }
  }

  return null;
}

/**
 * Checks if a date is within the last N days
 */
export function isDateWithinDays(date: Date, days: number): boolean {
  const now = new Date();
  const diffDays = differenceInDays(now, date);
  return diffDays >= 0 && diffDays <= days;
}

/**
 * Gets the current time in a readable format
 */
export function getTimestamp(): string {
  return new Date().toISOString();
}
