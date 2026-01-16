import { NextResponse } from 'next/server';
import {
  getNeighbourhoodStats,
  getYearOverYearStats,
  getPermitsByMonthAndNeighbourhood,
  getActivePermitsWithIssuedDates,
  getAvgCompletionDaysByNeighbourhood,
  getHistoricalCompletions,
} from '@/lib/db-turso';
import { calculateFeasibilityScore, calculateAllNeighbourhoodScores } from '@/lib/scoring';
import { calculateNeighbourhoodIntelligence, getHotZoneCategory } from '@/lib/market-intelligence';
import { calculateNeighbourhoodForecast, calculateSeasonalFactors } from '@/lib/forecasting';
import type { NeighbourhoodComparison, CityAverages, ComparisonData } from '@/lib/comparison';
import { calculateCityAverages } from '@/lib/comparison';

export const dynamic = 'force-dynamic';

const MAX_NEIGHBOURHOODS = 10;

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const neighbourhoodsParam = searchParams.get('neighbourhoods');

    // Fetch all base data in parallel
    const [
      allStats,
      yoyStats,
      monthlyData,
      activePermits,
      avgCompletionByNeighbourhood,
      historicalCompletions,
    ] = await Promise.all([
      getNeighbourhoodStats(),
      getYearOverYearStats(),
      getPermitsByMonthAndNeighbourhood(24),
      getActivePermitsWithIssuedDates(),
      getAvgCompletionDaysByNeighbourhood(),
      getHistoricalCompletions(),
    ]);

    // Build lookup maps
    const statsMap = new Map(allStats.map(s => [s.name, s]));
    const yoyMap = new Map(yoyStats.map(y => [y.neighbourhood, y]));

    // Group monthly data by neighbourhood
    const monthlyMap = new Map<string, { month: string; permits: number; units: number }[]>();
    for (const item of monthlyData) {
      const existing = monthlyMap.get(item.neighbourhood) || [];
      existing.push({ month: item.month, permits: item.permits, units: item.units });
      monthlyMap.set(item.neighbourhood, existing);
    }

    // Calculate all feasibility rankings
    const allFeasibilityRankings = calculateAllNeighbourhoodScores(allStats);
    const feasibilityMap = new Map(allFeasibilityRankings.map(r => [r.neighbourhood, r]));

    // Calculate hot zone scores for all neighbourhoods
    const maxPermits = Math.max(...allStats.map(s => s.totalPermits), 1);
    const allHotZoneScores = allStats.map(stats => {
      const yoy = yoyMap.get(stats.name);
      const monthly = monthlyMap.get(stats.name) || [];
      const intel = calculateNeighbourhoodIntelligence(
        stats.name,
        stats,
        yoy,
        monthly,
        undefined,
        maxPermits
      );
      return {
        neighbourhood: stats.name,
        score: intel.hotZoneScore,
        category: intel.category,
        momentum: intel.metrics.recentMomentum,
      };
    });
    const hotZoneMap = new Map(allHotZoneScores.map(h => [h.neighbourhood, h]));

    // Calculate seasonal factors for forecasting
    const seasonalFactors = calculateSeasonalFactors(historicalCompletions);

    // Get all neighbourhood names for the selector
    const allNeighbourhoodNames = allStats.map(s => s.name).sort();

    // Calculate city averages
    const cityAverages = calculateCityAverages(
      allStats,
      allFeasibilityRankings.map(r => ({ neighbourhood: r.neighbourhood, score: r.score })),
      allHotZoneScores.map(h => ({ neighbourhood: h.neighbourhood, score: h.score })),
      yoyStats
    );

    // If no neighbourhoods specified, return just metadata
    if (!neighbourhoodsParam) {
      return NextResponse.json({
        neighbourhoods: [],
        cityAverages,
        allNeighbourhoodNames,
        generatedAt: new Date().toISOString(),
      } as ComparisonData);
    }

    // Parse requested neighbourhoods
    const requestedNeighbourhoods = neighbourhoodsParam
      .split(',')
      .map(n => n.trim())
      .filter(n => n.length > 0)
      .slice(0, MAX_NEIGHBOURHOODS);

    // Build comparison data for each requested neighbourhood
    const comparisons: NeighbourhoodComparison[] = [];

    for (const name of requestedNeighbourhoods) {
      const stats = statsMap.get(name);
      if (!stats) continue;

      const yoy = yoyMap.get(name);
      const feasibility = feasibilityMap.get(name);
      const hotZone = hotZoneMap.get(name);
      const monthlyTrend = monthlyMap.get(name) || [];

      // Calculate forecast for this neighbourhood
      const avgDays = avgCompletionByNeighbourhood[name] || null;
      const forecast = calculateNeighbourhoodForecast(
        name,
        activePermits,
        avgDays,
        seasonalFactors
      );

      // Calculate YoY change percentage
      const yoyChange = yoy
        ? yoy.lastYear > 0
          ? Math.round(((yoy.thisYear - yoy.lastYear) / yoy.lastYear) * 100)
          : yoy.thisYear > 0
          ? 100
          : 0
        : 0;

      comparisons.push({
        name,
        stats: {
          totalPermits: stats.totalPermits,
          activePermits: stats.activePermits,
          completedPermits: stats.completedPermits,
          totalUnits: stats.totalUnitsCreated,
          avgProcessingDays: stats.avgProcessingDays,
        },
        yoy: {
          thisYear: yoy?.thisYear || 0,
          lastYear: yoy?.lastYear || 0,
          change: yoyChange,
        },
        feasibility: {
          score: feasibility?.score || 0,
          grade: feasibility?.grade || 'Challenging',
          rank: feasibility?.rank || allStats.length,
        },
        hotZone: {
          score: hotZone?.score || 0,
          category: hotZone?.category || 'cooling',
          momentum: hotZone?.momentum || 0,
        },
        forecast: {
          projected12Months: forecast.totalProjectedUnits,
          activePipeline: forecast.activePipelineUnits,
        },
        monthlyTrend,
        byCategory: stats.byCategory,
      });
    }

    return NextResponse.json({
      neighbourhoods: comparisons,
      cityAverages,
      allNeighbourhoodNames,
      generatedAt: new Date().toISOString(),
    } as ComparisonData);
  } catch (error) {
    console.error('Compare API error:', error);
    return NextResponse.json(
      { error: 'Failed to generate comparison data' },
      { status: 500 }
    );
  }
}
