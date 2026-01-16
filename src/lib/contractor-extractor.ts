// Contractor Name Extraction from Permit Descriptions
// EXPERIMENTAL: This uses pattern matching and is not reliable

export type ConfidenceLevel = 'high' | 'medium' | 'low';

export interface ExtractedContractor {
  name: string;
  confidence: ConfidenceLevel;
  matchType: string;
}

export interface ContractorStats {
  name: string;
  permitCount: number;
  neighbourhoods: string[];
  categories: { category: string; count: number }[];
  avgProcessingDays: number | null;
  recentPermits: number; // permits in last 12 months
  confidence: ConfidenceLevel;
}

export interface ContractorLeaderboard {
  contractors: ContractorStats[];
  totalExtracted: number;
  totalPermits: number;
  extractionRate: number;
  generatedAt: string;
}

export interface PermitDescription {
  id: string;
  description: string;
  neighbourhood: string | null;
  category: string;
  processingDays: number | null;
  applicationDate: string;
}

// Extraction patterns ordered by confidence
const PATTERNS: { pattern: RegExp; confidence: ConfidenceLevel; matchType: string }[] = [
  // High confidence: Company suffixes
  {
    pattern: /(?:by|for|contractor[:\s]+|builder[:\s]+)([A-Z][A-Za-z0-9\s&'.,-]+(?:Inc\.?|Ltd\.?|Corp\.?|Corporation|Limited|Company|Co\.?))/gi,
    confidence: 'high',
    matchType: 'company_suffix',
  },
  // Medium confidence: Construction-related keywords
  {
    pattern: /([A-Z][A-Za-z0-9\s&'.-]+(?:Construction|Builders?|Contracting|Renovations?|Developments?|Homes?|Properties))/gi,
    confidence: 'medium',
    matchType: 'construction_keyword',
  },
  // Low confidence: "by [Name]" pattern
  {
    pattern: /\bby\s+([A-Z][A-Za-z0-9\s&'.-]{3,30})\b/gi,
    confidence: 'low',
    matchType: 'by_pattern',
  },
];

// Words to exclude from extraction
const EXCLUDED_WORDS = new Set([
  'the', 'city', 'toronto', 'ontario', 'canada', 'owner', 'applicant',
  'permit', 'building', 'existing', 'proposed', 'new', 'addition',
  'alteration', 'interior', 'exterior', 'residential', 'commercial',
  'dwelling', 'unit', 'units', 'storey', 'storeys', 'basement',
  'ground', 'floor', 'roof', 'wall', 'walls', 'foundation',
  'mechanical', 'electrical', 'plumbing', 'hvac', 'demolition',
  'laneway', 'garden', 'suite', 'secondary', 'accessory', 'detached',
  'semi-detached', 'duplex', 'triplex', 'fourplex', 'multiplex',
]);

/**
 * Normalize a contractor name for comparison
 */
export function normalizeContractorName(name: string): string {
  return name
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/[.,]+$/, '')
    .replace(/\b(Inc|Ltd|Corp|Corporation|Limited|Company|Co)\.?\b/gi, (m) => m.replace('.', ''))
    .trim();
}

/**
 * Check if a name looks valid (not just common words)
 */
function isValidContractorName(name: string): boolean {
  const normalized = name.toLowerCase().trim();

  // Too short
  if (normalized.length < 4) return false;

  // Only excluded words
  const words = normalized.split(/\s+/);
  if (words.every((w) => EXCLUDED_WORDS.has(w))) return false;

  // Starts with excluded word
  if (EXCLUDED_WORDS.has(words[0])) return false;

  // Contains only numbers
  if (/^\d+$/.test(normalized)) return false;

  // Too many numbers (likely an address)
  if ((normalized.match(/\d/g) || []).length > 3) return false;

  return true;
}

/**
 * Extract contractor name from a description
 */
export function extractContractorName(description: string): ExtractedContractor | null {
  if (!description || description.length < 10) return null;

  for (const { pattern, confidence, matchType } of PATTERNS) {
    // Reset regex state
    pattern.lastIndex = 0;

    const match = pattern.exec(description);
    if (match && match[1]) {
      const name = normalizeContractorName(match[1]);
      if (isValidContractorName(name)) {
        return {
          name,
          confidence,
          matchType,
        };
      }
    }
  }

  return null;
}

/**
 * Process all permits and build contractor leaderboard
 */
export function buildContractorLeaderboard(
  permits: PermitDescription[],
  minPermits: number = 2
): ContractorLeaderboard {
  const contractorMap = new Map<
    string,
    {
      permits: PermitDescription[];
      confidence: ConfidenceLevel;
    }
  >();

  let totalExtracted = 0;
  const oneYearAgo = new Date();
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

  for (const permit of permits) {
    const extracted = extractContractorName(permit.description);
    if (extracted) {
      totalExtracted++;
      const key = extracted.name.toLowerCase();

      if (!contractorMap.has(key)) {
        contractorMap.set(key, {
          permits: [],
          confidence: extracted.confidence,
        });
      }

      const entry = contractorMap.get(key)!;
      entry.permits.push(permit);

      // Upgrade confidence if we find a higher confidence match
      if (
        (extracted.confidence === 'high') ||
        (extracted.confidence === 'medium' && entry.confidence === 'low')
      ) {
        entry.confidence = extracted.confidence;
      }
    }
  }

  // Build stats for each contractor
  const contractors: ContractorStats[] = [];

  for (const [, entry] of contractorMap) {
    if (entry.permits.length < minPermits) continue;

    // Get unique neighbourhoods
    const neighbourhoods = [...new Set(
      entry.permits
        .map((p) => p.neighbourhood)
        .filter((n): n is string => n !== null)
    )].slice(0, 10);

    // Count by category
    const categoryCount = new Map<string, number>();
    for (const permit of entry.permits) {
      categoryCount.set(permit.category, (categoryCount.get(permit.category) || 0) + 1);
    }
    const categories = [...categoryCount.entries()]
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count);

    // Calculate avg processing days
    const processingDays = entry.permits
      .map((p) => p.processingDays)
      .filter((d): d is number => d !== null);
    const avgProcessingDays = processingDays.length > 0
      ? Math.round(processingDays.reduce((a, b) => a + b, 0) / processingDays.length)
      : null;

    // Count recent permits
    const recentPermits = entry.permits.filter((p) => {
      const date = new Date(p.applicationDate);
      return date >= oneYearAgo;
    }).length;

    contractors.push({
      name: entry.permits[0].description.match(
        new RegExp(entry.permits[0].description.split(' ')[0], 'i')
      )
        ? normalizeContractorName(
            extractContractorName(entry.permits[0].description)?.name || ''
          )
        : normalizeContractorName(
            extractContractorName(entry.permits[0].description)?.name || ''
          ),
      permitCount: entry.permits.length,
      neighbourhoods,
      categories,
      avgProcessingDays,
      recentPermits,
      confidence: entry.confidence,
    });
  }

  // Sort by permit count
  contractors.sort((a, b) => b.permitCount - a.permitCount);

  return {
    contractors,
    totalExtracted,
    totalPermits: permits.length,
    extractionRate: permits.length > 0
      ? Math.round((totalExtracted / permits.length) * 100)
      : 0,
    generatedAt: new Date().toISOString(),
  };
}

/**
 * Format category name for display
 */
export function formatCategoryName(category: string): string {
  return category
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}
