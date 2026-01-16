// Best Time to Apply Analysis Logic

import type { MonthlyProcessingStats } from './db-turso';

export type MonthRating = 'excellent' | 'good' | 'average' | 'slow' | 'avoid';

export interface MonthlyStats {
  month: number;
  name: string;
  median: number;
  mean: number;
  count: number;
  p25: number;
  p75: number;
  rank: number; // 1 = fastest
  rating: MonthRating;
}

export interface BestTimeAnalysis {
  byMonth: MonthlyStats[];
  bestMonths: number[]; // top 3 (1-indexed)
  worstMonths: number[]; // bottom 3 (1-indexed)
  overallMedian: number;
  overallMean: number;
  recommendation: string;
  totalSamples: number;
}

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

function getPercentile(sorted: number[], percentile: number): number {
  if (sorted.length === 0) return 0;
  const index = Math.ceil((percentile / 100) * sorted.length) - 1;
  return sorted[Math.max(0, Math.min(index, sorted.length - 1))];
}

function getMedian(sorted: number[]): number {
  if (sorted.length === 0) return 0;
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? Math.round((sorted[mid - 1] + sorted[mid]) / 2)
    : sorted[mid];
}

function getMean(values: number[]): number {
  if (values.length === 0) return 0;
  const sum = values.reduce((a, b) => a + b, 0);
  return Math.round(sum / values.length);
}

function getRating(rank: number): MonthRating {
  if (rank <= 3) return 'excellent';
  if (rank <= 6) return 'good';
  if (rank <= 9) return 'average';
  if (rank <= 11) return 'slow';
  return 'avoid';
}

export function analyzeByMonth(data: MonthlyProcessingStats[]): BestTimeAnalysis {
  // Calculate stats for each month
  const monthStats: MonthlyStats[] = data.map((d) => {
    const sorted = d.processingDays;
    return {
      month: d.month,
      name: MONTH_NAMES[d.month - 1],
      median: getMedian(sorted),
      mean: getMean(sorted),
      count: d.count,
      p25: getPercentile(sorted, 25),
      p75: getPercentile(sorted, 75),
      rank: 0, // will be set below
      rating: 'average' as MonthRating, // will be set below
    };
  });

  // Sort by median to determine rankings
  const sortedByMedian = [...monthStats]
    .filter((m) => m.count >= 5) // need minimum sample size
    .sort((a, b) => a.median - b.median);

  // Assign ranks
  sortedByMedian.forEach((m, i) => {
    const original = monthStats.find((s) => s.month === m.month);
    if (original) {
      original.rank = i + 1;
      original.rating = getRating(i + 1);
    }
  });

  // Handle months with insufficient data
  monthStats.forEach((m) => {
    if (m.rank === 0) {
      m.rank = 12;
      m.rating = 'average';
    }
  });

  // Get best and worst months
  const rankedMonths = [...monthStats]
    .filter((m) => m.count >= 5)
    .sort((a, b) => a.rank - b.rank);

  const bestMonths = rankedMonths.slice(0, 3).map((m) => m.month);
  const worstMonths = rankedMonths.slice(-3).reverse().map((m) => m.month);

  // Calculate overall stats
  const allDays = data.flatMap((d) => d.processingDays);
  allDays.sort((a, b) => a - b);
  const overallMedian = getMedian(allDays);
  const overallMean = getMean(allDays);

  // Generate recommendation
  const recommendation = generateRecommendation(monthStats, bestMonths, worstMonths, overallMedian);

  return {
    byMonth: monthStats,
    bestMonths,
    worstMonths,
    overallMedian,
    overallMean,
    recommendation,
    totalSamples: allDays.length,
  };
}

function generateRecommendation(
  stats: MonthlyStats[],
  bestMonths: number[],
  worstMonths: number[],
  overallMedian: number
): string {
  if (bestMonths.length === 0) {
    return 'Not enough data to determine the best time to apply. Check back after more permits have been processed.';
  }

  const bestNames = bestMonths.map((m) => MONTH_NAMES[m - 1]);
  const worstNames = worstMonths.map((m) => MONTH_NAMES[m - 1]);

  // Calculate how much faster the best months are
  const bestMedians = stats.filter((s) => bestMonths.includes(s.month)).map((s) => s.median);
  const worstMedians = stats.filter((s) => worstMonths.includes(s.month)).map((s) => s.median);

  const avgBest = Math.round(bestMedians.reduce((a, b) => a + b, 0) / bestMedians.length);
  const avgWorst = Math.round(worstMedians.reduce((a, b) => a + b, 0) / worstMedians.length);
  const daysSaved = avgWorst - avgBest;
  const percentFaster = Math.round(((avgWorst - avgBest) / avgWorst) * 100);

  if (daysSaved <= 0) {
    return `Processing times are fairly consistent throughout the year. Apply when you're ready.`;
  }

  const bestList = bestNames.length === 1
    ? bestNames[0]
    : bestNames.slice(0, -1).join(', ') + ' or ' + bestNames[bestNames.length - 1];

  const avoidList = worstNames.length === 1
    ? worstNames[0]
    : worstNames.slice(0, -1).join(', ') + ' and ' + worstNames[worstNames.length - 1];

  return `Apply in ${bestList} for the fastest processing times (about ${daysSaved} days faster). Avoid ${avoidList} when processing is ${percentFaster}% slower.`;
}

export function getMonthColor(rating: MonthRating): string {
  switch (rating) {
    case 'excellent':
      return '#10b981'; // green-500
    case 'good':
      return '#84cc16'; // lime-500
    case 'average':
      return '#eab308'; // yellow-500
    case 'slow':
      return '#f97316'; // orange-500
    case 'avoid':
      return '#ef4444'; // red-500
    default:
      return '#9ca3af'; // gray-400
  }
}

export function getMonthBgColor(rating: MonthRating): string {
  switch (rating) {
    case 'excellent':
      return 'bg-green-100';
    case 'good':
      return 'bg-lime-100';
    case 'average':
      return 'bg-yellow-100';
    case 'slow':
      return 'bg-orange-100';
    case 'avoid':
      return 'bg-red-100';
    default:
      return 'bg-gray-100';
  }
}

export function getMonthTextColor(rating: MonthRating): string {
  switch (rating) {
    case 'excellent':
      return 'text-green-700';
    case 'good':
      return 'text-lime-700';
    case 'average':
      return 'text-yellow-700';
    case 'slow':
      return 'text-orange-700';
    case 'avoid':
      return 'text-red-700';
    default:
      return 'text-gray-700';
  }
}
