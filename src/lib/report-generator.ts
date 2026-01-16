// Report Generator - Data aggregation for PDF reports

import type { NeighbourhoodStats } from './types';

export interface ReportSummary {
  totalPermits: number;
  activePermits: number;
  completedPermits: number;
  unitsCreated: number;
  avgProcessingDays: number | null;
  approvalRate: number;
}

export interface CategoryBreakdown {
  category: string;
  count: number;
  percentage: number;
}

export interface MonthlyTrend {
  month: string;
  count: number;
}

export interface CityComparison {
  metric: string;
  neighbourhood: number;
  cityAvg: number;
  difference: number;
  isBetter: boolean;
}

export interface RecentPermit {
  address: string;
  category: string;
  status: string;
  date: string;
}

export interface FeasibilityInfo {
  score: number;
  grade: string;
  rank: number;
  totalNeighbourhoods: number;
}

export interface ReportData {
  neighbourhood: string;
  generatedAt: string;
  summary: ReportSummary;
  feasibility: FeasibilityInfo;
  categoryBreakdown: CategoryBreakdown[];
  monthlyTrends: MonthlyTrend[];
  cityComparison: CityComparison[];
  recentPermits: RecentPermit[];
}

/**
 * Calculate city averages from all neighbourhood stats
 */
export function calculateCityAverages(stats: NeighbourhoodStats[]): {
  avgPermits: number;
  avgProcessingDays: number;
  avgApprovalRate: number;
  avgUnitsPerPermit: number;
} {
  const totalNeighbourhoods = stats.length;
  const totalPermits = stats.reduce((sum, n) => sum + n.totalPermits, 0);
  const totalCompleted = stats.reduce((sum, n) => sum + n.completedPermits, 0);
  const totalUnits = stats.reduce((sum, n) => sum + n.totalUnitsCreated, 0);

  const processingDays = stats
    .filter((n) => n.avgProcessingDays !== null)
    .map((n) => n.avgProcessingDays as number);

  return {
    avgPermits: Math.round(totalPermits / totalNeighbourhoods),
    avgProcessingDays: processingDays.length > 0
      ? Math.round(processingDays.reduce((a, b) => a + b, 0) / processingDays.length)
      : 0,
    avgApprovalRate: totalPermits > 0 ? Math.round((totalCompleted / totalPermits) * 100) : 0,
    avgUnitsPerPermit: totalPermits > 0
      ? Math.round((totalUnits / totalPermits) * 10) / 10
      : 0,
  };
}

/**
 * Build comparison metrics between neighbourhood and city
 */
export function buildCityComparison(
  neighbourhood: NeighbourhoodStats,
  cityAvg: ReturnType<typeof calculateCityAverages>
): CityComparison[] {
  const approvalRate = neighbourhood.totalPermits > 0
    ? Math.round((neighbourhood.completedPermits / neighbourhood.totalPermits) * 100)
    : 0;

  const unitsPerPermit = neighbourhood.totalPermits > 0
    ? Math.round((neighbourhood.totalUnitsCreated / neighbourhood.totalPermits) * 10) / 10
    : 0;

  return [
    {
      metric: 'Total Permits',
      neighbourhood: neighbourhood.totalPermits,
      cityAvg: cityAvg.avgPermits,
      difference: neighbourhood.totalPermits - cityAvg.avgPermits,
      isBetter: neighbourhood.totalPermits > cityAvg.avgPermits,
    },
    {
      metric: 'Avg Processing Days',
      neighbourhood: neighbourhood.avgProcessingDays || 0,
      cityAvg: cityAvg.avgProcessingDays,
      difference: (neighbourhood.avgProcessingDays || 0) - cityAvg.avgProcessingDays,
      isBetter: (neighbourhood.avgProcessingDays || Infinity) < cityAvg.avgProcessingDays,
    },
    {
      metric: 'Approval Rate',
      neighbourhood: approvalRate,
      cityAvg: cityAvg.avgApprovalRate,
      difference: approvalRate - cityAvg.avgApprovalRate,
      isBetter: approvalRate > cityAvg.avgApprovalRate,
    },
    {
      metric: 'Units per Permit',
      neighbourhood: unitsPerPermit,
      cityAvg: cityAvg.avgUnitsPerPermit,
      difference: Math.round((unitsPerPermit - cityAvg.avgUnitsPerPermit) * 10) / 10,
      isBetter: unitsPerPermit > cityAvg.avgUnitsPerPermit,
    },
  ];
}

/**
 * Calculate category breakdown with percentages
 */
export function buildCategoryBreakdown(
  stats: NeighbourhoodStats
): CategoryBreakdown[] {
  const categories = [
    { key: 'secondary_suite', label: 'Secondary Suite' },
    { key: 'laneway_suite', label: 'Laneway Suite' },
    { key: 'garden_suite', label: 'Garden Suite' },
    { key: 'duplex', label: 'Duplex' },
    { key: 'triplex', label: 'Triplex' },
    { key: 'fourplex', label: 'Fourplex' },
    { key: 'multiplex_other', label: 'Multiplex (Other)' },
  ];

  const total = stats.totalPermits;

  return categories
    .map(({ key, label }) => ({
      category: label,
      count: stats.byCategory[key as keyof typeof stats.byCategory] || 0,
      percentage: total > 0
        ? Math.round(((stats.byCategory[key as keyof typeof stats.byCategory] || 0) / total) * 100)
        : 0,
    }))
    .filter((c) => c.count > 0)
    .sort((a, b) => b.count - a.count);
}

/**
 * Format date for display
 */
export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-CA', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Format category name for display
 */
export function formatCategoryName(category: string): string {
  return category
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}
