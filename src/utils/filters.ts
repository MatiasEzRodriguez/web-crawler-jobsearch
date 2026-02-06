/**
 * Keywords filter patterns for job titles and descriptions
 */
const TECH_KEYWORDS = [
  'node',
  'javascript',
  'typescript',
  'js',
  'ts',
  'python',
  'java',
  'react',
  'angular',
  'vue',
  'backend',
  'back-end',
  'frontend',
  'front-end',
  'fullstack',
  'full-stack',
  'full stack',
  'sistemas',
  'sistemas jr',
  'desarrollador',
  'programador',
  'soporte técnico',
  'infraestructura',
  'engineer',
  'developer',
  'golang',
  'c++',
  'cpp',
];

/**
 * Level filter patterns for junior/trainee positions
 */
const JUNIOR_LEVELS = [
  'junior',
  'trainee',
  'ssr',
  'semi-senior',
  'associate',
  'jr',
  'jr.',
  'semi-sr',
  'semi sr',
  'nivel inicial',
  'iniciante',
  'practicante',
];

/**
 * Creates a regex pattern from keywords (case-insensitive)
 */
function createKeywordRegex(keywords: string[]): RegExp {
  const escaped = keywords.map(kw => kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  const pattern = escaped.join('|');
  return new RegExp(`\\b(${pattern})\\b`, 'gi');
}

/**
 * Checks if job title or description matches required keywords
 * Must match at least one technology keyword
 */
export function matchesTechKeywords(title: string, description?: string): boolean {
  const fullText = `${title} ${description || ''}`;
  const techRegex = createKeywordRegex(TECH_KEYWORDS);
  return techRegex.test(fullText);
}

/**
 * Checks if job level matches junior/trainee levels
 */
export function matchesJuniorLevel(title: string, description?: string): boolean {
  const fullText = `${title} ${description || ''}`;
  const levelRegex = createKeywordRegex(JUNIOR_LEVELS);
  return levelRegex.test(fullText);
}

/**
 * Complete filter: checks both keywords and level
 */
export function isValidJob(title: string, description?: string, level?: string): boolean {
  const fullText = `${title} ${description || ''} ${level || ''}`;
  const hasTechKeyword = createKeywordRegex(TECH_KEYWORDS).test(fullText);
  const hasJuniorLevel = createKeywordRegex(JUNIOR_LEVELS).test(fullText);
  return hasTechKeyword && (hasJuniorLevel || !level);
}

/**
 * Gets the matched keywords from text
 */
export function getMatchedKeywords(text: string): string[] {
  const allKeywords = [...TECH_KEYWORDS, ...JUNIOR_LEVELS];
  const keywordRegex = createKeywordRegex(allKeywords);
  const matches = text.matchAll(keywordRegex as RegExp);
  const matched = new Set<string>();
  for (const match of matches) {
    if (match[1]) matched.add(match[1].toLowerCase());
  }
  return Array.from(matched);
}

/**
 * Site-specific filter for GetOnBrd.
 * Requirements:
 * - If location includes "Argentina" or "Buenos Aires" -> accept
 * - If location indicates 100% remote (remoto/remota) -> accept
 * - If location indicates hybrid/presential/on-site -> reject
 * - Otherwise reject
 */
export function isValidGetOnBrdJob(
  title: string,
  location?: string,
  description?: string,
  level?: string
): boolean {
  // Basic check: tech keywords + level
  const basicValid = isValidJob(title, description, level);
  if (!basicValid) return false;

  // If there is no location we cannot assume it's allowed
  if (!location) return false;

  // Step A: Normalize location (lowercase, remove diacritics, collapse whitespace)
  const normalized = location
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/\s+/g, ' ')
    .trim();

  const ALLOWED_KEYWORDS = ['argentina', 'buenos aires', 'caba', 'remoto', 'remota', 'remote', 'anywhere'];
  const DISALLOWED_MODALITIES = ['hibrido', 'hybrid', 'presencial', 'on-site', 'onsite', 'oficina'];

  // Step B: If location contains a disallowed modality AND does NOT contain Argentina/BA/CABA -> reject
  const hasModality = DISALLOWED_MODALITIES.some(m => normalized.includes(m));
  const hasArgentina = ['argentina', 'buenos aires', 'caba'].some(k => normalized.includes(k));
  if (hasModality && !hasArgentina) return false;

  // Step C: If location contains any allowed keyword -> accept
  const hasAllowed = ALLOWED_KEYWORDS.some(k => normalized.includes(k));
  if (hasAllowed) return true;

  // Step D: Default -> reject everything else (e.g., 'santiago', 'lima')
  return false;
}

