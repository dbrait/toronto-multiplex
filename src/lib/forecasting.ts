// Housing Supply Forecasting System

import { addMonths, format, differenceInMonths } from 'date-fns';
import type { ProcessedPermit, NeighbourhoodStats } from './types';

export type ConfidenceLevel = 'high' | 'medium' | 'low';

export interface MonthlyForecast {
  month: string;
  projectedUnits: number;
  confidence: ConfidenceLevel;
  breakdown: {
    fromActivePipeline: number;
    seasonalAdjustment: number;
  };
}

export interface NeighbourhoodForecast {
  neighbourhood: string;
  totalProjectedUnits: number;
  monthlyForecasts: MonthlyForecast[];
  activePipelineUnits: number;
  activePermitCount: number;
  avgCompletionDays: number | null;
}

export interface CityForecast {
  totalProjectedUnits: number;
  monthlyForecasts: MonthlyForecast[];
  byNeighbourhood: NeighbourhoodForecast[];
  activePipelineUnits: number;
  activePermitCount: number;
  generatedAt: string;
}

// Default completion time if no historical data (6 months)
const DEFAULT_COMPLETION_DAYS = 180;

// Confidence thresholds (months from now)
const HIGH_CONFIDENCE_MONTHS = 3;
const MEDIUM_CONFIDENCE_MONTHS = 8;

/**
 * Get confidence level based on months into the future
 */
function getConfidenceLevel(monthsAhead: number): ConfidenceLevel {
  if (monthsAhead <= HIGH_CONFIDENCE_MONTHS) return 'high';
  if (monthsAhead <= MEDIUM_CONFIDENCE_MONTHS) return 'medium';
  return 'low';
}

/**
 * Calculate seasonal adjustment factors from historical data
 * Returns multipliers for each month (1-12)
 */
export function calculateSeasonalFactors(
  historicalCompletions: { month: string; units: number }[]
): Record<number, number> {
  if (historicalCompletions.length === 0) {
    // No data, return neutral factors
    return Object.fromEntries([...Array(12)].map((_, i) => [i + 1, 1.0]));
  }

  // Group by month number and calculate average
  const monthTotals: Record<number, number[]> = {};
  for (let i = 1; i <= 12; i++) {
    monthTotals[i] = [];
  }

  for (const item of historicalCompletions) {
    const monthNum = parseInt(item.month.split('-')[1], 10);
    if (monthNum >= 1 && monthNum <= 12) {
      monthTotals[monthNum].push(item.units);
    }
  }

  // Calculate overall average
  const allUnits = historicalCompletions.map(h => h.units);
  const overallAvg = allUnits.reduce((a, b) => a + b, 0) / allUnits.length || 1;

  // Calculate seasonal factors (month avg / overall avg)
  const seasonalFactors: Record<number, number> = {};
  for (let month = 1; month <= 12; month++) {
    const monthData = monthTotals[month];
    if (monthData.length > 0) {
      const monthAvg = monthData.reduce((a, b) => a + b, 0) / monthData.length;
      seasonalFactors[month] = monthAvg / overallAvg;
    } else {
      seasonalFactors[month] = 1.0;
    }
  }

  return seasonalFactors;
}

/**
 * Estimate when a permit will complete based on issued date and avg completion time
 */
function estimateCompletionDate(
  issuedDate: Date,
  avgCompletionDays: number
): Date {
  const completionDate = new Date(issuedDate);
  completionDate.setDate(completionDate.getDate() + avgCompletionDays);
  return completionDate;
}

/**
 * Calculate forecast for a single neighbourhood
 */
export function calculateNeighbourhoodForecast(
  neighbourhood: string,
  permits: ProcessedPermit[],
  avgCompletionDays: number | null,
  seasonalFactors: Record<number, number>
): NeighbourhoodForecast {
  const now = new Date();
  const completionDays = avgCompletionDays || DEFAULT_COMPLETION_DAYS;

  // Filter permits for this neighbourhood
  const neighbourhoodPermits = permits.filter(
    p => p.neighbourhood === neighbourhood && p.issuedDate
  );

  // Calculate total active pipeline units
  const activePipelineUnits = neighbourhoodPermits.reduce(
    (sum, p) => sum + p.dwellingUnitsCreated,
    0
  );

  // Initialize monthly buckets for next 12 months
  const monthlyBuckets: Record<string, number> = {};
  for (let i = 0; i < 12; i++) {
    const monthDate = addMonths(now, i);
    const monthKey = format(monthDate, 'yyyy-MM');
    monthlyBuckets[monthKey] = 0;
  }

  // Distribute permits into expected completion months
  for (const permit of neighbourhoodPermits) {
    if (!permit.issuedDate) continue;

    const expectedCompletion = estimateCompletionDate(permit.issuedDate, completionDays);
    const monthsUntilCompletion = differenceInMonths(expectedCompletion, now);

    // Only count if completion is within forecast window
    if (monthsUntilCompletion >= 0 && monthsUntilCompletion < 12) {
      const monthKey = format(expectedCompletion, 'yyyy-MM');
      if (monthlyBuckets[monthKey] !== undefined) {
        monthlyBuckets[monthKey] += permit.dwellingUnitsCreated;
      }
    }
  }

  // Build monthly forecasts with seasonal adjustments
  const monthlyForecasts: MonthlyForecast[] = [];
  let totalProjectedUnits = 0;

  Object.entries(monthlyBuckets).forEach(([month, pipelineUnits], index) => {
    const monthNum = parseInt(month.split('-')[1], 10);
    const seasonalFactor = seasonalFactors[monthNum] || 1.0;

    // Apply seasonal adjustment (subtle, max ±20%)
    const adjustment = Math.round(pipelineUnits * (seasonalFactor - 1) * 0.2);
    const projectedUnits = Math.max(0, pipelineUnits + adjustment);

    monthlyForecasts.push({
      month,
      projectedUnits,
      confidence: getConfidenceLevel(index),
      breakdown: {
        fromActivePipeline: pipelineUnits,
        seasonalAdjustment: adjustment,
      },
    });

    totalProjectedUnits += projectedUnits;
  });

  return {
    neighbourhood,
    totalProjectedUnits,
    monthlyForecasts,
    activePipelineUnits,
    activePermitCount: neighbourhoodPermits.length,
    avgCompletionDays: avgCompletionDays,
  };
}

/**
 * Calculate city-wide forecast by aggregating all neighbourhoods
 */
export function calculateCityForecast(
  activePermits: ProcessedPermit[],
  neighbourhoodStats: NeighbourhoodStats[],
  avgCompletionByNeighbourhood: Record<string, number>,
  historicalCompletions: { month: string; units: number }[]
): CityForecast {
  const seasonalFactors = calculateSeasonalFactors(historicalCompletions);

  // Get unique neighbourhoods from permits
  const neighbourhoods = [...new Set(
    activePermits
      .map(p => p.neighbourhood)
      .filter((n): n is string => n !== null)
  )];

  // Calculate forecast for each neighbourhood
  const byNeighbourhood: NeighbourhoodForecast[] = neighbourhoods.map(neighbourhood => {
    const avgDays = avgCompletionByNeighbourhood[neighbourhood] || null;
    return calculateNeighbourhoodForecast(
      neighbourhood,
      activePermits,
      avgDays,
      seasonalFactors
    );
  });

  // Sort by total projected units descending
  byNeighbourhood.sort((a, b) => b.totalProjectedUnits - a.totalProjectedUnits);

  // Aggregate monthly forecasts
  const now = new Date();
  const monthlyForecasts: MonthlyForecast[] = [];

  for (let i = 0; i < 12; i++) {
    const monthDate = addMonths(now, i);
    const monthKey = format(monthDate, 'yyyy-MM');

    let monthTotal = 0;
    let pipelineTotal = 0;
    let adjustmentTotal = 0;

    for (const nf of byNeighbourhood) {
      const monthData = nf.monthlyForecasts.find(mf => mf.month === monthKey);
      if (monthData) {
        monthTotal += monthData.projectedUnits;
        pipelineTotal += monthData.breakdown.fromActivePipeline;
        adjustmentTotal += monthData.breakdown.seasonalAdjustment;
      }
    }

    monthlyForecasts.push({
      month: monthKey,
      projectedUnits: monthTotal,
      confidence: getConfidenceLevel(i),
      breakdown: {
        fromActivePipeline: pipelineTotal,
        seasonalAdjustment: adjustmentTotal,
      },
    });
  }

  const totalProjectedUnits = monthlyForecasts.reduce(
    (sum, mf) => sum + mf.projectedUnits,
    0
  );

  const activePipelineUnits = activePermits.reduce(
    (sum, p) => sum + p.dwellingUnitsCreated,
    0
  );

  return {
    totalProjectedUnits,
    monthlyForecasts,
    byNeighbourhood,
    activePipelineUnits,
    activePermitCount: activePermits.length,
    generatedAt: new Date().toISOString(),
  };
}
