import { NextRequest, NextResponse } from 'next/server';
import {
  getNeighbourhoodStats,
  getAllNeighbourhoods,
  getMonthlyTrends,
  getRecentPermitsByNeighbourhood,
} from '@/lib/db-turso';
import { calculateAllNeighbourhoodScores } from '@/lib/scoring';
import {
  calculateCityAverages,
  buildCityComparison,
  buildCategoryBreakdown,
  formatDate,
  formatCategoryName,
  type ReportData,
} from '@/lib/report-generator';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const neighbourhood = searchParams.get('neighbourhood');
    const type = searchParams.get('type');

    // Return list of neighbourhoods for dropdown
    if (type === 'options') {
      const neighbourhoods = await getAllNeighbourhoods();
      return NextResponse.json({ neighbourhoods });
    }

    if (!neighbourhood) {
      return NextResponse.json(
        { error: 'Missing neighbourhood parameter' },
        { status: 400 }
      );
    }

    // Get all data
    const allStats = await getNeighbourhoodStats();
    const neighbourhoodStats = allStats.find(
      (n) => n.name.toLowerCase() === neighbourhood.toLowerCase()
    );

    if (!neighbourhoodStats) {
      return NextResponse.json(
        { error: 'Neighbourhood not found' },
        { status: 404 }
      );
    }

    // Get monthly trends for this neighbourhood
    const allTrends = await getMonthlyTrends(24);
    const neighbourhoodTrends = allTrends.filter(
      (t) =>
        t.category !== 'other' &&
        allStats.find(
          (n) =>
            n.name.toLowerCase() === neighbourhood.toLowerCase()
        )
    );

    // Aggregate monthly counts
    const monthlyMap = new Map<string, number>();
    // Get trends for all categories in this neighbourhood by querying recent permits
    const recentPermits = await getRecentPermitsByNeighbourhood(neighbourhood, 100);

    // Build monthly trends from recent permits
    for (const permit of recentPermits) {
      if (permit.applicationDate) {
        const month = permit.applicationDate.substring(0, 7); // YYYY-MM
        monthlyMap.set(month, (monthlyMap.get(month) || 0) + 1);
      }
    }

    const monthlyTrends = [...monthlyMap.entries()]
      .map(([month, count]) => ({ month, count }))
      .sort((a, b) => a.month.localeCompare(b.month))
      .slice(-12);

    // Calculate city averages
    const cityAvg = calculateCityAverages(allStats);

    // Build city comparison
    const cityComparison = buildCityComparison(neighbourhoodStats, cityAvg);

    // Build category breakdown
    const categoryBreakdown = buildCategoryBreakdown(neighbourhoodStats);

    // Calculate feasibility score
    const feasibilityScores = calculateAllNeighbourhoodScores(allStats);
    const feasibilityData = feasibilityScores.find(
      (f: { neighbourhood: string }) => f.neighbourhood.toLowerCase() === neighbourhood.toLowerCase()
    );

    // Get recent permits for table
    const recentPermitsForTable = (await getRecentPermitsByNeighbourhood(neighbourhood, 20))
      .map((p) => ({
        address: p.address,
        category: formatCategoryName(p.category),
        status: p.status,
        date: p.applicationDate ? formatDate(p.applicationDate) : 'N/A',
      }));

    // Build approval rate
    const approvalRate = neighbourhoodStats.totalPermits > 0
      ? Math.round((neighbourhoodStats.completedPermits / neighbourhoodStats.totalPermits) * 100)
      : 0;

    const reportData: ReportData = {
      neighbourhood: neighbourhoodStats.name,
      generatedAt: new Date().toISOString(),
      summary: {
        totalPermits: neighbourhoodStats.totalPermits,
        activePermits: neighbourhoodStats.activePermits,
        completedPermits: neighbourhoodStats.completedPermits,
        unitsCreated: neighbourhoodStats.totalUnitsCreated,
        avgProcessingDays: neighbourhoodStats.avgProcessingDays,
        approvalRate,
      },
      feasibility: feasibilityData
        ? {
            score: feasibilityData.score,
            grade: feasibilityData.grade,
            rank: feasibilityData.rank,
            totalNeighbourhoods: feasibilityScores.length,
          }
        : {
            score: 0,
            grade: 'N/A',
            rank: 0,
            totalNeighbourhoods: feasibilityScores.length,
          },
      categoryBreakdown,
      monthlyTrends,
      cityComparison,
      recentPermits: recentPermitsForTable,
    };

    return NextResponse.json(reportData);
  } catch (error) {
    console.error('Report API error:', error);
    return NextResponse.json(
      { error: 'Failed to generate report data' },
      { status: 500 }
    );
  }
}
