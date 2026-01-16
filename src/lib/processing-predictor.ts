// Permit Processing Time Prediction System

export type ConfidenceLevel = 'high' | 'medium' | 'low';

export interface ProcessingStats {
  count: number;
  median: number;
  mean: number;
  p25: number;
  p75: number;
  p90: number;
  min: number;
  max: number;
}

export interface ProcessingEstimate {
  expected: number;
  range: { low: number; high: number };
  worstCase: number;
  confidence: ConfidenceLevel;
  sampleSize: number;
  comparison: {
    cityAverage: number;
    categoryAverage: number;
    neighbourhoodAverage: number;
    vsCityDays: number;
    vsCategoryDays: number;
  };
  dataSource: 'exact' | 'category' | 'neighbourhood' | 'city';
}

export interface PredictorInput {
  processingDays: number[];
  cityProcessingDays: number[];
  categoryProcessingDays: number[];
  neighbourhoodProcessingDays: number[];
}

/**
 * Calculate percentile from sorted array
 */
function percentile(sortedArr: number[], p: number): number {
  if (sortedArr.length === 0) return 0;
  if (sortedArr.length === 1) return sortedArr[0];

  const index = (p / 100) * (sortedArr.length - 1);
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  const weight = index - lower;

  if (upper >= sortedArr.length) return sortedArr[sortedArr.length - 1];
  return sortedArr[lower] * (1 - weight) + sortedArr[upper] * weight;
}

/**
 * Calculate statistics from processing days array
 */
export function calculateStats(processingDays: number[]): ProcessingStats {
  if (processingDays.length === 0) {
    return {
      count: 0,
      median: 0,
      mean: 0,
      p25: 0,
      p75: 0,
      p90: 0,
      min: 0,
      max: 0,
    };
  }

  const sorted = [...processingDays].sort((a, b) => a - b);
  const sum = sorted.reduce((a, b) => a + b, 0);

  return {
    count: sorted.length,
    median: Math.round(percentile(sorted, 50)),
    mean: Math.round(sum / sorted.length),
    p25: Math.round(percentile(sorted, 25)),
    p75: Math.round(percentile(sorted, 75)),
    p90: Math.round(percentile(sorted, 90)),
    min: sorted[0],
    max: sorted[sorted.length - 1],
  };
}

/**
 * Get confidence level based on sample size
 */
export function getConfidenceLevel(sampleSize: number): ConfidenceLevel {
  if (sampleSize >= 50) return 'high';
  if (sampleSize >= 20) return 'medium';
  return 'low';
}

/**
 * Get color for confidence level
 */
export function getConfidenceColor(confidence: ConfidenceLevel): string {
  switch (confidence) {
    case 'high': return '#10b981';
    case 'medium': return '#f59e0b';
    case 'low': return '#ef4444';
  }
}

/**
 * Generate processing time estimate
 */
export function predictProcessingTime(input: PredictorInput): ProcessingEstimate {
  // Calculate stats for all data sources
  const exactStats = calculateStats(input.processingDays);
  const cityStats = calculateStats(input.cityProcessingDays);
  const categoryStats = calculateStats(input.categoryProcessingDays);
  const neighbourhoodStats = calculateStats(input.neighbourhoodProcessingDays);

  // Determine which data source to use (with fallback)
  let stats: ProcessingStats;
  let dataSource: ProcessingEstimate['dataSource'];

  if (exactStats.count >= 5) {
    stats = exactStats;
    dataSource = 'exact';
  } else if (categoryStats.count >= 10) {
    stats = categoryStats;
    dataSource = 'category';
  } else if (neighbourhoodStats.count >= 10) {
    stats = neighbourhoodStats;
    dataSource = 'neighbourhood';
  } else {
    stats = cityStats;
    dataSource = 'city';
  }

  // Calculate comparison metrics
  const vsCityDays = stats.median - cityStats.median;
  const vsCategoryDays = categoryStats.count > 0 ? stats.median - categoryStats.median : 0;

  return {
    expected: stats.median,
    range: { low: stats.p25, high: stats.p75 },
    worstCase: stats.p90,
    confidence: getConfidenceLevel(stats.count),
    sampleSize: stats.count,
    comparison: {
      cityAverage: cityStats.median,
      categoryAverage: categoryStats.median,
      neighbourhoodAverage: neighbourhoodStats.median,
      vsCityDays,
      vsCategoryDays,
    },
    dataSource,
  };
}

/**
 * Format category name for display
 */
export function formatCategoryName(category: string): string {
  const names: Record<string, string> = {
    secondary_suite: 'Secondary Suite',
    laneway_suite: 'Laneway Suite',
    garden_suite: 'Garden Suite',
    duplex: 'Duplex',
    triplex: 'Triplex',
    fourplex: 'Fourplex',
    multiplex_other: 'Other Multiplex',
  };
  return names[category] || category;
}

/**
 * Get the range bucket for a given number of days
 */
export function getDaysBucket(days: number): string {
  if (days < 30) return '< 30 days';
  if (days < 60) return '30-60 days';
  if (days < 90) return '60-90 days';
  if (days < 180) return '90-180 days';
  if (days < 365) return '180-365 days';
  return '> 365 days';
}
