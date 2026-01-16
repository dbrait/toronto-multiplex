import { NextResponse } from 'next/server';
import {
  getNeighbourhoodStats,
  getPermitsByMonthAndNeighbourhood,
  getYearOverYearStats,
  getNeighbourhoodCoordinates,
} from '@/lib/db-turso';
import { calculateMarketIntelligence } from '@/lib/market-intelligence';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const neighbourhood = searchParams.get('neighbourhood');

    // Fetch all required data in parallel
    const [neighbourhoodStats, yoyStats, monthlyData, coordinates] = await Promise.all([
      getNeighbourhoodStats(),
      getYearOverYearStats(),
      getPermitsByMonthAndNeighbourhood(24), // 24 months for trend analysis
      getNeighbourhoodCoordinates(),
    ]);

    // Calculate full market intelligence
    const intelligence = calculateMarketIntelligence(
      neighbourhoodStats,
      yoyStats,
      monthlyData,
      coordinates
    );

    // If specific neighbourhood requested, filter the response
    if (neighbourhood) {
      const neighbourhoodData = intelligence.hotZones.find(
        (hz) => hz.neighbourhood.toLowerCase() === neighbourhood.toLowerCase()
      );

      if (!neighbourhoodData) {
        return NextResponse.json(
          { error: 'Neighbourhood not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        neighbourhood: neighbourhoodData,
        cityStats: intelligence.cityStats,
        generatedAt: intelligence.generatedAt,
      });
    }

    // Return full market intelligence
    return NextResponse.json(intelligence);
  } catch (error) {
    console.error('Market intelligence API error:', error);
    return NextResponse.json(
      { error: 'Failed to generate market intelligence' },
      { status: 500 }
    );
  }
}
