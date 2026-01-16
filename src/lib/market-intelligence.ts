// Market Intelligence Analysis System

import type { NeighbourhoodStats } from './types';

export type HotZoneCategory = 'hot' | 'warming' | 'stable' | 'cooling';

export interface MonthlyTrend {
  month: string;
  permits: number;
  units: number;
}

export interface NeighbourhoodIntelligence {
  neighbourhood: string;
  hotZoneScore: number;
  category: HotZoneCategory;
  metrics: {
    totalPermits: number;
    totalUnits: number;
    yoyChange: number;
    recentMomentum: number;
    avgProcessingDays: number | null;
  };
  monthlyTrend: MonthlyTrend[];
  coordinates: {
    latitude: number;
    longitude: number;
  } | null;
}

export interface MarketIntelligence {
  hotZones: NeighbourhoodIntelligence[];
  emergingAreas: string[];
  cityStats: {
    totalActivePermits: number;
    totalUnits: number;
    yoyChange: number;
    hotNeighbourhoodCount: number;
    warmingNeighbourhoodCount: number;
  };
  generatedAt: string;
}

// Weights for hot zone score calculation
const WEIGHTS = {
  activity: 0.30,
  yoyGrowth: 0.35,
  momentum: 0.35,
};

/**
 * Get the hot zone category based on score
 */
export function getHotZoneCategory(score: number): HotZoneCategory {
  if (score >= 80) return 'hot';
  if (score >= 60) return 'warming';
  if (score >= 40) return 'stable';
  return 'cooling';
}

/**
 * Get the color for a hot zone category
 */
export function getCategoryColor(category: HotZoneCategory): string {
  switch (category) {
    case 'hot': return '#ef4444';
    case 'warming': return '#f97316';
    case 'stable': return '#eab308';
    case 'cooling': return '#3b82f6';
  }
}

/**
 * Calculate the trend slope from monthly data (positive = accelerating)
 */
function calculateMomentum(monthlyData: MonthlyTrend[]): number {
  if (monthlyData.length < 2) return 0;

  // Use last 6 months
  const recent = monthlyData.slice(-6);
  if (recent.length < 2) return 0;

  // Simple linear regression slope
  const n = recent.length;
  const sumX = (n * (n - 1)) / 2;
  const sumY = recent.reduce((sum, d) => sum + d.permits, 0);
  const sumXY = recent.reduce((sum, d, i) => sum + i * d.permits, 0);
  const sumX2 = recent.reduce((sum, _, i) => sum + i * i, 0);

  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);

  // Normalize to -100 to +100 scale
  const avgPermits = sumY / n || 1;
  const normalizedSlope = (slope / avgPermits) * 100;

  return Math.max(-100, Math.min(100, normalizedSlope * 10));
}

/**
 * Calculate intelligence for a single neighbourhood
 */
export function calculateNeighbourhoodIntelligence(
  neighbourhood: string,
  stats: NeighbourhoodStats | undefined,
  yoyData: { thisYear: number; lastYear: number; thisYearUnits: number; lastYearUnits: number } | undefined,
  monthlyData: MonthlyTrend[],
  coordinates: { latitude: number; longitude: number } | undefined,
  maxPermits: number
): NeighbourhoodIntelligence {
  const totalPermits = stats?.totalPermits || 0;
  const totalUnits = stats?.totalUnitsCreated || 0;

  // Calculate YoY change
  const thisYear = yoyData?.thisYear || 0;
  const lastYear = yoyData?.lastYear || 0;
  const yoyChange = lastYear > 0 ? ((thisYear - lastYear) / lastYear) * 100 : (thisYear > 0 ? 100 : 0);

  // Calculate momentum from monthly trend
  const momentum = calculateMomentum(monthlyData);

  // Calculate component scores
  const activityScore = maxPermits > 0 ? (totalPermits / maxPermits) * 100 : 0;

  // YoY score: -50% = 0, 0% = 50, +50% = 100
  const yoyScore = Math.max(0, Math.min(100, 50 + yoyChange));

  // Momentum score: normalize -100 to +100 into 0 to 100
  const momentumScore = (momentum + 100) / 2;

  // Calculate weighted score
  const hotZoneScore = Math.round(
    activityScore * WEIGHTS.activity +
    yoyScore * WEIGHTS.yoyGrowth +
    momentumScore * WEIGHTS.momentum
  );

  return {
    neighbourhood,
    hotZoneScore,
    category: getHotZoneCategory(hotZoneScore),
    metrics: {
      totalPermits,
      totalUnits,
      yoyChange: Math.round(yoyChange),
      recentMomentum: Math.round(momentum),
      avgProcessingDays: stats?.avgProcessingDays || null,
    },
    monthlyTrend: monthlyData,
    coordinates: coordinates ? { latitude: coordinates.latitude, longitude: coordinates.longitude } : null,
  };
}

/**
 * Identify emerging areas (high momentum, lower current activity)
 */
function identifyEmergingAreas(hotZones: NeighbourhoodIntelligence[]): string[] {
  // Filter for neighbourhoods with positive momentum but not already "hot"
  const emerging = hotZones
    .filter(
      (hz) =>
        hz.metrics.recentMomentum > 20 &&
        hz.category !== 'hot' &&
        hz.metrics.totalPermits >= 5
    )
    .sort((a, b) => b.metrics.recentMomentum - a.metrics.recentMomentum)
    .slice(0, 5);

  return emerging.map((hz) => hz.neighbourhood);
}

/**
 * Calculate full market intelligence
 */
export function calculateMarketIntelligence(
  neighbourhoodStats: NeighbourhoodStats[],
  yoyStats: { neighbourhood: string; thisYear: number; lastYear: number; thisYearUnits: number; lastYearUnits: number }[],
  monthlyByNeighbourhood: { neighbourhood: string; month: string; permits: number; units: number }[],
  coordinates: { neighbourhood: string; latitude: number; longitude: number }[]
): MarketIntelligence {
  // Build lookup maps
  const yoyMap = new Map(yoyStats.map((y) => [y.neighbourhood, y]));
  const coordsMap = new Map(coordinates.map((c) => [c.neighbourhood, c]));

  // Group monthly data by neighbourhood
  const monthlyMap = new Map<string, MonthlyTrend[]>();
  for (const item of monthlyByNeighbourhood) {
    const existing = monthlyMap.get(item.neighbourhood) || [];
    existing.push({ month: item.month, permits: item.permits, units: item.units });
    monthlyMap.set(item.neighbourhood, existing);
  }

  // Find max permits for normalization
  const maxPermits = Math.max(...neighbourhoodStats.map((s) => s.totalPermits), 1);

  // Calculate intelligence for each neighbourhood
  const hotZones = neighbourhoodStats.map((stats) => {
    const yoyData = yoyMap.get(stats.name);
    const monthlyData = monthlyMap.get(stats.name) || [];
    const coords = coordsMap.get(stats.name);

    return calculateNeighbourhoodIntelligence(
      stats.name,
      stats,
      yoyData,
      monthlyData,
      coords,
      maxPermits
    );
  });

  // Sort by hot zone score descending
  hotZones.sort((a, b) => b.hotZoneScore - a.hotZoneScore);

  // Find emerging areas
  const emergingAreas = identifyEmergingAreas(hotZones);

  // Calculate city-wide stats
  const totalActivePermits = neighbourhoodStats.reduce((sum, s) => sum + s.activePermits, 0);
  const totalUnits = neighbourhoodStats.reduce((sum, s) => sum + s.totalUnitsCreated, 0);

  const cityThisYear = yoyStats.reduce((sum, y) => sum + y.thisYear, 0);
  const cityLastYear = yoyStats.reduce((sum, y) => sum + y.lastYear, 0);
  const cityYoyChange = cityLastYear > 0 ? Math.round(((cityThisYear - cityLastYear) / cityLastYear) * 100) : 0;

  const hotNeighbourhoodCount = hotZones.filter((hz) => hz.category === 'hot').length;
  const warmingNeighbourhoodCount = hotZones.filter((hz) => hz.category === 'warming').length;

  return {
    hotZones,
    emergingAreas,
    cityStats: {
      totalActivePermits,
      totalUnits,
      yoyChange: cityYoyChange,
      hotNeighbourhoodCount,
      warmingNeighbourhoodCount,
    },
    generatedAt: new Date().toISOString(),
  };
}
