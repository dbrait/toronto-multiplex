// ADU Feasibility Scoring System

import type { NeighbourhoodStats } from './types';

export type FeasibilityGrade = 'Excellent' | 'Good' | 'Moderate' | 'Challenging';

export interface FeasibilityFactor {
  score: number;
  value: string;
  description: string;
}

export interface FeasibilityScore {
  neighbourhood: string;
  overallScore: number;
  grade: FeasibilityGrade;
  factors: {
    approvalRate: FeasibilityFactor;
    processingSpeed: FeasibilityFactor;
    activityLevel: FeasibilityFactor;
    aduDensity: FeasibilityFactor;
  };
  stats: {
    totalPermits: number;
    completedPermits: number;
    activePermits: number;
    avgProcessingDays: number | null;
    unitsCreated: number;
  };
  comparison: {
    cityAvgScore: number;
    rank: number;
    totalNeighbourhoods: number;
    percentile: number;
  };
}

export interface NeighbourhoodRanking {
  neighbourhood: string;
  score: number;
  grade: FeasibilityGrade;
  rank: number;
}

// Weights for each factor (must sum to 1.0)
const WEIGHTS = {
  approvalRate: 0.30,
  processingSpeed: 0.30,
  activityLevel: 0.20,
  aduDensity: 0.20,
};

/**
 * Convert a numeric score to a grade label
 */
export function getScoreGrade(score: number): FeasibilityGrade {
  if (score >= 80) return 'Excellent';
  if (score >= 60) return 'Good';
  if (score >= 40) return 'Moderate';
  return 'Challenging';
}

/**
 * Get the color associated with a grade
 */
export function getGradeColor(grade: FeasibilityGrade): string {
  switch (grade) {
    case 'Excellent': return '#10b981'; // green
    case 'Good': return '#eab308'; // yellow
    case 'Moderate': return '#f97316'; // orange
    case 'Challenging': return '#ef4444'; // red
  }
}

/**
 * Calculate feasibility score for a single neighbourhood
 */
export function calculateFeasibilityScore(
  stats: NeighbourhoodStats,
  allStats: NeighbourhoodStats[]
): FeasibilityScore {
  // Calculate city-wide metrics for comparison
  const maxPermits = Math.max(...allStats.map(s => s.totalPermits), 1);
  const maxProcessingDays = Math.max(
    ...allStats.filter(s => s.avgProcessingDays !== null).map(s => s.avgProcessingDays!),
    1
  );

  // Factor 1: Approval Rate (30%)
  // Higher completion rate = better
  const approvalRateValue = stats.totalPermits > 0
    ? (stats.completedPermits / stats.totalPermits) * 100
    : 0;
  const approvalRateScore = Math.min(approvalRateValue * 1.2, 100); // Boost slightly since most have high rates

  // Factor 2: Processing Speed (30%)
  // Lower processing days = better (invert the scale)
  const processingSpeedValue = stats.avgProcessingDays ?? maxProcessingDays;
  const processingSpeedScore = Math.max(
    100 - (processingSpeedValue / maxProcessingDays) * 100,
    0
  );

  // Factor 3: Activity Level (20%)
  // More permits = more precedent = better
  const activityLevelValue = stats.totalPermits;
  const activityLevelScore = (activityLevelValue / maxPermits) * 100;

  // Factor 4: ADU Density (20%)
  // Higher ratio of ADU-specific permits = better
  const aduPermits = stats.byCategory.secondary_suite +
                     stats.byCategory.laneway_suite +
                     stats.byCategory.garden_suite;
  const aduDensityValue = stats.totalPermits > 0
    ? (aduPermits / stats.totalPermits) * 100
    : 0;
  const aduDensityScore = Math.min(aduDensityValue * 2, 100); // Boost since these are often low %

  // Calculate overall weighted score
  const overallScore = Math.round(
    approvalRateScore * WEIGHTS.approvalRate +
    processingSpeedScore * WEIGHTS.processingSpeed +
    activityLevelScore * WEIGHTS.activityLevel +
    aduDensityScore * WEIGHTS.aduDensity
  );

  // Calculate city average and ranking
  const allScores = allStats.map(s => calculateRawScore(s, allStats));
  const cityAvgScore = Math.round(allScores.reduce((a, b) => a + b, 0) / allScores.length);

  const sortedScores = [...allScores].sort((a, b) => b - a);
  const rank = sortedScores.findIndex(s => s <= overallScore) + 1;
  const percentile = Math.round((1 - (rank - 1) / allStats.length) * 100);

  return {
    neighbourhood: stats.name,
    overallScore,
    grade: getScoreGrade(overallScore),
    factors: {
      approvalRate: {
        score: Math.round(approvalRateScore),
        value: `${Math.round(approvalRateValue)}%`,
        description: 'Percentage of permits that reach completion',
      },
      processingSpeed: {
        score: Math.round(processingSpeedScore),
        value: stats.avgProcessingDays ? `${stats.avgProcessingDays} days` : 'N/A',
        description: 'Average time from application to permit issued',
      },
      activityLevel: {
        score: Math.round(activityLevelScore),
        value: `${stats.totalPermits} permits`,
        description: 'Total permit activity in this neighbourhood',
      },
      aduDensity: {
        score: Math.round(aduDensityScore),
        value: `${Math.round(aduDensityValue)}%`,
        description: 'Proportion of permits that are ADU-specific (laneway, garden, secondary)',
      },
    },
    stats: {
      totalPermits: stats.totalPermits,
      completedPermits: stats.completedPermits,
      activePermits: stats.activePermits,
      avgProcessingDays: stats.avgProcessingDays,
      unitsCreated: stats.totalUnitsCreated,
    },
    comparison: {
      cityAvgScore,
      rank,
      totalNeighbourhoods: allStats.length,
      percentile,
    },
  };
}

/**
 * Calculate raw score without all the metadata (for rankings)
 */
function calculateRawScore(stats: NeighbourhoodStats, allStats: NeighbourhoodStats[]): number {
  const maxPermits = Math.max(...allStats.map(s => s.totalPermits), 1);
  const maxProcessingDays = Math.max(
    ...allStats.filter(s => s.avgProcessingDays !== null).map(s => s.avgProcessingDays!),
    1
  );

  const approvalRateScore = stats.totalPermits > 0
    ? Math.min((stats.completedPermits / stats.totalPermits) * 100 * 1.2, 100)
    : 0;

  const processingSpeedScore = Math.max(
    100 - ((stats.avgProcessingDays ?? maxProcessingDays) / maxProcessingDays) * 100,
    0
  );

  const activityLevelScore = (stats.totalPermits / maxPermits) * 100;

  const aduPermits = stats.byCategory.secondary_suite +
                     stats.byCategory.laneway_suite +
                     stats.byCategory.garden_suite;
  const aduDensityScore = stats.totalPermits > 0
    ? Math.min((aduPermits / stats.totalPermits) * 100 * 2, 100)
    : 0;

  return Math.round(
    approvalRateScore * WEIGHTS.approvalRate +
    processingSpeedScore * WEIGHTS.processingSpeed +
    activityLevelScore * WEIGHTS.activityLevel +
    aduDensityScore * WEIGHTS.aduDensity
  );
}

/**
 * Calculate scores for all neighbourhoods and return ranked list
 */
export function calculateAllNeighbourhoodScores(
  allStats: NeighbourhoodStats[]
): NeighbourhoodRanking[] {
  const scores = allStats.map(stats => ({
    neighbourhood: stats.name,
    score: calculateRawScore(stats, allStats),
    grade: getScoreGrade(calculateRawScore(stats, allStats)),
  }));

  // Sort by score descending and add ranks
  return scores
    .sort((a, b) => b.score - a.score)
    .map((item, index) => ({
      ...item,
      rank: index + 1,
    }));
}

/**
 * Get city-wide average score
 */
export function getCityAverageScore(allStats: NeighbourhoodStats[]): number {
  const scores = allStats.map(s => calculateRawScore(s, allStats));
  return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
}
