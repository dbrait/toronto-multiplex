import { NextResponse } from 'next/server';
import {
  getNeighbourhoodStats,
  getPermitsByMonthAndNeighbourhood,
  getYearOverYearStats,
  getCategoryBreakdown,
} from '@/lib/db-turso';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Fetch all data in parallel
    const [neighbourhoodStats, monthlyData, yoyStats, categoryData] = await Promise.all([
      getNeighbourhoodStats(),
      getPermitsByMonthAndNeighbourhood(36), // 3 years of data
      getYearOverYearStats(),
      getCategoryBreakdown(),
    ]);

    // Calculate city totals
    const cityTotalUnits = neighbourhoodStats.reduce(
      (sum, n) => sum + n.totalUnitsCreated,
      0
    );
    const cityTotalPermits = neighbourhoodStats.reduce(
      (sum, n) => sum + n.totalPermits,
      0
    );
    const avgUnitsPerPermit = cityTotalPermits > 0
      ? cityTotalUnits / cityTotalPermits
      : 0;

    // Calculate YoY growth for city
    const thisYearUnits = yoyStats.reduce((sum, n) => sum + n.thisYearUnits, 0);
    const lastYearUnits = yoyStats.reduce((sum, n) => sum + n.lastYearUnits, 0);
    const yoyGrowthPercent = lastYearUnits > 0
      ? Math.round(((thisYearUnits - lastYearUnits) / lastYearUnits) * 100)
      : 0;

    // Build timeline with cumulative totals
    const monthlyTotals = new Map<string, number>();
    for (const item of monthlyData) {
      const current = monthlyTotals.get(item.month) || 0;
      monthlyTotals.set(item.month, current + item.units);
    }

    const sortedMonths = [...monthlyTotals.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]));

    let cumulative = 0;
    const timeline = sortedMonths.map(([month, units]) => {
      cumulative += units;
      return { month, units, cumulative };
    });

    // Build neighbourhood rankings
    const neighbourhoods = neighbourhoodStats
      .filter((n) => n.totalUnitsCreated > 0)
      .map((n) => {
        const yoy = yoyStats.find(
          (y) => y.neighbourhood.toLowerCase() === n.name.toLowerCase()
        );
        const yoyGrowth = yoy && yoy.lastYearUnits > 0
          ? Math.round(((yoy.thisYearUnits - yoy.lastYearUnits) / yoy.lastYearUnits) * 100)
          : 0;

        return {
          name: n.name,
          units: n.totalUnitsCreated,
          permits: n.totalPermits,
          avgUnitsPerPermit: n.totalPermits > 0
            ? Math.round((n.totalUnitsCreated / n.totalPermits) * 100) / 100
            : 0,
          yoyGrowth,
          thisYearUnits: yoy?.thisYearUnits || 0,
          lastYearUnits: yoy?.lastYearUnits || 0,
        };
      })
      .sort((a, b) => b.units - a.units);

    // Build category breakdown with percentages
    const totalCategoryUnits = categoryData.reduce((sum, c) => sum + c.units, 0);
    const byCategory = categoryData
      .filter((c) => c.units > 0)
      .map((c) => ({
        category: c.category,
        units: c.units,
        permits: c.count,
        percentage: totalCategoryUnits > 0
          ? Math.round((c.units / totalCategoryUnits) * 100)
          : 0,
      }))
      .sort((a, b) => b.units - a.units);

    return NextResponse.json({
      cityTotal: {
        totalUnits: cityTotalUnits,
        totalPermits: cityTotalPermits,
        avgUnitsPerPermit: Math.round(avgUnitsPerPermit * 100) / 100,
        yoyGrowthPercent,
        thisYearUnits,
        lastYearUnits,
      },
      timeline,
      neighbourhoods,
      byCategory,
    });
  } catch (error) {
    console.error('Density impact error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch density data' },
      { status: 500 }
    );
  }
}
