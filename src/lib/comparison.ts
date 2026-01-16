// Neighbourhood Comparison System

import type { NeighbourhoodStats } from './types';
import type { HotZoneCategory, MonthlyTrend } from './market-intelligence';
import type { FeasibilityGrade } from './scoring';

export interface NeighbourhoodComparison {
  name: string;
  stats: {
    totalPermits: number;
    activePermits: number;
    completedPermits: number;
    totalUnits: number;
    avgProcessingDays: number | null;
  };
  yoy: {
    thisYear: number;
    lastYear: number;
    change: number;
  };
  feasibility: {
    score: number;
    grade: FeasibilityGrade;
    rank: number;
  };
  hotZone: {
    score: number;
    category: HotZoneCategory;
    momentum: number;
  };
  forecast: {
    projected12Months: number;
    activePipeline: number;
  };
  monthlyTrend: MonthlyTrend[];
  byCategory: Record<string, number>;
}

export interface CityAverages {
  totalPermits: number;
  avgProcessingDays: number;
  feasibilityScore: number;
  hotZoneScore: number;
  yoyChange: number;
}

export interface ComparisonData {
  neighbourhoods: NeighbourhoodComparison[];
  cityAverages: CityAverages;
  allNeighbourhoodNames: string[];
  generatedAt: string;
}

/**
 * Calculate city-wide averages for comparison context
 */
export function calculateCityAverages(
  allStats: NeighbourhoodStats[],
  allFeasibilityScores: { neighbourhood: string; score: number }[],
  allHotZoneScores: { neighbourhood: string; score: number }[],
  allYoyData: { neighbourhood: string; thisYear: number; lastYear: number }[]
): CityAverages {
  const totalPermits = Math.round(
    allStats.reduce((sum, s) => sum + s.totalPermits, 0) / allStats.length
  );

  const statsWithProcessing = allStats.filter(s => s.avgProcessingDays !== null);
  const avgProcessingDays = statsWithProcessing.length > 0
    ? Math.round(
        statsWithProcessing.reduce((sum, s) => sum + (s.avgProcessingDays || 0), 0) /
        statsWithProcessing.length
      )
    : 0;

  const feasibilityScore = allFeasibilityScores.length > 0
    ? Math.round(
        allFeasibilityScores.reduce((sum, s) => sum + s.score, 0) / allFeasibilityScores.length
      )
    : 0;

  const hotZoneScore = allHotZoneScores.length > 0
    ? Math.round(
        allHotZoneScores.reduce((sum, s) => sum + s.score, 0) / allHotZoneScores.length
      )
    : 0;

  const totalThisYear = allYoyData.reduce((sum, y) => sum + y.thisYear, 0);
  const totalLastYear = allYoyData.reduce((sum, y) => sum + y.lastYear, 0);
  const yoyChange = totalLastYear > 0
    ? Math.round(((totalThisYear - totalLastYear) / totalLastYear) * 100)
    : 0;

  return {
    totalPermits,
    avgProcessingDays,
    feasibilityScore,
    hotZoneScore,
    yoyChange,
  };
}
