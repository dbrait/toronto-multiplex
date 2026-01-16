import { NextRequest, NextResponse } from 'next/server';
import { getNeighbourhoodStats, getAllNeighbourhoods } from '@/lib/db-turso';
import type { NeighbourhoodContext } from '@/lib/roi-calculator';

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

    // Get neighbourhood context
    if (neighbourhood) {
      const allStats = await getNeighbourhoodStats();

      // Calculate city averages
      const totalPermits = allStats.reduce((sum, n) => sum + n.totalPermits, 0);
      const totalCompleted = allStats.reduce((sum, n) => sum + n.completedPermits, 0);
      const cityAvgProcessing = allStats
        .filter((n) => n.avgProcessingDays !== null)
        .reduce((sum, n, _, arr) => sum + (n.avgProcessingDays || 0) / arr.length, 0);
      const avgPermitsPerNeighbourhood = totalPermits / allStats.length;

      // Find the specific neighbourhood
      const neighbourhoodStats = allStats.find(
        (n) => n.name.toLowerCase() === neighbourhood.toLowerCase()
      );

      if (!neighbourhoodStats) {
        return NextResponse.json(
          { error: 'Neighbourhood not found' },
          { status: 404 }
        );
      }

      const approvalRate = neighbourhoodStats.totalPermits > 0
        ? (neighbourhoodStats.completedPermits / neighbourhoodStats.totalPermits) * 100
        : 0;

      const avgUnitsPerPermit = neighbourhoodStats.totalPermits > 0
        ? neighbourhoodStats.totalUnitsCreated / neighbourhoodStats.totalPermits
        : 0;

      const context: NeighbourhoodContext = {
        name: neighbourhoodStats.name,
        avgProcessingDays: neighbourhoodStats.avgProcessingDays,
        approvalRate: Math.round(approvalRate),
        totalPermits: neighbourhoodStats.totalPermits,
        avgUnitsPerPermit: Math.round(avgUnitsPerPermit * 10) / 10,
        processingVsCity: neighbourhoodStats.avgProcessingDays
          ? Math.round(neighbourhoodStats.avgProcessingDays - cityAvgProcessing)
          : 0,
        activityVsCity: Math.round(
          ((neighbourhoodStats.totalPermits - avgPermitsPerNeighbourhood) /
            avgPermitsPerNeighbourhood) *
            100
        ),
      };

      return NextResponse.json(context);
    }

    return NextResponse.json({ error: 'Missing neighbourhood parameter' }, { status: 400 });
  } catch (error) {
    console.error('ROI Calculator API error:', error);
    return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 });
  }
}
